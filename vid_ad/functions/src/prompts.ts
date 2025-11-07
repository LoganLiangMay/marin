/**
 * Prompt Engineering System for Ad Script Generation
 * Provides modular, versioned prompt templates for different ad types and brand tones
 */

export type BrandTone = 'professional' | 'casual' | 'playful' | 'luxury' | 'inspiring' | 'urgent';
export type AdType = 'product-demo' | 'testimonial' | 'lifestyle' | 'comparison' | 'problem-solution';

export interface ScriptGenerationParams {
  productName: string;
  productDescription: string;
  brandTone: BrandTone;
  targetAudience?: string;
  duration: number;
  adType?: AdType;
  keywords?: string[];
  uniqueSellingPoints?: string[];
}

/**
 * Brand tone characteristics and writing styles
 */
const BRAND_TONE_PROFILES: Record<BrandTone, { style: string; vocabulary: string; approach: string }> = {
  professional: {
    style: 'Clear, authoritative, and informative',
    vocabulary: 'Industry-standard terminology, precise language, formal tone',
    approach: 'Focus on features, benefits, and credibility. Use data and facts.',
  },
  casual: {
    style: 'Conversational, friendly, and relatable',
    vocabulary: 'Everyday language, contractions, informal expressions',
    approach: 'Speak like a friend. Use humor and personal stories when appropriate.',
  },
  playful: {
    style: 'Fun, energetic, and entertaining',
    vocabulary: 'Vivid language, creative wordplay, exclamations',
    approach: 'Be bold and memorable. Use metaphors and surprising comparisons.',
  },
  luxury: {
    style: 'Elegant, sophisticated, and aspirational',
    vocabulary: 'Premium language, refined descriptions, exclusive terminology',
    approach: 'Emphasize quality, craftsmanship, and exclusivity. Appeal to desire.',
  },
  inspiring: {
    style: 'Motivational, uplifting, and empowering',
    vocabulary: 'Action-oriented language, positive affirmations, transformative words',
    approach: 'Focus on possibilities and transformation. Tell a story of change.',
  },
  urgent: {
    style: 'Direct, compelling, and action-focused',
    vocabulary: 'Strong verbs, time-sensitive language, clear calls-to-action',
    approach: 'Create FOMO. Emphasize scarcity, benefits, and immediate action.',
  },
};

/**
 * Ad type templates with specific structures
 */
const AD_TYPE_STRUCTURES: Record<AdType, { structure: string; focus: string }> = {
  'product-demo': {
    structure: 'Hook → Problem → Product Demo → Benefits → Call-to-Action',
    focus: 'Show the product in action. Demonstrate how it works and solves problems.',
  },
  'testimonial': {
    structure: 'Customer Story → Problem They Faced → Solution Discovery → Results → Recommendation',
    focus: 'Use authentic customer voice. Share real transformation and emotional impact.',
  },
  'lifestyle': {
    structure: 'Aspiration → Product in Context → Lifestyle Benefits → Emotional Connection → CTA',
    focus: 'Show how the product fits into an ideal lifestyle. Sell the dream, not just the product.',
  },
  'comparison': {
    structure: 'Before/Alternatives → Why They Fall Short → Our Solution → Competitive Advantages → CTA',
    focus: 'Clearly differentiate from competitors. Highlight unique value propositions.',
  },
  'problem-solution': {
    structure: 'Relatable Problem → Amplify Pain → Introduce Solution → Demonstrate Benefits → CTA',
    focus: 'Make the problem deeply relatable. Position product as the hero that saves the day.',
  },
};

/**
 * Scene timing optimization based on duration
 */
function getSceneTimingGuideline(duration: number): string {
  if (duration <= 10) {
    return 'Create 2-3 quick scenes (3-5 seconds each). Focus on one key message.';
  } else if (duration <= 30) {
    return 'Create 3-5 scenes (5-8 seconds each). Build a complete narrative with setup, demo, and CTA.';
  } else {
    return 'Create 5-7 scenes (8-12 seconds each). Develop a full story with emotional arc and detailed demonstration.';
  }
}

/**
 * Generate optimized system prompt based on parameters
 */
function generateSystemPrompt(params: ScriptGenerationParams): string {
  const toneProfile = BRAND_TONE_PROFILES[params.brandTone];
  const adType = params.adType || 'product-demo';
  const adStructure = AD_TYPE_STRUCTURES[adType];

  return `You are an expert advertising script writer and creative director with 15+ years of experience in video marketing.

Your expertise includes:
- Creating compelling hooks that capture attention in the first 3 seconds
- Writing emotionally resonant copy that drives conversions
- Understanding audience psychology and pain points
- Crafting clear, memorable calls-to-action
- Optimizing scripts for different platforms (social media, TV, digital)

For this script, you must adopt this brand tone:
**${params.brandTone.toUpperCase()} TONE**
- Style: ${toneProfile.style}
- Vocabulary: ${toneProfile.vocabulary}
- Approach: ${toneProfile.approach}

Ad Type: **${adType.toUpperCase()}**
Structure: ${adStructure.structure}
Focus: ${adStructure.focus}

CRITICAL REQUIREMENTS:
1. Hook viewers in the first 3 seconds - use a question, surprising fact, or bold statement
2. Every word must serve a purpose - no filler
3. Include a clear, specific call-to-action
4. Match the ${params.brandTone} tone consistently throughout
5. Make it scannable - viewers should understand the value even with sound off
6. Use scene descriptions that are specific and actionable for video production`;
}

