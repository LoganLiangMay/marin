# Code References: Exact Lines and Issues

## Critical File: `/app/generate/page.tsx`

### Issue #1: Single localStorage Key for All Campaigns (Line 75)

**Location:** Lines 68-93 (onSubmit handler)

```typescript
// CURRENT CODE - PROBLEMATIC
const onSubmit = async (data: AdGenerationFormData) => {
  console.log('🎬 onSubmit called with data:', data);
  setIsSubmitting(true);

  try {
    console.log('💾 Saving generation data to localStorage...');
    // ❌ PROBLEM: Uses single key for ALL campaigns
    localStorage.setItem('lastGenerationData', JSON.stringify(data));

    // Clear draft after successful submission
    localStorage.removeItem('adGenerationDraft');

    console.log('✅ Data saved, redirecting to results page...');

    // Small delay to ensure state updates and show loading state
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to generation results page
    console.log('🔄 Navigating to /generate/results/');
    window.location.href = '/generate/results/';
  } catch (error) {
    console.error('❌ Generation error:', error);
    alert('Error preparing video generation. Please try again.');
    setIsSubmitting(false);
  }
};
```

**What happens:**
- Every campaign uses key: `'lastGenerationData'`
- When Campaign #2 is created, it OVERWRITES Campaign #1 data
- Campaign #1 is irretrievably lost

**What should happen:**
```typescript
// FIXED CODE - What it should be
const onSubmit = async (data: AdGenerationFormData) => {
  try {
    // Generate unique ID for this campaign
    const campaignId = crypto.randomUUID(); // or use uuid package
    
    // Store with unique key
    const campaignKey = `campaign_${campaignId}`;
    localStorage.setItem(campaignKey, JSON.stringify({
      id: campaignId,
      createdAt: Date.now(),
      ...data
    }));
    
    // Track active campaign
    localStorage.setItem('activeCampaignId', campaignId);
    
    // Redirect with campaign ID in URL
    window.location.href = `/generate/results/?campaignId=${campaignId}`;
  } catch (error) {
    // ...
  }
};
```

---

### Issue #2: Form Auto-Loads Old Draft (Lines 40-51)

**Location:** Lines 40-51 (useEffect)

```typescript
// CURRENT CODE - LOADS OLD DRAFT
useEffect(() => {
  const savedDraft = localStorage.getItem('adGenerationDraft');
  if (savedDraft) {
    try {
      const parsedDraft = JSON.parse(savedDraft);
      // ❌ PROBLEM: Loads previous draft into form
      form.reset(parsedDraft);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }
}, [form]);
```

**When does this cause problems:**
1. User creates Campaign #1
2. Form auto-saves to `adGenerationDraft` while typing
3. User submits and generates videos
4. Draft is cleared: `localStorage.removeItem('adGenerationDraft')` (Line 78)
5. User clicks "Generate New Campaign" → navigates to `/generate`
6. If user had created a draft but NOT submitted it, the draft would reload here

**Edge case scenario:**
1. User starts Campaign #1 draft (doesn't submit)
2. Navigates away, comes back
3. Old draft reloads
4. User modifies it slightly and submits as Campaign #2
5. Still a single campaign data point, but with confusion about which is active

