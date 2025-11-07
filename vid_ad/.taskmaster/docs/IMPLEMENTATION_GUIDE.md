# Implementation Guide
## AI-Powered Dynamic Video Ad Generator

### Table of Contents
1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Authentication Implementation](#authentication-implementation)
4. [Form Implementation](#form-implementation)
5. [Video Generation Pipeline](#video-generation-pipeline)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)

---

## Getting Started

### Prerequisites
- Node.js 20 LTS or higher
- npm or yarn package manager
- Firebase CLI installed globally
- AWS CLI configured
- OpenAI API key

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd vid-ad-generator

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Initialize Firebase
firebase init
# Select: Firestore, Functions, Hosting, Emulators

# Start development server
npm run dev
```

---

## Development Setup

### Project Structure

```
vid-ad-generator/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── components/        # Shared components
├── functions/             # Firebase Functions
│   ├── src/
│   └── lib/
├── lib/                   # Shared utilities
│   ├── firebase/         # Firebase config
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── public/               # Static assets
└── types/                # TypeScript definitions
```

### Firebase Configuration

```typescript
// lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

---

## Authentication Implementation

### Auth Context Provider

```typescript
// lib/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Route Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/ads'];
const publicRoutes = ['/login', '/signup', '/'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route =>
    path.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(path);

  // Get session from cookie
  const session = request.cookies.get('session');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicRoute && session && !path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

---

## Form Implementation

### Ad Generation Form with React Hook Form

```typescript
// app/(dashboard)/ads/new/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  productName: z.string().min(5).max(100),
  productDescription: z.string().min(50).max(500),
  keywords: z.array(z.string()).max(10).optional(),
  brandTone: z.enum(['professional', 'casual', 'energetic', 'luxurious']),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  numberOfVariations: z.number().min(1).max(3),
  videoLength: z.enum(['5', '10']),
  orientation: z.enum(['vertical', 'horizontal']),
  resolution: z.enum(['720p', '1080p', '4k']),
  frameRate: z.enum(['24', '30', '60']),
  soraModel: z.enum(['sora-2', 'sora-2-pro']),
  productImage: z.instanceof(File).optional(),
  logo: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewAdPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfVariations: 1,
      videoLength: '10',
      orientation: 'vertical',
      resolution: '1080p',
      frameRate: '30',
      soraModel: 'sora-2',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Upload assets to S3 if provided
      const assetUrls = await uploadAssets(data);

      // Create ad document in Firestore
      const adRef = await addDoc(collection(db, 'ads'), {
        ...data,
        ...assetUrls,
        userId: auth.currentUser?.uid,
        status: 'queued',
        createdAt: serverTimestamp(),
      });

      // Redirect to ad detail page
      router.push(`/ads/${adRef.id}`);
    } catch (error) {
      console.error('Error creating ad:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields implementation */}
    </form>
  );
}
```

---

## Video Generation Pipeline

### Firebase Function for Video Generation

```typescript
// functions/src/triggers/onAdCreated.ts
import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';

initializeApp();
const db = getFirestore();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const processAdGeneration = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '4GB',
  })
  .firestore.document('ads/{adId}')
  .onCreate(async (snap, context) => {
    const adId = context.params.adId;
    const adData = snap.data();

    try {
      // Update status to processing
      await snap.ref.update({ status: 'processing' });

      // Step 1: Generate scripts
      const scripts = await generateScripts(adData);

      // Step 2: Generate variations
      const variations = await Promise.all(
        scripts.map(async (script, index) => {
          const variation = await generateVariation(script, adData, index);
          return variation;
        })
      );

      // Step 3: Update Firestore with results
      await snap.ref.update({
        status: 'completed',
        variations,
        completedAt: new Date(),
      });
    } catch (error) {
      console.error('Error generating ad:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message,
      });
    }
  });

