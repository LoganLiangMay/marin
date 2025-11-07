import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/config';

interface ReplicateVideoParams {
  prompt: string;
  duration?: number; // 2-12 seconds
  resolution?: '480p' | '720p' | '1080p';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21';
  model?: 'seedance-1-lite' | 'seedance-1-pro';
  seed?: number;
  cameraFixed?: boolean;
  image?: string; // URL or file for image-to-video
  lastFrameImage?: string;
  // Additional form data
  productName?: string;
  productDescription?: string;
  keywords?: string[];
  brandTone?: string;
  primaryColor?: string;
  callToAction?: string;
  targetAudience?: string;
}

export interface VideoGenerationResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: any;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  urls?: {
    get: string;
    cancel: string;
  };
}

interface VideoResult {
  id: string;
  url: string;
  thumbnail: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  metadata: {
    prompt: string;
    model: string;
    resolution: string;
    aspectRatio: string;
    cost: number;
    generationTime: number;
  };
}

export class ReplicateVideoService {
  private static instance: ReplicateVideoService;
  private functions;

  // Model versions - update these if needed
  private readonly MODELS = {
    'seedance-1-lite': 'bytedance/seedance-1-lite',
    'seedance-1-pro': 'bytedance/seedance-1-pro',
  };

  // Pricing per second (in USD)
  private readonly PRICING = {
    'seedance-1-lite': {
      '480p': 0.018,
      '720p': 0.036,
      '1080p': 0.072,
    },
    'seedance-1-pro': {
      '480p': 0.03,
      '720p': 0.06,
      '1080p': 0.15,
    },
  };

  private constructor() {
    // Initialize Firebase Functions
    this.functions = getFunctions(app);
    console.log('✅ Firebase Functions initialized for Replicate video service');
  }

  static getInstance(): ReplicateVideoService {
    if (!ReplicateVideoService.instance) {
      ReplicateVideoService.instance = new ReplicateVideoService();
    }
    return ReplicateVideoService.instance;
  }

  /**
   * Generate a video using Replicate's video models (via Firebase Functions)
   */
  async generateVideo(params: ReplicateVideoParams): Promise<VideoResult> {
    console.log('🎬 Replicate Video Generation Request:', params);

    const model = params.model || 'seedance-1-lite';
    const duration = params.duration || 6;
    const resolution = params.resolution || '720p';
    const aspectRatio = params.aspectRatio || '16:9';

    try {
      // Call Firebase Function instead of Replicate API directly
      const generateVideoFn = httpsCallable(this.functions, 'generateReplicateVideo');

      const result = await generateVideoFn({
        model,
        prompt: params.prompt,
        duration,
        aspectRatio,
        resolution,
        seed: params.seed,
        cameraFixed: params.cameraFixed,
        image: params.image,
        lastFrameImage: params.lastFrameImage,
        productName: params.productName,
        productDescription: params.productDescription,
        keywords: params.keywords,
        brandTone: params.brandTone,
        primaryColor: params.primaryColor,
        callToAction: params.callToAction,
        targetAudience: params.targetAudience,
      });

      const data = result.data as any;

      console.log('✅ Video generation initiated:', data.predictionId);

      // Calculate estimated cost
      const cost = this.calculateCost(model, duration, resolution);

      // Return initial result
      return {
        id: data.predictionId,
        url: '',
        thumbnail: '',
        duration: duration,
        status: this.mapStatus(data.status || 'starting'),
        progress: 0,
        metadata: {
          prompt: params.prompt,
          model: model,
          resolution: resolution,
          aspectRatio: aspectRatio,
          cost: cost,
          generationTime: 0,
        },
      };

    } catch (error: any) {
      console.error('❌ Firebase Function Error:', error);

      if (error.message?.includes('unauthenticated')) {
        throw new Error('You must be logged in to generate videos.');
      }

      if (error.message?.includes('resource-exhausted')) {
        throw new Error('Insufficient credits. Please purchase more credits to continue.');
      }

      throw new Error(error.message || 'Failed to start video generation');
    }
  }

  /**
   * Check the status of a video generation (via Firebase Functions)
   */
  async getVideoStatus(predictionId: string, videoId?: string): Promise<VideoResult> {
    try {
      const checkStatusFn = httpsCallable(this.functions, 'checkReplicateVideoStatus');

      const result = await checkStatusFn({
        predictionId,
        videoId,
      });

      const data = result.data as any;

      console.log(`📊 Video status for ${predictionId}:`, data.status);

      // Extract video URL from output
      let videoUrl = '';
      if (data.output) {
        if (typeof data.output === 'string') {
          videoUrl = data.output;
        } else if (Array.isArray(data.output) && data.output.length > 0) {
          videoUrl = data.output[0];
        }
      }

      // Calculate progress based on status
      let progress = 0;
      if (data.status === 'starting') progress = 10;
      else if (data.status === 'processing') progress = 50;
      else if (data.status === 'succeeded') progress = 100;
      else if (data.status === 'failed') progress = 0;

      return {
        id: predictionId,
        url: videoUrl,
        thumbnail: videoUrl ? this.generateThumbnail(videoUrl) : '',
        duration: 0, // Duration from metadata if available
        status: this.mapStatus(data.status),
        progress: progress,
        metadata: {
          prompt: '',
          model: '',
          resolution: '',
          aspectRatio: '',
          cost: 0,
          generationTime: data.metrics?.predict_time || 0,
        },
      };

    } catch (error: any) {
      console.error('Error retrieving video status:', error.message);
      throw error;
    }
  }

