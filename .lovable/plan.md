

# Fix Reposition Button — Use Raw `<button>` Instead of Chronicle `Button`

## Problem
The Reposition button is using the Chronicle `Button` component from `UI.tsx`, which applies its own variant styles (`bg-slate-900`, borders, shadows) that conflict with and override the Shadow Surface className additions. This is why the button looks completely wrong — Tailwind utility conflicts mean the Chronicle Button's base styles win.

## Fix

**File**: `src/components/chronicle/CharactersTab.tsx` (lines 746-751)

Replace the Chronicle `<Button>` with a raw `<button>` element, keeping the exact same sizing (`w-full`) and the Shadow Surface classes. This eliminates the style conflict entirely.

```tsx
<button
  type="button"
  onClick={() => setIsRepositioning(!isRepositioning)}
  className={`w-full h-10 rounded-xl text-[10px] font-bold leading-none uppercase tracking-wider transition-colors cursor-pointer ${
    isRepositioning
      ? 'bg-blue-500 text-white border border-blue-500'
      : 'bg-[hsl(240_6%_18%)] border border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] hover:bg-[hsl(240_6%_22%)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]'
  }`}
>
  {isRepositioning ? "Save Position" : "REPOSITION"}
</button>
```

Single file, single change. The sizing stays identical — only the component type changes from `<Button>` to `<button>` to stop the style conflict.

