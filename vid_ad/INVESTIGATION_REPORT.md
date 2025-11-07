# Investigation Report: "Generate New Campaign" Reuses Old Resources

## Executive Summary

The "Generate New Campaign" functionality is reusing old resources instead of creating fresh campaigns because:

1. **No campaign session/ID management** - Each campaign is not assigned a unique identifier
2. **Single localStorage key per data type** - All campaigns store data using the same localStorage key (`lastGenerationData`)
3. **No state isolation** - There is no mechanism to clear or isolate state between consecutive campaigns
4. **Frontend-only data persistence** - No backend database to track separate campaigns
5. **Hard-coded Nike example** - The results page always generates a hardcoded Nike running campaign example regardless of input

---

## Detailed Findings

### 1. Flow Analysis: From Form to Results Page

#### `/app/generate/page.tsx` (Campaign Form)
- **Lines 40-51**: Loads draft from `localStorage.adGenerationDraft` on mount
- **Lines 54-59**: Saves draft to localStorage as user types (watchable form changes)
- **Lines 68-93**: `onSubmit()` handler
  - **Line 75**: Saves form data to `localStorage.setItem('lastGenerationData', JSON.stringify(data))`
  - **Line 78**: Clears draft with `localStorage.removeItem('adGenerationDraft')`
  - **Line 87**: Redirects with `window.location.href = '/generate/results/'`

**PROBLEM #1**: Uses a single static key `'lastGenerationData'` for ALL campaigns

#### `/app/generate/results/page.tsx` (Results Display)
- **Lines 34-42**: Retrieves data on mount
  ```javascript
  const generationData = localStorage.getItem('lastGenerationData');
  if (generationData) {
    parsedData = JSON.parse(generationData);
  }
  ```
- **Lines 47-63**: Generates hardcoded Nike prompts based on form data
  - Always uses Nike-specific prompts
  - Ignores actual product name in some places
  - **Lines 54-60**: Example hardcoded prompts with Nike branding
- **Lines 412-416**: "Generate New Campaign" button
  ```javascript
  <button onClick={() => router.push('/generate')} className="...">
    Generate New Campaign
  </button>
  ```

**PROBLEM #2**: When user clicks button, routes back to `/generate` form
- The `lastGenerationData` is STILL in localStorage
- User sees same form with previous data OR old campaign data loads

**PROBLEM #3**: No cache clearing mechanism
- `localStorage` is never cleared for old campaigns
- Each new campaign overwrites the same key
- Previous campaign videos/data is lost but no cleanup

---

### 2. State Management Issues

#### Missing Campaign Context/State
Currently, the app has:
- ✅ `AuthContext` for user authentication
- ✅ `ReplicateVideoService` singleton for API calls
- ❌ **NO CampaignContext** to track active campaign
- ❌ **NO session IDs** to distinguish campaigns
- ❌ **NO campaign history** to track previous generations

#### localStorage Dependencies
```javascript
// app/generate/page.tsx - Line 42
localStorage.getItem('adGenerationDraft')

// app/generate/page.tsx - Line 56
localStorage.setItem('adGenerationDraft', JSON.stringify(formData))

// app/generate/page.tsx - Line 75
localStorage.setItem('lastGenerationData', JSON.stringify(data))

// app/generate/results/page.tsx - Line 36
localStorage.getItem('lastGenerationData')
```

**Issues with this approach:**
1. Single key means only 1 "active" campaign at a time
2. No way to store campaign history
3. No persistence across browser sessions without `localStorage`
4. No way to identify which campaign generated which videos
5. Refreshing results page retrieves old `lastGenerationData`

---

### 3. The "Generate New Campaign" Button Issue

#### Button Code Location
File: `/app/generate/results/page.tsx`, Lines 411-416

```javascript
<button
  onClick={() => router.push('/generate')}
  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
>
  Generate New Campaign
</button>
```

#### What Happens When Clicked:
1. Route changes to `/generate`
2. `/app/generate/page.tsx` mounts
3. **Lines 40-51** check if `localStorage.getItem('adGenerationDraft')` exists
4. If previous campaign had draft saved, **that draft is loaded back into the form**
5. User sees the SAME form values as the previous campaign
6. When form submitted, **overwrites** the `lastGenerationData` key

#### Expected vs Actual Behavior:
| Step | Expected | Actual |
|------|----------|--------|
| Click "Generate New" | Show blank form | Form loaded with previous draft |
| Enter new product info | Create new campaign | Previous data still in localStorage |
| Submit form | New campaign with new ID | Overwrites previous entry (single key) |
| View results | Show new videos | May show old data if timing issue |

