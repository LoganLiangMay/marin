'use client'

/**
 * Upload Modal Component
 * Story 6.2: Call Library View with Pagination and Filters
 *
 * Modal for uploading audio files with metadata
 */

import { useState, useRef } from 'react'
import { callsApi } from '@/lib/api-client'
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState({
    company_name: '',
    call_type: 'sales',
    additional_notes: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4']
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a|mp4)$/i)) {
        toast.error('Please upload a valid audio file (MP3, WAV, or M4A)')
        return
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB in bytes
      if (selectedFile.size > maxSize) {
        toast.error('File size must be less than 100MB')
        return
      }

      setFile(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      // Create a mock event to reuse validation logic
      handleFileChange({
        target: { files: [droppedFile] },
      } as any)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    if (!metadata.company_name.trim()) {
      toast.error('Please enter a company name')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      await callsApi.upload(file, metadata)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Wait a moment to show 100% before closing
      setTimeout(() => {
        onSuccess()
      }, 500)
    } catch (error: any) {
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.detail || 'Failed to upload audio file')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upload Audio File</h2>
            <button
              onClick={onClose}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* File Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File *
              </label>
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors
                  ${uploading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-brand-500 hover:bg-brand-50'}
                  ${file ? 'border-brand-500 bg-brand-50' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.mp4"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <DocumentIcon className="h-10 w-10 text-brand-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      MP3, WAV, or M4A up to 100MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                id="company_name"
                type="text"
                required
                value={metadata.company_name}
                onChange={(e) => setMetadata({ ...metadata, company_name: e.target.value })}
                disabled={uploading}
                placeholder="e.g., Acme Corporation"
                className="input w-full"
              />
            </div>

            {/* Call Type */}
            <div>
              <label htmlFor="call_type" className="block text-sm font-medium text-gray-700 mb-1">
                Call Type *
              </label>
              <select
                id="call_type"
                value={metadata.call_type}
                onChange={(e) => setMetadata({ ...metadata, call_type: e.target.value })}
                disabled={uploading}
                className="input w-full"
              >
                <option value="sales">Sales</option>
                <option value="support">Support</option>
                <option value="discovery">Discovery</option>
                <option value="demo">Demo</option>
                <option value="followup">Follow-up</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                id="additional_notes"
                rows={3}
                value={metadata.additional_notes}
                onChange={(e) => setMetadata({ ...metadata, additional_notes: e.target.value })}
                disabled={uploading}
                placeholder="Any additional context or notes about this call..."
                className="input w-full resize-none"
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-brand-600 h-2 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading || !file || !metadata.company_name.trim()}
              className="btn btn-primary"
            >
              {uploading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
