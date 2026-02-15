

# Restyle "New Story" Card to Match Scenario Builder Cover Placeholder

## What's changing

The "New Story" button card in `ScenarioHub.tsx` (lines 226-235) will be restyled to match the dark gradient placeholder used for the cover image in the Scenario Builder (`WorldTab.tsx` line 447).

## Visual Target

- Dark gradient background (`from-zinc-800 to-zinc-900`) instead of the current light gray (`bg-slate-50/50`)
- Dashed border in `border-zinc-600` instead of `border-slate-200`
- A "+" icon (using the existing Plus icon from lucide or an SVG) styled in `text-zinc-500`
- "New Story" text in `text-zinc-500` with `font-black uppercase tracking-widest`
- Hover state: `border-blue-400` with subtle background shift

## Technical Details

**File:** `src/components/chronicle/ScenarioHub.tsx`, lines 226-235

**Current:**
```
className="aspect-[2/3] w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 group hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
```

**New outer button:**
```
className="aspect-[2/3] w-full rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-4 group hover:border-blue-400 transition-all duration-300"
```

**Current "+" circle (line 231):**
```
className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl text-slate-400 ..."
```

**New "+" circle:**
```
className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center text-3xl text-zinc-500 group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors"
```

**Current "New Story" label (line 234):**
```
className="text-sm font-black uppercase tracking-widest text-black group-hover:text-blue-600"
```

**New label:**
```
className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-400"
```

No other files or elements are changed.
