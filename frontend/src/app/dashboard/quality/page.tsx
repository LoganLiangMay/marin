'use client'

/**
 * Quality Monitoring Page
 * Displays analysis quality metrics and alerts
 *
 * Features:
 * - Quality score trends
 * - Active alerts
 * - Low quality calls
 * - Quality metrics breakdown
 */

import { useState } from 'react'
import { useQuery } from 'react-query'
import { qualityApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { format, subDays } from 'date-fns'
import { clsx } from 'clsx'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function QualityPage() {
  const { user, isAnalyst } = useAuth()

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    preset: '30d',
  })

  // Fetch quality alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery(
    ['quality-alerts'],
    () => qualityApi.getAlerts({ limit: 50 }),
    {
      enabled: !!user && isAnalyst,
      refetchInterval: 60000, // Refetch every minute
    }
  )

  // Fetch quality metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    ['quality-metrics', dateRange.start, dateRange.end],
    () => qualityApi.getMetrics({
      start_date: dateRange.start,
      end_date: dateRange.end,
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
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-gray-600">
            You need analyst or admin permissions to view quality monitoring.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = alertsLoading || metricsLoading

  // Count alerts by severity
  const alertCounts = alerts?.alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Track analysis quality and system alerts
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
            <p className="mt-4 text-gray-600">Loading quality data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Alert Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {alerts?.total || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {alertCounts.critical || 0}
                  </p>
                </div>
                <XCircleIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warning</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {alertCounts.warning || 0}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {metrics ? (metrics.average_quality_score * 100).toFixed(1) : '0'}%
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quality Score Trend */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quality Score Trend
                </h2>
                {metrics.quality_over_time && metrics.quality_over_time.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.quality_over_time}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_score"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Avg Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>

              {/* Quality Breakdown */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Quality Breakdown
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Has Transcript</span>
                      <span className="font-medium text-gray-900">
                        {(metrics.transcript_quality_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${metrics.transcript_quality_rate * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Has Sentiment</span>
                      <span className="font-medium text-gray-900">
                        {(metrics.sentiment_analysis_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${metrics.sentiment_analysis_rate * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Has Entities</span>
                      <span className="font-medium text-gray-900">
                        {(metrics.entity_extraction_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${metrics.entity_extraction_rate * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <span className="font-medium text-gray-900">{metrics.total_calls}</span> total calls analyzed
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">{metrics.low_quality_calls}</span> calls below quality threshold
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Alerts */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
            {alerts && alerts.alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className={clsx(
                      'p-4 rounded-lg border',
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={clsx(
                            'badge text-xs',
                            alert.severity === 'critical' ? 'badge-error' :
                            alert.severity === 'warning' ? 'badge-warning' :
                            'badge-info'
                          )}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {alert.alert_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {alert.message}
                        </p>
                        {alert.call_id && (
                          <a
                            href={`/dashboard/calls/${alert.call_id}`}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium mt-2 inline-block"
                          >
                            View Call →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                <p className="mt-4 text-gray-600">No active alerts</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
