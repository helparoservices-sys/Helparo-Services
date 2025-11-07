'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Bundles & Campaigns (Migration 023)
 * Tables: service_bundles, bundle_services, bundle_purchases, seasonal_campaigns, campaign_applicable_services, campaign_redemptions
 */

// ============================================
// SERVICE BUNDLES
// ============================================

export async function createServiceBundle(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const imageUrl = formData.get('image_url') as string
  const regularPrice = parseFloat(formData.get('regular_price') as string)
  const bundlePrice = parseFloat(formData.get('bundle_price') as string)
  const validityDays = parseInt(formData.get('validity_days') as string)
  const maxRedemptions = parseInt(formData.get('max_redemptions') as string)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const discountPercent = ((regularPrice - bundlePrice) / regularPrice) * 100

    const { data: bundle, error } = await supabase
      .from('service_bundles')
      .insert({
        name,
        description,
        image_url: imageUrl,
        regular_price: regularPrice,
        bundle_price: bundlePrice,
        discount_percent: discountPercent,
        validity_days: validityDays,
        max_redemptions: maxRedemptions,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/bundles')
    revalidatePath('/customer/bundles')
    return { success: true, bundle }
  } catch (error: any) {
    console.error('Create service bundle error:', error)
    return { error: error.message }
  }
}

export async function addServiceToBundle(bundleId: string, categoryId: string, quantity: number, pricePerService: number) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('bundle_services')
      .insert({
        bundle_id: bundleId,
        category_id: categoryId,
        quantity,
        price_per_service: pricePerService
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/bundles')
    return { success: true, bundleService: data }
  } catch (error: any) {
    console.error('Add service to bundle error:', error)
    return { error: error.message }
  }
}

export async function getActiveServiceBundles() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('service_bundles')
      .select(`
        *,
        services:bundle_services(
          quantity,
          price_per_service,
          category:service_categories(
            id,
            name,
            icon
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, bundles: data }
  } catch (error: any) {
    console.error('Get active service bundles error:', error)
    return { error: error.message }
  }
}

export async function purchaseBundle(bundleId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get bundle details
    const { data: bundle } = await supabase
      .from('service_bundles')
      .select('*, services:bundle_services(*)')
      .eq('id', bundleId)
      .single()

    if (!bundle || !bundle.is_active) {
      return { error: 'Bundle not available' }
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallet_accounts')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (!wallet || wallet.balance < bundle.bundle_price) {
      return { error: 'Insufficient wallet balance' }
    }

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + bundle.validity_days)

    // Create bundle purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('bundle_purchases')
      .insert({
        bundle_id: bundleId,
        customer_id: user.id,
        purchase_price: bundle.bundle_price,
        remaining_redemptions: bundle.max_redemptions,
        expiry_date: expiryDate.toISOString()
      })
      .select()
      .single()

    if (purchaseError) throw purchaseError

    // Deduct from wallet
    const { error: walletError } = await supabase
      .from('wallet_accounts')
      .update({ balance: wallet.balance - bundle.bundle_price })
      .eq('user_id', user.id)

    if (walletError) throw walletError

    // Create transaction record
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: bundle.bundle_price,
        transaction_type: 'bundle_purchase',
        status: 'completed',
        description: `Purchased ${bundle.name}`
      })

    revalidatePath('/customer/bundles')
    revalidatePath('/customer/wallet')
    return { success: true, purchase }
  } catch (error: any) {
    console.error('Purchase bundle error:', error)
    return { error: error.message }
  }
}

export async function getMyBundles() {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('bundle_purchases')
      .select(`
        *,
        bundle:service_bundles(
          name,
          description,
          image_url,
          services:bundle_services(
            quantity,
            category:service_categories(name, icon)
          )
        )
      `)
      .eq('customer_id', user.id)
      .gte('expiry_date', new Date().toISOString())
      .gt('remaining_redemptions', 0)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, bundles: data }
  } catch (error: any) {
    console.error('Get my bundles error:', error)
    return { error: error.message }
  }
}

export async function redeemBundleService(purchaseId: string, categoryId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get purchase details
    const { data: purchase } = await supabase
      .from('bundle_purchases')
      .select('*, bundle:service_bundles(services:bundle_services(*))')
      .eq('id', purchaseId)
      .eq('customer_id', user.id)
      .single()

    if (!purchase) {
      return { error: 'Bundle purchase not found' }
    }

    if (purchase.remaining_redemptions <= 0) {
      return { error: 'No redemptions remaining' }
    }

    if (new Date(purchase.expiry_date) < new Date()) {
      return { error: 'Bundle has expired' }
    }

    // Decrease redemption count
    const { error: updateError } = await supabase
      .from('bundle_purchases')
      .update({ remaining_redemptions: purchase.remaining_redemptions - 1 })
      .eq('id', purchaseId)

    if (updateError) throw updateError

    revalidatePath('/customer/bundles')
    return { success: true }
  } catch (error: any) {
    console.error('Redeem bundle service error:', error)
    return { error: error.message }
  }
}

// ============================================
// SEASONAL CAMPAIGNS
// ============================================

export async function createSeasonalCampaign(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const bannerUrl = formData.get('banner_url') as string
  const campaignType = formData.get('campaign_type') as string
  const discountPercent = parseFloat(formData.get('discount_percent') as string)
  const flatDiscount = parseFloat(formData.get('flat_discount') as string)
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string
  const maxRedemptions = parseInt(formData.get('max_redemptions') as string)
  const minOrderAmount = parseFloat(formData.get('min_order_amount') as string)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { data: campaign, error } = await supabase
      .from('seasonal_campaigns')
      .insert({
        title,
        description,
        banner_url: bannerUrl,
        campaign_type: campaignType,
        discount_percent: discountPercent,
        flat_discount_amount: flatDiscount,
        start_date: startDate,
        end_date: endDate,
        max_redemptions_per_user: maxRedemptions,
        min_order_amount: minOrderAmount,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/campaigns')
    revalidatePath('/customer/offers')
    return { success: true, campaign }
  } catch (error: any) {
    console.error('Create seasonal campaign error:', error)
    return { error: error.message }
  }
}

export async function addServiceToCampaign(campaignId: string, categoryId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('campaign_applicable_services')
      .insert({
        campaign_id: campaignId,
        category_id: categoryId
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/campaigns')
    return { success: true, campaignService: data }
  } catch (error: any) {
    console.error('Add service to campaign error:', error)
    return { error: error.message }
  }
}

export async function getActiveCampaigns() {
  const supabase = await createClient()

  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('seasonal_campaigns')
      .select(`
        *,
        applicable_services:campaign_applicable_services(
          category:service_categories(
            id,
            name,
            icon
          )
        )
      `)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, campaigns: data }
  } catch (error: any) {
    console.error('Get active campaigns error:', error)
    return { error: error.message }
  }
}

export async function applyCampaignToOrder(campaignId: string, serviceRequestId: string, originalAmount: number) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get campaign details
    const { data: campaign } = await supabase
      .from('seasonal_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign || !campaign.is_active) {
      return { error: 'Campaign not available' }
    }

    // Check if campaign is valid
    const now = new Date()
    if (now < new Date(campaign.start_date) || now > new Date(campaign.end_date)) {
      return { error: 'Campaign has expired' }
    }

    // Check min order amount
    if (originalAmount < campaign.min_order_amount) {
      return { error: `Minimum order amount is ₹${campaign.min_order_amount}` }
    }

    // Check redemption limit
    const { count: redemptionCount } = await supabase
      .from('campaign_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('customer_id', user.id)

    if (redemptionCount && redemptionCount >= campaign.max_redemptions_per_user) {
      return { error: 'Maximum redemptions reached for this campaign' }
    }

    // Calculate discount
    let discountAmount = 0
    if (campaign.campaign_type === 'percentage') {
      discountAmount = (originalAmount * campaign.discount_percent) / 100
    } else if (campaign.campaign_type === 'flat') {
      discountAmount = campaign.flat_discount_amount
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount)

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('campaign_redemptions')
      .insert({
        campaign_id: campaignId,
        customer_id: user.id,
        service_request_id: serviceRequestId,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount
      })
      .select()
      .single()

    if (redemptionError) throw redemptionError

    // Update total redemptions
    const { error: updateError } = await supabase
      .from('seasonal_campaigns')
      .update({ 
        total_redemptions: campaign.total_redemptions + 1 
      })
      .eq('id', campaignId)

    if (updateError) throw updateError

    revalidatePath('/customer/requests')
    return { success: true, redemption, finalAmount, discountAmount }
  } catch (error: any) {
    console.error('Apply campaign to order error:', error)
    return { error: error.message }
  }
}

export async function getMyCampaignRedemptions() {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('campaign_redemptions')
      .select(`
        *,
        campaign:seasonal_campaigns(
          title,
          campaign_type,
          banner_url
        ),
        service_request:service_requests(
          title,
          status
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return { success: true, redemptions: data }
  } catch (error: any) {
    console.error('Get my campaign redemptions error:', error)
    return { error: error.message }
  }
}

export async function toggleBundleStatus(bundleId: string, isActive: boolean) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('service_bundles')
      .update({ is_active: isActive })
      .eq('id', bundleId)

    if (error) throw error

    revalidatePath('/admin/bundles')
    revalidatePath('/customer/bundles')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle bundle status error:', error)
    return { error: error.message }
  }
}

export async function toggleCampaignStatus(campaignId: string, isActive: boolean) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('seasonal_campaigns')
      .update({ is_active: isActive })
      .eq('id', campaignId)

    if (error) throw error

    revalidatePath('/admin/campaigns')
    revalidatePath('/customer/offers')
    return { success: true }
  } catch (error: any) {
    console.error('Toggle campaign status error:', error)
    return { error: error.message }
  }
}
