'use client'

/**
 * Call Detail Page
 * Story 6.3: Call Detail View with Audio Playback and Transcript
 *
 * Features:
 * - Audio player with playback controls
 * - Full transcript with timestamps
 * - Call metadata and analysis results
 * - Sentiment, entities, pain points, objections
 * - Quality validation results
 */

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import { callsApi } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import AudioPlayer from './components/audio-player'
import TranscriptViewer from './components/transcript-viewer'

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const callId = params.id as string

  // Fetch call details
  const { data: call, isLoading, error } = useQuery(
    ['call', callId],
    () => callsApi.get(callId),
    {
      enabled: !!user && !!callId,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading call details...</p>
        </div>
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Call Not Found</h2>
          <p className="mt-2 text-gray-600">The requested call could not be found.</p>
          <button
            onClick={() => router.push('/dashboard/calls')}
            className="btn btn-primary mt-6"
          >
            Back to Call Library
          </button>
        </div>
      </div>
    )
  }

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

  const getSentimentColor = (sentiment?: string) => {
    const colors = {
      positive: 'text-green-600 bg-green-100',
      neutral: 'text-gray-600 bg-gray-100',
      negative: 'text-red-600 bg-red-100',
    }
    return colors[sentiment as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard/calls')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {call.metadata?.company_name || 'Unknown Company'}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <PhoneIcon className="h-4 w-4" />
                {call.metadata?.call_type || 'Unknown Type'}
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {format(new Date(call.created_at), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {call.audio_duration_seconds
                  ? `${Math.floor(call.audio_duration_seconds / 60)}:${(call.audio_duration_seconds % 60).toString().padStart(2, '0')}`
                  : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
        <span className={`badge ${getStatusBadge(call.status)}`}>
          {call.status}
        </span>
      </div>

      {/* Audio Player */}
      {call.audio_url && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audio Recording</h2>
          <AudioPlayer audioUrl={call.audio_url} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript */}
          {call.transcript && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Transcript</h2>
              <TranscriptViewer transcript={call.transcript} />
            </div>
          )}

          {/* Analysis Results */}
          {call.analysis && (
            <>
              {/* Pain Points */}
              {call.analysis.pain_points && call.analysis.pain_points.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Pain Points
                  </h2>
                  <div className="space-y-3">
                    {call.analysis.pain_points.map((pain, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{pain.pain_point}</h3>
                          <span className="badge badge-error text-xs">
                            {pain.severity}
                          </span>
                        </div>
                        {pain.context && (
                          <p className="text-sm text-gray-600 italic">"{pain.context}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objections */}
              {call.analysis.objections && call.analysis.objections.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Objections
                  </h2>
                  <div className="space-y-3">
                    {call.analysis.objections.map((objection, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{objection.objection}</h3>
                          <span className={clsx(
                            'badge text-xs',
                            objection.resolved ? 'badge-success' : 'badge-warning'
                          )}>
                            {objection.resolved ? 'Resolved' : 'Unresolved'}
                          </span>
                        </div>
                        {objection.context && (
                          <p className="text-sm text-gray-600 italic mb-2">"{objection.context}"</p>
                        )}
                        {objection.resolution && (
                          <div className="mt-2 pt-2 border-t border-yellow-300">
                            <p className="text-xs font-medium text-gray-700 mb-1">Resolution:</p>
                            <p className="text-sm text-gray-600">{objection.resolution}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column - Metadata & Analysis */}
        <div className="space-y-6">
          {/* Call Metadata */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Call Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {call.metadata?.company_name || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Call Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {call.metadata?.call_type || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {call.audio_duration_seconds
                    ? `${Math.floor(call.audio_duration_seconds / 60)}m ${call.audio_duration_seconds % 60}s`
                    : 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              {call.metadata?.additional_notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {call.metadata.additional_notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Sentiment Analysis */}
          {call.analysis && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h2>
              <div className="space-y-4">
                {/* Overall Sentiment */}
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    Overall Sentiment
                  </div>
                  <div
                    className={clsx(
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      getSentimentColor(call.analysis.overall_sentiment)
                    )}
                  >
                    {call.analysis.overall_sentiment || 'Unknown'}
                  </div>
                </div>

                {/* Sentiment Scores */}
                {call.analysis.sentiment_scores && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Positive</span>
                        <span>{(call.analysis.sentiment_scores.positive * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${call.analysis.sentiment_scores.positive * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Neutral</span>
                        <span>{(call.analysis.sentiment_scores.neutral * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${call.analysis.sentiment_scores.neutral * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Negative</span>
                        <span>{(call.analysis.sentiment_scores.negative * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${call.analysis.sentiment_scores.negative * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Entities */}
          {call.analysis?.entities && call.analysis.entities.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entities Mentioned</h2>
              <div className="space-y-3">
                {call.analysis.entities.map((entity, idx) => (
                  <div key={idx} className="pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entity.text}</div>
                        <div className="text-xs text-gray-500 mt-1">{entity.type}</div>
                      </div>
                      {entity.context && (
                        <span className="text-xs text-gray-400">
                          {entity.context.slice(0, 30)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Validation */}
          {call.quality_validation && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Check</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <span className={clsx(
                    'font-semibold',
                    call.quality_validation.quality_score >= 0.8 ? 'text-green-600' :
                    call.quality_validation.quality_score >= 0.6 ? 'text-yellow-600' :
                    'text-red-600'
                  )}>
                    {(call.quality_validation.quality_score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <QualityCheckItem
                    label="Transcript Quality"
                    passed={call.quality_validation.has_transcript}
                  />
                  <QualityCheckItem
                    label="Sentiment Analyzed"
                    passed={call.quality_validation.has_sentiment}
                  />
                  <QualityCheckItem
                    label="Entities Extracted"
                    passed={call.quality_validation.has_entities}
                  />
                  <QualityCheckItem
                    label="Key Phrases Found"
                    passed={call.quality_validation.has_key_phrases}
                  />
                </div>

                {call.quality_validation.alerts && call.quality_validation.alerts.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Alerts:</p>
                    <div className="space-y-1">
                      {call.quality_validation.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-yellow-700">
                          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Quality Check Item Component
function QualityCheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      {passed ? (
        <CheckCircleIcon className="h-5 w-5 text-green-600" />
      ) : (
        <XCircleIcon className="h-5 w-5 text-red-600" />
      )}
    </div>
  )
}
