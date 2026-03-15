

## Plan: Slim down Add/Create character buttons

**File**: `src/components/chronicle/WorldTab.tsx`

### Change 1: Replace `AddCharacterPlaceholder` (lines 601-618)
Replace the bulky card-style button with a thin, centered button using the `Plus` Lucide icon:

```tsx
const AddCharacterPlaceholder: React.FC<{ label: string; hasError?: boolean }> = ({ label, hasError }) => (
  <button
    type="button"
    onClick={() => setIsCharacterCreationOpen(true)}
    className={cn(
      "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
      "bg-[#1c1c1f] hover:bg-[#252529] transition-all",
      "text-blue-500 text-sm font-semibold",
      "border border-white/5",
      hasError && "border-red-500 ring-2 ring-red-500"
    )}
  >
    <Plus className="w-4 h-4" />
    {label}
  </button>
);
```

### Change 2: Update call sites (lines 634, 646)
- Line 634: `<AddCharacterPlaceholder label="Main Character" hasError={...} />`
- Line 646: `<AddCharacterPlaceholder label="Side Character" />`

Remove `sublabel` prop — no longer needed. `Plus` icon is already imported at the top of the file.

