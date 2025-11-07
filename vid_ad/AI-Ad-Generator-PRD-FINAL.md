# Product Requirements Document (PRD)
## AI-Powered Dynamic Video Ad Generator

**Version:** 2.0 Final  
**Date:** November 4, 2025  
**Status:** Ready for Development  
**Project Type:** Internal MVP Testing Tool

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [User Personas & Stories](#user-personas--stories)
4. [Core Features & Requirements](#core-features--requirements)
5. [Technical Architecture](#technical-architecture)
6. [User Interface Specifications](#user-interface-specifications)
7. [Video Generation Pipeline](#video-generation-pipeline)
8. [Database Schema](#database-schema)
9. [API Specifications](#api-specifications)
10. [Cost Analysis](#cost-analysis)
11. [Development Timeline](#development-timeline)
12. [Success Metrics](#success-metrics)
13. [Risk Mitigation](#risk-mitigation)
14. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### What We're Building
An AI-powered platform that generates professional, dynamic video advertisements from simple text descriptions. Users input product details, and the system generates 1-3 complete video ads (5-10 seconds) with cinematic visuals, voiceover narration, and professional effects.

### Key Differentiators
- ✅ **OpenAI Sora-2 Integration** - Cinematic AI-generated video scenes
- ✅ **Zero Stock Footage** - All visuals generated on-demand
- ✅ **Multiple Variations** - Generate 1-3 different ads per request
- ✅ **Full Customization** - User controls quality, format, and output count
- ✅ **Intelligent Fallback** - Automatic DALL-E 3 + FFmpeg if Sora fails
- ✅ **30-Second Generation** - Complete ads in under 3 minutes

### Technology Stack
```
Frontend:     Next.js 14 + TypeScript + Tailwind CSS
Backend:      Firebase (Auth, Firestore, Functions, Hosting)
Storage:      AWS S3 (video files)
AI Services:  OpenAI (GPT-4o, Sora-2, Sora-2-Pro, DALL-E 3, TTS)
Processing:   FFmpeg (video assembly, effects, transitions)
```

---

## Product Vision

### Mission Statement
Enable anyone to create professional, scroll-stopping video ads without video editing skills, expensive equipment, or stock footage subscriptions.

### Target Market (MVP)
Internal testing tool for validating AI ad generation technology before commercialization.

### Success Criteria
- Generate visually impressive ads that match or exceed professional agency quality
- Prove AI-generated ads can drive engagement (measure in future phases)
- Validate technical feasibility and cost structure
- Create foundation for future SaaS product

---

## User Personas & Stories

### Primary Persona: Internal Product Tester

**Profile:**
- Role: Product team member / QA tester
- Goal: Validate AI video generation quality
- Technical skill: Varies (non-technical to technical)
- Use frequency: Daily during testing phase

**User Stories:**

**As a product tester, I want to:**
1. Generate video ads quickly so I can test multiple variations
2. Control video quality settings so I can compare outputs
3. Choose between 1-3 variations so I can test A/B scenarios
4. Download videos easily so I can share with stakeholders
5. See generation costs so I understand economics
6. Have videos generate reliably so I can trust the system
7. Preview videos instantly so I can evaluate quality
8. Regenerate ads if unsatisfied so I can get better results

---

## Core Features & Requirements

### MVP Feature Set (P0 - Must Have)

#### 1. User Authentication
**Requirements:**
- Simple email/password authentication via Firebase Auth
- No social OAuth needed for MVP
- Password reset functionality
- Session persistence
- Auto-logout after 30 days inactive

**User Flow:**
```
Landing Page → Sign Up Form → Email Verification → Dashboard
             → Login Form → Dashboard
```

**Out of Scope:**
- Multi-factor authentication
- Social login (Google, Facebook)
- Team accounts
- SSO integration

---

#### 2. Ad Generation Form

**Required Inputs:**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Product Name | Text | Yes | - | Max 50 characters |
| Product Description | Textarea | Yes | - | 2-5 sentences, max 500 chars |
| Keywords | Text | No | - | Comma-separated, max 10 |
| Brand Tone | Dropdown | No | "Professional" | Professional, Casual, Energetic, Luxurious |
| Primary Brand Color | Color Picker | No | #000000 | Hex color code |

**Generation Settings:**

| Setting | Type | Options | Default | Notes |
|---------|------|---------|---------|-------|
| Number of Variations | Radio | 1, 2, 3 | 1 | How many different ads to generate |
| Video Length | Radio | 5s, 10s | 10s | Total duration |
| Orientation | Radio | Vertical (9:16), Horizontal (16:9) | Vertical | Aspect ratio |
| Resolution | Dropdown | 720p, 1080p, 4K | 1080p | Output quality |
| Frame Rate | Dropdown | 24fps, 30fps, 60fps | 30fps | Smoothness |
| Sora Model | Toggle | Sora-2, Sora-2-Pro | Sora-2 | Quality tier |

**Optional Uploads:**

| Asset | Format | Required | Max Size | Usage |
|-------|--------|----------|----------|-------|
| Product Photo | PNG, JPG | No | 10MB | Featured in Scene 2 |
| Logo | PNG (transparent) | No | 5MB | Watermark overlay |

**Form Validation:**
- Product name: 5-50 characters
- Product description: 50-500 characters
- Keywords: Optional, max 10 tags
- Image uploads: Validate format and size
- Show character counts in real-time
- Disable submit until valid

**UI Mockup:**
```
┌────────────────────────────────────────────┐
│  Create New Ad                       [X]   │
├────────────────────────────────────────────┤
│                                            │
│  Product Information                       │
│  ─────────────────────────────────────     │
│                                            │
│  Product Name *                            │
│  [_____________________________] 0/50      │
│                                            │
│  Product Description *                     │
│  [_____________________________]           │
│  [_____________________________]           │
│  [_____________________________] 0/500     │
│                                            │
│  Keywords (optional)                       │
│  [sustainable, eco-friendly, cold] 3/10    │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                            │
│  Brand Settings (Optional)                 │
│  ─────────────────────────────────────     │
│                                            │
│  Brand Tone                                │
│  ○ Professional  ○ Casual                  │
│  ○ Energetic     ○ Luxurious               │
│                                            │
│  Primary Brand Color                       │
│  [■] #000000                               │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                            │
│  Generation Settings                       │
│  ─────────────────────────────────────     │
│                                            │
│  Number of Variations                      │
│  ◉ 1  ○ 2  ○ 3                            │
│                                            │
│  Video Length                              │
│  ○ 5 seconds  ◉ 10 seconds                │
│                                            │
│  Orientation                               │
│  ◉ Vertical (9:16)  ○ Horizontal (16:9)   │
│                                            │
│  Quality Settings                          │
│  Resolution: [1080p ▼]                    │
│  Frame Rate: [30fps ▼]                    │
│                                            │
│  Sora Model                                │
│  ◉ Sora-2 (Faster, Standard)              │
│  ○ Sora-2-Pro (Slower, Premium)           │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                            │
│  Optional Uploads                          │
│  ─────────────────────────────────────     │
│                                            │
│  Product Photo (recommended)               │
│  [Upload Image] or drag & drop             │
│                                            │
│  Logo (optional)                           │
│  [Upload PNG] or drag & drop               │
│                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                            │
│  [Cancel]              [Generate Ads →]    │
│                                            │
└────────────────────────────────────────────┘
```

---

#### 3. Video Generation Pipeline

**High-Level Flow:**
```
User Submits Form
      ↓
Save to Firestore (status: "queued")
      ↓
Trigger Firebase Function
      ↓
Generate Script with GPT-4o (3 variations if requested)
      ↓
For each variation:
   ├─→ Generate Scenes with Sora-2/Pro (all scenes)
   │   └─→ [FALLBACK] If Sora fails → DALL-E 3 + FFmpeg
   ├─→ Generate Voiceover with TTS
   ├─→ Assemble with FFmpeg
   └─→ Upload to S3
      ↓
Update Firestore (status: "completed")
      ↓
User sees videos in dashboard
```

**Detailed Pipeline Steps:**

**Step 1: Script Generation (GPT-4o)**

Input:
```typescript
{
  productName: "EcoBottle",
  productDescription: "Reusable water bottle, keeps drinks cold for 24 hours",
  keywords: ["sustainable", "eco-friendly", "cold"],
  brandTone: "energetic",
  duration: 10,
  numberOfVariations: 3
}
```

Prompt Template:
```
You are an expert advertising creative director. Generate ${numberOfVariations} 
different ${duration}-second video ad scripts for a product.

PRODUCT:
Name: ${productName}
Description: ${productDescription}
Keywords: ${keywords.join(', ')}
Brand Tone: ${brandTone}

REQUIREMENTS:
- Each script must be exactly ${duration} seconds
- 3 scenes per script
- Each scene: 2-4 seconds
- Include visual descriptions suitable for AI video generation
- Include text overlays (max 5 words per scene)
- Include voiceover narration (natural, conversational)
- Variation 1: Focus on problem-solution
- Variation 2: Focus on lifestyle/aspirational
- Variation 3: Focus on features/benefits

OUTPUT FORMAT (JSON):
{
  "variations": [
    {
      "variation_id": 1,
      "concept": "Brief description of this variation's approach",
      "hook": "Opening line",
      "scenes": [
        {
          "scene_number": 1,
          "duration": 3,
          "sora_prompt": "Detailed visual description for Sora video generation, 
                         cinematic, professional commercial quality",
          "text_overlay": "5 words max",
          "voiceover": "Natural narration, 15-20 words",
          "shot_type": "wide|medium|close-up",
          "mood": "energetic|calm|dramatic|inspiring"
        }
      ],
      "cta": "Call to action text"
    }
  ]
}

SORA PROMPT GUIDELINES:
- Be specific about camera movement (zoom, pan, rotate)
- Specify lighting (studio, natural, dramatic)
- Include quality markers (4K, professional, cinematic)
- Describe motion clearly (slow rotation, floating, pouring)
- Avoid abstract concepts, be literal

Generate ${numberOfVariations} compelling variations now.
```

Expected Output Example:
```json
{
  "variations": [
    {
      "variation_id": 1,
      "concept": "Problem-solution narrative showing plastic waste then EcoBottle",
      "hook": "Still using disposable plastic?",
      "scenes": [
        {
          "scene_number": 1,
          "duration": 3,
          "sora_prompt": "Close-up of crumpled plastic water bottles in a pile, 
                         harsh lighting, environmental waste, slow camera push in, 
                         4K cinematic quality, documentary style",
          "text_overlay": "8M tons yearly",
          "voiceover": "Millions of plastic bottles pollute our planet every single day",
          "shot_type": "close-up",
          "mood": "dramatic"
        },
        {
          "scene_number": 2,
          "duration": 4,
          "sora_prompt": "Sleek stainless steel water bottle slowly rotating on 
                         white background, water droplets sliding down surface, 
                         studio product lighting, smooth rotation, premium commercial, 
                         4K quality",
          "text_overlay": "Meet EcoBottle",
          "voiceover": "Meet EcoBottle. The sustainable solution that keeps drinks 
                        ice cold for 24 hours",
          "shot_type": "medium",
          "mood": "inspiring"
        },
        {
          "scene_number": 3,
          "duration": 3,
          "sora_prompt": "Active young person hiking in nature, holding EcoBottle, 
                         taking a refreshing drink, golden hour lighting, wide shot, 
                         cinematic outdoor commercial, 4K",
          "text_overlay": "Join the movement",
          "voiceover": "Make the switch today at EcoBottle dot com",
          "shot_type": "wide",
          "mood": "energetic"
        }
      ],
      "cta": "Shop EcoBottle.com"
    },
    {
      "variation_id": 2,
      "concept": "Lifestyle-focused showing active use scenarios",
      "hook": "Life on the go",
      "scenes": [
        {
          "scene_number": 1,
          "duration": 3,
          "sora_prompt": "Morning sunrise over city skyline, person waking up 
                         and reaching for water bottle on nightstand, warm natural 
                         lighting, lifestyle commercial, slow motion, 4K",
          "text_overlay": "Start your day right",
          "voiceover": "From morning workouts to late night adventures",
          "shot_type": "wide",
          "mood": "inspiring"
        },
        {
          "scene_number": 2,
          "duration": 4,
          "sora_prompt": "EcoBottle in gym setting, person gripping it during workout, 
                         water droplets on bottle, dynamic lighting, fast cuts between 
                         activities, commercial energy, 4K quality",
          "text_overlay": "Cold for 24 hours",
          "voiceover": "EcoBottle keeps your drinks perfectly cold all day long",
          "shot_type": "close-up",
          "mood": "energetic"
        },
        {
          "scene_number": 3,
          "duration": 3,
          "sora_prompt": "Top-down shot of EcoBottle on wooden desk next to laptop, 
                         hand reaching in to grab it, modern workspace aesthetic, 
                         soft window lighting, lifestyle product placement, 4K",
          "text_overlay": "Your perfect companion",
          "voiceover": "Get yours today and never settle for warm drinks again",
          "shot_type": "medium",
          "mood": "calm"
        }
      ],
      "cta": "Order Now"
    },
    {
      "variation_id": 3,
      "concept": "Feature-focused highlighting technical benefits",
      "hook": "Engineered to perfection",
      "scenes": [
        {
          "scene_number": 1,
          "duration": 3,
          "sora_prompt": "Extreme close-up of stainless steel bottle surface, 
                         camera slowly panning across premium metal finish, 
                         studio lighting highlighting texture and quality, 
                         macro lens effect, 4K commercial",
          "text_overlay": "Premium Materials",
          "voiceover": "Crafted from premium stainless steel for maximum durability",
          "shot_type": "close-up",
          "mood": "luxurious"
        },
        {
          "scene_number": 2,
          "duration": 4,
          "sora_prompt": "Cross-section animation showing double-wall insulation, 
                         ice cubes on one side staying frozen while exterior stays 
                         cool, technical product demonstration, clean white background, 
                         professional commercial, 4K",
          "text_overlay": "24-Hour Cold",
          "voiceover": "Double-wall insulation technology keeps drinks ice cold 
                        for a full 24 hours",
          "shot_type": "medium",
          "mood": "professional"
        },
        {
          "scene_number": 3,
          "duration": 3,
          "sora_prompt": "EcoBottle surrounded by ice, water droplets, and fresh 
                         fruit, rotating slowly on turntable, studio product shot, 
                         vibrant colors, premium beverage commercial aesthetic, 4K",
          "text_overlay": "Shop Now",
          "voiceover": "Experience the difference. Shop EcoBottle today",
          "shot_type": "medium",
          "mood": "inspiring"
        }
      ],
      "cta": "Shop EcoBottle.com"
    }
  ]
}
```

**API Call:**
```typescript
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are an expert advertising creative director specializing in 
                short-form video ads. You understand viral trends, platform-specific 
                best practices, and AI video generation capabilities."
    },
    {
      role: "user",
      content: prompt
    }
  ],
  response_format: { type: "json_object" },
  temperature: 0.8, // Creative but controlled
});

const scripts = JSON.parse(completion.choices[0].message.content);
```

**Cost:** ~$0.02-0.04 per request (1-3 scripts)
**Time:** 5-10 seconds

---

**Step 2: Scene Generation with Sora**

For each scene in each variation, generate video using Sora:

```typescript
async function generateSceneWithSora(
  scene: Scene,
  settings: GenerationSettings
): Promise<string> {
  
  const model = settings.soraModel; // "sora-2" or "sora-2-pro"
  
  try {
    // Attempt Sora generation
    const video = await openai.videos.create({
      model: model,
      prompt: scene.sora_prompt,
      duration: scene.duration,
      size: getSize(settings.orientation, settings.resolution),
      // size examples: "1080x1920" (vertical), "1920x1080" (horizontal)
    });
    
    // Handle response based on OpenAI's actual API structure
    // (This may require polling if videos are processed asynchronously)
    
    if (video.status === 'processing') {
      // Poll for completion
      const completedVideo = await pollForCompletion(video.id);
      return completedVideo.url;
    } else {
      return video.url;
    }
    
  } catch (error) {
    console.error(`Sora generation failed for scene ${scene.scene_number}:`, error);
    
    // FALLBACK: Generate with DALL-E 3 + FFmpeg animation
    return await generateSceneFallback(scene, settings);
  }
}

async function pollForCompletion(videoId: string, maxAttempts = 30): Promise<Video> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(5000); // Wait 5 seconds between checks
    
    const video = await openai.videos.retrieve(videoId);
    
    if (video.status === 'completed') {
      return video;
    } else if (video.status === 'failed') {
      throw new Error(`Video generation failed: ${video.error}`);
    }
    
    // Update progress in Firestore
    await updateProgress(videoId, (i / maxAttempts) * 100);
  }
  
  throw new Error('Video generation timed out after 150 seconds');
}
```

**Resolution Mapping:**
```typescript
function getSize(orientation: string, resolution: string): string {
  const sizes = {
    vertical: {
      '720p': '720x1280',
      '1080p': '1080x1920',
      '4k': '2160x3840'
    },
    horizontal: {
      '720p': '1280x720',
      '1080p': '1920x1080',
      '4k': '3840x2160'
    }
  };
  
  return sizes[orientation][resolution];
}
```

**Sora Cost Estimates:**
```
Sora-2: ~$0.40 per 4-second clip
Sora-2-Pro: ~$0.80 per 4-second clip

10-second ad (3 scenes):
- Sora-2: $1.20
- Sora-2-Pro: $2.40
```

**Sora Generation Time:**
```
Per scene (3-4 seconds): 30-60 seconds
Per ad (3 scenes): 90-180 seconds
```

---

**Step 3: Fallback System (DALL-E 3 + FFmpeg)**

If Sora fails for any reason, automatically fall back to static image generation with animations:

```typescript
async function generateSceneFallback(
  scene: Scene,
  settings: GenerationSettings
): Promise<string> {
  
  console.log(`Using fallback for scene ${scene.scene_number}`);
  
  // 1. Generate static image with DALL-E 3
  const image = await openai.images.generate({
    model: "dall-e-3",
    prompt: convertSoraPromptToImagePrompt(scene.sora_prompt),
    size: "1024x1024",
    quality: "hd",
    style: "natural"
  });
  
  // 2. Download image to temp storage
  const imagePath = await downloadImage(image.data[0].url);
  
  // 3. Create animated video with FFmpeg
  const videoPath = await animateImageWithFFmpeg(imagePath, {
    duration: scene.duration,
    resolution: settings.resolution,
    orientation: settings.orientation,
    frameRate: settings.frameRate,
    textOverlay: scene.text_overlay,
    animation: selectAnimation(scene.mood) // ken-burns, zoom, pan, etc.
  });
  
  return videoPath;
}

function convertSoraPromptToImagePrompt(soraPrompt: string): string {
  // Remove motion-specific words from Sora prompt
  return soraPrompt
    .replace(/slowly rotating|rotation|moving|panning|zoom/gi, '')
    .replace(/camera|shot|cinematic/gi, '')
    .trim() + ', high quality still image, professional photography';
}

function selectAnimation(mood: string): AnimationType {
  const animations = {
    'dramatic': 'zoom-in',
    'energetic': 'shake-zoom',
    'calm': 'slow-pan',
    'inspiring': 'ken-burns',
    'luxurious': 'subtle-rotation',
    'professional': 'zoom-out'
  };
  
  return animations[mood] || 'ken-burns';
}
```

**FFmpeg Animation Examples:**

```typescript
async function animateImageWithFFmpeg(
  imagePath: string,
  options: AnimationOptions
): Promise<string> {
  
  const { width, height } = getResolution(options.resolution, options.orientation);
  const outputPath = `/tmp/scene_${Date.now()}.mp4`;
  
  let filterComplex = '';
  
  switch (options.animation) {
    case 'ken-burns':
      // Slow zoom + pan effect (Apple/Nike style)
      filterComplex = `
        [0:v]scale=${width * 1.2}:${height * 1.2},
        zoompan=z='zoom+0.002':d=${options.duration * options.frameRate}:
        x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${options.frameRate},
        fade=in:0:${options.frameRate}:fade=out:${(options.duration - 0.5) * options.frameRate}:${options.frameRate * 0.5}[v];
      `;
      break;
      
    case 'zoom-in':
      // Dramatic zoom effect
      filterComplex = `
        [0:v]scale=${width * 1.5}:${height * 1.5},
        zoompan=z='1+0.005*on':d=${options.duration * options.frameRate}:
        x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${options.frameRate}[v];
      `;
      break;
      
    case 'slow-pan':
      // Gentle horizontal pan
      filterComplex = `
        [0:v]scale=${width * 1.2}:-1,
        crop=${width}:${height}:x='(iw-${width})*(1-t/${options.duration})':y=0[v];
      `;
      break;
      
    case 'subtle-rotation':
      // Slight 3D rotation effect
      filterComplex = `
        [0:v]scale=${width}:${height},
        perspective=x0=0:y0=0:x1='W*sin(t*PI/${options.duration})':y1=0:
        x2=W:y2=H:x3='W-W*sin(t*PI/${options.duration})':y3=H:
        interpolation=linear[v];
      `;
      break;
      
    default:
      // Simple scale and fade
      filterComplex = `
        [0:v]scale=${width}:${height},
        fade=in:0:${options.frameRate}:fade=out:${(options.duration - 0.5) * options.frameRate}:${options.frameRate * 0.5}[v];
      `;
  }
  
  // Add text overlay if provided
  if (options.textOverlay) {
    filterComplex += `
      [v]drawtext=text='${options.textOverlay}':
      fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
      fontsize=80:fontcolor=white:borderw=3:bordercolor=black:
      x=(w-text_w)/2:y=h-200:
      enable='between(t,0.5,${options.duration - 0.5})'[vtext];
    `;
  } else {
    filterComplex += '[v]null[vtext];';
  }
  
  // Execute FFmpeg
  await new Promise((resolve, reject) => {
    ffmpeg(imagePath)
      .complexFilter(filterComplex)
      .outputOptions([
        '-map [vtext]',
        `-r ${options.frameRate}`,
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        `-t ${options.duration}`
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  
  return outputPath;
}
```

**Fallback Cost:**
```
DALL-E 3 image: $0.08
FFmpeg processing: $0.00 (compute only)
Total per scene: $0.08

10-second ad (3 scenes): $0.24
```

**Fallback indicators:**
- Log all fallback occurrences
- Tag videos with "sora" or "fallback" in metadata
- (Optional) Show badge to user: "AI Generated" vs "AI Enhanced"

---

**Step 4: Voiceover Generation**

Generate professional narration for the ad:

```typescript
async function generateVoiceover(
  script: Script,
  brandTone: string
): Promise<string> {
  
  // Combine all voiceover text
  const fullNarration = script.scenes
    .map(scene => scene.voiceover)
    .join(' ');
  
  // Select voice based on brand tone
  const voice = selectVoice(brandTone);
  
  // Generate audio
  const mp3 = await openai.audio.speech.create({
    model: "tts-1-hd", // High quality model
    voice: voice,
    input: fullNarration,
    speed: 1.0, // Normal speed (can adjust: 0.25 - 4.0)
  });
  
  // Save to temp file
  const buffer = Buffer.from(await mp3.arrayBuffer());
  const audioPath = `/tmp/voiceover_${Date.now()}.mp3`;
  await fs.writeFile(audioPath, buffer);
  
  return audioPath;
}

function selectVoice(brandTone: string): Voice {
  const voiceMap = {
    'professional': 'onyx',      // Deep, authoritative male voice
    'casual': 'alloy',           // Neutral, friendly
    'energetic': 'nova',         // Bright, enthusiastic female voice
    'luxurious': 'shimmer'       // Smooth, premium female voice
  };
  
  return voiceMap[brandTone] || 'alloy';
}
```

**Available Voices:**
- `alloy` - Neutral, versatile (male-leaning)
- `echo` - Clear, professional (male)
- `fable` - Warm, expressive (male)
- `onyx` - Deep, authoritative (male)
- `nova` - Bright, energetic (female)
- `shimmer` - Smooth, premium (female)

**Cost:** ~$0.15 per 10-second ad (based on $15 per 1M characters)
**Time:** 3-5 seconds

---

**Step 5: Video Assembly with FFmpeg**

Combine all scenes, add voiceover, apply effects:

```typescript
async function assembleVideo(
  scenes: string[], // Array of scene video paths
  voiceover: string, // Voiceover audio path
  settings: GenerationSettings,
  brandColor?: string,
  logo?: string
): Promise<string> {
  
  const { width, height } = getResolution(settings.resolution, settings.orientation);
  const outputPath = `/tmp/final_${Date.now()}.mp4`;
  
  // Build complex filter
  let filterComplex = '';
  
  // Load and scale all scene videos
  for (let i = 0; i < scenes.length; i++) {
    filterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${settings.frameRate}[v${i}];`;
  }
  
  // Concatenate scenes with crossfade transitions
  let concat = '';
  for (let i = 0; i < scenes.length; i++) {
    if (i === 0) {
      concat = `[v${i}]`;
    } else {
      concat = `${concat}[v${i}]xfade=transition=fade:duration=0.5:offset=${getSceneOffset(scenes, i)}`;
      if (i < scenes.length - 1) {
        concat += '[vt' + i + '];[vt' + i + ']';
      }
    }
  }
  concat += '[vconcat];';
  
  filterComplex += concat;
  
  // Apply color grading (subtle cinematic look)
  filterComplex += `
    [vconcat]eq=contrast=1.1:brightness=0.02:saturation=1.15[vcolor];
  `;
  
  // Add logo overlay if provided
  if (logo) {
    filterComplex += `
      [vcolor][${scenes.length}:v]overlay=W-w-20:20:enable='gte(t,1)'[vlogo];
    `;
  } else {
    filterComplex += '[vcolor]null[vlogo];';
  }
  
  // Add subtle vignette for polish
  filterComplex += `
    [vlogo]vignette=angle=PI/4:mode=forward[vfinal];
  `;
  
  // Audio: Mix voiceover with background music (if added in future)
  filterComplex += `
    [${scenes.length + (logo ? 1 : 0)}:a]volume=1.0,apad[audio];
  `;
  
  // Build input array
  const inputs = [...scenes];
  if (logo) inputs.push(logo);
  inputs.push(voiceover);
  
  // Execute FFmpeg
  const command = ffmpeg();
  
  inputs.forEach(input => command.input(input));
  
  await new Promise((resolve, reject) => {
    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map [vfinal]',
        '-map [audio]',
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        `-r ${settings.frameRate}`,
        '-pix_fmt yuv420p',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-shortest' // End when shortest stream ends
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        // Update progress in database
        console.log(`Processing: ${progress.percent}%`);
      })
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
  
  return outputPath;
}

function getSceneOffset(scenes: Scene[], index: number): number {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += scenes[i].duration - 0.5; // Account for crossfade overlap
  }
  return offset;
}
```

**Processing Time:**
- 5-second ad: 10-15 seconds
- 10-second ad: 20-30 seconds

**Output Specs:**
```
Video Codec: H.264 (libx264)
Audio Codec: AAC
Bitrate: Adaptive based on resolution
  - 720p: ~3 Mbps
  - 1080p: ~5 Mbps  
  - 4K: ~20 Mbps
Color Space: yuv420p (maximum compatibility)
Container: MP4
Optimization: FastStart enabled (web streaming)
```

---

**Step 6: Upload to S3**

```typescript
async function uploadToS3(
  videoPath: string,
  adId: string,
  variationNumber: number
): Promise<string> {
  
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  
  const fileBuffer = await fs.readFile(videoPath);
  const fileName = `${adId}_variation_${variationNumber}.mp4`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `videos/${fileName}`,
    Body: fileBuffer,
    ContentType: 'video/mp4',
    ACL: 'public-read', // Or use CloudFront for private URLs
  }));
  
  // Generate thumbnail
  const thumbnailPath = await generateThumbnail(videoPath);
  const thumbnailBuffer = await fs.readFile(thumbnailPath);
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `thumbnails/${adId}_variation_${variationNumber}.jpg`,
    Body: thumbnailBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  }));
  
  // Clean up temp files
  await fs.unlink(videoPath);
  await fs.unlink(thumbnailPath);
  
  const videoUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/videos/${fileName}`;
  const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/thumbnails/${adId}_variation_${variationNumber}.jpg`;
  
  return { videoUrl, thumbnailUrl };
}

async function generateThumbnail(videoPath: string): Promise<string> {
  const thumbnailPath = videoPath.replace('.mp4', '.jpg');
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['50%'], // Middle frame
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '1080x1920' // Match video dimensions
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  return thumbnailPath;
}
```

---

**Step 7: Update Firestore**

```typescript
async function updateAdStatus(
  adId: string,
  variationNumber: number,
  status: 'completed' | 'failed',
  data?: {
    videoUrl?: string;
    thumbnailUrl?: string;
    script?: Script;
    cost?: number;
    error?: string;
  }
) {
  const adRef = doc(db, 'ads', adId);
  
  const update: any = {
    [`variations.${variationNumber}.status`]: status,
    [`variations.${variationNumber}.completedAt`]: new Date(),
  };
  
  if (data) {
    if (data.videoUrl) update[`variations.${variationNumber}.videoUrl`] = data.videoUrl;
    if (data.thumbnailUrl) update[`variations.${variationNumber}.thumbnailUrl`] = data.thumbnailUrl;
    if (data.script) update[`variations.${variationNumber}.script`] = data.script;
    if (data.cost) update[`variations.${variationNumber}.cost`] = data.cost;
    if (data.error) update[`variations.${variationNumber}.error`] = data.error;
  }
  
  // Check if all variations are complete
  const adDoc = await getDoc(adRef);
  const variations = adDoc.data().variations;
  const allComplete = Object.values(variations).every(
    (v: any) => v.status === 'completed' || v.status === 'failed'
  );
  
  if (allComplete) {
    update.status = 'completed';
    update.completedAt = new Date();
  }
  
  await updateDoc(adRef, update);
}
```

---

#### 4. Dashboard & Video Preview

**Dashboard Layout:**

```
┌────────────────────────────────────────────────────────┐
│  My Ads                                  [+ New Ad]     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ [Thumbnail]  │  │ [Thumbnail]  │  │ [Processing] │ │
│  │              │  │              │  │              │ │
│  │ EcoBottle #1 │  │ EcoBottle #2 │  │ EcoBottle #3 │ │
│  │ 3 variations │  │ 2 variations │  │ 1 variation  │ │
│  │              │  │              │  │              │ │
│  │ Nov 4, 2025  │  │ Nov 3, 2025  │  │ ⏳ 45% done  │ │
│  │              │  │              │  │              │ │
│  │ [View] [⬇]   │  │ [View] [⬇]   │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                        │
│  [Load More...]                                        │
└────────────────────────────────────────────────────────┘
```

**Ad Detail View:**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  EcoBottle Ad Campaign                                  │
│  Created: Nov 4, 2025 at 3:45 PM                       │
│  Duration: 10 seconds | Vertical (9:16) | 1080p | 30fps│
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Variation 1: Problem-Solution                          │
│  ┌─────────────────────────────────┐                   │
│  │                                 │                   │
│  │     [Video Player]              │                   │
│  │     ▶️ Play                      │                   │
│  │                                 │                   │
│  │     0:00 ━━━━━━━━○━━ 0:10       │                   │
│  │                                 │                   │
│  └─────────────────────────────────┘                   │
│                                                         │
│  Model Used: Sora-2                                     │
│  Generation Method: Full AI Video                       │
│  Cost: $1.35                                            │
│                                                         │
│  [Download MP4] [Copy Link] [Regenerate]                │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Variation 2: Lifestyle Focus                           │
│  ┌─────────────────────────────────┐                   │
│  │                                 │                   │
│  │     [Video Player]              │                   │
│  │     ▶️ Play                      │                   │
│  │                                 │                   │
│  └─────────────────────────────────┘                   │
│                                                         │
│  [Download MP4] [Copy Link] [Regenerate]                │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Variation 3: Feature Highlight                         │
│  ┌─────────────────────────────────┐                   │
│  │                                 │                   │
│  │     [Video Player]              │                   │
│  │     ▶️ Play                      │                   │
│  │                                 │                   │
│  └─────────────────────────────────┘                   │
│                                                         │
│  [Download MP4] [Copy Link] [Regenerate]                │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  📊 Total Cost: $4.05                                   │
│  ⏱️  Total Time: 4 min 32 sec                           │
│                                                         │
│  [Delete All Variations]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Real-time Progress Updates:**

```
┌──────────────────────────────────┐
│  Generating Your Ads...          │
├──────────────────────────────────┤
│                                  │
│  Variation 1 of 3                │
│  ████████████░░░░░░  60%         │
│                                  │
│  ✓ Script generated              │
│  ✓ Scene 1 generated (Sora-2)    │
│  ⏳ Scene 2 generating...         │
│  ⏸️  Scene 3 pending              │
│  ⏸️  Voiceover pending            │
│  ⏸️  Assembly pending             │
│                                  │
│  Est. time remaining: 2 min      │
│                                  │
└──────────────────────────────────┘
```

**Implementation with Firestore Real-time:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdProgress({ adId }: { adId: string }) {
  const [progress, setProgress] = useState<Ad | null>(null);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'ads', adId),
      (doc) => {
        setProgress(doc.data() as Ad);
      }
    );
    
    return () => unsubscribe();
  }, [adId]);
  
  if (!progress) return <div>Loading...</div>;
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Generating Your Ads...</h2>
      
      {Object.entries(progress.variations).map(([key, variation]) => (
        <div key={key} className="mb-6 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Variation {key}</h3>
          
          <div className="mb-2">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${variation.progress || 0}%` }}
              />
            </div>
          </div>
          
          <div className="text-sm space-y-1">
            {variation.status === 'completed' && (
              <div className="flex items-center text-green-600">
                <span className="mr-2">✓</span> Complete!
              </div>
            )}
            
            {variation.status === 'processing' && (
              <>
                <div className="flex items-center">
                  <span className="mr-2">
                    {variation.scriptGenerated ? '✓' : '⏳'}
                  </span>
                  Script generation
                </div>
                
                {variation.scenes?.map((scene, i) => (
                  <div key={i} className="flex items-center">
                    <span className="mr-2">
                      {scene.status === 'completed' ? '✓' : 
                       scene.status === 'processing' ? '⏳' : '⏸️'}
                    </span>
                    Scene {i + 1} {scene.usedFallback && '(Enhanced)'}
                  </div>
                ))}
                
                <div className="flex items-center">
                  <span className="mr-2">
                    {variation.voiceoverGenerated ? '✓' : '⏸️'}
                  </span>
                  Voiceover
                </div>
                
                <div className="flex items-center">
                  <span className="mr-2">
                    {variation.assembled ? '✓' : '⏸️'}
                  </span>
                  Final assembly
                </div>
              </>
            )}
            
            {variation.status === 'failed' && (
              <div className="text-red-600">
                ✗ Generation failed: {variation.error}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

#### 5. Error Handling & Retry Logic

**Error Categories:**

| Error Type | Cause | Handling Strategy |
|------------|-------|-------------------|
| **Sora API Timeout** | Video generation > 180s | Automatic fallback to DALL-E + FFmpeg |
| **Sora API Error** | 500, 503, rate limit | Retry once, then fallback |
| **GPT-4o Error** | API error | Retry up to 3 times with exponential backoff |
| **TTS Error** | API error | Retry up to 3 times |
| **FFmpeg Error** | Processing crash | Log error, mark as failed, notify user |
| **S3 Upload Error** | Network issue | Retry up to 5 times |
| **Firestore Error** | Write failure | Retry with backoff |

**Retry Implementation:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Usage
const script = await retryWithBackoff(
  () => openai.chat.completions.create({ /* ... */ }),
  3,
  1000
);
```

**User-Facing Error Messages:**

```typescript
const ERROR_MESSAGES = {
  'sora-timeout': 'Video generation is taking longer than expected. Using enhanced image generation instead.',
  'sora-api-error': 'Temporarily using enhanced visuals. Your ad will still look great!',
  'script-generation-failed': 'Failed to generate ad script. Please try again.',
  'upload-failed': 'Failed to save video. Please check your connection and try again.',
  'ffmpeg-error': 'Video processing error. Our team has been notified.',
};
```

---

## Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                                                             │
│  Next.js 14 Frontend (Firebase Hosting)                    │
│  - React Components                                        │
│  - Tailwind CSS                                            │
│  - Real-time Updates                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   FIREBASE SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │  Firestore   │  │   Firebase   │     │
│  │     Auth     │  │   Database   │  │  Functions   │     │
│  │              │  │              │  │              │     │
│  │  - Email/PW  │  │  - Users     │  │  - Process   │     │
│  │  - Sessions  │  │  - Ads       │  │  - Generate  │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │             │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│                   OPENAI API SERVICES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    GPT-4o    │  │   Sora-2 /   │  │   DALL-E 3   │     │
│  │              │  │  Sora-2-Pro  │  │              │     │
│  │  - Scripts   │  │  - Video     │  │  - Images    │     │
│  │  - 3 vars    │  │  - Scenes    │  │  (Fallback)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐                                          │
│  │  TTS (HD)    │                                          │
│  │              │                                          │
│  │  - Voiceover │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│              VIDEO PROCESSING (Firebase Function)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FFmpeg Processing:                                         │
│  - Scene assembly                                           │
│  - Transitions & effects                                    │
│  - Audio mixing                                             │
│  - Color grading                                            │
│  - Text overlays                                            │
│  - Logo overlay                                             │
│  - Thumbnail generation                                     │
│                                                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│                      AWS S3 STORAGE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /videos/                                                   │
│    - {adId}_variation_1.mp4                                 │
│    - {adId}_variation_2.mp4                                 │
│    - {adId}_variation_3.mp4                                 │
│                                                             │
│  /thumbnails/                                               │
│    - {adId}_variation_1.jpg                                 │
│    - {adId}_variation_2.jpg                                 │
│    - {adId}_variation_3.jpg                                 │
│                                                             │
│  (Optional: CloudFront CDN for faster delivery)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User fills form → Submit
   ↓
2. Frontend validates input
   ↓
3. Create Firestore document (status: "queued")
   ↓
4. Trigger Firebase Function via Firestore trigger
   ↓
5. Firebase Function:
   a. Generate script (GPT-4o)
   b. For each variation:
      - For each scene:
        * Try Sora generation
        * If fail → DALL-E + FFmpeg
      - Generate voiceover (TTS)
      - Assemble with FFmpeg
      - Upload to S3
   c. Update Firestore with results
   ↓
6. Frontend listens to Firestore changes (real-time)
   ↓
7. User sees completed videos
```

---

## Database Schema

### Firestore Collections

#### **Collection: `users`**

```typescript
interface User {
  id: string;                    // Auto-generated UID
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  
  // Stats
  totalAdsGenerated: number;
  totalSpent: number;            // For future billing
  
  // Preferences
  defaultBrandTone?: string;
  defaultPrimaryColor?: string;
}
```

**Document Example:**
```json
{
  "id": "user_abc123xyz",
  "email": "test@example.com",
  "displayName": null,
  "createdAt": "2025-11-04T19:30:00Z",
  "lastLoginAt": "2025-11-04T20:15:00Z",
  "totalAdsGenerated": 12,
  "totalSpent": 16.80,
  "defaultBrandTone": "energetic",
  "defaultPrimaryColor": "#4CAF50"
}
```

#### **Collection: `ads`**

```typescript
interface Ad {
  id: string;                    // Auto-generated
  userId: string;                // Reference to user
  
  // Input data
  productName: string;
  productDescription: string;
  keywords: string[];
  brandTone: string;
  primaryColor?: string;
  
  // Generation settings
  numberOfVariations: 1 | 2 | 3;
  videoLength: 5 | 10;
  orientation: 'vertical' | 'horizontal';
  resolution: '720p' | '1080p' | '4k';
  frameRate: 24 | 30 | 60;
  soraModel: 'sora-2' | 'sora-2-pro';
  
  // Optional uploads
  productImageUrl?: string;      // S3 URL if uploaded
  logoUrl?: string;              // S3 URL if uploaded
  
  // Status
  status: 'queued' | 'processing' | 'completed' | 'failed';
  
  // Variations (map of variation number to data)
  variations: {
    [key: number]: {
      status: 'queued' | 'processing' | 'completed' | 'failed';
      progress: number;          // 0-100
      
      // Generation details
      scriptGenerated: boolean;
      script?: Script;
      scenes: {
        sceneNumber: number;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        usedFallback: boolean;   // true if DALL-E used instead of Sora
        generationMethod: 'sora-2' | 'sora-2-pro' | 'dalle-ffmpeg';
      }[];
      voiceoverGenerated: boolean;
      assembled: boolean;
      
      // Output
      videoUrl?: string;         // S3 URL
      thumbnailUrl?: string;     // S3 URL
      
      // Cost tracking
      cost: number;              // USD
      costBreakdown: {
        scriptGeneration: number;
        sceneGeneration: number;
        voiceover: number;
        processing: number;
      };
      
      // Timing
      startedAt: Timestamp;
      completedAt?: Timestamp;
      processingTime?: number;   // seconds
      
      // Error info
      error?: string;
    };
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  
  // Totals
  totalCost: number;
  totalProcessingTime: number;
}
```

**Document Example:**
```json
{
  "id": "ad_1730761200000",
  "userId": "user_abc123xyz",
  
  "productName": "EcoBottle",
  "productDescription": "Reusable water bottle that keeps drinks cold for 24 hours",
  "keywords": ["sustainable", "eco-friendly", "cold"],
  "brandTone": "energetic",
  "primaryColor": "#4CAF50",
  
  "numberOfVariations": 3,
  "videoLength": 10,
  "orientation": "vertical",
  "resolution": "1080p",
  "frameRate": 30,
  "soraModel": "sora-2",
  
  "productImageUrl": null,
  "logoUrl": "https://bucket.s3.amazonaws.com/logos/user_abc123xyz_logo.png",
  
  "status": "completed",
  
  "variations": {
    "1": {
      "status": "completed",
      "progress": 100,
      "scriptGenerated": true,
      "script": { /* full script object */ },
      "scenes": [
        {
          "sceneNumber": 1,
          "status": "completed",
          "usedFallback": false,
          "generationMethod": "sora-2"
        },
        {
          "sceneNumber": 2,
          "status": "completed",
          "usedFallback": false,
          "generationMethod": "sora-2"
        },
        {
          "sceneNumber": 3,
          "status": "completed",
          "usedFallback": false,
          "generationMethod": "sora-2"
        }
      ],
      "voiceoverGenerated": true,
      "assembled": true,
      "videoUrl": "https://bucket.s3.amazonaws.com/videos/ad_1730761200000_variation_1.mp4",
      "thumbnailUrl": "https://bucket.s3.amazonaws.com/thumbnails/ad_1730761200000_variation_1.jpg",
      "cost": 1.35,
      "costBreakdown": {
        "scriptGeneration": 0.01,
        "sceneGeneration": 1.20,
        "voiceover": 0.14,
        "processing": 0.00
      },
      "startedAt": "2025-11-04T20:00:00Z",
      "completedAt": "2025-11-04T20:02:45Z",
      "processingTime": 165,
      "error": null
    },
    "2": {
      "status": "completed",
      "progress": 100,
      /* similar structure */
      "cost": 1.35
    },
    "3": {
      "status": "completed",
      "progress": 100,
      /* similar structure */
      "cost": 1.35
    }
  },
  
  "createdAt": "2025-11-04T20:00:00Z",
  "updatedAt": "2025-11-04T20:08:30Z",
  "completedAt": "2025-11-04T20:08:30Z",
  
  "totalCost": 4.05,
  "totalProcessingTime": 510
}
```

**Firestore Indexes Required:**

```javascript
// Composite index for querying user's ads
{
  collection: "ads",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// For filtering by status
{
  collection: "ads",
  fields: [
    { fieldPath: "userId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}
```

---

## API Specifications

### Firebase Functions

#### **Function: `processAdGeneration`**

**Trigger:** Firestore onCreate (`ads/{adId}`)

**Timeout:** 540 seconds (9 minutes)

**Memory:** 4GB (for FFmpeg processing)

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=ad-generator-videos
```

**Function Code Structure:**
```typescript
export const processAdGeneration = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '4GB',
  })
  .firestore
  .document('ads/{adId}')
  .onCreate(async (snap, context) => {
    const adId = context.params.adId;
    const adData = snap.data();
    
    try {
      await generateAd(adId, adData);
    } catch (error) {
      console.error('Ad generation failed:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message
      });
    }
  });
