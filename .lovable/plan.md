

# Fix: Lock Default Location Rows & Prevent Deletion

## Problem
The first two default location rows in Primary Locations can be deleted by the user. These should be permanent (non-deletable) since the API requires locations. The trash icon should be replaced with a lock icon matching the Character Builder pattern.

## Changes

### 1. `src/components/chronicle/WorldTab.tsx` (lines 850-860)
Replace the trash button with a conditional: if `idx < 2` and the row is one of the two default slots, show a lock icon (`Lock` from lucide-react, matching `w-3.5 h-3.5 text-zinc-400`); otherwise show the trash button. Also need to import `Lock` from lucide-react. The delete logic already prevents going below 0 — we just need to ensure the first two are always protected.

Specifically:
- Add `Lock` to the lucide-react import
- Replace the trash button block (lines 850-860) with:
  - If `idx < 2` and total locations ≤ actual count (i.e., it's a default row): render `<div className="w-7 flex-shrink-0 flex items-center justify-center pt-2"><Lock className="w-3.5 h-3.5 text-zinc-400" /></div>`
  - Else: render the existing trash button

### 2. `src/components/chronicle/StoryCardView.tsx` (lines 165-176)
Same conditional logic — show lock icon for first two rows, trash for added rows. Add `Lock` to the lucide-react import (line 5).

### 3. Delete protection
In both files, the delete handler for locations should also enforce a minimum of 2 rows — prevent deletion if `idx < 2`.

## Lock icon spec (from CharacterEditModal.tsx line 213-215)
```
<div className="w-7 flex-shrink-0 flex items-center justify-center pt-2">
  <Lock className="w-3.5 h-3.5 text-zinc-400" />
</div>
```