  /**
   * Wait for video generation to complete
   * Default timeout increased to 20 minutes for Replicate video generation
   */
  async waitForCompletion(predictionId: string, maxWaitTime: number = 1200000): Promise<VideoResult> {
    const startTime = Date.now();
    const pollInterval = 3000; // Check every 3 seconds

    console.log(`⏳ Waiting for video ${predictionId} (max ${maxWaitTime / 1000}s)`);

    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getVideoStatus(predictionId);

      if (result.status === 'completed') {
        console.log('✅ Video generation completed:', predictionId);
        return result;
      }

      if (result.status === 'failed') {
        console.error('❌ Video generation failed:', predictionId);
        throw new Error('Video generation failed');
      }

      // Log progress every 30 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed % 30000 < pollInterval) {
        console.log(`⏱️ Video ${predictionId} still processing... (${Math.round(elapsed / 1000)}s elapsed)`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    console.error('⏱️ Video generation timed out after', maxWaitTime / 1000, 'seconds');
    throw new Error(`Video generation timed out after ${maxWaitTime / 1000} seconds`);
  }

  /**
   * Cancel a video generation (via Firebase Functions)
   */
  async cancelGeneration(predictionId: string, videoId?: string): Promise<void> {
    try {
      const cancelFn = httpsCallable(this.functions, 'cancelReplicateVideo');

      await cancelFn({
        predictionId,
        videoId,
      });

      console.log(`Video generation ${predictionId} canceled`);
    } catch (error: any) {
      console.error('Error canceling generation:', error.message);
      throw error;
    }
  }

  /**
   * Calculate cost estimate based on model and parameters
   */
  calculateCost(model: string, duration: number, resolution: string): number {
    const modelKey = model as keyof typeof this.PRICING;
    const resolutionKey = resolution as keyof typeof this.PRICING['seedance-1-lite'];

    if (!this.PRICING[modelKey] || !this.PRICING[modelKey][resolutionKey]) {
      console.warn(`No pricing data for ${model} at ${resolution}`);
      return 0;
    }

    const pricePerSecond = this.PRICING[modelKey][resolutionKey];
    return parseFloat((pricePerSecond * duration).toFixed(2));
  }

  /**
   * Map Replicate status to our status format
   */
  private mapStatus(replicateStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (replicateStatus) {
      case 'starting':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
      case 'canceled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Generate a thumbnail URL from video URL
   * This is a placeholder - in production you might want to extract actual frames
   */
  private generateThumbnail(_videoUrl: string): string {
    // For now, return a placeholder or the video URL itself
    // In production, you might want to:
    // 1. Extract first frame using FFmpeg
    // 2. Use a thumbnail service
    // 3. Generate via Replicate's image models
    return `https://picsum.photos/seed/${Date.now()}/800/450`;
  }

  /**
   * Generate multiple video variations from different prompts
   */
  async generateVariations(
    baseParams: ReplicateVideoParams,
    prompts: string[]
  ): Promise<VideoResult[]> {
    const variations: VideoResult[] = [];

    for (const prompt of prompts) {
      const params = {
        ...baseParams,
        prompt: prompt,
      };

      const result = await this.generateVideo(params);
      variations.push(result);
    }

    return variations;
  }

  /**
   * Get pricing information for display
   */
  getPricingInfo() {
    return {
      models: Object.keys(this.MODELS),
      pricing: this.PRICING,
      description: {
        'seedance-1-lite': 'Budget-friendly option, good for drafts and previews',
        'seedance-1-pro': 'Higher quality with better dynamic range and realism',
      },
    };
  }

  /**
   * Validate parameters before generation
   */
  validateParams(params: ReplicateVideoParams): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.prompt || params.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    }

    if (params.duration && (params.duration < 2 || params.duration > 12)) {
      errors.push('Duration must be between 2 and 12 seconds');
    }

    if (params.resolution && !['480p', '720p', '1080p'].includes(params.resolution)) {
      errors.push('Resolution must be 480p, 720p, or 1080p');
    }

    if (params.aspectRatio && !['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'].includes(params.aspectRatio)) {
      errors.push('Invalid aspect ratio');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default ReplicateVideoService;
