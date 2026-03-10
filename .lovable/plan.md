

# Fix Three Issues: Time-of-Day Icons, Input Preview Backgrounds, Badge Preview Backgrounds

## Issues

1. **Time of Day buttons** (line ~1796): Using emoji text (`☀︎ Rise`, `☀ Day`, `◐ Set`, `☽ Night`) instead of actual Lucide icons (`Sunrise`, `Sun`, `Sunset`, `Moon`) with NO text labels — the real buttons are icon-only.

2. **InputCardV2 preview strip** (line 353-354): Uses `background: previewBg || '#25272d'` — a dark colored background. Should be white (`#fff`) like ButtonCardV2, with the element shown standalone.

3. **BadgeCardV2 preview strip** (line 462-463): Uses `background: previewBg || '#1a1a2e'` — another dark colored background. Same fix: white bg, element shown standalone.

## Changes

**File: `src/components/admin/styleguide/StyleGuideTool.tsx`**

### 1. Add Lucide icon imports
Add `Sunrise, Sun, Sunset, Moon` to the existing lucide-react import on line 2.

### 2. Fix Time of Day button preview (line ~1794-1801)
Replace the emoji+text buttons with icon-only buttons using the real Lucide components:
```tsx
<button className="p-2 rounded-lg bg-white border border-black text-black"><Sunrise className="w-4 h-4" /></button>
<button className="p-2 rounded-lg bg-blue-100 border-2 border-blue-400 text-blue-600 shadow-sm"><Sun className="w-4 h-4" /></button>
<button className="p-2 rounded-lg bg-white border border-black text-black"><Sunset className="w-4 h-4" /></button>
<button className="p-2 rounded-lg bg-white border border-black text-black"><Moon className="w-4 h-4" /></button>
```

### 3. Fix InputCardV2 preview strip background (line 354)
Change from `background: previewBg || '#25272d'` to `background: '#fff'`. Remove the `previewBg` prop from the component entirely since it's no longer needed.

### 4. Fix BadgeCardV2 preview strip background (line 463)
Change from `background: previewBg || '#1a1a2e'` to `background: '#fff'`. Remove the `previewBg` prop from the component entirely.

### 5. Remove all `previewBg` prop usages
Search all `InputCardV2` and `BadgeCardV2` instances and remove any `previewBg="..."` props being passed to them.

