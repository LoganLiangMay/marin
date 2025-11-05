'use client'

/**
 * Dashboard Home Page
 * Story 6.1: Next.js Project Setup with Authentication
 */

import { useAuth } from '@/hooks/use-auth'
import { useQuery } from 'react-query'
import { healthApi, analyticsApi } from '@/lib/api-client'

export default function DashboardPage() {
  const { user } = useAuth()

  // Fetch health status
  const { data: health } = useQuery('health', () => healthApi.check(), {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch analytics summary
  const { data: analytics, isLoading } = useQuery(
    'analytics-summary',
    () => analyticsApi.getSummary({ days: 7 }),
    {
      enabled: !!user,
    }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.email || 'User'}
        </p>
      </div>

      {/* System Status */}
      {health && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <p className="text-sm text-gray-600 mt-1">API Version: {health.version}</p>
            </div>
            <div className="flex items-center">
              <span className="status-dot status-success"></span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-20 mb-2"></div>
              <div className="skeleton h-8 w-16"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Calls"
            value={analytics.call_volume.total_calls}
            subtitle="Last 7 days"
          />
          <StatCard
            title="Analyzed"
            value={analytics.call_volume.analyzed_calls}
            subtitle={`${((analytics.call_volume.analyzed_calls / analytics.call_volume.total_calls) * 100).toFixed(1)}% success rate`}
          />
          <StatCard
            title="Avg Processing Time"
            value={`${analytics.performance.average_total_time.toFixed(1)}s`}
            subtitle="Per call"
          />
          <StatCard
            title="Total Cost"
            value={`$${analytics.performance.total_cost_usd.toFixed(2)}`}
            subtitle={`$${analytics.performance.average_cost_per_call.toFixed(4)} per call`}
          />
        </div>
      ) : null}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickLinkCard
          title="View Calls"
          description="Browse and search all call recordings"
          href="/dashboard/calls"
          icon="📞"
        />
        <QuickLinkCard
          title="Analytics"
          description="View detailed analytics and trends"
          href="/dashboard/analytics"
          icon="📊"
        />
        <QuickLinkCard
          title="Insights"
          description="Daily aggregated insights"
          href="/dashboard/insights"
          icon="💡"
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="card">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

function QuickLinkCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: string }) {
  return (
    <a href={href} className="card hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </a>
  )
}
