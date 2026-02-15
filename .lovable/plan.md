
# Update Cogwheel Button to Match Themed Button Style

## Change

Update the settings cogwheel button in the character column panel (line 2626) to use the same themed styling as the "Chat Settings" and "Generate Image" buttons, without adding any text.

## Technical Details

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`, line 2626

Current styling:
```
bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg
```

New styling (matching the Chat Settings button pattern):
```
bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]
```

The button keeps the same size (`px-3 py-2`), icon-only layout, and `rounded-xl` shape -- only the color/shadow classes change.
