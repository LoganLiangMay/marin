# Replicate Video Generation - Input Parameters Guide

This document outlines the available input parameters for generating short-form videos using Replicate's Seedance models.

## Available Models

### 1. Seedance 1 Lite (Budget-Friendly)
- **Model ID**: `bytedance/seedance-1-lite`
- **Best for**: Quick drafts, previews, and budget-conscious projects
- **Pricing**:
  - 480p: $0.018/second (~$0.11 for 6s video)
  - 720p: $0.036/second (~$0.22 for 6s video) ⭐ **Recommended**
  - 1080p: $0.072/second (~$0.43 for 6s video)

### 2. Seedance 1 Pro (Higher Quality)
- **Model ID**: `bytedance/seedance-1-pro`
- **Best for**: Final production videos, higher quality requirements
- **Features**: Wide dynamic range, better physical realism and stability
- **Pricing**:
  - 480p: $0.03/second (~$0.18 for 6s video)
  - 720p: $0.06/second (~$0.36 for 6s video)
  - 1080p: $0.15/second (~$0.90 for 6s video)

## Input Parameters

### Required Parameters

#### `prompt` (string)
The text description for video generation. This is the most important parameter.

**Best Practices**:
- Be specific and descriptive
- Include camera angles and movements
- Specify lighting and mood
- Mention style (cinematic, editorial, etc.)
- Add details about motion and pace

**Examples**:
```typescript
// Good prompt
"Energetic cinematic shot: Female athlete in Nike gear, leading runners through neon-lit city streets at night. Motion blur, wet asphalt reflections, high-contrast lighting. Camera: tracking shot, 24fps cinematic"

// Basic prompt (less effective)
"Person running in Nike shoes"
```

### Optional Parameters

#### `duration` (number)
Length of the generated video in seconds.

- **Range**: 2-12 seconds
- **Default**: 5 seconds
- **Recommended for ads**: 6 seconds
- **Note**: Longer videos cost more (price is per second)

```typescript
duration: 6  // 6-second video
```

#### `resolution` (string)
Output video quality.

- **Options**: `'480p'` | `'720p'` | `'1080p'`
- **Default**: `'720p'`
- **Recommended**: `'720p'` for most short-form ads (good balance of quality and cost)

```typescript
resolution: '720p'
```

#### `aspectRatio` (string)
Video dimensions/orientation.

- **Options**:
  - `'16:9'` - Landscape (YouTube, desktop)
  - `'9:16'` - Portrait (TikTok, Instagram Stories) ⭐
  - `'1:1'` - Square (Instagram feed)
  - `'4:3'` - Traditional TV
  - `'3:4'` - Vertical
  - `'21:9'` - Ultra-wide
  - `'9:21'` - Ultra-tall
- **Default**: `'16:9'`
- **Recommended for social ads**: `'9:16'` (portrait)

```typescript
aspectRatio: '9:16'  // Portrait for mobile
```

#### `model` (string)
Which Seedance model to use.

- **Options**: `'seedance-1-lite'` | `'seedance-1-pro'`
- **Default**: `'seedance-1-lite'`

```typescript
model: 'seedance-1-lite'  // Budget option
model: 'seedance-1-pro'   // Higher quality
```

#### `seed` (number)
Random seed for reproducible results.

- **Type**: Integer
- **Default**: Random
- **Use case**: Generate the same video again with identical parameters

```typescript
seed: 42  // Always generates the same video with same prompt
```

#### `cameraFixed` (boolean)
Lock camera position (no camera movement).

- **Options**: `true` | `false`
- **Default**: `false` (camera can move)
- **Use when**: You want static camera shots

```typescript
cameraFixed: false  // Allow dynamic camera work
cameraFixed: true   // Static camera only
```

#### `image` (string)
URL or file path for image-to-video generation.

- **Type**: URL or file path
- **Use case**: Animate a static image instead of text-to-video
- **Format**: HTTPS URL or file handle

```typescript
image: "https://example.com/product-photo.jpg"
// OR
image: await fs.readFile("path/to/image.png")
```

#### `lastFrameImage` (string)
Specify the final frame of the video.

- **Type**: URL or file path
- **Requires**: Must also provide `image` parameter
- **Use case**: Control both start and end of animation

```typescript
image: "start-frame.jpg",
lastFrameImage: "end-frame.jpg"
```

## Complete Example