**What should happen:**
```typescript
// FIXED CODE - Clear draft on new campaign
useEffect(() => {
  // Check if we're on a new campaign (no campaign ID in URL)
  const searchParams = new URLSearchParams(window.location.search);
  const campaignId = searchParams.get('campaignId');
  
  if (!campaignId) {
    // This is a new campaign, start fresh
    localStorage.removeItem('adGenerationDraft');
    form.reset(); // Use form's default values
  } else {
    // Load existing campaign if navigating back
    const draftKey = `campaign_draft_${campaignId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      form.reset(JSON.parse(savedDraft));
    }
  }
}, [form]);
```

---

### Issue #3: Draft is Cleared But Campaign Data Isn't (Line 78)

**Location:** Line 78

```typescript
// CURRENT CODE
// Clear draft after successful submission
localStorage.removeItem('adGenerationDraft');
```

**The problem:**
- Clears draft (good)
- But `lastGenerationData` stays in localStorage (bad)
- When Campaign #2 is created, Campaign #1's `lastGenerationData` is still there
- Then it gets overwritten

**Related code:** Line 75
```typescript
localStorage.setItem('lastGenerationData', JSON.stringify(data)); // ← This stays!
localStorage.removeItem('adGenerationDraft'); // ← Only this is cleared
```

---

## Critical File: `/app/generate/results/page.tsx`

### Issue #4: Results Page Retrieves Single Key (Line 36)

**Location:** Lines 34-42 (useEffect)

```typescript
// CURRENT CODE - GETS SINGLE KEY
useEffect(() => {
  // ❌ PROBLEM: Always retrieves the LAST campaign created
  const generationData = localStorage.getItem('lastGenerationData');
  let parsedData: any = {};

  if (generationData) {
    parsedData = JSON.parse(generationData);
    console.log('🚀 Starting Replicate video generation with params:', parsedData);
  }

  const variations = parsedData.variations || 2;
  const duration = parsedData.duration || 6;
  // ... rest of initialization
}, []);
```

**What's wrong:**
- If user navigates from Campaign #1 results to create Campaign #2
- Then clicks browser back button
- Results page mounts again
- It retrieves `localStorage['lastGenerationData']` which is NOW Campaign #2 data
- Shows Campaign #2 results instead of Campaign #1
- User can't view their previous campaign results

**What should happen:**
```typescript
// FIXED CODE - RETRIEVES SPECIFIC CAMPAIGN
useEffect(() => {
  // Get campaign ID from URL
  const searchParams = new URLSearchParams(window.location.search);
  const campaignId = searchParams.get('campaignId');
  
  if (!campaignId) {
    // No campaign ID = error, redirect to form
    router.push('/generate');
    return;
  }
  
  // Retrieve SPECIFIC campaign
  const campaignKey = `campaign_${campaignId}`;
  const generationData = localStorage.getItem(campaignKey);
  
  if (!generationData) {
    // Campaign not found, redirect to form
    router.push('/generate');
    return;
  }
  
  let parsedData = JSON.parse(generationData);
  // ... rest of initialization
}, []);
```

---

### Issue #5: Hardcoded Nike Prompts (Lines 47-63)

**Location:** Lines 47-63

```typescript
// CURRENT CODE - HARDCODED NIKE DEFAULTS
const generateVideoPrompts = () => {
  const brandTone = parsedData.brandTone || 'energetic';
  const productName = parsedData.productName || 'Nike'; // ❌ DEFAULTS TO NIKE!
  const description = parsedData.productDescription ||
    'A cinematic night-time Nike campaign photo of a female runner leading a run club through the city streets'; // ❌ NIKE-SPECIFIC!

  const prompts = [
    `${brandTone} cinematic shot: Female athlete in ${productName} gear, leading runners through neon-lit city streets at night. ${description}. Motion blur, wet asphalt reflections, high-contrast lighting, sweat glistening, determination visible. Camera: tracking shot, 24fps cinematic`,

    `Dynamic ${brandTone} sequence: Close-up of ${productName} shoes hitting wet pavement, rhythm of the run, city lights streaking by. Urban energy, chromatic flares, editorial flash photography style. Camera: low angle, slow motion moments, 30fps`,

    `Inspiring ${brandTone} finale: Runner reaches destination, ${productName} logo visible, city skyline background. Sunrise breaking through buildings, triumphant moment, sweat and satisfaction. Camera: hero shot, lens flares, 24fps cinematic`
  ];

  return prompts.slice(0, variations);
};
```

**Problems:**
1. Default `productName` is 'Nike' (line 50)
2. Default `description` is Nike running campaign specific (line 51-52)
3. Prompts hardcode "runner", "running", "shoes", "athletic gear" themes
4. If form data is missing, falls back to Nike defaults
5. Even with correct data, the prompts have Nike-specific language

**Scenarios where hardcoded Nike appears:**
- When `parsedData` is undefined/null
- When `parsedData.productName` is empty
- When `parsedData.productDescription` is empty
- Always in the prompt text structure itself

**What should happen:**
```typescript
// FIXED CODE - NO HARDCODED NIKE
const generateVideoPrompts = () => {
  if (!parsedData.productName) {
    console.error('Missing product name');
    return [];
  }
  
  const brandTone = parsedData.brandTone || 'professional';
  const productName = parsedData.productName; // REQUIRED, no default
  const description = parsedData.productDescription; // REQUIRED, no default
  
  // Generic, product-agnostic prompts
  const prompts = [
    `${brandTone} opening scene: Product ${productName} displayed prominently. ${description}. Professional lighting, clean composition, polished finish. Camera: product-focused establishing shot, cinematic quality, 24fps`,

    `${brandTone} detail sequence: Close-up highlights of ${productName} features and benefits. ${description}. Dynamic camera movement, smooth transitions, emphasis on quality. Camera: medium shot with movement, 30fps`,

    `${brandTone} lifestyle moment: Customer interacting with ${productName}. Real-world usage scenario showing product value. ${description}. Authentic, engaging, professional presentation. Camera: wide shot to close-up, 24fps cinematic`
  ];

  return prompts.slice(0, variations);
};
```

---

### Issue #6: Hardcoded "Nike Campaign Videos" Title (Line 294)

**Location:** Line 294

```javascript
// CURRENT CODE - HARDCODED NIKE
<h2 className="text-2xl font-bold text-gray-900 mb-4">
  Generated Nike Campaign Videos ({videos.length})