```

---

### REST API Endpoints (Next.js API Routes)

Not heavily used since we're using Firebase Functions, but these can be added for auxiliary operations:

#### **POST /api/upload-asset**

Upload product image or logo before ad generation.

**Request:**
```typescript
{
  file: File,
  type: 'product-image' | 'logo',
  userId: string
}
```

**Response:**
```typescript
{
  success: boolean,
  url: string,  // S3 URL
  error?: string
}
```

#### **GET /api/ads/:id/download**

Generate temporary download link for video.

**Response:**
```typescript
{
  success: boolean,
  downloadUrl: string,  // Pre-signed S3 URL (expires in 1 hour)
  expiresAt: string
}
```

---

## Cost Analysis

### Per-Ad Cost Breakdown

#### **Single 10-Second Ad (1 Variation)**

**Sora-2 Model:**
```
Script Generation (GPT-4o):        $0.02
Scene 1 (3s, Sora-2):              $0.40
Scene 2 (4s, Sora-2):              $0.50
Scene 3 (3s, Sora-2):              $0.40
Voiceover (TTS):                   $0.15
FFmpeg Processing:                 $0.00 (compute included)
S3 Storage (1 month):              $0.01
─────────────────────────────────────
Total:                             $1.48
```

**Sora-2-Pro Model:**
```
Script Generation (GPT-4o):        $0.02
Scene 1 (3s, Sora-2-Pro):          $0.80
Scene 2 (4s, Sora-2-Pro):          $1.00
Scene 3 (3s, Sora-2-Pro):          $0.80
Voiceover (TTS):                   $0.15
FFmpeg Processing:                 $0.00
S3 Storage (1 month):              $0.01
─────────────────────────────────────
Total:                             $2.78
```

**With Fallback (if all scenes use DALL-E):**
```
Script Generation (GPT-4o):        $0.02
Scene 1 (DALL-E 3):                $0.08
Scene 2 (DALL-E 3):                $0.08
Scene 3 (DALL-E 3):                $0.08
Voiceover (TTS):                   $0.15
FFmpeg Processing:                 $0.00
S3 Storage:                        $0.01
─────────────────────────────────────
Total:                             $0.42
```

#### **3 Variations (Most Common Use Case)**

**Sora-2:**
- 1 variation: $1.48
- 3 variations: $4.44

**Sora-2-Pro:**
- 1 variation: $2.78
- 3 variations: $8.34

**Mixed (1 Sora-2, 2 Fallback):**
- Worst case scenario if Sora is unreliable
- Total: $2.32

### Monthly Infrastructure Costs

**Base Infrastructure (0 ads generated):**
```
Firebase:
  Authentication:                  Free (unlimited)
  Firestore:                       Free tier (50k reads, 20k writes)
  Hosting:                         Free tier
  Functions:                       Free tier (2M invocations)
  
