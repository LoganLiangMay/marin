# Investigation Index: "Generate New Campaign" Reuses Old Resources

## Overview

This investigation analyzed why the "Generate New Campaign" functionality reuses old resources instead of creating fresh campaigns. A complete root-cause analysis with detailed code references has been documented.

## Investigation Documents

### 1. **QUICK_SUMMARY.md** ⭐ START HERE
   - **Purpose:** Executive summary of the problem
   - **Best for:** Quick understanding of the issue
   - **Content:**
     - 5 critical issues identified
     - Current vs expected behavior
     - localStorage structure
     - Priority order for fixes
   - **Read time:** 5 minutes

### 2. **INVESTIGATION_REPORT.md** 📋 COMPREHENSIVE ANALYSIS
   - **Purpose:** Complete technical investigation
   - **Best for:** Deep understanding of root causes
   - **Content:**
     - Flow analysis from form to results
     - State management issues
     - Campaign button analysis
     - Data loss scenarios
     - Specific code issues with line numbers
     - Current storage structure
     - Recommended fixes with priority
   - **Read time:** 20 minutes

### 3. **CODE_REFERENCES.md** 🔍 EXACT CODE LOCATIONS
   - **Purpose:** Detailed code analysis with exact line numbers
   - **Best for:** Implementing fixes
   - **Content:**
     - Issue #1-7 with current and fixed code
     - What happens vs what should happen
     - Summary table of all issues
     - Files that are NOT problematic
   - **Read time:** 15 minutes

### 4. **FLOW_DIAGRAM.txt** 📊 VISUAL DATA FLOW
   - **Purpose:** Step-by-step visual walkthrough
   - **Best for:** Understanding the sequence of events
   - **Content:**
     - Campaign #1 creation flow
     - User clicks "Generate New Campaign"
     - Campaign #2 creation flow (showing data loss)
     - Timeline of localStorage state changes
     - What gets lost vs what gets reused
     - Cascading failure chain
   - **Read time:** 10 minutes

## Problem Summary

### The Core Issue
The application uses a **single localStorage key** (`'lastGenerationData'`) to store campaign data. When a user creates a new campaign, it **overwrites** the previous campaign's data with no way to retrieve it.

### Key Statistics
- **Files affected:** 2
- **Critical issues:** 2 (Lines 75 in page.tsx, Line 36 in results/page.tsx)
- **High severity issues:** 5 (Hardcoded Nike references)
- **Data loss scenarios:** Multiple (especially when creating 2nd campaign)
- **Lines of problematic code:** ~10 total across 2 files

## Quick Fix Checklist

### Critical (Must Fix First)
- [ ] **Issue #1**: Replace single key with UUID-based campaign IDs
  - File: `app/generate/page.tsx` line 75
  - Change: `localStorage.setItem('lastGenerationData', ...)` 
  - To: `localStorage.setItem('campaign_' + uuid, ...)`
  
- [ ] **Issue #2**: Update results page to retrieve specific campaign
  - File: `app/generate/results/page.tsx` line 36
  - Change: `localStorage.getItem('lastGenerationData')`
  - To: Use URL query parameter `campaignId`

### High (Should Fix Second)
- [ ] **Issue #3-7**: Remove hardcoded Nike references
  - File: `app/generate/results/page.tsx` lines 47-63, 294, 402-407
  - Change: All hardcoded "Nike" strings to dynamic product name
  - Use form data: `productName`, `brandTone`, `description`

### Medium (Nice to Have)
- [ ] **Issue #4**: Handle form draft loading properly
  - File: `app/generate/page.tsx` lines 40-51
  - Consider campaign-specific draft keys

## Impact Analysis

### Current Impact (Without Fixes)
- Users can only have 1 "active" campaign at a time
- Previous campaign data is lost when creating new campaigns
- Results page always shows hardcoded Nike branding
- Can't retrieve historical campaigns
- Page refresh loses data
- No campaign history/tracking

### After Fixes (Expected Benefits)
- Users can create multiple campaigns sequentially
- Previous campaigns preserved in localStorage
- Campaign history accessible
- Dynamic UI shows correct product names
- Results are campaign-specific and reproducible
- Foundation for campaign management features

