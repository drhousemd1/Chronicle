

## Plan: Fix Character Roster Card Layout

**File:** `src/components/chronicle/WorldTab.tsx` lines 82-86

Three fixes:

1. **Row 1 — Remove "Name:" label**, just show the character name directly with bold white text and truncation
2. **Row 2 — Age:** Show empty string instead of `—` when no age is set
3. **Row 3 — Controlled by:** No changes

Replace lines 82-86:
```tsx
<div className="min-w-0 flex-1 space-y-0.5">
  <div className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">{char.name}</div>
  <div className="text-xs text-slate-400"><span className="text-slate-500">Age:</span> {char.age || ''}</div>
  <div className="text-xs text-slate-400"><span className="text-slate-500">Controlled by:</span> <span className="uppercase tracking-wider font-black">{char.controlledBy}</span></div>
</div>
```

Single file, 3-line change.

