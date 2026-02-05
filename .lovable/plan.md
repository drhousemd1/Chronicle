

# Add "Editable" Text Badge to Detail Modal

## Summary

When a story has "Allow Edits" enabled, the tile cards show a pencil icon. When users open the detail modal, they should see a text badge saying "EDITABLE" in purple (matching the icon color) next to the "PUBLISHED" badge. This helps users understand what the pencil icon means.

---

## Current State

- **Tile cards:** Show a purple pencil icon when `allow_remix` is true
- **Detail modal:** Shows only "PUBLISHED" badge for owned published scenarios (lines 356-361)
- The pencil icon IS shown on the cover image inside the modal (lines 223-230)
- Missing: Text badge "EDITABLE" in the right column next to "PUBLISHED"

---

## Solution

Add an "EDITABLE" text badge that appears next to the "PUBLISHED" badge when `allowRemix` is true. This badge should:
- Use the same purple color as the pencil icon (`text-purple-400`, `bg-purple-500/20`)
- Appear in the same horizontal row as "PUBLISHED"
- Show for both owned scenarios AND gallery/saved scenarios (anywhere allowRemix is true)

---

## File: `src/components/chronicle/ScenarioDetailModal.tsx`

**Change the current badge section (lines 356-361) from a single badge to a flex container with both badges:**

**Before:**
```tsx
{/* Published badge for owned scenarios */}
{isOwned && isPublished && (
  <span className="inline-flex w-fit px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 mt-1">
    PUBLISHED
  </span>
)}
```

**After:**
```tsx
{/* Status badges row */}
{(isPublished || allowRemix) && (
  <div className="flex items-center gap-2 mt-1">
    {/* Published badge - for owned scenarios */}
    {isOwned && isPublished && (
      <span className="inline-flex w-fit px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
        PUBLISHED
      </span>
    )}
    
    {/* Editable badge - shows when allowRemix is enabled */}
    {allowRemix && (
      <span className="inline-flex w-fit px-2.5 py-1 bg-purple-500/20 rounded-lg text-xs font-bold text-purple-400">
        EDITABLE
      </span>
    )}
  </div>
)}
```

---

## Visual Result

**Owned, Published, Edits Enabled:**
```text
Acotar
[PUBLISHED] [EDITABLE]
```

**Owned, Published, Edits Disabled:**
```text
Acotar
[PUBLISHED]
```

**Gallery/Saved Story with Edits Enabled:**
```text
Acotar
[EDITABLE]
by Username
```

**Gallery/Saved Story without Edits:**
```text
Acotar
by Username
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioDetailModal.tsx` | Wrap badges in flex container, add "EDITABLE" badge when `allowRemix` is true |

---

## Badge Styling

The "EDITABLE" badge uses the same color family as the pencil icon:
- Background: `bg-purple-500/20` (semi-transparent purple)
- Text: `text-purple-400` (matching the pencil icon color)
- Same sizing and styling as "PUBLISHED" badge for visual consistency

