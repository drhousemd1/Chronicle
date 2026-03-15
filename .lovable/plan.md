

## Plan: Update "Main Characters" and "Side Characters" roster headers to match container header style

**Current state** (lines 624 and 636): Both headers use a flat, plain style:
```
bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm
```

**Target state**: The standardized container header used everywhere else on this page (Scene Gallery, World Codex, Story Arcs, Content Themes, etc.):
```
relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 shadow-lg
```
Plus the gloss sheen overlay div and `relative z-[1]` on the title text.

**Changes** (single file: `src/components/chronicle/WorldTab.tsx`):

1. **Line 624** — Replace the "Main Characters" header div:
```tsx
<div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 rounded-xl mb-3 shadow-lg">
  <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
  <div className="text-[10px] font-bold text-white uppercase tracking-wider relative z-[1]">Main Characters</div>
</div>
```

2. **Line 636** — Replace the "Side Characters" header div with the identical pattern, just different label text.

These headers sit standalone (not inside a rounded container wrapper), so they keep `rounded-xl` and `mb-3` from the current markup. The gradient, top border highlight, gloss sheen overlay, and `shadow-lg` bring the 3D depth to match every other slate-blue header on the page.

