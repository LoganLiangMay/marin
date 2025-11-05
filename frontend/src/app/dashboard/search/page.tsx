'use client'

/**
 * Semantic Search Page (Placeholder)
 * Story 6.4: Semantic Search Interface
 *
 * Note: This page is a placeholder until Epic 4 backend stories are completed:
 * - Story 4.3: Implement Bedrock Titan Embedding Generation Worker
 * - Story 4.4: Build Semantic Search API Endpoint
 * - Story 4.5: Implement RAG-Enhanced Answer Generation
 */

import { useAuth } from '@/hooks/use-auth'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default function SearchPage() {
  const { user } = useAuth()

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-50 text-brand-600 rounded-full mb-4">
          <SparklesIcon className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Semantic Search
        </h1>
        <p className="text-gray-600 mb-6">
          Search across call transcripts using natural language. Ask questions like
          "What are the main concerns about pricing?" or "Find calls where customers
          mentioned competitor products."
        </p>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Coming Soon:</strong> This feature requires backend services from Epic 4
            (Stories 4.3-4.5) to be completed.
          </p>
        </div>

        {/* Preview of search interface */}
        <div className="card text-left">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search across all call transcripts..."
              disabled
              className="input pl-11 w-full opacity-50 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2 opacity-50">
            <p className="text-xs font-medium text-gray-700 mb-2">Example searches:</p>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-info text-xs cursor-not-allowed">
                pricing concerns
              </span>
              <span className="badge badge-info text-xs cursor-not-allowed">
                competitor mentions
              </span>
              <span className="badge badge-info text-xs cursor-not-allowed">
                feature requests
              </span>
              <span className="badge badge-info text-xs cursor-not-allowed">
                technical issues
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Want to learn more about semantic search?{' '}
            <a href="/dashboard" className="text-brand-600 hover:text-brand-700 font-medium">
              Back to Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