/**
 * Generate optimized user prompt with all parameters
 */
function generateUserPrompt(params: ScriptGenerationParams): string {
  const timingGuideline = getSceneTimingGuideline(params.duration);
  const keywordsSection = params.keywords && params.keywords.length > 0
    ? `\nKey Keywords to Include: ${params.keywords.join(', ')}`
    : '';
  const uspSection = params.uniqueSellingPoints && params.uniqueSellingPoints.length > 0
    ? `\nUnique Selling Points: ${params.uniqueSellingPoints.join(', ')}`
    : '';

  return `Create a ${params.duration}-second video ad script for:

**Product:** ${params.productName}
**Description:** ${params.productDescription}
**Brand Tone:** ${params.brandTone}
${params.targetAudience ? `**Target Audience:** ${params.targetAudience}` : ''}
${keywordsSection}
${uspSection}

**Timing:** ${timingGuideline}

**Scene Requirements:**
- Each scene MUST have a compelling visual description (what viewers see)
- Each scene MUST have engaging dialogue/voiceover (what viewers hear)
- Scene durations MUST total exactly ${params.duration} seconds
- First scene (hook) should be high-impact and attention-grabbing
- Final scene MUST include a clear call-to-action

Provide the script in this EXACT JSON format:
{
  "title": "Catchy ad title that captures the core message",
  "hook": "The attention-grabbing opening line or concept",
  "scenes": [
    {
      "id": 1,
      "description": "Detailed visual description of what's happening on screen. Be specific about shots, angles, and visual elements.",
      "dialogue": "The exact voiceover text or on-screen text. Keep it punchy and conversational.",
      "duration": 5,
      "visualNotes": "Additional notes for video editor (camera movements, transitions, effects)"
    }
  ],
  "totalDuration": ${params.duration},
  "targetEmotion": "The primary emotion this ad should evoke (e.g., excitement, relief, aspiration)",
  "callToAction": "The specific action you want viewers to take"
}

Make every word count. This script should convert viewers into customers.`;
}

/**
 * Main prompt generation function with versioning
 */
export function generatePrompt(params: ScriptGenerationParams, version: string = 'v1.0'): {
  systemPrompt: string;
  userPrompt: string;
  version: string;
  metadata: {
    brandTone: BrandTone;
    adType: AdType;
    duration: number;
    hasKeywords: boolean;
    hasUSPs: boolean;
  };
} {
  // Validate parameters
  if (!params.productName || !params.productDescription) {
    throw new Error('productName and productDescription are required');
  }

  if (params.duration < 5 || params.duration > 120) {
    throw new Error('duration must be between 5 and 120 seconds');
  }

  const systemPrompt = generateSystemPrompt(params);
  const userPrompt = generateUserPrompt(params);

  return {
    systemPrompt,
    userPrompt,
    version,
    metadata: {
      brandTone: params.brandTone,
      adType: params.adType || 'product-demo',
      duration: params.duration,
      hasKeywords: Boolean(params.keywords && params.keywords.length > 0),
      hasUSPs: Boolean(params.uniqueSellingPoints && params.uniqueSellingPoints.length > 0),
    },
  };
}

/**
 * Generate variation-specific prompts to ensure different scripts
 */
export function generateVariationPrompt(
  params: ScriptGenerationParams,
  variationNumber: number,
  totalVariations: number
): {
  systemPrompt: string;
  userPrompt: string;
} {
  const basePrompt = generatePrompt(params);

  // Add variation-specific instructions
  const variationStrategies = [
    'Focus on emotional storytelling and customer transformation',
    'Emphasize product features and practical benefits',
    'Use humor and entertainment to engage viewers',
  ];

  const strategy = variationStrategies[variationNumber - 1] || variationStrategies[0];

  const variationInstruction = `\n\n**VARIATION ${variationNumber} of ${totalVariations}**
Strategy for this variation: ${strategy}
Make this script distinctly different from other variations while maintaining the ${params.brandTone} tone.`;

  return {
    systemPrompt: basePrompt.systemPrompt,
    userPrompt: basePrompt.userPrompt + variationInstruction,
  };
}

/**
 * Validate prompt parameters
 */
export function validatePromptParams(params: ScriptGenerationParams): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.productName || params.productName.trim().length === 0) {
    errors.push('productName is required and cannot be empty');
  }

  if (!params.productDescription || params.productDescription.trim().length === 0) {
    errors.push('productDescription is required and cannot be empty');
  }

  if (params.productName && params.productName.length > 100) {
    errors.push('productName must be 100 characters or less');
  }

  if (params.productDescription && params.productDescription.length > 1000) {
    errors.push('productDescription must be 1000 characters or less');
  }

  if (params.duration < 5 || params.duration > 120) {
    errors.push('duration must be between 5 and 120 seconds');
  }

  const validTones: BrandTone[] = ['professional', 'casual', 'playful', 'luxury', 'inspiring', 'urgent'];
  if (!validTones.includes(params.brandTone)) {
    errors.push(`brandTone must be one of: ${validTones.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