AWS S3:
  Storage (base):                  $0
  
Total Base:                        $0/month
```

**With Usage (100 ad requests/month = 300 videos):**
```
Firebase:
  Firestore reads/writes:          ~$2
  Functions compute:               ~$15-20
  
AWS S3:
  Storage (300 videos @ 20MB):     $0.70
  Data transfer:                   ~$10
  
OpenAI API:
  Scripts (100 requests):          $2
  Videos (300 @ Sora-2):          $400
  Voiceovers (300):               $45
  
─────────────────────────────────────
Total:                             ~$475/month
```

**With Usage (100 ad requests, 50% fallback):**
```
Firebase:                          ~$17-22
AWS S3:                            ~$11
OpenAI API:
  Scripts:                         $2
  Videos (150 Sora + 150 DALL-E):  $212
  Voiceovers:                      $45
─────────────────────────────────────
Total:                             ~$287-297/month
```

### Cost Optimization Strategies

1. **Smart Sora Usage**
   - Use Sora-2 by default (cheaper)
   - Reserve Sora-2-Pro for "premium" user requests
   - Implement fallback aggressively to reduce Sora spend

2. **Caching**
   - Cache similar product images (DALL-E)
   - Reuse voiceovers for identical scripts
   - Cache scene generations for common prompts

3. **Batch Processing**
   - Process multiple ads in parallel
   - Reduce function cold starts

4. **S3 Lifecycle**
   - Move videos to Glacier after 30 days
   - Delete after 90 days (or charge for long-term storage)

---

## Development Timeline

### Phase 1: Foundation (Week 1-2)

**Week 1:**
- [ ] Firebase project setup
- [ ] Next.js project initialization
- [ ] Firebase Authentication implementation
- [ ] Basic UI shell (landing, login, signup)
- [ ] Protected routes middleware
- [ ] Firestore database setup
- [ ] Deploy to Firebase Hosting (staging)

**Week 2:**
- [ ] Ad creation form UI
- [ ] Form validation
- [ ] Image upload to S3 (product photo, logo)
- [ ] Firestore integration (create ad document)
- [ ] Dashboard skeleton
- [ ] Real-time updates setup

**Deliverables:**
- Working auth flow
- Form that saves to Firestore
- Basic dashboard

---

### Phase 2: AI Integration (Week 3-4)

**Week 3:**
- [ ] OpenAI API integration
- [ ] GPT-4o script generation
- [ ] Test and refine prompts
- [ ] Sora-2 video generation test
- [ ] TTS voiceover generation
- [ ] DALL-E 3 image generation (fallback)

**Week 4:**
- [ ] Firebase Functions setup
- [ ] Video generation pipeline implementation
- [ ] FFmpeg integration and testing
- [ ] Fallback system implementation
- [ ] Error handling and retries
- [ ] Progress tracking in Firestore

**Deliverables:**
- Complete generation pipeline
- Tested with multiple products
- Fallback system working

---

### Phase 3: Video Assembly (Week 5)

**Week 5:**
- [ ] FFmpeg scene assembly
- [ ] Transitions and effects
- [ ] Text overlays
- [ ] Logo overlay
- [ ] Color grading
- [ ] Audio mixing
- [ ] Thumbnail generation
- [ ] S3 upload
- [ ] Performance optimization

**Deliverables:**
- Full end-to-end video generation
- Professional-quality output

---

### Phase 4: Dashboard & Polish (Week 6)

**Week 6:**
- [ ] Video player implementation
- [ ] Download functionality
- [ ] Cost display
- [ ] Generation time display
- [ ] Real-time progress UI
- [ ] Error messages
- [ ] Loading states
- [ ] Responsive design
- [ ] Bug fixes
- [ ] Performance testing

**Deliverables:**
- Complete, polished dashboard
- All features working

---

### Phase 5: Testing & Launch (Week 7)

**Week 7:**
- [ ] Comprehensive testing
  - [ ] Different product types
  - [ ] All settings combinations
  - [ ] Fallback scenarios
  - [ ] Error scenarios
- [ ] Load testing
- [ ] Security audit
- [ ] Documentation
- [ ] Deploy to production
- [ ] Internal team onboarding

**Deliverables:**
- Production-ready MVP
- Internal testing begins

---

**Total Timeline: 7 weeks**

---

## Success Metrics

### Technical Metrics

**Performance:**
- Average generation time: < 3 minutes per variation
- Success rate: > 95%
- Fallback rate: < 20%
- Uptime: > 99.5%

**Quality:**
- User satisfaction: > 4/5 stars (internal feedback)
- Video output quality: 1080p minimum
- Audio-video sync: Perfect (0 frame drift)

**Cost:**
- Cost per ad: $1.48 (Sora-2) / $2.78 (Sora-2-Pro)
- Infrastructure cost: < $25/month (base)

### User Metrics (Internal Testing)

**Engagement:**
- Daily active testers: 5-10
- Ads generated per day: 10-20
- Time on platform: > 5 minutes per session

**Usage Patterns:**
- Preferred variation count: Track 1 vs 2 vs 3
- Preferred length: Track 5s vs 10s
- Preferred model: Track Sora-2 vs Sora-2-Pro
- Fallback acceptance: Track if users regenerate after fallback

**Feedback:**
- Bug reports: Track and resolve within 24 hours
- Feature requests: Prioritize for Phase 2
- Quality feedback: Average rating > 4/5

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Sora API unavailable** | Medium | High | Fallback system (DALL-E + FFmpeg) |
| **Sora generation too slow** | Medium | Medium | Set timeout, use fallback |
| **Sora quality issues** | Low | Medium | Allow regeneration, use Pro model |
| **High OpenAI costs** | High | High | Implement fallback, optimize prompts |
| **FFmpeg crashes** | Low | High | Error handling, retry logic |
| **S3 upload failures** | Low | Medium | Retry with exponential backoff |
| **Firebase quota limits** | Low | Medium | Monitor usage, upgrade plan |
| **Video file size too large** | Medium | Low | Compression settings, resolution limits |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **OpenAI pricing changes** | Medium | High | Monitor announcements, have alternatives ready |
| **Sora access revoked** | Low | Critical | Fallback system already built |
| **Competitor launches similar** | High | Medium | Speed to market, focus on quality |
| **User adoption low** | Medium | Medium | Internal marketing, demos |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Team availability** | Medium | High | Document everything, cross-train |
| **Timeline slippage** | Medium | Medium | Weekly checkpoints, flexible scope |
| **Budget overrun** | Low | Medium | Cost tracking, alerts |

---

## Future Enhancements (Post-MVP)

### Phase 2 (Month 2-3)

**Features:**
1. **Background Music Library**
   - Curated royalty-free tracks
   - Genre selection
   - Volume control

2. **Advanced Editing**
   - Swap scenes
   - Adjust timing
   - Change text overlays
   - Regenerate individual scenes

3. **Templates**
   - Pre-designed ad styles
   - Industry-specific templates
   - Seasonal templates

4. **Batch Generation**
   - Upload CSV of products
   - Generate ads for entire catalog

5. **Analytics**
   - Track views (if videos hosted)
   - Download stats
   - Cost per ad trends

### Phase 3 (Month 4-6)

**Features:**
1. **Team Collaboration**
   - Multi-user accounts
   - Share ads
   - Comments and feedback

2. **Brand Guidelines**
   - Save brand presets
   - Font selections
   - Color palettes
   - Logo variations

3. **Social Media Integration**
   - Direct upload to Meta/TikTok
   - Scheduling
   - Performance tracking

4. **A/B Testing Tools**
   - Side-by-side comparison
   - Annotations
   - Winner selection

5. **API Access**
   - Programmatic generation
   - Webhooks for completion
   - Bulk operations

### Phase 4 (Month 7+)

**Commercialization:**
1. **Pricing Tiers**
   - Free: 1 ad/month
   - Starter: $49/mo - 20 ads
   - Pro: $149/mo - 100 ads
   - Enterprise: Custom

2. **Marketplace**
   - User-uploaded templates
   - Creative services
   - Stock footage integration

3. **White-Label**
   - Agency partnerships
   - Custom branding
   - Reseller program

4. **Advanced AI**
   - Custom voice cloning
   - Brand-specific fine-tuning
   - Longer video support (30s-60s)

---

## Appendix

### A. Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side)
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PROJECT_ID=

# OpenAI
OPENAI_API_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# App
NEXT_PUBLIC_APP_URL=https://app.example.com
NODE_ENV=production
```

