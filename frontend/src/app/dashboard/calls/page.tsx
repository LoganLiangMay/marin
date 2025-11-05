'use client'

/**
 * Call Library Page
 * Story 6.2: Call Library View with Pagination and Filters
 *
 * Features:
 * - Paginated table of calls
 * - Advanced filtering (status, date range, sentiment, company, call type)
 * - Search by transcript or company name
 * - Upload audio file
 * - View call details
 */

import { useState } from 'react'
import { useQuery } from 'react-query'
import { callsApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import { Call, PaginationState, FilterState } from '@/types'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import UploadModal from './components/upload-modal'
import FilterPanel from './components/filter-panel'

export default function CallsPage() {
  const { user } = useAuth()

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
  })

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: undefined,
    sentiment: undefined,
    startDate: undefined,
    endDate: undefined,
    company: undefined,
    callType: undefined,
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // UI state
  const [showFilters, setShowFilters] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Fetch calls with pagination and filters
  const { data, isLoading, error, refetch } = useQuery(
    ['calls', pagination, filters, debouncedSearch],
    () => callsApi.list({
      page: pagination.page,
      page_size: pagination.pageSize,
      status: filters.status,
      sentiment: filters.sentiment,
      start_date: filters.startDate,
      end_date: filters.endDate,
      company_name: filters.company,
      call_type: filters.callType,
      search: debouncedSearch || undefined,
    }),
    {
      keepPreviousData: true,
      enabled: !!user,
    }
  )

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    const timer = setTimeout(() => {
      setDebouncedSearch(value)
      setPagination({ ...pagination, page: 1 }) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 }) // Reset to first page on filter change
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      status: undefined,
      sentiment: undefined,
      startDate: undefined,
      endDate: undefined,
      company: undefined,
      callType: undefined,
    })
    setSearchQuery('')
    setDebouncedSearch('')
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(v => v !== undefined) || debouncedSearch !== ''

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / pagination.pageSize) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Library</h1>
          <p className="text-gray-600 mt-1">
            {data ? `${data.total} total calls` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn btn-primary flex items-center justify-center"
        >
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          Upload Audio
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by company name or transcript..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'btn flex items-center justify-center',
              hasActiveFilters ? 'btn-primary' : 'btn-secondary'
            )}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-white text-brand-600 rounded-full">
                Active
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary flex items-center justify-center"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>
        )}
      </div>

      {/* Calls Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading calls...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Error loading calls. Please try again.</p>
            <button onClick={() => refetch()} className="btn btn-secondary mt-4">
              Retry
            </button>
          </div>
        ) : data && data.calls.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company / Call Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.calls.map((call) => (
                    <CallTableRow key={call.call_id} call={call} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {data.calls.map((call) => (
                <CallMobileCard key={call.call_id} call={call} />
              ))}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={pagination.page}
                totalPages={totalPages}
                pageSize={pagination.pageSize}
                totalItems={data.total}
                onPageChange={(page) => setPagination({ ...pagination, page })}
                onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
              />
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">No calls found.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            refetch()
            toast.success('Audio file uploaded successfully')
          }}
        />
      )}
    </div>
  )
}

// Call Table Row Component
function CallTableRow({ call }: { call: Call }) {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'badge-warning',
      processing: 'badge-info',
      transcribing: 'badge-info',
      analyzing: 'badge-info',
      analyzed: 'badge-success',
      failed: 'badge-error',
    }
    return styles[status as keyof typeof styles] || 'badge-info'
  }

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null
    const styles = {
      positive: 'badge-success',
      neutral: 'badge',
      negative: 'badge-error',
    }
    return styles[sentiment as keyof typeof styles] || 'badge'
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {call.metadata?.company_name || 'Unknown Company'}
          </div>
          <div className="text-sm text-gray-500">
            {call.metadata?.call_type || 'Unknown Type'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {call.audio_duration_seconds
          ? `${Math.floor(call.audio_duration_seconds / 60)}:${(call.audio_duration_seconds % 60).toString().padStart(2, '0')}`
          : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${getStatusBadge(call.status)}`}>
          {call.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {call.analysis?.overall_sentiment ? (
          <span className={`badge ${getSentimentBadge(call.analysis.overall_sentiment)}`}>
            {call.analysis.overall_sentiment}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(call.created_at), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <a
            href={`/dashboard/calls/${call.call_id}`}
            className="text-brand-600 hover:text-brand-900"
            title="View details"
          >
            <EyeIcon className="h-5 w-5" />
          </a>
          {call.audio_url && (
            <a
              href={call.audio_url}
              download
              className="text-gray-600 hover:text-gray-900"
              title="Download audio"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </td>
    </tr>
  )
}

// Mobile Card Component
function CallMobileCard({ call }: { call: Call }) {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'badge-warning',
      processing: 'badge-info',
      transcribing: 'badge-info',
      analyzing: 'badge-info',
      analyzed: 'badge-success',
      failed: 'badge-error',
    }
    return styles[status as keyof typeof styles] || 'badge-info'
  }

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null
    const styles = {
      positive: 'badge-success',
      neutral: 'badge',
      negative: 'badge-error',
    }
    return styles[sentiment as keyof typeof styles] || 'badge'
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {call.metadata?.company_name || 'Unknown Company'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {call.metadata?.call_type || 'Unknown Type'}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/calls/${call.call_id}`}
            className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg"
          >
            <EyeIcon className="h-5 w-5" />
          </a>
          {call.audio_url && (
            <a
              href={call.audio_url}
              download
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className={`badge ${getStatusBadge(call.status)}`}>
          {call.status}
        </span>
        {call.analysis?.overall_sentiment && (
          <span className={`badge ${getSentimentBadge(call.analysis.overall_sentiment)}`}>
            {call.analysis.overall_sentiment}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {call.audio_duration_seconds
            ? `${Math.floor(call.audio_duration_seconds / 60)}:${(call.audio_duration_seconds % 60).toString().padStart(2, '0')}`
            : 'Duration unknown'}
        </span>
        <span>{format(new Date(call.created_at), 'MMM d, yyyy')}</span>
      </div>
    </div>
  )
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, and pages around current
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Info */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            Per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="input text-sm py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {getPageNumbers().map((page, idx) => (
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(page)}
                className={clsx(
                  'px-3 py-1 text-sm font-medium rounded-md',
                  page === currentPage
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                )}
              >
                {page}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-500">
                {page}
              </span>
            )
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
