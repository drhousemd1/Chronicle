

# Update Scenario Builder Styling & Simplify Share Modal

## Overview

This plan addresses three changes:
1. Fix SFW/NSFW button text size and colors in ContentThemesSection
2. Remove the HintBox from the Share Your Story section (in WorldTab)
3. Remove the entire Discovery Tags section from ShareScenarioModal

---

## Changes Required

### 1. Fix SFW/NSFW Button Styling in ContentThemesSection

**File:** `src/components/chronicle/ContentThemesSection.tsx` (lines 177-184)

**Current Issues:**
- Text uses `text-sm font-bold` which is larger than other category buttons (`text-xs`)
- Colors use rose/emerald instead of the badge colors (red-400/blue-400)

**Updates:**

| Element | Current | Updated |
|---------|---------|---------|
| Text size | `text-sm font-bold` | `text-xs font-medium` (matches other tags) |
| SFW selected | `bg-emerald-500/20 text-emerald-300 border-emerald-500/30` | `bg-blue-500/20 text-blue-400 border-blue-500/30` |
| NSFW selected | `bg-rose-500/20 text-rose-300 border-rose-500/30` | `bg-red-500/20 text-red-400 border-red-500/30` |

**Updated Code:**
```tsx
<button
  key={type}
  type="button"
  onClick={() => onChange(isSelected ? null : type)}
  className={cn(
    "px-4 py-2 rounded-lg text-xs font-medium border transition-all",
    isSelected
      ? type === 'NSFW'
        ? "bg-red-500/20 text-red-400 border-red-500/30"
        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300"
  )}
>
  {type}
</button>
```

---

### 2. Remove HintBox from Share Your Story Section

**File:** `src/components/chronicle/WorldTab.tsx` (lines 894-917)

**Current:** The section has a HintBox with 3 hints plus the Publish button inside a recessed container.

**Updated:** Remove the HintBox entirely, keep only the Publish to Gallery button. The button can be directly in the `p-6` container without the extra recessed wrapper.

**Updated Code:**
```tsx
<div className="p-6">
  <button
    type="button"
    onClick={() => setShowShareModal(true)}
    className="flex h-10 w-full items-center justify-center gap-2 px-4
      rounded-xl border border-[hsl(var(--ui-border))] 
      bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
      text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none
      hover:bg-white/5 active:bg-white/10
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40
      transition-colors"
  >
    <Share2 className="w-3.5 h-3.5 shrink-0" />
    <span>Publish to Gallery</span>
  </button>
</div>
```

---

### 3. Remove Discovery Tags from ShareScenarioModal

**File:** `src/components/chronicle/ShareScenarioModal.tsx` (lines 164-178)

**Current:** The modal includes a "Discovery Tags" section with TagInput component.

**Updated:** Remove the entire Discovery Tags section and the tag validation requirement since tags are now managed in the Content Themes section of the Scenario Builder.

**Changes:**
1. Remove the Discovery Tags section JSX (lines 164-178)
2. Update `handlePublish` to remove the tag validation check (lines 59-63)
3. Update `publishScenario` call to pass empty array or remove tags parameter
4. Remove unused imports (`TagInput`, `Label` if only used for tags)
5. Remove `tags` state if no longer needed

**Note:** Since tags are now managed in ContentThemesSection, the publish function should pull from content themes instead. The modal becomes simpler - just remix permission and action buttons.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ContentThemesSection.tsx` | Fix SFW/NSFW button text size and colors |
| `src/components/chronicle/WorldTab.tsx` | Remove HintBox, keep only Publish button |
| `src/components/chronicle/ShareScenarioModal.tsx` | Remove Discovery Tags section |

---

## Visual Summary

### Before vs After - SFW/NSFW Buttons

| State | Before | After |
|-------|--------|-------|
| SFW selected | Green emerald, large text | Blue-400, text-xs |
| NSFW selected | Rose pink, large text | Red-400, text-xs |
| Unselected | Same | No change |

### Before vs After - Share Your Story Section

**Before:**
```text
┌─────────────────────────────────────┐
│ Share Your Story                    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ • Publish to gallery...         │ │
│ │ • Choose whether others...      │ │
│ │ • Add tags so players...        │ │
│ │                                 │ │
│ │ [  Publish to Gallery  ]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**After:**
```text
┌─────────────────────────────────────┐
│ Share Your Story                    │
├─────────────────────────────────────┤
│                                     │
│     [  Publish to Gallery  ]        │
│                                     │
└─────────────────────────────────────┘
```

### Before vs After - Share Modal

**Before:**
- Story title card
- Allow Remixing toggle
- Permissions info box
- **Discovery Tags section** ← REMOVE
- Action buttons
- Stats (if published)

**After:**
- Story title card
- Allow Remixing toggle  
- Permissions info box
- Action buttons
- Stats (if published)

