

## Plan: Standardize Error Message Styling

**Problem:** Error text sizes, colors, and border treatments are inconsistent across fields. Story Name uses `text-xs text-red-500` with `ring-2 ring-red-500`, while other fields use `text-xs text-red-400` with no ring. Text is too small.

### Changes

**All error messages across all files will use this standard (matching Story Name):**
- **Text:** `text-sm text-red-500` (14px, not 12px `text-xs`)
- **Border on inputs:** `border-red-500 ring-2 ring-red-500`
- **Color:** `text-red-500` everywhere, not `text-red-400`

**Files to update:**

1. **`src/components/chronicle/WorldTab.tsx`**
   - Story Premise error text: `text-xs text-red-400` → `text-sm text-red-500`
   - Story Premise border: add `ring-2 ring-red-500` to match Story Name
   - Opening Dialog error text + border: same fix
   - Location label error: `text-red-400` → `text-red-500`
   - Story Arc error text: `text-xs text-red-400` → `text-sm text-red-500`
   - Character card errors (line ~99): `text-xs text-red-400` → `text-sm text-red-500`
   - No characters error (line ~436): `text-xs text-red-400` → `text-sm text-red-500`
   - Bottom summary panel error items: keep `text-sm` (already correct size)

2. **`src/components/chronicle/ContentThemesSection.tsx`**
   - Tags error: `text-xs text-red-400` → `text-sm text-red-500`
   - Story type error: `text-xs text-red-400` → `text-sm text-red-500`

3. **`src/components/chronicle/StoryGoalsSection.tsx`**
   - Border when `hasError`: already `border-red-500`, add `ring-2 ring-red-500` to match

