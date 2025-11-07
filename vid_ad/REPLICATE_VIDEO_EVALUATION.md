# Replicate Video Generation - Comprehensive Evaluation

## Current Implementation Status

### ✅ Currently Integrated
- **Models**: ByteDance Seedance 1 Lite & Pro
- **Parameters**:
  - `prompt` (string) - Text description for video generation
  - `duration` (2-12 seconds) - Currently limited to 5-10s in UI
  - `resolution` ('480p' | '720p' | '1080p')
  - `aspect_ratio` ('16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21')
  - `seed` (number) - For reproducible outputs
  - `camera_fixed` (boolean) - Fix camera position
  - `image` (URI) - Input image for image-to-video
  - `last_frame_image` (URI) - Ending frame

### 📊 Seedance Pricing (Current)
| Model | Resolution | Cost/sec | Notes |
|-------|-----------|----------|-------|
| Seedance Lite | 480p | $0.018 | Budget option |
| Seedance Lite | 720p | $0.036 | Current default |
| Seedance Lite | 1080p | $0.072 | High quality |
| Seedance Pro | 480p | $0.030 | Better realism |
| Seedance Pro | 720p | $0.060 | Pro quality |
| Seedance Pro | 1080p | $0.150 | Premium |

**Total Usage**: 949.1K+ runs (highly stable, production-ready)

---

## Available Replicate Models for Expansion

### 1. Google Veo 3.1 & 3.1-Fast
**Status**: Latest Google models (Jan 2025)

#### Features:
- Higher-fidelity video output
- **Context-aware audio generation** (major advantage)
- Reference image support
- Last frame support for continuity

#### Parameters:
- `prompt` (string) - Text description
- `first_frame_image` (URI) - Starting reference image
- `last_frame_image` (URI) - Ending reference image
- Duration: Up to 8 seconds
- Resolution: 720p (Veo 3.1-Fast), 1080p (Veo 3.1)

#### Pricing:
- Veo 3.1-Fast: ~$0.10-0.15 per video (optimized for speed)
- Veo 3.1: ~$0.20-0.30 per video (higher quality)

#### Pros:
- Built-in audio generation
- Latest technology from Google
- Higher fidelity output

#### Cons:
- More expensive than Seedance
- Limited duration (max 8s)
- Newer model (less proven at scale)

**Recommendation**: Add as premium option for ads requiring audio

---

### 2. Minimax Video-01 / Hailuo 2.3
**Status**: Cinematic-focused models

#### Features:
- **Prompt optimizer** (automatic enhancement)
- Optimized for realistic human motion
- High-fidelity cinematic output
- Character reference support

#### Parameters:
- `prompt` (string)
- `prompt_optimizer` (boolean, default: true) - Auto-enhance prompts
- `first_frame_image` (URI) - Reference image
- `subject_reference` (URI) - Character consistency
- Duration: Up to 6 seconds (10s coming soon)
- Resolution: 720p HD
- Frame Rate: 25fps

#### Pricing:
- $0.50 per video (fixed cost, not per-second)
- Very predictable pricing

#### Pros:
- Fixed pricing simplifies cost estimation
- Excellent for human-focused ads
- Automatic prompt enhancement
- Cinematic quality

#### Cons:
- Shorter max duration (6s)
- Higher per-video cost for short clips
- No explicit temperature/CFG controls

**Recommendation**: Add for product ads featuring people/models

---

### 3. Alibaba Wan 2.5
**Status**: Text & Image-to-Video with audio

#### Features:
- Text-to-video generation
- Image-to-video animation
- **Background audio generation**
- Two variants: standard and speed-optimized

#### Parameters:
- `prompt` (string)
- `image` (URI) - For image-to-video mode
- Resolution: 720p-1080p
- Duration: 3-8 seconds

#### Pricing:
- ~$0.08-0.15 per video (competitive)

#### Pros:
- Audio generation included
- Good balance of quality and speed
- Image animation capability

#### Cons:
- Less documentation than major models
- Newer in market

