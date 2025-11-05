'use client'

/**
 * Transcript Viewer Component
 * Story 6.3: Call Detail View with Audio Playback and Transcript
 *
 * Displays the full transcript with search and copy functionality
 */

import { useState } from 'react'
import {
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface TranscriptViewerProps {
  transcript: string
}

export default function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      setCopied(true)
      toast.success('Transcript copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy transcript')
    }
  }

  // Highlight search term in transcript
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>
    }

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    )
  }

  // Split transcript into paragraphs for better readability
  const paragraphs = transcript.split('\n\n').filter(p => p.trim())

  // Count search matches
  const matchCount = searchTerm.trim()
    ? transcript.toLowerCase().split(searchTerm.toLowerCase()).length - 1
    : 0

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 py-2 text-sm w-full"
          />
          {matchCount > 0 && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-gray-500">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="btn btn-secondary btn-sm flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <DocumentDuplicateIcon className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Transcript Content */}
      <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        {paragraphs.length > 0 ? (
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            {paragraphs.map((paragraph, idx) => (
              <p key={idx}>
                {getHighlightedText(paragraph, searchTerm)}
              </p>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No transcript available</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{transcript.split(/\s+/).length} words</span>
        <span>{transcript.length} characters</span>
      </div>
    </div>
  )
}
