/**
 * TypeScript type definitions for the application
 * Story 6.1: Next.js Project Setup with Authentication
 */

// Call Types
export interface Call {
  call_id: string
  status: 'pending' | 'uploading' | 'transcribing' | 'analyzing' | 'analyzed' | 'failed'
  created_at: string
  updated_at: string
  audio_file: {
    filename: string
    size_bytes: number
    duration_seconds?: number
    s3_key: string
    s3_url?: string
  }
  transcript?: {
    full_text: string
    word_count: number
    language: string
    confidence_score: number
  }
  analysis?: CallAnalysis
  metadata?: {
    company_name?: string
    call_type?: string
    participants?: string[]
    [key: string]: any
  }
  processing?: {
    uploaded_at?: string
    transcribed_at?: string
    analyzed_at?: string
  }
  error?: string
}

export interface CallAnalysis {
  summary: string
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative'
    score: number
    confidence: number
    reasoning: string
  }
  entities: Entity[]
  pain_points: PainPoint[]
  objections: Objection[]
  key_topics: string[]
  call_outcome: string
  next_steps: string[]
  quality_validation?: QualityValidation
}

export interface Entity {
  entity: string
  entity_type: 'person' | 'company' | 'product' | 'location' | 'other'
  mentions: number
  context?: string
}

export interface PainPoint {
  pain_point: string
  severity: number
  category?: string
  mentioned_at?: string
}

export interface Objection {
  objection: string
  type: string
  handled: boolean
  response?: string
}

export interface QualityValidation {
  quality_score: number
  quality_level: 'high' | 'medium' | 'low'
  completeness_score: number
  consistency_score: number
  confidence_score: number
  issues: QualityIssue[]
  recommendations: string[]
  requires_review: boolean
  alert_triggered: boolean
  validated_at: string
}

export interface QualityIssue {
  issue_type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  description: string
  field_path?: string
  expected_value?: any
  actual_value?: any
}

// Analytics Types
export interface AnalyticsSummary {
  period_start: string
  period_end: string
  call_volume: CallVolumeStats
  sentiment: SentimentDistribution
  performance: PerformanceMetrics
  top_topics: TopicStatistics[]
  top_entities: EntityStatistics[]
  outcomes: OutcomeStatistics[]
}

export interface CallVolumeStats {
  total_calls: number
  analyzed_calls: number
  failed_calls: number
  pending_calls: number
  average_duration_seconds: number
  total_duration_hours: number
}

export interface SentimentDistribution {
  positive_count: number
  neutral_count: number
  negative_count: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  average_score: number
}

export interface PerformanceMetrics {
  average_transcription_time: number
  average_analysis_time: number
  average_total_time: number
  success_rate: number
  total_cost_usd: number
  average_cost_per_call: number
}

export interface TopicStatistics {
  topic: string
  call_count: number
  percentage: number
}

export interface EntityStatistics {
  entity_id: string
  canonical_name: string
  entity_type: string
  total_mentions: number
  call_count: number
  first_mentioned: string
  last_mentioned: string
}

export interface OutcomeStatistics {
  outcome: string
  count: number
  percentage: number
}

export interface CallVolumeTimeSeries {
  date: string
  call_count: number
  analyzed_count: number
  average_duration: number
}

export interface SentimentTrendPoint {
  date: string
  positive_count: number
  neutral_count: number
  negative_count: number
  average_score: number
}

// Insights Types
export interface DailyInsights {
  insights_id: string
  insights_type: 'daily' | 'weekly'
  period_start: string
  period_end: string
  call_volume: {
    total_calls: number
    analyzed_calls: number
    trend: 'increasing' | 'decreasing' | 'stable' | 'new'
  }
  sentiment_summary: {
    overall_trend: string
    average_score: number
    distribution: SentimentDistribution
  }
  top_pain_points: Array<{
    pain_point: string
    count: number
    trend: string
  }>
  top_objections: Array<{
    objection: string
    count: number
    handled_percentage: number
  }>
  top_topics: Array<{
    topic: string
    count: number
    trend: string
  }>
  entity_mentions: Array<{
    entity_name: string
    entity_type: string
    mention_count: number
  }>
  generated_at: string
}

// Quality Types
export interface QualityAlert {
  alert_id: string
  alert_type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: 'open' | 'acknowledged' | 'resolved' | 'ignored'
  title: string
  message: string
  call_id?: string
  call_ids: string[]
  metric_name?: string
  metric_value?: number
  threshold_value?: number
  triggered_at: string
  acknowledged_at?: string
  resolved_at?: string
  acknowledged_by?: string
  resolution_notes?: string
}

export interface QualityMetrics {
  period_start: string
  period_end: string
  total_calls_analyzed: number
  high_quality_count: number
  medium_quality_count: number
  low_quality_count: number
  average_quality_score: number
  median_quality_score: number
  min_quality_score: number
  max_quality_score: number
  average_completeness: number
  average_consistency: number
  average_confidence: number
  total_issues_found: number
  issues_by_type: Record<string, number>
  calls_requiring_review: number
  alerts_triggered: number
  critical_alerts: number
  calculated_at: string
}

// Health Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime_seconds?: number
  dependencies?: Record<string, DependencyStatus>
}

export interface DependencyStatus {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  response_time_ms?: number
  error?: string
  details?: Record<string, any>
}

export interface SystemMetrics {
  timestamp: string
  system: {
    cpu: {
      percent: number
      count: number
    }
    memory: {
      total_gb: number
      available_gb: number
      used_gb: number
      percent: number
    }
    disk: {
      total_gb: number
      used_gb: number
      free_gb: number
      percent: number
    }
    process: {
      memory_mb: number
      cpu_percent: number
      num_threads: number
    }
  }
  application: {
    total_calls: number
    calls_analyzed: number
    calls_failed: number
    average_processing_time: number
    total_cost_usd: number
  }
}

// UI State Types
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  status?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}
