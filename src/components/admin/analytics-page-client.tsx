'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { TrendingUp, IndianRupee, ShoppingCart, Users, UserCheck, BarChart3, RefreshCw } from 'lucide-react'
import { getAnalyticsData } from '@/app/actions/admin'
import { useToast } from '@/components/ui/toast-notification'

interface Stats {
  revenue: {
    total: string
    growth: string
    data: number[]
  }
  bookings: {
    total: number
    growth: string
    data: number[]
  }
  activeHelpers: {
    total: number
    growth: string
    data: number[]
  }
  customers: {
    total: number
    growth: string
    data: number[]
  }
}

interface CategoryPerformance {
  id: string
  name: string
  bookings: number
  revenue: number
  growth: number
}

interface TopHelper {
  id: string
  name: string
  bookings: number
  rating: number
  earnings: string
}

interface AnalyticsData {
  stats: Stats
  categoryPerformance: CategoryPerformance[]
  topHelpers: TopHelper[]
}

interface AnalyticsPageClientProps {
  analytics: AnalyticsData
}

export function AnalyticsPageClient({ analytics }: AnalyticsPageClientProps) {
  const router = useRouter()
  const { showSuccess, showError, showInfo } = useToast()
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(false)

  const handleRefresh = useCallback(() => {
    showInfo('Refreshing Analytics...', 'Fetching latest analytics data')
    router.refresh()
  }, [router, showInfo])

  const handleTimeRangeChange = useCallback(async (range: '7d' | '30d' | '90d' | '1y') => {
    setTimeRange(range)
    setLoading(true)
    showInfo(`Loading ${range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '3 Months' : '1 Year'} Data...`, 'Please wait while we fetch analytics')
    
    try {
      const result = await getAnalyticsData(range)
      if ('success' in result && result.success) {
        showSuccess('Data Loaded! 📊', `Analytics for ${range === '7d' ? '7 days' : range === '30d' ? '30 days' : range === '90d' ? '3 months' : '1 year'} has been updated`)
        router.refresh()
      } else {
        showError('Load Failed', 'Failed to fetch analytics data for selected time range')
      }
    } catch (error) {
      console.error('Error changing time range:', error)
      showError('Load Failed', 'An unexpected error occurred while loading analytics')
    } finally {
      setLoading(false)
    }
  }, [router, showSuccess, showError, showInfo])

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-900 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Analytics Dashboard</h1>
            <p className="text-muted-foreground dark:text-slate-400">Platform performance and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm" className="dark:bg-slate-800 dark:text-white dark:border-slate-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-600 shadow-sm">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeRange === range
                      ? 'bg-primary-600 text-white dark:bg-blue-600'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {loading && timeRange === range ? 'Loading...' : (
                    <>                    
                      {range === '7d' && '7 Days'}
                      {range === '30d' && '30 Days'}
                      {range === '90d' && '3 Months'}
                      {range === '1y' && '1 Year'}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={analytics.stats.revenue.total}
            growth={analytics.stats.revenue.growth}
            icon={<IndianRupee className="h-6 w-6" />}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            trend={analytics.stats.revenue.data}
          />
          <MetricCard
            title="Total Bookings"
            value={analytics.stats.bookings.total.toString()}
            growth={analytics.stats.bookings.growth}
            icon={<ShoppingCart className="h-6 w-6" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            trend={analytics.stats.bookings.data}
          />
          <MetricCard
            title="Active Helpers"
            value={analytics.stats.activeHelpers.total.toString()}
            growth={analytics.stats.activeHelpers.growth}
            icon={<UserCheck className="h-6 w-6" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            trend={analytics.stats.activeHelpers.data}
          />
          <MetricCard
            title="Total Customers"
            value={analytics.stats.customers.total.toString()}
            growth={analytics.stats.customers.growth}
            icon={<Users className="h-6 w-6" />}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            trend={analytics.stats.customers.data}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.stats.revenue.data.map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t hover:from-green-600 hover:to-green-700 transition-colors"
                      style={{
                        height: `${(value / Math.max(...analytics.stats.revenue.data)) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">
                      {timeRange === '7d' ? `D${idx + 1}` : `W${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                Bookings Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.stats.bookings.data.map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t hover:from-blue-600 hover:to-blue-700 transition-colors"
                      style={{
                        height: `${(value / Math.max(...analytics.stats.bookings.data)) * 100}%`,
                        minHeight: '8px'
                      }}
                    />
                    <span className="text-xs text-muted-foreground mt-2">
                      {timeRange === '7d' ? `D${idx + 1}` : `W${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-right py-3 px-4 font-medium">Bookings</th>
                    <th className="text-right py-3 px-4 font-medium">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium">Growth</th>
                    <th className="text-right py-3 px-4 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.categoryPerformance.map((category) => (
                    <tr key={category.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{category.bookings}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{category.revenue.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant="secondary" className="text-green-600 bg-green-50">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{category.growth}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <MiniSparkline value={category.growth} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Helpers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              Top Performing Helpers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topHelpers.map((helper, idx) => (
              <div key={helper.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{helper.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">{helper.bookings} bookings</span>
                      <span className="text-yellow-500 flex items-center gap-1 text-sm">
                        ⭐ {helper.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{helper.earnings}</p>
                  <p className="text-sm text-muted-foreground">Total earnings</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  growth,
  icon,
  iconBg,
  iconColor,
  trend,
}: {
  title: string
  value: string
  growth: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend: number[]
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`${growth.startsWith('+') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}
          >
            {growth}
          </Badge>
          <div className="flex items-end gap-0.5 h-8">
            {trend.map((value, idx) => (
              <div
                key={idx}
                className="w-1 bg-primary-500 rounded-t"
                style={{
                  height: `${Math.max((value / Math.max(...trend)) * 100, 10)}%`,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniSparkline({ value }: { value: number }) {
  // Value represents growth percentage for visualization scaling
  const intensity = Math.min(value / 50, 1) // Scale based on growth percentage
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          className="w-1 bg-green-500 rounded-full"
          style={{
            height: `${Math.min(4 + idx * 2, 16)}px`,
            opacity: 0.4 + (idx * 0.15 * intensity),
          }}
        />
      ))}
    </div>
  )
}