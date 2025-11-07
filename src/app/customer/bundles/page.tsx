'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getActiveServiceBundles, purchaseBundle, getMyBundles } from '@/app/actions/bundles'

interface Bundle {
  id: string
  name: string
  description: string
  price: number
  original_price: number
  image_url: string | null
  validity_days: number
  total_redemptions: number
  is_active: boolean
}

interface MyBundle {
  id: string
  bundle_id: string
  purchase_date: string
  expiry_date: string
  remaining_redemptions: number
  bundle: {
    name: string
    description: string
    image_url: string | null
  }
}

export default function CustomerBundlesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [myBundles, setMyBundles] = useState<MyBundle[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-bundles'>('marketplace')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [bundlesRes, myBundlesRes] = await Promise.all([
      getActiveServiceBundles(),
      getMyBundles()
    ])

    if (bundlesRes.error) {
      setError(bundlesRes.error)
    } else {
      setBundles(bundlesRes.bundles || [])
    }

    if (!myBundlesRes.error) {
      setMyBundles(myBundlesRes.bundles || [])
    }

    setLoading(false)
  }

  const handlePurchase = async (bundleId: string) => {
    setPurchasing(bundleId)
    setError('')

    const result = await purchaseBundle(bundleId)

    if (result.error) {
      setError(result.error)
    } else {
      // Reload data to show purchased bundle
      await loadData()
    }

    setPurchasing(null)
  }

  const calculateSavings = (originalPrice: number, price: number) => {
    const savings = originalPrice - price
    const percentage = Math.round((savings / originalPrice) * 100)
    return { savings, percentage }
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Service Bundles</h1>
          <p className="text-muted-foreground">Save more with our combo packages</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'marketplace'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('my-bundles')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'my-bundles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Bundles ({myBundles.length})
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'marketplace' ? (
          <>
            {/* Marketplace */}
            {bundles.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">No bundles available at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bundles.map(bundle => {
                  const { savings, percentage } = calculateSavings(bundle.original_price, bundle.price)
                  
                  return (
                    <Card key={bundle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {bundle.image_url && (
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-6xl">🎁</span>
                        </div>
                      )}
                      
                      <CardHeader>
                        <CardTitle className="text-lg">{bundle.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">{bundle.description}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">₹{bundle.price}</span>
                          <span className="text-sm text-muted-foreground line-through">₹{bundle.original_price}</span>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                            Save {percentage}%
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>📦</span>
                            <span>{bundle.total_redemptions} services included</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⏰</span>
                            <span>Valid for {bundle.validity_days} days</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handlePurchase(bundle.id)}
                          disabled={purchasing === bundle.id}
                          className="w-full"
                        >
                          {purchasing === bundle.id ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            'Purchase Bundle'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* My Bundles */}
            {myBundles.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">You haven't purchased any bundles yet</p>
                    <Button onClick={() => setActiveTab('marketplace')}>
                      Browse Bundles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myBundles.map(myBundle => {
                  const expiryDate = new Date(myBundle.expiry_date)
                  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isExpiringSoon = daysRemaining <= 7

                  return (
                    <Card key={myBundle.id} className={isExpiringSoon ? 'border-orange-300' : ''}>
                      <CardHeader>
                        <CardTitle className="text-lg">{myBundle.bundle.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{myBundle.bundle.description}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Redemptions Left</span>
                            <span className="font-medium">{myBundle.remaining_redemptions}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Expires</span>
                            <span className={`font-medium ${isExpiringSoon ? 'text-orange-600' : ''}`}>
                              {expiryDate.toLocaleDateString()} ({daysRemaining}d)
                            </span>
                          </div>
                        </div>

                        {isExpiringSoon && (
                          <div className="rounded bg-orange-50 border border-orange-200 p-3">
                            <p className="text-xs text-orange-700">⚠️ Expiring soon! Use your remaining services</p>
                          </div>
                        )}

                        <Link href={`/customer/bundles/redeem?id=${myBundle.id}`}>
                          <Button className="w-full" variant="outline">
                            Redeem Service
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