async function generateScripts(adData: any): Promise<any[]> {
  const prompt = `Generate ${adData.numberOfVariations} video ad scripts for:
    Product: ${adData.productName}
    Description: ${adData.productDescription}
    Keywords: ${adData.keywords?.join(', ')}
    Brand Tone: ${adData.brandTone}
    Duration: ${adData.videoLength} seconds

    Return as JSON with scenes, voiceover, and visual descriptions.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0].message.content!).variations;
}

async function generateVariation(
  script: any,
  adData: any,
  index: number
): Promise<any> {
  const variation: any = {
    id: index + 1,
    status: 'processing',
    script,
  };

  try {
    // Generate scenes with Sora or fallback to DALL-E
    const scenes = await generateScenes(script, adData);

    // Generate voiceover
    const voiceover = await generateVoiceover(script);

    // Assemble video
    const videoUrl = await assembleVideo(scenes, voiceover, adData);

    // Generate thumbnail
    const thumbnailUrl = await generateThumbnail(videoUrl);

    variation.status = 'completed';
    variation.videoUrl = videoUrl;
    variation.thumbnailUrl = thumbnailUrl;
    variation.generatedAt = new Date();
  } catch (error) {
    variation.status = 'failed';
    variation.error = error.message;
  }

  return variation;
}
```

### Sora Integration with Fallback

```typescript
// functions/src/services/video.service.ts
async function generateSceneWithSora(
  scene: Scene,
  settings: GenerationSettings
): Promise<string> {
  const model = settings.soraModel;

  try {
    // Attempt Sora generation
    const video = await openai.videos.create({
      model: model,
      prompt: scene.sora_prompt,
      duration: scene.duration,
      size: getResolution(settings),
    });

    // Poll for completion
    const completedVideo = await pollForCompletion(video.id);
    return completedVideo.url;
  } catch (error) {
    console.error('Sora generation failed, using fallback:', error);
    return await generateSceneWithDALLE(scene, settings);
  }
}

async function generateSceneWithDALLE(
  scene: Scene,
  settings: GenerationSettings
): Promise<string> {
  // Generate static image
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: convertToImagePrompt(scene.sora_prompt),
    size: '1024x1024',
    quality: 'hd',
  });

  // Create video with Ken Burns effect
  const videoPath = await createVideoFromImage(
    image.data[0].url!,
    scene.duration,
    settings
  );

  return videoPath;
}
```

---

## Error Handling

### Global Error Boundary

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
```

### API Error Handler

```typescript
// lib/utils/errorHandler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): Response {
  if (error instanceof APIError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled error:', error);
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// __tests__/services/openai.test.ts
import { generateScripts } from '@/services/openai';
import { describe, it, expect, jest } from '@jest/globals';

describe('OpenAI Service', () => {
  it('should generate multiple script variations', async () => {
    const mockData = {
      productName: 'EcoBottle',
      productDescription: 'Sustainable water bottle',
      numberOfVariations: 3,
    };

    const scripts = await generateScripts(mockData);

    expect(scripts).toHaveLength(3);
    expect(scripts[0]).toHaveProperty('scenes');
    expect(scripts[0]).toHaveProperty('voiceover');
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/adGeneration.test.ts
import { createAd } from '@/lib/firebase/ads';
import { waitFor } from '@testing-library/react';

describe('Ad Generation Integration', () => {
  it('should complete full ad generation pipeline', async () => {
    const adData = {
      productName: 'Test Product',
      productDescription: 'Test description',
      // ... other fields
    };

    const adRef = await createAd(adData);

    // Wait for processing to complete
    await waitFor(
      async () => {
        const ad = await getAd(adRef.id);
        expect(ad.status).toBe('completed');
      },
      { timeout: 180000 } // 3 minutes
    );
  });
});
```

---

## Deployment Guide

### Environment Configuration

```bash
# Production environment variables
firebase functions:config:set \
  openai.key="sk-..." \
  aws.access_key="AKIA..." \
  aws.secret_key="..." \
  aws.region="us-east-1" \
  aws.bucket="ad-generator-videos"
```

### Build and Deploy

```bash
# Build Next.js application
npm run build

# Deploy Firebase Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Full deployment
firebase deploy
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

---

## Performance Optimization

### Next.js Optimization

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['storage.googleapis.com', 's3.amazonaws.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### Database Indexing

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "ads",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Monitoring

### Error Logging

```typescript
// lib/monitoring/logger.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

export function logError(error: Error, context?: any) {
  console.error(error, context);

  if (typeof window !== 'undefined') {
    const analytics = getAnalytics();
    logEvent(analytics, 'error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }
}
```

---

This implementation guide provides the essential code patterns and configurations needed to build the AI-Powered Dynamic Video Ad Generator. Follow the sections in order for a smooth implementation process.