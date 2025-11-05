'use client'

/**
 * Analytics Dashboard Page
 * Story 6.5: Analytics Dashboard with Visualizations
 *
 * Features:
 * - Call volume trends (line chart)
 * - Sentiment distribution (pie chart)
 * - Top pain points
 * - Top entities mentioned
 * - Performance metrics
 * - Date range selector
 */

import { useState } from 'react'
import { useQuery } from 'react-query'
import { analyticsApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { clsx } from 'clsx'

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
}

const SEVERITY_COLORS = ['#ef4444', '#f59e0b', '#eab308']

export default function AnalyticsPage() {
  const { user, isAnalyst } = useAuth()

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    preset: '30d',
  })

  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery(
    ['analytics-summary', dateRange.start, dateRange.end],
    () => analyticsApi.getSummary({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
    {
      enabled: !!user && isAnalyst,
    }
  )

  // Fetch call volume timeseries
  const { data: callVolume, isLoading: volumeLoading } = useQuery(
    ['call-volume', dateRange.start, dateRange.end],
    () => analyticsApi.getCallVolume({
      start_date: dateRange.start,
      end_date: dateRange.end,
      interval: 'daily',
    }),
    {
      enabled: !!user && isAnalyst,
    }
  )

  // Fetch sentiment trends
  const { data: sentiment, isLoading: sentimentLoading } = useQuery(
    ['sentiment-trends', dateRange.start, dateRange.end],
    () => analyticsApi.getSentimentTrends({
      start_date: dateRange.start,
      end_date: dateRange.end,
    }),
    {
      enabled: !!user && isAnalyst,
    }
  )

  // Fetch pain points
  const { data: painPoints, isLoading: painPointsLoading } = useQuery(
    ['pain-points', dateRange.start, dateRange.end],
    () => analyticsApi.getPainPoints({
      start_date: dateRange.start,
      end_date: dateRange.end,
      limit: 10,
    }),
    {
      enabled: !!user && isAnalyst,
    }
  )

  // Fetch top entities
  const { data: entities, isLoading: entitiesLoading } = useQuery(
    ['top-entities', dateRange.start, dateRange.end],
    () => analyticsApi.getTopEntities({
      start_date: dateRange.start,
      end_date: dateRange.end,
      limit: 10,
      entity_type: undefined,
    }),
    {
      enabled: !!user && isAnalyst,
    }
  )

  const handlePresetChange = (preset: string) => {
    const end = new Date()
    let start: Date

    switch (preset) {
      case '7d':
        start = subDays(end, 7)
        break
      case '30d':
        start = subDays(end, 30)
        break
      case '90d':
        start = subDays(end, 90)
        break
      case 'custom':
        return // Don't update dates for custom
      default:
        start = subDays(end, 30)
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      preset,
    })
  }

  if (!isAnalyst) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-gray-600">
            You need analyst or admin permissions to view analytics.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = summaryLoading || volumeLoading || sentimentLoading || painPointsLoading || entitiesLoading

  // Prepare sentiment pie chart data
  const sentimentPieData = summary ? [
    { name: 'Positive', value: summary.sentiment.positive_percentage, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: summary.sentiment.neutral_percentage, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: summary.sentiment.negative_percentage, color: SENTIMENT_COLORS.negative },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Insights and trends from your call data
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            {['7d', '30d', '90d'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={clsx(
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                  dateRange.preset === preset
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {preset === '7d' && 'Last 7 Days'}
                {preset === '30d' && 'Last 30 Days'}
                {preset === '90d' && 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Calls"
                value={summary.call_volume.total_calls}
                subtitle={`${summary.call_volume.analyzed_calls} analyzed`}
                trend={summary.call_volume.change_percentage}
                icon={<ChartBarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Avg Processing Time"
                value={`${summary.performance.average_total_time.toFixed(1)}s`}
                subtitle="Per call"
                icon={<CalendarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Total Cost"
                value={`$${summary.performance.total_cost_usd.toFixed(2)}`}
                subtitle={`$${summary.performance.average_cost_per_call.toFixed(4)}/call`}
                icon={<ChartBarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Success Rate"
                value={`${((summary.call_volume.analyzed_calls / summary.call_volume.total_calls) * 100).toFixed(1)}%`}
                subtitle={`${summary.call_volume.failed_calls} failed`}
                icon={<ChartBarIcon className="h-6 w-6" />}
              />
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Call Volume Chart */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Volume Trend</h2>
              {callVolume && callVolume.timeseries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={callVolume.timeseries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_calls"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Total Calls"
                    />
                    <Line
                      type="monotone"
                      dataKey="analyzed_calls"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Analyzed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Sentiment Distribution */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h2>
              {sentimentPieData.length > 0 && sentimentPieData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pain Points */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pain Points</h2>
              {painPoints && painPoints.pain_points.length > 0 ? (
                <div className="space-y-3">
                  {painPoints.pain_points.slice(0, 8).map((pain, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pain.pain_point}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {pain.count} occurrences • Avg severity: {pain.avg_severity.toFixed(1)}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-brand-600">
                            {pain.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No pain points identified
                </div>
              )}
            </div>

            {/* Top Entities */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Mentioned Entities</h2>
              {entities && entities.entities.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={entities.entities.slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="entity"
                      stroke="#6b7280"
                      fontSize={12}
                      width={90}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No entities found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: {
  title: string
  value: string | number
  subtitle: string
  trend?: number
  icon?: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        {icon && (
          <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1 text-sm">
            {trend > 0 ? (
              <>
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">+{trend.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">{trend.toFixed(1)}%</span>
              </>
            )}
            <span className="text-gray-500">vs previous period</span>
          </div>
        </div>
      )}
    </div>
  )
}