</h2>
```

**Should be:**
```javascript
// FIXED CODE - DYNAMIC PRODUCT NAME
<h2 className="text-2xl font-bold text-gray-900 mb-4">
  Generated {generationData?.productName} Campaign Videos ({videos.length})
</h2>
```

---

### Issue #7: Hardcoded "Nike Campaign Ready" Summary (Lines 402-407)

**Location:** Lines 402-407

```javascript
// CURRENT CODE - HARDCODED NIKE BRANDING
<h4 className="font-semibold text-blue-900 mb-2">🎯 Nike Campaign Ready</h4>
<p className="text-sm text-blue-700">
  Your energetic Nike running campaign videos have been generated using Replicate's Seedance model.
  Each scene captures the cinematic night-run aesthetic with motion blur,
  neon reflections, and dynamic camera work as specified.
</p>
```

**Should be:**
```javascript
// FIXED CODE - DYNAMIC CONTENT
<h4 className="font-semibold text-blue-900 mb-2">
  🎯 {generationData?.productName} Campaign Ready
</h4>
<p className="text-sm text-blue-700">
  Your {generationData?.brandTone} {generationData?.productName} campaign videos have been generated using Replicate's Seedance model.
  Each scene was crafted according to your specifications with professional editing,
  high-quality output, and dynamic presentation as requested.
</p>
```

---

## Summary Table of Issues

| Line | File | Current Code | Problem | Fix |
|------|------|--------------|---------|-----|
| 75 | generate/page.tsx | `localStorage.setItem('lastGenerationData', ...)` | Single key overwrites | Use UUID: `localStorage.setItem('campaign_' + uuid, ...)` |
| 36 | generate/results/page.tsx | `localStorage.getItem('lastGenerationData')` | Retrieves last campaign | Use URL param: `const campaignId = searchParams.get('campaignId')` |
| 40-51 | generate/page.tsx | Auto-loads draft from localStorage | Draft persists between campaigns | Clear on new campaign or use campaign-specific keys |
| 50 | generate/results/page.tsx | `parsedData.productName \|\| 'Nike'` | Nike default | Remove default, require product name |
| 51-52 | generate/results/page.tsx | `\|\| 'A cinematic night-time Nike campaign...'` | Nike-specific description | Use generic default or require description |
| 294 | generate/results/page.tsx | `Generated Nike Campaign Videos` | Hardcoded Nike | Use: `Generated {productName} Campaign Videos` |
| 402 | generate/results/page.tsx | `Nike Campaign Ready` | Hardcoded Nike | Use: `{productName} Campaign Ready` |
| 403-407 | generate/results/page.tsx | `Your energetic Nike running campaign...` | Hardcoded Nike-specific text | Use form values: `Your {brandTone} {productName} campaign...` |

---

## Files Not Problematic

These files are actually fine:

- ✅ `/lib/services/replicateVideoService.ts` - Service is solid, handles API correctly
- ✅ `/lib/contexts/AuthContext.tsx` - Auth context is proper implementation
- ✅ `/components/AdGenerationForm.tsx` - Form component works correctly
- ✅ `/lib/schemas/adGenerationSchema.ts` - Schema validation is good
- ✅ All form step components - Properly capture user input

The issue is purely in the **data flow and state management** between the form and results pages, not in the individual components or services.

