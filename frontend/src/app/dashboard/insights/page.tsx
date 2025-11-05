'use client'

/**
 * Insights Dashboard Page
 * Displays daily aggregated insights from call analysis
 *
 * Features:
 * - Daily insights cards
 * - Trends over time
 * - Key themes and patterns
 * - Date filtering
 */

import { useState } from 'react'
import { useQuery } from 'react-query'
import { insightsApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import {
  LightBulbIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import { format, subDays } from 'date-fns'
import { clsx } from 'clsx'
import { DailyInsights } from '@/types'

export default function InsightsPage() {
  const { user, isAnalyst } = useAuth()

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    preset: '30d',
  })

  // Fetch daily insights
  const { data: insights, isLoading } = useQuery(
    ['daily-insights', dateRange.start, dateRange.end],
    () => insightsApi.getDaily({
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
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="mt-2 text-gray-600">
            You need analyst or admin permissions to view insights.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Insights</h1>
          <p className="text-gray-600 mt-1">
            Key themes and patterns from your call data
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
            <p className="mt-4 text-gray-600">Loading insights...</p>
          </div>
        </div>
      ) : insights && insights.insights.length > 0 ? (
        <div className="space-y-6">
          {/* Insights Grid */}
          {insights.insights.map((insight) => (
            <DailyInsightCard key={insight.date} insight={insight} />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Insights Available</h3>
            <p className="mt-2 text-gray-600">
              There are no insights for the selected date range.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Daily Insight Card Component
function DailyInsightCard({ insight }: { insight: DailyInsights }) {
  const [expanded, setExpanded] = useState(false)

  const getSentimentColor = (sentiment: string) => {
    const colors = {
      positive: 'text-green-600 bg-green-100',
      neutral: 'text-gray-600 bg-gray-100',
      negative: 'text-red-600 bg-red-100',
    }
    return colors[sentiment as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(new Date(insight.date), 'MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-gray-600">
              {insight.total_calls} calls analyzed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('badge', getSentimentColor(insight.overall_sentiment))}>
            {insight.overall_sentiment}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Positive</p>
          <p className="text-lg font-semibold text-green-600">
            {(insight.sentiment_distribution.positive * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Neutral</p>
          <p className="text-lg font-semibold text-gray-600">
            {(insight.sentiment_distribution.neutral * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Negative</p>
          <p className="text-lg font-semibold text-red-600">
            {(insight.sentiment_distribution.negative * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Avg Score</p>
          <p className="text-lg font-semibold text-gray-900">
            {insight.average_quality_score.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Key Themes */}
      {insight.key_themes && insight.key_themes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Themes</h4>
          <div className="flex flex-wrap gap-2">
            {insight.key_themes.map((theme, idx) => (
              <span key={idx} className="badge badge-info">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Pain Points */}
      {insight.top_pain_points && insight.top_pain_points.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Top Pain Points</h4>
          <div className="space-y-2">
            {insight.top_pain_points.slice(0, expanded ? undefined : 3).map((pain, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{pain.pain_point}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {pain.frequency} occurrences • Severity: {pain.severity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Entities */}
      {insight.common_entities && insight.common_entities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Common Entities</h4>
          <div className="flex flex-wrap gap-2">
            {insight.common_entities.slice(0, expanded ? undefined : 6).map((entity, idx) => (
              <div key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>{entity.entity}</span>
                <span className="text-xs text-blue-600">{entity.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse Button */}
      {(insight.top_pain_points && insight.top_pain_points.length > 3) ||
       (insight.common_entities && insight.common_entities.length > 6) ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      ) : null}
    </div>
  )
}