## Test Scenarios

To verify the issue before and after fixes:

### Verification Steps
1. Create Campaign #1 (Nike Shoes) and generate videos
2. Click "Generate New Campaign"
3. Create Campaign #2 (Apple Watch) and generate videos
4. Check browser DevTools → Application → localStorage
5. Try to access Campaign #1 (should fail currently)
6. After fixes, both campaigns should be accessible

### Expected Behavior (After Fixes)
- `localStorage['campaigns']['uuid-1234']` = Nike campaign
- `localStorage['campaigns']['uuid-5678']` = Apple Watch campaign
- Both accessible via results page with correct campaign ID
- Each shows correct product branding

## File Locations

All affected files are in the Next.js app directory:

```
/app/generate/
├── page.tsx              ← Issues #1, #2, #4
└── results/page.tsx      ← Issues #3, #4, #5, #6, #7
```

Supporting files (no issues, but important to know):
- `/lib/services/replicateVideoService.ts` ✓ Fine
- `/lib/contexts/AuthContext.tsx` ✓ Fine
- `/components/AdGenerationForm.tsx` ✓ Fine
- `/lib/schemas/adGenerationSchema.ts` ✓ Fine

## Related Services

### ReplicateVideoService
- **Status:** ✓ Working correctly
- **Issue:** No campaign ID association
- **Fix needed:** Add campaign ID to video metadata

### AuthContext
- **Status:** ✓ Working correctly
- **Issue:** None
- **Note:** Good reference for context implementation

## Architecture Recommendations

### Current Architecture (Problematic)
```
User Input Form
    ↓
Single localStorage key (lastGenerationData)
    ↓
Results Page (displays whatever is in localStorage)
```

### Recommended Architecture
```
User Input Form
    ↓
Generate UUID for campaign
    ↓
Store at: localStorage['campaigns'][uuid]
    ↓
Redirect to: /generate/results/?campaignId=uuid
    ↓
Results Page (retrieves specific campaign by ID)
    ↓
Optional: Sync to Firestore for persistence
```

## Implementation Priority

### Phase 1: Core Fix (MVP)
1. Add UUID generation to form submission
2. Use campaign IDs in localStorage keys
3. Update results page to use URL parameters
4. Remove hardcoded Nike references from UI

### Phase 2: Enhancement
1. Create CampaignContext for state management
2. Add campaign history to dashboard
3. Implement campaign selection/switching
4. Add campaign deletion/archiving

### Phase 3: Persistence
1. Move campaigns to Firestore
2. Add user association
3. Enable campaign sharing
4. Create campaign management UI

## Questions Answered

### Q: Why do campaigns overwrite each other?
A: Single localStorage key (`'lastGenerationData'`) is used for all campaigns. Each new campaign overwrites the previous one.

### Q: Why does the form show blank?
A: Form uses react-hook-form default values. Draft is cleared on submit (line 78), so form appears fresh. But localStorage data is preserved.

### Q: Why is everything Nike-branded?
A: Results page has hardcoded Nike defaults and hardcoded text throughout (lines 50, 51-52, 294, 402-407).

### Q: Can I retrieve an old campaign?
A: Currently, no. Once a new campaign is created, the old one is overwritten and lost.

### Q: Is this a database issue?
A: No, the database/Firestore is fine. This is a client-side state management issue in localStorage.

## References

- `QUICK_SUMMARY.md` - High-level overview
- `INVESTIGATION_REPORT.md` - Full technical analysis
- `CODE_REFERENCES.md` - Exact code locations and fixes
- `FLOW_DIAGRAM.txt` - Visual data flow walkthrough

## Next Steps

1. Read **QUICK_SUMMARY.md** for overview
2. Review **CODE_REFERENCES.md** to understand exact issues
3. Create tasks for Critical fixes (Issues #1 and #2)
4. Implement fixes following the provided code examples
5. Test with verification steps provided
6. Plan Phase 2 enhancements after core fix

---

**Investigation completed:** November 6, 2024
**Status:** Root causes identified, solutions documented, ready for implementation
