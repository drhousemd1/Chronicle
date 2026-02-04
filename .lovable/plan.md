

# Move "Remove From Gallery" to Bottom Right Corner

## Overview

Move the existing "Remove from Gallery" button from its current location (left column, under action buttons) to the bottom right corner of the modal's right column content area.

---

## Current Location (to be removed)

**Lines 294-308** - Currently in the left column, below the Edit/Play buttons:
```tsx
{/* Unpublish button for owned published scenarios */}
{isOwned && isPublished && onUnpublish && (
  <button onClick={handleUnpublish} ...>
    Remove from Gallery
  </button>
)}
```

---

## New Location

The button will be placed at the **bottom of the right column's content area**, after the Characters section, aligned to the right.

---

## Changes Required

### File: `src/components/chronicle/ScenarioDetailModal.tsx`

**1. Remove the button from lines 294-308** (left column)

Delete this block:
```tsx
{/* Unpublish button for owned published scenarios */}
{isOwned && isPublished && onUnpublish && (
  <button
    onClick={handleUnpublish}
    disabled={isUnpublishing}
    className="w-full mt-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
  >
    {isUnpublishing ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : (
      <Globe className="w-4 h-4" />
    )}
    Remove from Gallery
  </button>
)}
```

**2. Add the button after the Characters section (line 476)**, aligned to the right:

```tsx
{/* Characters Section */}
<div className="mt-auto pt-8 border-t border-white/5">
  {/* ... existing characters content ... */}
</div>

{/* Remove from Gallery - Bottom Right */}
{isOwned && isPublished && onUnpublish && (
  <div className="flex justify-end mt-6">
    <button
      onClick={handleUnpublish}
      disabled={isUnpublishing}
      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      {isUnpublishing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Globe className="w-4 h-4" />
      )}
      Remove from Gallery
    </button>
  </div>
)}
```

---

## Visual Layout

```text
+------------------------------------------+----------------------------------------+
| LEFT COLUMN (420px)                      | RIGHT COLUMN (flex-1)                  |
|                                          |                                        |
| [Cover Image]                            | Title                                  |
|                                          | PUBLISHED badge                        |
| [Edit] [Play]                            |                                        |
|                                          | SYNOPSIS                               |
| (NO Remove button here anymore)          | Description text...                    |
|                                          |                                        |
|                                          | Content Themes Grid                    |
|                                          |                                        |
|                                          | ─────────────────────────────────────  |
|                                          | CHARACTERS                             |
|                                          | (avatar) (avatar) (avatar)             |
|                                          |                                        |
|                                          |            [Remove from Gallery] ← NEW |
+------------------------------------------+----------------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioDetailModal.tsx` | Remove button from left column (lines 294-308), add to bottom of right column content (after line 476) |

