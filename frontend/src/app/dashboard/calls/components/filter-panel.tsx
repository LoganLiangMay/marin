'use client'

/**
 * Filter Panel Component
 * Story 6.2: Call Library View with Pagination and Filters
 *
 * Provides advanced filtering options for the call library
 */

import { FilterState } from '@/types'
import { format } from 'date-fns'

interface FilterPanelProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const handleChange = (key: keyof FilterState, value: string | undefined) => {
    onChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Status Filter */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          className="input w-full"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="transcribing">Transcribing</option>
          <option value="analyzing">Analyzing</option>
          <option value="analyzed">Analyzed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Sentiment Filter */}
      <div>
        <label htmlFor="sentiment" className="block text-sm font-medium text-gray-700 mb-1">
          Sentiment
        </label>
        <select
          id="sentiment"
          value={filters.sentiment || ''}
          onChange={(e) => handleChange('sentiment', e.target.value)}
          className="input w-full"
        >
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Call Type Filter */}
      <div>
        <label htmlFor="callType" className="block text-sm font-medium text-gray-700 mb-1">
          Call Type
        </label>
        <select
          id="callType"
          value={filters.callType || ''}
          onChange={(e) => handleChange('callType', e.target.value)}
          className="input w-full"
        >
          <option value="">All Types</option>
          <option value="sales">Sales</option>
          <option value="support">Support</option>
          <option value="discovery">Discovery</option>
          <option value="demo">Demo</option>
          <option value="followup">Follow-up</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Company Filter */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company
        </label>
        <input
          id="company"
          type="text"
          placeholder="Enter company name"
          value={filters.company || ''}
          onChange={(e) => handleChange('company', e.target.value)}
          className="input w-full"
        />
      </div>

      {/* Start Date Filter */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
          Start Date
        </label>
        <input
          id="startDate"
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="input w-full"
        />
      </div>

      {/* End Date Filter */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
          End Date
        </label>
        <input
          id="endDate"
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="input w-full"
        />
      </div>
    </div>
  )
}
