'use client';

import { useState, useEffect } from 'react';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real data from Supabase
  const stats = {
    revenue: {
      total: '₹2,45,680',
      growth: '+24.5%',
      data: [12000, 15000, 18000, 22000, 25000, 28000, 32000],
    },
    bookings: {
      total: 1248,
      growth: '+18.2%',
      data: [45, 52, 48, 58, 65, 72, 68],
    },
    activeHelpers: {
      total: 156,
      growth: '+12.3%',
      data: [120, 125, 130, 138, 145, 150, 156],
    },
    customers: {
      total: 2845,
      growth: '+32.1%',
      data: [2200, 2350, 2500, 2600, 2700, 2780, 2845],
    },
  };

  const categoryPerformance = [
    { name: 'Home Cleaning', bookings: 342, revenue: 85680, growth: 25.4 },
    { name: 'Plumbing', bookings: 215, revenue: 65320, growth: 18.7 },
    { name: 'Electrical', bookings: 189, revenue: 48900, growth: 15.2 },
    { name: 'Carpentry', bookings: 156, revenue: 42100, growth: 12.8 },
    { name: 'Painting', bookings: 124, revenue: 38400, growth: 22.1 },
    { name: 'Pest Control', bookings: 98, revenue: 28650, growth: 9.5 },
  ];

  const topHelpers = [
    { name: 'Rajesh Kumar', bookings: 45, rating: 4.9, earnings: '₹28,450' },
    { name: 'Amit Sharma', bookings: 42, rating: 4.8, earnings: '₹26,800' },
    { name: 'Suresh Patel', bookings: 38, rating: 4.9, earnings: '₹24,680' },
    { name: 'Vikram Singh', bookings: 35, rating: 4.7, earnings: '₹22,350' },
    { name: 'Ravi Verma', bookings: 33, rating: 4.8, earnings: '₹21,900' },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 3 Months'}
              {range === '1y' && 'Last Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={stats.revenue.total}
          growth={stats.revenue.growth}
          icon="💰"
          trend={stats.revenue.data}
        />
        <MetricCard
          title="Total Bookings"
          value={stats.bookings.total.toString()}
          growth={stats.bookings.growth}
          icon="📅"
          trend={stats.bookings.data}
        />
        <MetricCard
          title="Active Helpers"
          value={stats.activeHelpers.total.toString()}
          growth={stats.activeHelpers.growth}
          icon="👷"
          trend={stats.activeHelpers.data}
        />
        <MetricCard
          title="Total Customers"
          value={stats.customers.total.toString()}
          growth={stats.customers.growth}
          icon="👥"
          trend={stats.customers.data}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.revenue.data.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{
                    height: `${(value / Math.max(...stats.revenue.data)) * 100}%`,
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {timeRange === '7d' ? `Day ${idx + 1}` : `W${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.bookings.data.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                  style={{
                    height: `${(value / Math.max(...stats.bookings.data)) * 100}%`,
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {timeRange === '7d' ? `Day ${idx + 1}` : `W${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Bookings</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Growth</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              {categoryPerformance.map((category, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{category.name}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{category.bookings}</td>
                  <td className="py-3 px-4 text-right text-gray-700">₹{category.revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-green-600 font-medium">+{category.growth}%</span>
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
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Helpers</h2>
        <div className="space-y-4">
          {topHelpers.map((helper, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{helper.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">{helper.bookings} bookings</span>
                    <span className="text-yellow-500 flex items-center gap-1 text-sm">
                      ⭐ {helper.rating}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg">{helper.earnings}</p>
                <p className="text-sm text-gray-500">Total earnings</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  growth,
  icon,
  trend,
}: {
  title: string;
  value: string;
  growth: string;
  icon: string;
  trend: number[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {growth}
        </span>
        <div className="flex items-end gap-0.5 h-8">
          {trend.map((value, idx) => (
            <div
              key={idx}
              className="w-1 bg-blue-500 rounded-t"
              style={{
                height: `${(value / Math.max(...trend)) * 100}%`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, idx) => (
        <div
          key={idx}
          className="w-1 bg-green-500 rounded-full"
          style={{
            height: `${Math.min(4 + idx * 2, 20)}px`,
            opacity: 0.4 + (idx * 0.15),
          }}
        ></div>
      ))}
    </div>
  );
}