### B. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    "firebase": "^10.7.0",
    "firebase-admin": "^11.11.0",
    
    "openai": "^4.20.0",
    
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    
    "fluent-ffmpeg": "^2.1.2",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    
    "sharp": "^0.32.0",
    
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-*": "^1.0.0"
  }
}
```

### C. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own ads
    match /ads/{adId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

### D. S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ad-generator-videos/videos/*"
    },
    {
      "Sid": "PublicReadGetThumbnail",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ad-generator-videos/thumbnails/*"
    }
  ]
}
```

### E. FFmpeg Installation (Firebase Functions)

Since Firebase Functions run on Google Cloud, FFmpeg must be included:

**Option 1: Use Layer (Recommended)**
```bash
# In functions directory
mkdir -p bin
cd bin
wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz
tar xvf ffmpeg-git-amd64-static.tar.xz
mv ffmpeg-git-*-amd64-static/ffmpeg .
mv ffmpeg-git-*-amd64-static/ffprobe .
rm -rf ffmpeg-git-*
cd ..
```

**In Firebase Function:**
```typescript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

// Set FFmpeg path
const ffmpegPath = path.join(__dirname, '../bin/ffmpeg');
const ffprobePath = path.join(__dirname, '../bin/ffprobe');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
```

**Option 2: Use Docker Container**
```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y ffmpeg
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-04 | Initial | First draft |
| 2.0 | 2025-11-04 | Final | Sora integration, user controls, complete specs |

---

## Sign-off

**Prepared by:** AI Product Team  
**Reviewed by:** [Pending]  
**Approved by:** [Pending]  
**Date:** November 4, 2025

---

**END OF DOCUMENT**