```typescript
import { ReplicateVideoService } from '@/lib/services/replicateVideoService';

const videoService = ReplicateVideoService.getInstance();

// Generate a short-form Nike ad
const result = await videoService.generateVideo({
  // Required
  prompt: "Energetic cinematic shot: Female athlete in Nike Air Max shoes, leading runners through neon-lit city streets at night. Motion blur on stride, wet asphalt reflections, high-contrast lighting, sweat glistening. Camera: low angle tracking shot, 24fps cinematic",

  // Optional - customize as needed
  duration: 6,                  // 6 seconds
  resolution: '720p',           // HD quality
  aspectRatio: '9:16',          // Portrait for mobile
  model: 'seedance-1-lite',     // Budget model
  cameraFixed: false,           // Allow camera movement
  seed: 42,                     // For reproducible results
});

console.log(`Video ID: ${result.id}`);
console.log(`Estimated cost: $${result.metadata.cost}`);

// Wait for completion
const completed = await videoService.waitForCompletion(result.id);
console.log(`Video URL: ${completed.url}`);
```

## Batch Generation

Generate multiple variations:

```typescript
const prompts = [
  "Opening scene: Runner starting their journey at golden hour",
  "Action scene: Dynamic running through urban environment",
  "Closing scene: Runner reaching destination, triumphant"
];

const results = await videoService.generateVariations(
  {
    duration: 6,
    resolution: '720p',
    aspectRatio: '9:16',
    model: 'seedance-1-lite'
  },
  prompts
);
```

## Cost Optimization Tips

1. **Start with Lite model**: Test with `seedance-1-lite` before upgrading to Pro
2. **Use 720p**: Best balance of quality and cost for most use cases
3. **Keep videos short**: 5-6 seconds is ideal for social ads
4. **Test prompts first**: Refine your prompt before batch generation
5. **Use seeds**: Reuse successful `seed` values to ensure consistency

## Pricing Calculator

```typescript
const service = ReplicateVideoService.getInstance();

// Calculate cost before generating
const cost = service.calculateCost(
  'seedance-1-lite',  // model
  6,                   // duration in seconds
  '720p'              // resolution
);

console.log(`This video will cost approximately: $${cost}`);
// Output: This video will cost approximately: $0.22
```

## Validation

The service automatically validates parameters:

```typescript
const validation = service.validateParams({
  prompt: "Test video",
  duration: 15,  // Invalid - too long
  resolution: '2k'  // Invalid - not supported
});

if (!validation.valid) {
  console.error('Invalid parameters:', validation.errors);
  // Output: ['Duration must be between 2 and 12 seconds', 'Resolution must be 480p, 720p, or 1080p']
}
```

## Environment Setup

Add to your `.env` or `.env.local`:

```bash
# Get your API token from https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=your_token_here

# Optional: For Next.js client-side usage
NEXT_PUBLIC_REPLICATE_API_TOKEN=your_token_here
```

## Common Use Cases

### Social Media Ads (Recommended Settings)
```typescript
{
  duration: 6,
  resolution: '720p',
  aspectRatio: '9:16',
  model: 'seedance-1-lite'
}
// Cost: ~$0.22 per video
```

### YouTube Shorts
```typescript
{
  duration: 10,
  resolution: '1080p',
  aspectRatio: '9:16',
  model: 'seedance-1-pro'
}
// Cost: ~$1.50 per video
```

### Instagram Feed
```typescript
{
  duration: 6,
  resolution: '720p',
  aspectRatio: '1:1',
  model: 'seedance-1-lite'
}
// Cost: ~$0.22 per video
```

### Desktop/YouTube Banner
```typescript
{
  duration: 8,
  resolution: '1080p',
  aspectRatio: '16:9',
  model: 'seedance-1-pro'
}
// Cost: ~$1.20 per video
```

## Error Handling

```typescript
try {
  const result = await videoService.generateVideo(params);
  const completed = await videoService.waitForCompletion(result.id);

  if (completed.status === 'failed') {
    console.error('Video generation failed');
  } else {
    console.log('Success:', completed.url);
  }
} catch (error) {
  if (error.message.includes('authentication')) {
    console.error('Invalid API token');
  } else if (error.message.includes('timed out')) {
    console.error('Generation took too long');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Additional Resources

- [Replicate Documentation](https://replicate.com/docs)
- [Seedance 1 Lite Model](https://replicate.com/bytedance/seedance-1-lite)
- [Seedance 1 Pro Model](https://replicate.com/bytedance/seedance-1-pro)
- [Replicate API Tokens](https://replicate.com/account/api-tokens)