---

### 4. Hardcoded Nike Campaign Problem

#### Code Location
File: `/app/generate/results/page.tsx`, Lines 47-63

```javascript
const generateVideoPrompts = () => {
  const brandTone = parsedData.brandTone || 'energetic';
  const productName = parsedData.productName || 'Nike';
  const description = parsedData.productDescription ||
    'A cinematic night-time Nike campaign photo of a female runner leading a run club through the city streets';

  const prompts = [
    `${brandTone} cinematic shot: Female athlete in ${productName} gear, ...`,
    `Dynamic ${brandTone} sequence: ...`,
    `Inspiring ${brandTone} finale: ...`
  ];
  return prompts.slice(0, variations);
};
```

**Problems:**
1. **Default to Nike** - If `productName` not in `parsedData`, defaults to 'Nike'
2. **Hardcoded description** - Default description is Nike-specific
3. **Results page title** - Line 294: "Generated Nike Campaign Videos" is hardcoded
4. **Brand summary** - Lines 402-407 hardcoded Nike messaging

---

### 5. Campaign Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User visits /generate                                       │
│ (App/generate/page.tsx mounts)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► useEffect checks localStorage
                     │   └─► loadDraft from 'adGenerationDraft'
                     │       └─► PROBLEM: Old draft loads!
                     │
