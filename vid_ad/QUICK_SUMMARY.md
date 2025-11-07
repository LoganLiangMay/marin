# Quick Summary: "Generate New Campaign" Reuses Old Resources

## The Problem in One Picture

```
Campaign #1: "Nike Shoes"
  └─► localStorage['lastGenerationData'] = Nike campaign

User clicks "Generate New Campaign" → Form clears ✓

User creates Campaign #2: "Apple Watch"
  └─► localStorage['lastGenerationData'] = Apple Watch (OVERWRITES Nike!) ✗
  └─► Nike campaign data is LOST ✗
  └─► No way to retrieve Nike campaign anymore ✗
```

## 5 Critical Issues

### 1. Single Storage Key (PRIMARY ISSUE)
- **Location:** `app/generate/page.tsx:75`, `app/generate/results/page.tsx:36`
- **Problem:** All campaigns use same `localStorage['lastGenerationData']` key
- **Impact:** Each new campaign overwrites the previous one - data loss!
- **Fix:** Use unique ID (UUID) for each campaign, store as `campaigns[uuid]`

### 2. No Campaign Session/ID
- **Location:** Entire architecture
- **Problem:** No unique identifier for campaigns - can't distinguish Campaign #1 from Campaign #2
- **Impact:** Can't track history, can't retrieve old campaigns
- **Fix:** Generate UUID when campaign starts, pass through entire flow

### 3. Hardcoded Nike Everything
- **Location:** `app/generate/results/page.tsx:47-63, 294, 402-407`
- **Problem:** Results page hardcodes Nike branding, defaults, and prompts
- **Impact:** Even if data preserved, UI shows "Nike Campaign" for all products
- **Fix:** Use actual product data from form (productName, brandTone, etc.)

### 4. Form Auto-Loads Old Draft (Minor)
- **Location:** `app/generate/page.tsx:40-51`
- **Problem:** When navigating back to `/generate`, previous draft sometimes loads
- **Impact:** User might see stale form values
- **Fix:** Clear localStorage on new campaign OR use campaign-specific draft keys

### 5. No Backend Persistence
- **Location:** All state in ephemeral localStorage
- **Problem:** No persistent record of campaigns in database
- **Impact:** Refreshing page loses data, no campaign history
- **Fix:** Store campaigns in Firestore (or database) with user association

## Data Flow: What Happens

### Correct Scenario
```
User fills form (Campaign #1)
  ✓ All data captured correctly
  ✓ Passed to results page
  ✓ Videos generated correctly
```

### Broken Scenario (when user creates Campaign #2)
```
User fills form (Campaign #2)
  ✓ All data captured correctly
  ✓ localStorage['lastGenerationData'] = Campaign #2 (overwrites Campaign #1!) ✗
  ✓ Campaign #1 data is LOST ✗
  ✓ Passed to results page
  ✓ Videos generated correctly
  BUT Campaign #1 is now inaccessible ✗
```

## What's Currently Stored

```javascript
localStorage {
  'adGenerationDraft': undefined,              // Cleared after submit
  'lastGenerationData': {                      // ✗ SINGLE KEY FOR ALL CAMPAIGNS
    productName: 'Apple Watch',
    productDescription: '...',
    keywords: [...],
    brandTone: 'energetic',
    variations: 3,
    duration: 7,
    resolution: '1080p',
    videoModel: 'seedance-1-lite',
    // ... all form fields
  },
  'sessionStartTime': '2024-11-06T...'
}
```

## What Should Be Stored

```javascript
localStorage {
  'campaigns': {
    'uuid-1234': {
      id: 'uuid-1234',
      createdAt: 1699270800000,
      productName: 'Nike Shoes',
      productDescription: '...',
      keywords: [...],
      // ... all form fields
      videos: [
        { id: 'pred_abc123', url: '...', status: 'completed' },
        { id: 'pred_abc124', url: '...', status: 'completed' },
        { id: 'pred_abc125', url: '...', status: 'completed' }
      ]
    },
    'uuid-5678': {
      id: 'uuid-5678',
      createdAt: 1699274400000,
      productName: 'Apple Watch',
      productDescription: '...',
      keywords: [...],
      // ... all form fields
      videos: [
        { id: 'pred_def456', url: '...', status: 'completed' },
        { id: 'pred_def457', url: '...', status: 'completed' },
        { id: 'pred_def458', url: '...', status: 'completed' }
      ]
    }
  },
  'activeCampaignId': 'uuid-5678'  // Track which campaign is current
}
```

## Files With Issues

| File | Lines | Issue | Severity |
|------|-------|-------|----------|
| `app/generate/page.tsx` | 40-51 | Form loads old draft on mount | MEDIUM |
| `app/generate/page.tsx` | 75 | Uses single key for all campaigns | **CRITICAL** |
| `app/generate/page.tsx` | 78 | Only clears draft, not main data | MEDIUM |
| `app/generate/results/page.tsx` | 36 | Retrieves single key | **CRITICAL** |
| `app/generate/results/page.tsx` | 47-63 | Hardcoded Nike prompts | HIGH |
| `app/generate/results/page.tsx` | 294 | Hardcoded "Nike Campaign Videos" | HIGH |
| `app/generate/results/page.tsx` | 402-407 | Hardcoded "Nike Campaign Ready" | HIGH |

## Detailed Documentation

For complete analysis including:
- Step-by-step flow diagrams
- Timeline of data loss
- Code snippets showing exact issues
- ReplicateVideoService analysis
- Recommended fixes with priority levels

See:
- `INVESTIGATION_REPORT.md` - Comprehensive technical analysis
- `FLOW_DIAGRAM.txt` - Visual data flow with timestamps

## Quick Fixes (Priority Order)

### 🔴 CRITICAL (Do First)
1. **Generate campaign UUID on form submit** - Makes each campaign unique
2. **Store campaigns with unique keys** - Prevent data overwriting
3. **Update results page to use dynamic values** - Show actual product names

### 🟠 HIGH (Do Second)
4. Clear hardcoded Nike references from prompts
5. Create CampaignContext for state management
6. Add campaign ID to results page URL as query parameter

### 🟡 MEDIUM (Do Later)
7. Add campaign history to dashboard
8. Create campaign selection UI
9. Implement cloud persistence (Firestore)
10. Add campaign archiving/deletion

## Testing the Issue

To verify the problem:

1. Create Campaign #1 with product "Nike Shoes"
   - Fill form, generate videos
   - Verify videos show Nike Shoes

2. Click "Generate New Campaign"
   - Form appears blank ✓ Good!

3. Create Campaign #2 with product "Apple Watch"
   - Fill form, generate videos
   - Verify videos show Apple Watch ✓

4. Click browser back button
   - Try to access Campaign #1 results
   - ✗ You get Campaign #2 instead (or blank)
   - ✗ Campaign #1 data is gone

5. Open browser DevTools → Application → localStorage
   - Check `lastGenerationData`
   - ✗ Only Apple Watch campaign exists
   - ✗ Nike campaign completely gone

This confirms the issue!

## Root Cause

The entire campaign generation system treats "current campaign" as a single global state in localStorage, using a single key that gets overwritten with each new campaign. There's no unique identification, no multi-campaign support, and no history tracking.

It's like having a single whiteboard - when you erase it for the new campaign, the old one is lost forever.

---

**Need more details?** See INVESTIGATION_REPORT.md and FLOW_DIAGRAM.txt
