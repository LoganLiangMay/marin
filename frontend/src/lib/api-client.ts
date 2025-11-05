/**
 * API Client for backend communication
 * Story 6.1: Next.js Project Setup with Authentication
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { getAuthTokens } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Create axios instance with default configuration
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    async (config) => {
      const tokens = await getAuthTokens()
      if (tokens) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}

// Singleton instance
let apiClient: AxiosInstance | null = null

export const getApiClient = (): AxiosInstance => {
  if (!apiClient) {
    apiClient = createAxiosInstance()
  }
  return apiClient
}

// Type definitions for API responses
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  detail: string
  status_code?: number
}

// Helper function to handle API errors
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError
    return apiError?.detail || error.message || 'An unexpected error occurred'
  }
  return 'An unexpected error occurred'
}

// API endpoint functions

/**
 * Calls API
 */
export const callsApi = {
  /**
   * Get list of calls with pagination and filters
   */
  async list(params?: {
    page?: number
    page_size?: number
    status?: string
    start_date?: string
    end_date?: string
  }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/calls', { params })
    return response.data
  },

  /**
   * Get call by ID
   */
  async get(callId: string) {
    const client = getApiClient()
    const response = await client.get(`/api/v1/calls/${callId}`)
    return response.data
  },

  /**
   * Upload audio file
   */
  async upload(file: File, metadata?: any) {
    const client = getApiClient()
    const formData = new FormData()
    formData.append('file', file)
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const response = await client.post('/api/v1/calls/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  /**
   * Delete call
   */
  async delete(callId: string) {
    const client = getApiClient()
    const response = await client.delete(`/api/v1/calls/${callId}`)
    return response.data
  },
}

/**
 * Analytics API
 */
export const analyticsApi = {
  /**
   * Get analytics summary
   */
  async getSummary(params?: {
    start_date?: string
    end_date?: string
    days?: number
  }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/analytics/summary', { params })
    return response.data
  },

  /**
   * Get call volume time series
   */
  async getCallVolume(params?: {
    start_date?: string
    end_date?: string
    days?: number
  }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/analytics/call-volume/timeseries', { params })
    return response.data
  },

  /**
   * Get sentiment trends
   */
  async getSentimentTrends(days?: number) {
    const client = getApiClient()
    const response = await client.get('/api/v1/analytics/sentiment/trends', {
      params: { days },
    })
    return response.data
  },

  /**
   * Get top pain points
   */
  async getPainPoints(params?: { days?: number; limit?: number }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/analytics/pain-points', { params })
    return response.data
  },

  /**
   * Get top entities
   */
  async getTopEntities(params?: { entity_type?: string; limit?: number }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/analytics/entities/top', { params })
    return response.data
  },
}

/**
 * Insights API
 */
export const insightsApi = {
  /**
   * Get latest insights
   */
  async getLatest() {
    const client = getApiClient()
    const response = await client.get('/api/v1/insights/latest')
    return response.data
  },

  /**
   * Get insights for specific date
   */
  async getByDate(date: string) {
    const client = getApiClient()
    const response = await client.get(`/api/v1/insights/daily/${date}`)
    return response.data
  },
}

/**
 * Quality API
 */
export const qualityApi = {
  /**
   * Get quality metrics
   */
  async getMetrics(params?: {
    start_date?: string
    end_date?: string
    period_hours?: number
  }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/quality/metrics', { params })
    return response.data
  },

  /**
   * Get quality alerts
   */
  async getAlerts(params?: {
    status?: string
    severity?: string
    limit?: number
  }) {
    const client = getApiClient()
    const response = await client.get('/api/v1/quality/alerts', { params })
    return response.data
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const client = getApiClient()
    const response = await client.post(`/api/v1/quality/alerts/${alertId}/acknowledge`, {
      acknowledged_by: acknowledgedBy,
    })
    return response.data
  },

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolutionNotes?: string) {
    const client = getApiClient()
    const response = await client.post(`/api/v1/quality/alerts/${alertId}/resolve`, {
      resolution_notes: resolutionNotes,
    })
    return response.data
  },

  /**
   * Get quality dashboard
   */
  async getDashboard() {
    const client = getApiClient()
    const response = await client.get('/api/v1/quality/dashboard')
    return response.data
  },
}

/**
 * Health API
 */
export const healthApi = {
  /**
   * Basic health check
   */
  async check() {
    const client = getApiClient()
    const response = await client.get('/api/v1/health')
    return response.data
  },

  /**
   * Detailed health check
   */
  async detailed() {
    const client = getApiClient()
    const response = await client.get('/api/v1/health/detailed')
    return response.data
  },

  /**
   * Get metrics
   */
  async metrics() {
    const client = getApiClient()
    const response = await client.get('/api/v1/metrics')
    return response.data
  },
}