**Recommendation**: Consider for ads requiring background music/audio

---

### 4. Luma Ray 2
**Status**: Fast, high-quality generation

#### Features:
- Fast generation speed
- Text-to-video and image-to-video
- Multiple resolution tiers

#### Parameters:
- `prompt` (string)
- `image` (URI) - Optional starting image
- Resolution: 540p-720p
- Duration: 5 seconds

#### Pricing:
- ~$0.05-0.10 per video (competitive)

#### Pros:
- Fast generation
- Cost-effective
- Simple API

#### Cons:
- Limited duration (5s fixed)
- Lower max resolution than competitors

**Recommendation**: Good for rapid prototyping, A/B testing variations

---

## Missing Parameters Analysis

### ❌ Parameters NOT Available in Most Models:

1. **Temperature/Sampling Control**
   - Not exposed in Seedance, Veo, or Luma
   - Some models handle this internally via prompt optimization

2. **CFG Scale (Classifier-Free Guidance)**
   - Not directly available in most text-to-video models
   - Newer models may support this in future versions

3. **Negative Prompts**
   - Not supported in current Replicate video models
   - Available in image generation but not video

4. **FPS Control**
   - Most models use fixed FPS (24-25fps)
   - Seedance: Fixed 24fps
   - Minimax: Fixed 25fps
   - Not configurable

### ✅ Parameters AVAILABLE:

1. **Seed** (Seedance, most models) - Reproducibility
2. **Camera Control** (Seedance) - Fixed vs. moving camera
3. **Prompt Optimizer** (Minimax) - Automatic enhancement
4. **Reference Images** (Most models) - Image-to-video, character ref
5. **Last Frame** (Seedance, Veo) - Video continuity
6. **Resolution** (All models) - 480p to 1080p
7. **Aspect Ratio** (Seedance) - Multiple formats
8. **Duration** (All models) - Variable within limits

---

## Metadata & Output Analysis

### Available Metadata from Replicate API:

```typescript
interface PredictionResponse {
  id: string;                    // Prediction ID
  status: string;                // starting|processing|succeeded|failed|canceled
  output: string | string[];     // Video URL(s)

  // Timing & Performance
  created_at: string;
  started_at: string;
  completed_at: string;

  // Metrics
  metrics: {
    predict_time: number;        // Generation time in seconds
  };

  // Logs
  logs: string;                  // Model execution logs

  // Error handling
  error?: string;

  // URLs
  urls: {
    get: string;                 // Polling URL
    cancel: string;              // Cancellation URL
  };
}
```

### Output Format:
- **Video Format**: MP4
- **Codec**: H.264 (most models)
- **Audio**: Varies by model (Veo/Wan have audio, Seedance video-only)
- **Storage**: Temporary URLs (download within 24-48 hours)

---

## Recommendations for Platform Enhancement

### Priority 1: Immediate Additions
1. **Add duration range 2-12s** (currently 5-10s)
   - Seedance supports 2-12s
   - More flexibility for different ad formats

2. **Add 480p resolution option** (currently only 720p/1080p in UI)
   - Significant cost savings for draft/preview
   - Already supported in backend

3. **Expose seed parameter** (already in backend)
   - Allow users to reproduce favorite outputs
   - Add "Use same style" feature

4. **Add camera_fixed toggle** (already in backend)
   - Important for product-focused ads
   - Simple UI toggle

### Priority 2: Additional Models
1. **Google Veo 3.1-Fast** (Premium tier)
   - For ads requiring audio
   - Higher quality output
   - Add as "Premium" model option

2. **Minimax Video-01** (Human-focused tier)
   - For ads with people/models
   - Fixed pricing = predictable costs
   - Automatic prompt enhancement

### Priority 3: Advanced Features
1. **Image-to-Video workflow**
   - Upload product images
   - Animate them into video ads
   - Already supported in Seedance backend

2. **Last frame continuity**
   - Chain multiple video segments
   - Create longer narratives
   - Already in backend

3. **Batch generation with different seeds**
   - Generate multiple variations automatically
   - Same prompt, different seeds
   - Better A/B testing