┌─────────────────────┴────────────────────────────────────────┐
│ User fills form (Campaign #2)                               │
│ watch() saves to localStorage on every keystroke            │
│ └─► localStorage['adGenerationDraft'] = new campaign data   │
│ └─► localStorage['lastGenerationData'] still = Campaign #1  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     └─► User submits form
                         ├─► localStorage['lastGenerationData'] = Campaign #2 (overwrites!)
                         ├─► localStorage['adGenerationDraft'] = cleared
                         └─► Redirect to /generate/results
                             │
                             ├─► useEffect retrieves lastGenerationData
                             ├─► May get stale data if timing issues
                             └─► Generates videos with Campaign #2 params
                                 └─► PROBLEM: No unique campaign ID!
                                     └─► No way to retrieve Campaign #1
                                         └─► No campaign history
```

---

### 6. ReplicateVideoService Issues

File: `/lib/services/replicateVideoService.ts`

#### The Service Itself Is Fine
- ✅ Uses Replicate API correctly
- ✅ Has unique `predictionId` per video
- ✅ Tracks video generation status

#### But Context Is Missing
- ❌ Videos are stored in React state (`setVideos()`)
- ❌ State is lost on page refresh
- ❌ No association with a campaign ID
- ❌ Can't track "which videos belong to which campaign"

#### Line 32: Singleton Pattern
```javascript
const replicateService = ReplicateVideoService.getInstance();
```

This is fine for API access, but it doesn't help with campaign isolation.

---

### 7. Current Storage Structure

#### localStorage Keys Currently Used:
| Key | Stored In | Purpose | Problem |
|-----|-----------|---------|---------|
| `adGenerationDraft` | page.tsx:56 | Save form between sessions | Overwrites per campaign |
| `lastGenerationData` | page.tsx:75 | Pass data to results page | Only 1 campaign data |
| `sessionStartTime` | AuthContext:149 | Auth expiry tracking | Not campaign-related |

#### What's Missing:
```javascript
// Needed for proper multi-campaign support:
{
  "campaigns": {
    "campaign_uuid_1": {
      "id": "uuid",
      "createdAt": timestamp,
      "productName": "Nike Shoes",
      "productDescription": "...",
      "videos": [
        { "id": "pred_abc123", "url": "..." }
      ]
    },
    "campaign_uuid_2": {
      "id": "uuid",
      "createdAt": timestamp,
      "productName": "Apple Watch",
      // ...
    }
  }
}
```

---

## Root Causes Summary

| Issue | Root Cause | Location | Impact |
|-------|-----------|----------|--------|
| **Single Key Storage** | Uses `'lastGenerationData'` for all campaigns | `page.tsx:75`, `results/page.tsx:36` | Only 1 active campaign |
| **No Session IDs** | No UUID/ID for campaigns | Entire architecture | Can't identify campaigns |
| **Draft Auto-Load** | Form loads previous draft on mount | `page.tsx:40-51` | Old data bleeds into new form |
| **Hardcoded Nike** | Prompt generation defaults to Nike | `results/page.tsx:47-63` | All campaigns look like Nike |
| **No History** | State is ephemeral | All pages | Can't access previous campaigns |
| **Page Title Hardcoded** | Always says "Nike Campaign" | `results/page.tsx:294` | Misleading for other brands |
| **No Cache Clear** | localStorage never cleared | `page.tsx:78` only removes draft | Old data accumulates |

---

## Data Flow When User Clicks "Generate New Campaign"

### Current Broken Flow:
1. User is on `/generate/results` (Campaign #1)
2. Clicks "Generate New Campaign" button
3. Navigates to `/generate`
4. **Page.tsx mounts, useEffect triggers**
5. **Checks `localStorage.getItem('adGenerationDraft')`**
6. **If Campaign #1 had a draft, it LOADS BACK INTO FORM**
7. User sees previous form values (PROBLEM!)
8. User edits form for Campaign #2
9. Draft saves to localStorage continuously
10. User clicks "Generate Video"
11. **`lastGenerationData` is OVERWRITTEN with Campaign #2**
12. **Campaign #1 data is LOST**
13. Navigate to results page with Campaign #2 data
14. Shows Campaign #2 results (but no record of Campaign #1)

### What Should Happen:
1. Click "Generate New Campaign"
2. Navigate to `/generate`
3. **Form clears completely (fresh state)**
4. User fills in Campaign #2 data
5. **Campaign #2 saved with UNIQUE ID (e.g., uuid)**
6. **Campaign #1 preserved in campaign history**
7. Navigate to results
8. Show Campaign #2 results with unique ID
9. User can still access Campaign #1 from history/dashboard

---

## Specific Code Issues to Fix

### Issue 1: Clear Form Data on New Campaign
**File:** `/app/generate/page.tsx`

**Current Code (Line 40-51):**
```javascript
useEffect(() => {
  const savedDraft = localStorage.getItem('adGenerationDraft');
  if (savedDraft) {
    try {
      const parsedDraft = JSON.parse(savedDraft);
      form.reset(parsedDraft);  // ❌ LOADS OLD DRAFT!
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }
}, [form]);
```

**Problem:** When starting new campaign, loads previous draft

### Issue 2: No Campaign ID Management
**File:** `/app/generate/page.tsx`

**Current Code (Line 75):**
```javascript
localStorage.setItem('lastGenerationData', JSON.stringify(data));
```

**Problem:** Uses single key, no unique ID for this campaign

### Issue 3: Hardcoded Nike Prompts
**File:** `/app/generate/results/page.tsx`

**Current Code (Line 51-52):**
```javascript
const description = parsedData.productDescription ||
  'A cinematic night-time Nike campaign photo of a female runner...';
```

**Problem:** Default description is brand-specific to Nike

### Issue 4: Results Page Title Hardcoded
**File:** `/app/generate/results/page.tsx`

**Current Code (Line 294):**
```javascript
<h2 className="text-2xl font-bold text-gray-900 mb-4">
  Generated Nike Campaign Videos ({videos.length})
</h2>
```

**Problem:** Always says "Nike" regardless of actual product

### Issue 5: Summary Text Hardcoded
**File:** `/app/generate/results/page.tsx`

**Current Code (Lines 402-407):**
```javascript
<h4 className="font-semibold text-blue-900 mb-2">🎯 Nike Campaign Ready</h4>
<p className="text-sm text-blue-700">
  Your energetic Nike running campaign videos have been generated...
</p>
```

**Problem:** Always references Nike specifically

---

## Summary of Why Old Resources Are Reused

1. **No unique campaign identifier** - All campaigns share same `lastGenerationData` key
2. **Form auto-loads previous draft** - When navigating to new campaign, old draft loads
3. **Single localStorage entry per data type** - No campaign history, only current campaign
4. **Hardcoded example defaults to Nike** - Results always show Nike branding unless form is submitted
5. **No backend persistence** - All data is ephemeral localStorage, no permanent record
6. **Page refresh loses data** - If user refreshes `/generate/results`, it tries to load `lastGenerationData`
7. **No session/campaign context** - Videos generated have `predictionId` but no campaign association

---

## Recommended Fixes (Priority Order)

### HIGH PRIORITY
1. **Generate unique campaign ID** on form submission (UUID v4)
2. **Store campaigns in structured way** with unique keys
3. **Clear draft on new campaign** or use campaign-specific draft key
4. **Use dynamic values** in results page (not hardcoded Nike)

### MEDIUM PRIORITY
5. **Create CampaignContext** for state management
6. **Track campaign history** in localStorage or backend
7. **Associate videos with campaign ID** in database
8. **Add campaign selector** to dashboard

### LOW PRIORITY
9. Add cloud persistence (Firebase/database)
10. Create campaign management UI
11. Add campaign sharing/collaboration features

