'use server'

import Link from 'next/link'
import { PlatformTrustBadges, PaymentSafetyInfo } from '@/components/trust-badges'

export default async function CustomerDashboard() {
  return (
    <div className="min-h-screen bg-primary-50 py-12 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Helparo. Manage your service requests and payments.</p>
        </div>
        
        {/* Trust Badges */}
        <div className="bg-white p-6 rounded-lg border">
          <PlatformTrustBadges />
          <div className="mt-6">
            <PaymentSafetyInfo />
          </div>
        </div>
        
        {/* Main Services */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/services" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🔍 Browse Services</h3>
              <p className="text-sm text-muted-foreground">Explore available service categories</p>
            </Link>
            
            <Link href="/customer/requests/new" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">➕ Create Request</h3>
              <p className="text-sm text-muted-foreground">Post a new service request</p>
            </Link>
            
            <Link href="/customer/requests" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">📋 My Requests</h3>
              <p className="text-sm text-muted-foreground">View and manage your requests</p>
            </Link>

            <Link href="/customer/bids" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">💼 Bids</h3>
              <p className="text-sm text-muted-foreground">Review helper bids</p>
            </Link>
          </div>
        </div>

        {/* Payments & Rewards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Payments & Rewards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/customer/wallet" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">💰 Wallet</h3>
              <p className="text-sm text-muted-foreground">Fund escrows and view balance</p>
            </Link>

            <Link href="/customer/withdrawals" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">💸 Withdrawals</h3>
              <p className="text-sm text-muted-foreground">Request withdrawals</p>
            </Link>

            <Link href="/customer/loyalty" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">⭐ Loyalty Points</h3>
              <p className="text-sm text-muted-foreground">Earn & redeem points</p>
            </Link>

            <Link href="/customer/badges" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🏆 Badges</h3>
              <p className="text-sm text-muted-foreground">Achievements & rewards</p>
            </Link>
          </div>
        </div>

        {/* Deals & Offers */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Deals & Offers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/customer/bundles" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🎁 Service Bundles</h3>
              <p className="text-sm text-muted-foreground">Save with combo packages</p>
            </Link>

            <Link href="/customer/campaigns" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🎉 Campaigns</h3>
              <p className="text-sm text-muted-foreground">Seasonal offers & discounts</p>
            </Link>

            <Link href="/customer/promos" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🎫 Promo Codes</h3>
              <p className="text-sm text-muted-foreground">Apply discount codes</p>
            </Link>
          </div>
        </div>

        {/* Account & Support */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Account & Support</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/customer/subscriptions" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">📱 Subscriptions</h3>
              <p className="text-sm text-muted-foreground">Manage subscriptions</p>
            </Link>

            <Link href="/customer/referrals" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🤝 Referrals</h3>
              <p className="text-sm text-muted-foreground">Refer friends & earn</p>
            </Link>

            <Link href="/customer/support" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🎧 Support</h3>
              <p className="text-sm text-muted-foreground">Get help & support</p>
            </Link>

            <Link href="/customer/notifications" className="block p-6 bg-white rounded-lg border hover:border-primary transition-colors">
              <h3 className="font-semibold text-lg mb-2">🔔 Notifications</h3>
              <p className="text-sm text-muted-foreground">View notifications</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
