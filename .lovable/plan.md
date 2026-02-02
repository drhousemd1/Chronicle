
# Character Goals Section - Complete Rewrite with Correct Colors

## Overview

The current implementation uses the wrong color palette. I need to completely rewrite the component using the exact colors and structure from your mockup code.

---

## Key Color Corrections

### Current (Wrong) vs. Correct Colors

| Element | Current (Wrong) | Correct (from mockup) |
|---------|-----------------|----------------------|
| Main container bg | `bg-slate-800` | `bg-[#2a2a2f]` |
| Main border | `border-slate-600` | `border-white/10` |
| Section header bg | `bg-slate-500/60` | `bg-[#4a5f7f]` |
| Section header border | none | `border-white/20` |
| "Section" label | `text-emerald-300` | `text-[#a5d6a7]` |
| Title text | `text-white` | `text-[#e8f5e9]` |
| Goal card bg | `bg-slate-700` | `bg-[#3a3a3f]/30` |
| Goal card border | `border-slate-600` | `border-white/5` |
| Field labels | `text-amber-400` | `text-zinc-400` |
| Content text | `text-slate-200` | `text-zinc-300` |
| Progress ring bg | `#334155` (slate) | `text-zinc-800/40` |
| Timeline line | `bg-blue-500/50` | `bg-zinc-700/50` |
| Day chip | `bg-slate-800` | `bg-zinc-800/50 border-white/5` |

---

## Structural Changes from Mockup Code

### 1. Main Container
```tsx
<div className="w-full max-w-4xl bg-[#2a2a2f] rounded-[24px] border border-white/10 custom-shadow">
```
Note: Using `rounded-[24px]` for large border radius

### 2. Section Header
```tsx
<div className="bg-[#4a5f7f] border border-white/20 rounded-xl px-5 py-3 flex items-center justify-between shadow-lg">
  <div className="flex items-center gap-3">
    <span className="text-[#a5d6a7] font-bold tracking-wide uppercase text-xs">Section</span>
    <h2 className="text-[#e8f5e9] text-xl font-bold tracking-tight">Character Goals</h2>
  </div>
  {/* Edit button in view mode */}
</div>
```

### 3. Goal Card (View Mode)
```tsx
<div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
    {/* Left column: content (col-span-9) */}
    {/* Right column: progress ring (col-span-3) */}
  </div>
</div>
```

### 4. Field Labels
```tsx
<label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal Name</label>
<h3 className="text-lg font-bold text-white mt-0.5">{goal.title}</h3>
```

### 5. Progress Ring (96x96 with 38 radius)
```tsx
<div className="relative h-24 w-24 flex items-center justify-center">
  <svg className="w-full h-full transform -rotate-90">
    <circle cx="48" cy="48" r="38" stroke="currentColor" stroke-width="8" fill="transparent" className="text-zinc-800/40" />
    <circle cx="48" cy="48" r="38" stroke="currentColor" stroke-width="8" fill="transparent" 
      stroke-dasharray="238.7" stroke-dashoffset={offset} className="text-blue-500" stroke-linecap="round" />
  </svg>
  <span className="absolute text-white font-extrabold text-lg">{progress}%</span>
</div>
<p className="mt-3 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Overall Progress</p>
```

### 6. Milestone History Section
```tsx
<div className="mt-6 pt-6 border-t border-white/5">
  <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
    <History className="text-blue-400" />
    Milestone History
  </h4>
  
  <div className="space-y-3 pl-2 relative">
    {/* Vertical timeline line */}
    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700/50" />
    
    {/* Milestone entries */}
    <div className="relative flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-3.5 w-3.5 rounded-full bg-blue-500/80 ring-2 ring-blue-500/10 z-10" />
        <span className="text-sm text-zinc-200">{description}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Day chip */}
        <div className="flex items-center bg-zinc-800/50 rounded-md px-2 py-1 border border-white/5">
          <span className="text-[10px] font-bold text-zinc-400 mr-2">DAY</span>
          <span className="text-[11px] font-bold text-white">{day}</span>
        </div>
        {/* Time chip */}
        <div className="flex items-center bg-blue-500/10 rounded-md px-2 py-1 border border-blue-500/20 text-blue-400">
          <Sun className="text-xs" />
          <span className="text-[10px] font-bold ml-1 uppercase">Midday</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 7. Time Chip Colors
| Time | Background | Border | Text |
|------|------------|--------|------|
| Sunrise | `bg-amber-500/10` | `border-amber-500/20` | `text-amber-400` |
| Day/Midday | `bg-blue-500/10` | `border-blue-500/20` | `text-blue-400` |
| Sunset | `bg-orange-500/10` | `border-orange-500/20` | `text-orange-400` |
| Night | `bg-indigo-500/10` | `border-indigo-500/20` | `text-indigo-400` |

---

## Edit Mode Changes

In edit mode, the mockup shows:
- Blue borders on containers (`border-blue-500/20`)
- Input fields appear
- Delete (X) buttons next to milestones
- Horizontal slider under progress ring
- "+ Add Milestone Step" button
- "+ Add New Goal" button

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/chronicle/CharacterGoalsSection.tsx` | Complete rewrite with correct colors |

---

## Implementation Approach

I will completely rewrite the component using the exact color values and structure from your mockup code. The key changes:

1. Replace all `bg-slate-*` with the correct `bg-[#2a2a2f]`, `bg-[#3a3a3f]`, etc.
2. Replace `text-amber-400` labels with `text-zinc-400`
3. Update section header to use `bg-[#4a5f7f]` with `text-[#a5d6a7]` and `text-[#e8f5e9]`
4. Fix the progress ring dimensions (96x96, r=38)
5. Update timeline with proper vertical line and dot styling
6. Fix Day/Time chip structure and colors
7. Add proper border styles (`border-white/5`, `border-white/10`, etc.)
