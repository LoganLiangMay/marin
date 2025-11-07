'use client';

import { UseFormReturn } from 'react-hook-form';
import {
  AdGenerationFormData,
  VideoOrientation,
  VideoResolution,
  VideoFrameRate,
  ReplicateModel,
  estimateGenerationCost,
} from '@/lib/schemas/adGenerationSchema';

interface VideoConfigStepProps {
  form: UseFormReturn<AdGenerationFormData>;
}

export default function VideoConfigStep({ form }: VideoConfigStepProps) {
  const {
    register,
    watch,
  } = form;

  const variations = watch('variations');
  const duration = watch('duration');
  const orientation = watch('orientation');
  const resolution = watch('resolution');
  const videoModel = watch('videoModel');

  const estimatedCost = estimateGenerationCost(videoModel, duration, variations, resolution);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Video Configuration</h2>
        <p className="text-gray-600">Set your video specifications and generation options</p>
      </div>

      <div className="space-y-6">
        {/* Replicate Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            AI Model (Replicate Seedance) *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                videoModel === ReplicateModel.SEEDANCE_LITE
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('videoModel')}
                value={ReplicateModel.SEEDANCE_LITE}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-900">Seedance 1 Lite</span>
              <span className="text-xs text-gray-500 mt-1">Budget-friendly, quick drafts</span>
              <span className="text-xs text-green-600 mt-1">$0.036/sec @ 720p</span>
            </label>

            <label
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                videoModel === ReplicateModel.SEEDANCE_PRO
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('videoModel')}
                value={ReplicateModel.SEEDANCE_PRO}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-900">Seedance 1 Pro</span>
              <span className="text-xs text-gray-500 mt-1">Higher quality, better realism</span>
              <span className="text-xs text-green-600 mt-1">$0.06/sec @ 720p</span>
            </label>
          </div>
        </div>

        {/* Variations Slider */}
        <div>
          <label htmlFor="variations" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Variations: <span className="text-blue-600 font-semibold">{variations}</span>
          </label>
          <input
            type="range"
            id="variations"
            {...register('variations', { valueAsNumber: true })}
            min="1"
            max="3"
            step="1"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Generate multiple variations to choose from
          </p>
        </div>

        {/* Duration Slider */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Video Duration: <span className="text-blue-600 font-semibold">{duration}s</span>
          </label>
          <input
            type="range"
            id="duration"
            {...register('duration', { valueAsNumber: true })}
            min="5"
            max="10"
            step="1"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5s</span>
            <span>6s</span>
            <span>7s</span>
            <span>8s</span>
            <span>9s</span>
            <span>10s</span>
          </div>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Video Orientation *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <label
              className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                orientation === VideoOrientation.PORTRAIT
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('orientation')}
                value={VideoOrientation.PORTRAIT}
                className="sr-only"
              />
              <div className="w-8 h-12 border-2 border-gray-400 rounded mb-2" />
              <span className="text-xs font-medium">Portrait</span>
              <span className="text-xs text-gray-500">9:16</span>
            </label>

            <label
              className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                orientation === VideoOrientation.LANDSCAPE
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('orientation')}
                value={VideoOrientation.LANDSCAPE}
                className="sr-only"
              />
              <div className="w-12 h-8 border-2 border-gray-400 rounded mb-2" />
              <span className="text-xs font-medium">Landscape</span>
              <span className="text-xs text-gray-500">16:9</span>
            </label>

            <label
              className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                orientation === VideoOrientation.SQUARE
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                {...register('orientation')}
                value={VideoOrientation.SQUARE}
                className="sr-only"
              />
              <div className="w-10 h-10 border-2 border-gray-400 rounded mb-2" />
              <span className="text-xs font-medium">Square</span>
              <span className="text-xs text-gray-500">1:1</span>
            </label>
          </div>
        </div>

        {/* Resolution and Frame Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
              Resolution *
            </label>
            <select
              id="resolution"
              {...register('resolution')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={VideoResolution.HD_720P}>720p HD</option>
              <option value={VideoResolution.FHD_1080P}>1080p Full HD</option>
              <option value={VideoResolution.UHD_4K}>4K Ultra HD</option>
            </select>
          </div>

          <div>
            <label htmlFor="frameRate" className="block text-sm font-medium text-gray-700 mb-1">
              Frame Rate *
            </label>
            <select
              id="frameRate"
              {...register('frameRate', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value={VideoFrameRate.FPS_24}>24 fps (Cinematic)</option>
              <option value={VideoFrameRate.FPS_30}>30 fps (Standard)</option>
              <option value={VideoFrameRate.FPS_60}>60 fps (Smooth)</option>
            </select>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Estimated Generation Cost:</span>
            <span className="text-lg font-bold text-blue-600">
              ${estimatedCost.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Based on {variations} variation{variations > 1 ? 's' : ''} × {duration} seconds × {videoModel === ReplicateModel.SEEDANCE_PRO ? 'Seedance Pro' : 'Seedance Lite'} @ {resolution}
          </p>
        </div>
      </div>
    </div>
  );
}