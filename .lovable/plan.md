

# Fix Plan: Image Library Background Persistence and Tile Size Matching

## Overview

This plan addresses two issues on the Image Library page:
1. Background selection doesn't persist after page refresh
2. Tiles are smaller than Your Stories tiles and there's a gap before the first tile

---

## Problem 1: Background Persistence

### Root Cause

Looking at the code in Index.tsx:

```typescript
// Line 335-338 - Current (broken) implementation
const handleSelectImageLibraryBackground = (id: string | null) => {
  setSelectedImageLibraryBackgroundId(id);  // Only updates React state
};
```

The Image Library background handler only updates local React state. Compare this to the Your Stories (hub) handler:

```typescript
// Line 298-309 - Working implementation
const handleSelectBackground = async (id: string | null) => {
  await supabaseData.setSelectedBackground(user.id, id);  // Persists to database
  setSelectedHubBackgroundId(id);
  // ...
};
```

The hub version calls `supabaseData.setSelectedBackground()` to save to the database. The Image Library version does not.

### Solution

1. **Update the database schema** to support separate background selections for hub vs. image library (add an `image_library_background_id` column or a `context` field to track which page the selection belongs to)

2. **Create persistence functions** in supabase-data.ts:
   - `setImageLibraryBackground(userId, backgroundId)`
   - `getImageLibraryBackground(userId)`

3. **Update Index.tsx** to:
   - Load the Image Library background on mount
   - Persist selection when changed

### Implementation Details

**File: src/services/supabase-data.ts**

Add a new function to save/retrieve the image library background selection. We can use a separate column or a simple user_preferences approach.

**File: src/pages/Index.tsx**

Update the `handleSelectImageLibraryBackground` function to persist the selection:

```typescript
const handleSelectImageLibraryBackground = async (id: string | null) => {
  if (!user) return;
  try {
    await supabaseData.setImageLibraryBackground(user.id, id);
    setSelectedImageLibraryBackgroundId(id);
  } catch (e: any) {
    toast({ title: "Failed to set background", description: e.message, variant: "destructive" });
  }
};
```

Also update the `loadData` function to fetch the saved Image Library background.

---

## Problem 2: Tile Size Discrepancy

### Root Cause

Comparing the container styling between the two pages:

**ScenarioHub.tsx (Your Stories)**:
```tsx
<div className="w-full h-full p-10 flex flex-col overflow-y-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 w-full">
```

**ImageLibraryTab.tsx (Image Library)**:
```tsx
<div className="h-full overflow-y-auto p-10">
  <div className="max-w-6xl mx-auto space-y-8">  // <-- This constrains width!
    ...
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
```

The `max-w-6xl mx-auto` wrapper in ImageLibraryTab constrains the maximum width to 72rem (1152px), which:
1. Makes tiles smaller on wider screens
2. Centers the content, creating the visible gap on the left side

### Solution

Remove the `max-w-6xl mx-auto` constraint from the ImageLibraryTab grid wrapper to match ScenarioHub's full-width layout.

**File: src/components/chronicle/ImageLibraryTab.tsx**

Change line 409-410 from:
```tsx
<div className="h-full overflow-y-auto p-10">
  <div className="max-w-6xl mx-auto space-y-8">
```

To:
```tsx
<div className="w-full h-full p-10 flex flex-col overflow-y-auto">
  <div className="w-full">
```

This matches the ScenarioHub container structure exactly.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supabase-data.ts` | Add `setImageLibraryBackground()` and `getImageLibraryBackground()` functions |
| `src/pages/Index.tsx` | Update background handlers to persist Image Library selection; load on mount |
| `src/components/chronicle/ImageLibraryTab.tsx` | Remove `max-w-6xl mx-auto` constraint to match Your Stories layout |

---

## Database Consideration

Since we're already storing `isSelected` on background records, we have two options:

**Option A: Add a new field to backgrounds table**
Add an `image_library_selected` boolean column to track the Image Library selection separately.

**Option B: Use a user preferences approach**
Store user preferences as JSON or add an `image_library_background_id` column to a user settings table.

I recommend **Option A** as it keeps the logic simple and consistent with the existing `isSelected` approach.

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Image Library background | Resets on page refresh | Persists across sessions |
| Tile sizes | Smaller, constrained to 1152px | Same size as Your Stories |
| Left gap | Visible offset due to centering | Tiles start from left edge like Your Stories |