### Priority 4: Future Considerations
1. **Audio integration** (Veo/Wan models)
   - Combine with OpenAI TTS
   - Or use model's native audio

2. **Cost optimizer**
   - Recommend optimal model based on requirements
   - Balance quality vs. cost

3. **Quality presets**
   - "Draft" (Seedance Lite 480p)
   - "Standard" (Seedance Lite 720p)
   - "Professional" (Seedance Pro 1080p)
   - "Premium" (Veo 3.1 1080p)

---

## API Usage Patterns

### Current Implementation:
```typescript
// Generate video
const result = await replicateService.generateVideo({
  prompt: "Nike running shoes in urban setting",
  duration: 6,
  resolution: '720p',
  aspectRatio: '16:9',
  model: 'seedance-1-pro',
  seed: 12345,              // Reproducibility
  cameraFixed: true,        // Static camera
});

// Poll for completion
const status = await replicateService.checkVideoStatus(result.id);
```

### Recommended Enhancement:
```typescript
// Enhanced with more models
const result = await replicateService.generateVideo({
  prompt: "Nike running shoes in urban setting",
  duration: 6,
  resolution: '720p',
  aspectRatio: '16:9',
  model: 'veo-3-1-fast',    // New model option
  seed: 12345,

  // Image-to-video
  image: productImageUrl,

  // Audio (if Veo/Wan)
  includeAudio: true,

  // Prompt enhancement (if Minimax)
  autoEnhance: true,
});
```

---

## Cost Optimization Strategies

### Current Costs (Seedance Pro 720p, 6s video):
- Single variation: $0.36
- 3 variations: $1.08

### Optimized Costs:
1. **Use 480p for drafts**: $0.18 (50% savings)
2. **Use Seedance Lite**: $0.22 (39% savings)
3. **Shorter duration for tests**: $0.06 @ 2s (83% savings)
4. **Fixed-price models for human ads**: Minimax @ $0.50 flat

### Recommendation:
- Default to Seedance Lite 480p for initial generation
- Offer "Upgrade to HD" button for final export
- Save ~70% on iteration costs

---

## Implementation Checklist

### Phase 1: Expose Existing Parameters
- [ ] Add seed input field (reproducibility)
- [ ] Add camera fixed toggle
- [ ] Expand duration range to 2-12s
- [ ] Add 480p resolution option
- [ ] Add image-to-video upload

### Phase 2: Add New Models
- [ ] Integrate Google Veo 3.1-Fast
- [ ] Integrate Minimax Video-01
- [ ] Add model comparison UI
- [ ] Update pricing calculator

### Phase 3: Advanced Features
- [ ] Last frame continuity
- [ ] Automatic seed variation generation
- [ ] Cost optimizer recommendations
- [ ] Quality presets

---

## Testing & Validation

### Test Cases:
1. **Reproducibility**: Same seed → identical output
2. **Cost accuracy**: Actual charges match estimates
3. **Duration limits**: 2s, 6s, 10s, 12s all work
4. **Resolution scaling**: 480p → 720p → 1080p quality difference
5. **Model comparison**: Same prompt across models

### Metrics to Track:
- Generation success rate
- Average generation time by model
- Cost per video by configuration
- User satisfaction by model choice

---

## Conclusion

**Current State**: Solid foundation with Seedance models, all major parameters implemented in backend

**Quick Wins**:
1. Expose seed, camera_fixed, 480p in UI
2. Expand duration to 2-12s range
3. Add image-to-video UI

**Strategic Additions**:
1. Veo 3.1-Fast for premium/audio needs
2. Minimax for human-focused ads
3. Cost optimization presets

**Not Available/Not Recommended**:
- Temperature control (not exposed by providers)
- CFG scale (not available in video models)
- FPS control (fixed by models)
- Negative prompts (not supported)

The platform is already using industry-leading models with comprehensive parameter support. Focus should be on exposing existing capabilities and adding strategic model options rather than seeking unavailable controls.
