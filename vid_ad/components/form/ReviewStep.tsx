'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  AdGenerationFormData,
  formatKeywordsToString,
  estimateGenerationCost,
} from '@/lib/schemas/adGenerationSchema';

interface ReviewStepProps {
  form: UseFormReturn<AdGenerationFormData>;
}

export default function ReviewStep({ form }: ReviewStepProps) {
  const { watch } = form;
  const formData = watch();

  const estimatedCost = estimateGenerationCost(
    formData.videoModel,
    formData.duration,
    formData.variations,
    formData.resolution
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review & Generate</h2>
        <p className="text-gray-600">Review your settings before generating your video ad</p>
      </div>

      <div className="space-y-6">
        {/* Product Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Product Information</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Product Name:</dt>
              <dd className="text-sm font-medium text-gray-900">{formData.productName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Description:</dt>
              <dd className="text-sm text-gray-900">{formData.productDescription}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Keywords:</dt>
              <dd className="text-sm text-gray-900">
                {typeof formData.keywords === 'string'
                  ? formData.keywords
                  : formatKeywordsToString(formData.keywords || [])}
              </dd>
            </div>
            {formData.targetAudience && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Target Audience:</dt>
                <dd className="text-sm text-gray-900">{formData.targetAudience}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Brand Settings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Brand Settings</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Brand Tone:</dt>
              <dd className="text-sm font-medium text-gray-900 capitalize">{formData.brandTone}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-sm text-gray-600">Primary Color:</dt>
              <dd className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <span className="text-sm font-medium text-gray-900">{formData.primaryColor}</span>
              </dd>
            </div>
            {formData.callToAction && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Call to Action:</dt>
                <dd className="text-sm font-medium text-gray-900">{formData.callToAction}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Video Configuration */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Video Configuration</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">AI Model:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formData.videoModel === 'seedance-1-pro' ? 'Seedance 1 Pro' : 'Seedance 1 Lite'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Variations:</dt>
              <dd className="text-sm font-medium text-gray-900">{formData.variations}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Duration:</dt>
              <dd className="text-sm font-medium text-gray-900">{formData.duration} seconds</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Orientation:</dt>
              <dd className="text-sm font-medium text-gray-900 capitalize">{formData.orientation}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Resolution:</dt>
              <dd className="text-sm font-medium text-gray-900 uppercase">{formData.resolution}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Frame Rate:</dt>
              <dd className="text-sm font-medium text-gray-900">{formData.frameRate} fps</dd>
            </div>
          </dl>
        </div>

        {/* Additional Options */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Additional Options</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Voiceover:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formData.includeVoiceover ? `Yes (${formData.voiceStyle})` : 'No'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Background Music:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formData.includeBackgroundMusic ? 'Yes' : 'No'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Product Images:</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formData.productImages?.length || 0} uploaded
              </dd>
            </div>
          </dl>
        </div>

        {/* Cost Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Estimated Generation Cost</h3>
              <p className="text-xs text-gray-600 mt-1">
                This estimate includes video generation only
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${estimatedCost.toFixed(2)}</p>
              <p className="text-xs text-gray-600">
                {formData.variations} × {formData.duration}s × {formData.videoModel === 'seedance-1-pro' ? 'Pro' : 'Lite'} @ {formData.resolution}
              </p>
            </div>
          </div>
        </div>

        {/* Generation Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="flex-shrink-0 h-5 w-5 text-yellow-400 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Generation Time</h3>
              <p className="mt-1 text-sm text-yellow-700">
                Video generation typically takes 2-5 minutes. You'll receive real-time updates
                on the progress and can track the status in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}