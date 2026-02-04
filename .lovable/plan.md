

# Stack Scene Gallery Action Buttons Vertically

## Overview

Change the button layout from horizontal (side-by-side) to vertical (stacked) so the HintBox has more horizontal space for its text.

---

## Current vs Target Layout

**Current:**
```
┌────────────────────────────────────┐ ┌─────────────┬─────────────┐
│  HintBox (constrained width)       │ │  [Upload]   │  [AI Gen]   │
│  • Text wraps awkwardly            │ └─────────────┴─────────────┘
└────────────────────────────────────┘
```

**Target:**
```
┌──────────────────────────────────────────────┐ ┌─────────────┐
│  HintBox (more horizontal space)             │ │  [Upload]   │
│  • Text flows better on single lines         │ ├─────────────┤
│                                              │ │  [AI Gen]   │
└──────────────────────────────────────────────┘ └─────────────┘
```

---

## Technical Change

**File:** `src/components/chronicle/SceneGalleryActionButtons.tsx` (line 34)

Change the flex direction from horizontal to vertical:

```tsx
// Current
<div className="flex gap-2">

// Updated
<div className="flex flex-col gap-2">
```

This single change:
- Stacks the Upload Image button on top of the AI Generate button
- Gives the HintBox more horizontal space to display text without awkward wrapping
- Maintains consistent button widths in a vertical stack

---

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/chronicle/SceneGalleryActionButtons.tsx` | 34 | Add `flex-col` to the flex container |

