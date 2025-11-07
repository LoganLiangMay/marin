'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReplicateVideoService } from '@/lib/services/replicateVideoService';

interface VideoResult {
  id: string;
  url: string;
  thumbnail: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  duration: number;
  metadata: {
    productName: string;
    brandTone: string;
    orientation: string;
    resolution: string;
    prompt?: string;
    model?: string;
    cost?: number;
  };
}

export default function GenerateResultsPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('Initializing Replicate API...');
  const [generationData, setGenerationData] = useState<any>(null);
  const replicateService = ReplicateVideoService.getInstance();

  useEffect(() => {
    // Get campaign ID from URL
    const searchParams = new URLSearchParams(window.location.search);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      console.error('❌ No campaign ID provided');
      alert('Campaign not found. Please create a new campaign.');
      router.push('/generate');
      return;
    }

    // Get generation parameters from localStorage using campaign ID
    const campaignKey = `campaign_${campaignId}`;
    const campaignDataStr = localStorage.getItem(campaignKey);

    if (!campaignDataStr) {
      console.error('❌ Campaign data not found for ID:', campaignId);
      alert('Campaign data not found. Please create a new campaign.');
      router.push('/generate');
      return;
    }

    try {
      const parsedData = JSON.parse(campaignDataStr);
      console.log('🚀 Starting Replicate video generation with params:', parsedData);
      console.log('📋 Campaign ID:', campaignId);

      // Store generation data in state for use throughout component
      setGenerationData(parsedData);

      const variations = parsedData.variations || 2;
      const duration = parsedData.duration || 6;

      // Generate prompts based on campaign data
      const generateVideoPrompts = () => {
        const brandTone = parsedData.brandTone || 'professional';
        const productName = parsedData.productName;
        const description = parsedData.productDescription;

        if (!productName) {
          console.error('❌ Product name is required');
          return [];
        }

        const prompts = [
          `${brandTone} cinematic opening: ${productName} displayed prominently. ${description}. Professional lighting, clean composition, high-quality presentation, product-focused establishing shot. Camera: smooth tracking shot, 24fps cinematic`,

          `${brandTone} detail sequence: Close-up highlights of ${productName} features and benefits. ${description}. Dynamic camera movement, smooth transitions, emphasis on quality and craftsmanship. Camera: medium shot with movement, 30fps`,

          `${brandTone} lifestyle moment: ${productName} in real-world usage scenario showing product value. ${description}. Authentic presentation, professional quality, engaging composition. Camera: wide to close-up, 24fps cinematic`
        ];

        return prompts.slice(0, variations);
      };

    const initializeVideoGeneration = async () => {
      const prompts = generateVideoPrompts();
      const initialVideos: VideoResult[] = [];

      // Phase 1: Initialize videos
      setGenerationPhase('Connecting to Replicate API...');
      setCurrentProgress(10);

      for (let i = 0; i < Math.min(variations, prompts.length); i++) {
        // Map orientation to aspect ratio
        const orientationToAspectRatio: Record<string, string> = {
          'portrait': '9:16',
          'landscape': '16:9',
          'square': '1:1'
        };

        const orientation = parsedData.orientation || 'portrait';
        const replicateParams = {
          prompt: prompts[i] || `Generate ${parsedData.productName || 'product'} video ad scene ${i + 1}`,
          duration: duration,
          aspectRatio: orientationToAspectRatio[orientation] as '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21',
          resolution: (parsedData.resolution || '720p') as '480p' | '720p' | '1080p',
          model: (parsedData.videoModel || 'seedance-1-lite') as 'seedance-1-lite' | 'seedance-1-pro',
        };

        // Start generation with Replicate service
        const replicateResult = await replicateService.generateVideo(replicateParams);

        initialVideos.push({
          id: replicateResult.id,
          url: '',
          thumbnail: '',
          status: 'generating',
          progress: 0,
          duration: duration,
          metadata: {
            productName: parsedData.productName || 'Product',
            brandTone: parsedData.brandTone || 'professional',
            orientation: parsedData.orientation || 'portrait',
            resolution: parsedData.resolution || '720p',
            prompt: prompts[i],
            model: replicateParams.model,
            cost: replicateResult.metadata.cost,
          },
        });
      }

      setVideos(initialVideos);
      setGenerationPhase('Video generation started - this may take 10-20 minutes per video...');
      setCurrentProgress(20);

      // Poll each video individually and update UI as they complete
      const pollVideo = async (video: VideoResult, index: number) => {
        try {
          console.log(`🎬 Starting to poll video ${index + 1}/${initialVideos.length}`);

          // Wait for this specific video to complete (20 minute timeout)
          const status = await replicateService.waitForCompletion(video.id, 1200000);

          // Update this specific video in the state
          setVideos(prevVideos =>
            prevVideos.map(v =>
              v.id === video.id
                ? {
                    ...v,
                    url: status.url || '',
                    thumbnail: status.thumbnail || `https://picsum.photos/seed/${video.id}/400/600`,
                    status: 'completed' as const,
                    progress: 100,
                  }
                : v
            )
          );

          console.log(`✅ Video ${index + 1}/${initialVideos.length} completed`);
        } catch (error) {
          console.error(`❌ Error generating video ${video.id}:`, error);

          // Mark this video as failed
          setVideos(prevVideos =>
            prevVideos.map(v =>
              v.id === video.id
                ? {
                    ...v,
                    status: 'failed' as const,
                    progress: 0,
                  }
                : v
            )
          );
        }
      };

      // Start polling all videos in parallel
      await Promise.allSettled(
        initialVideos.map((video, index) => pollVideo(video, index))
      );

      // All videos processed (completed or failed)
      setGenerationPhase('Video generation complete!');
      setCurrentProgress(100);
      setIsGenerating(false);
    };

      initializeVideoGeneration();
    } catch (error) {
      console.error('❌ Error initializing campaign:', error);
      alert('Error loading campaign data. Please try again.');
      router.push('/generate');
    }
  }, [router]);

  const handleDownload = (video: VideoResult) => {
    window.open(video.url, '_blank');
  };

  const handleRegenerateVideo = async (index: number) => {
    const video = videos[index];
    if (!video) return;

    setVideos(prevVideos =>
      prevVideos.map((v, i) =>
        i === index ? { ...v, status: 'generating' as const, progress: 0 } : v
      )
    );

    // Map orientation to aspect ratio
    const orientationToAspectRatio: Record<string, '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21'> = {
      'portrait': '9:16',
      'landscape': '16:9',
      'square': '1:1'
    };

    // Regenerate with Replicate service
    const newParams = {
      prompt: video.metadata.prompt || `Regenerate ${video.metadata.productName} video scene`,
      duration: video.duration,
      aspectRatio: orientationToAspectRatio[video.metadata.orientation] || '16:9',
      resolution: video.metadata.resolution as '480p' | '720p' | '1080p',
      model: (video.metadata.model || 'seedance-1-lite') as 'seedance-1-lite' | 'seedance-1-pro',
    };

    try {
      const replicateResult = await replicateService.generateVideo(newParams);

      // Wait for completion
      const status = await replicateService.waitForCompletion(replicateResult.id);

      setVideos(prevVideos =>
        prevVideos.map((v, i) =>
          i === index
            ? {
                ...v,
                id: replicateResult.id,
                status: 'completed' as const,
                progress: 100,
                url: status.url || '',
                thumbnail: status.thumbnail || `https://picsum.photos/seed/${replicateResult.id}/400/600`,
              }
            : v
        )
      );
    } catch (error) {
      console.error('Error regenerating video:', error);
      setVideos(prevVideos =>
        prevVideos.map((v, i) =>
          i === index ? { ...v, status: 'failed' as const } : v
        )
      );
    }
  };

  const getTotalCost = () => {
    return videos.reduce((sum, video) => sum + (video.metadata.cost || 0), 0).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Replicate Video Generation</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Status Banner */}
        {isGenerating && (
          <div className="mb-6 px-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">🎬 Generating with Replicate</h2>
                  <p className="text-lg opacity-90">{generationPhase}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{currentProgress}%</div>
                  <div className="text-sm opacity-75">Complete</div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div
                  className="bg-white h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${currentProgress}%` }}
                >
                  {currentProgress > 10 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white/10 rounded p-2">
                  <div className="opacity-75">Model</div>
                  <div className="font-semibold">Seedance</div>
                </div>
                <div className="bg-white/10 rounded p-2">
                  <div className="opacity-75">Est. Time</div>
                  <div className="font-semibold">~10 seconds</div>
                </div>
                <div className="bg-white/10 rounded p-2">
                  <div className="opacity-75">Quality</div>
                  <div className="font-semibold">1080p HD</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Generated {generationData?.productName || 'Campaign'} Videos ({videos.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Video Preview */}
                <div className="aspect-[9/16] relative bg-gray-100">
                  {video.status === 'completed' ? (
                    <>
                      <video
                        src={video.url}
                        poster={video.thumbnail}
                        controls
                        className="w-full h-full object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Replicate AI
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Generating with Replicate...</p>
                        <p className="text-xs text-gray-500">{video.progress}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">
                    Scene {index + 1}: {index === 0 ? 'Opening' : index === 1 ? 'Action' : 'Finale'}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p className="line-clamp-2 text-xs">{video.metadata.prompt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{video.metadata.model}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{video.metadata.resolution}</span>
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{video.duration}s</span>
                    </div>
                    {video.metadata.cost && (
                      <p className="text-green-600 font-semibold">${video.metadata.cost}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    {video.status === 'completed' && (
                      <>
                        <button
                          onClick={() => handleDownload(video)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleRegenerateVideo(index)}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                        >
                          Regenerate
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Summary */}
        {!isGenerating && videos.length > 0 && (
          <div className="mt-8 px-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Video Generation Complete ✨
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Videos</p>
                  <p className="font-semibold text-lg">{videos.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Generation Time</p>
                  <p className="font-semibold text-lg">10 seconds</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Cost</p>
                  <p className="font-semibold text-lg text-green-600">${getTotalCost()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quality</p>
                  <p className="font-semibold text-lg">1080p HD</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🎯 {generationData?.productName || 'Campaign'} Ready
                </h4>
                <p className="text-sm text-blue-700">
                  Your {generationData?.brandTone || 'professional'} {generationData?.productName || 'campaign'} videos have been generated using Replicate's Seedance model.
                  Each scene was crafted according to your specifications with high-quality output,
                  professional editing, and dynamic presentation as requested.
                </p>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => router.push('/generate?new=true')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Generate New Campaign
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}