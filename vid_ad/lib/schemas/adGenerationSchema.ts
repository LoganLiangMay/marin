import { z } from 'zod';

// Enums for form options
export const BrandTone = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  PLAYFUL: 'playful',
  LUXURY: 'luxury',
  ENERGETIC: 'energetic',
  MINIMALIST: 'minimalist',
} as const;

export const VideoOrientation = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  SQUARE: 'square',
} as const;

export const VideoResolution = {
  HD_720P: '720p',
  FHD_1080P: '1080p',
  UHD_4K: '4k',
} as const;

export const VideoFrameRate = {
  FPS_24: 24,
  FPS_30: 30,
  FPS_60: 60,
} as const;

export const ReplicateModel = {
  SEEDANCE_LITE: 'seedance-1-lite',
  SEEDANCE_PRO: 'seedance-1-pro',
} as const;

// Zod schema for the ad generation form
export const adGenerationSchema = z.object({
  // Product Information
  productName: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be 100 characters or less')
    .trim(),

  productDescription: z
    .string()
    .min(10, 'Product description must be at least 10 characters')
    .max(500, 'Product description must be 500 characters or less')
    .trim(),

  keywords: z
    .string()
    .transform((val) => val.split(',').map((k) => k.trim()).filter(Boolean))
    .pipe(
      z
        .array(z.string())
        .min(1, 'At least one keyword is required')
        .max(10, 'Maximum 10 keywords allowed')
    ),

  // Brand Settings
  brandTone: z
    .enum([
      BrandTone.PROFESSIONAL,
      BrandTone.CASUAL,
      BrandTone.PLAYFUL,
      BrandTone.LUXURY,
      BrandTone.ENERGETIC,
      BrandTone.MINIMALIST,
    ])
    .default(BrandTone.PROFESSIONAL),

  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format')
    .default('#000000'),

  // Video Configuration
  variations: z
    .number()
    .int('Variations must be a whole number')
    .min(1, 'Minimum 1 variation required')
    .max(3, 'Maximum 3 variations allowed')
    .default(1),

  duration: z
    .number()
    .min(5, 'Minimum duration is 5 seconds')
    .max(10, 'Maximum duration is 10 seconds')
    .default(7),

  orientation: z
    .enum([
      VideoOrientation.PORTRAIT,
      VideoOrientation.LANDSCAPE,
      VideoOrientation.SQUARE,
    ])
    .default(VideoOrientation.LANDSCAPE),

  resolution: z
    .enum([
      VideoResolution.HD_720P,
      VideoResolution.FHD_1080P,
      VideoResolution.UHD_4K,
    ])
    .default(VideoResolution.FHD_1080P),

  frameRate: z
    .number()
    .refine((val) => [24, 30, 60].includes(val), {
      message: 'Frame rate must be 24, 30, or 60 fps',
    })
    .default(30),

  videoModel: z
    .enum([ReplicateModel.SEEDANCE_LITE, ReplicateModel.SEEDANCE_PRO])
    .default(ReplicateModel.SEEDANCE_LITE),

  // File Uploads (optional) - Simplified to avoid validation issues
  logoFile: z.any().optional(),

  productImages: z.any().optional().default([]),

  // Additional Options
  includeVoiceover: z.boolean().default(true),
  voiceStyle: z
    .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
    .default('alloy')
    .optional(),

  includeBackgroundMusic: z.boolean().default(true),
  callToAction: z
    .string()
    .max(50, 'Call to action must be 50 characters or less')
    .optional(),

  targetAudience: z
    .string()
    .max(200, 'Target audience description must be 200 characters or less')
    .optional(),
});

// Type inference for the form data
export type AdGenerationFormData = z.infer<typeof adGenerationSchema>;

// Export individual field schemas for partial validation
export const productNameSchema = adGenerationSchema.shape.productName;
export const productDescriptionSchema = adGenerationSchema.shape.productDescription;
export const keywordsSchema = adGenerationSchema.shape.keywords;

// Helper function to validate hex color
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Helper function to format keywords from array to string
export const formatKeywordsToString = (keywords: string[]): string => {
  return keywords.join(', ');
};

// Helper function to get model pricing (Replicate Seedance pricing)
export const getModelPricing = (model: typeof ReplicateModel[keyof typeof ReplicateModel], resolution: string = '720p'): number => {
  // Pricing per second based on Replicate's actual pricing
  const pricing = {
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

  const modelKey = model as keyof typeof pricing;
  const resKey = resolution as keyof typeof pricing['seedance-1-lite'];
  return pricing[modelKey]?.[resKey] || 0.036;
};

// Helper function to estimate generation cost
export const estimateGenerationCost = (
  model: typeof ReplicateModel[keyof typeof ReplicateModel],
  duration: number,
  variations: number,
  resolution: string = '720p'
): number => {
  const pricePerSecond = getModelPricing(model, resolution);
  return pricePerSecond * duration * variations;
};