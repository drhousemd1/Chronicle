
# Restyle Character Roster Panel to Dark Theme

## Problem

The Character Roster sidebar (Image 1) uses a light theme with white/slate backgrounds, which doesn't match the dark charcoal layered design of the Cover Image section (Image 2) and other right-side panels.

## Target Design (from Image 2)

The Cover Image section uses this layered architecture:
- **Outer container**: `bg-[#2a2a2f]` (dark charcoal) with `border-white/10`
- **Inner recessed areas**: `bg-[#3a3a3f]/30` with `border-white/5`
- **Dashed placeholder borders**: Dark gray tones, not light slate
- **Text colors**: White/muted gray instead of dark slate

## Solution

Completely restyle the Character Roster sidebar to use the same dark charcoal layered theme.

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/WorldTab.tsx` | Restyle entire sidebar and AddCharacterPlaceholder to dark theme |

---

## Detailed Changes

### 1. Sidebar Container (lines 331-334)

**Before:**
```tsx
<aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)]">
  <div className="p-6 border-b border-slate-100 bg-slate-50/30">
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Roster</div>
  </div>
```

**After:**
```tsx
<aside className="w-[260px] flex-shrink-0 bg-[#2a2a2f] border-r border-white/10 flex flex-col h-full">
  <div className="p-6 border-b border-white/10 bg-[#4a5f7f]">
    <div className="text-[10px] font-black text-white uppercase tracking-widest">Character Roster</div>
  </div>
```

### 2. Scrollable Content Area (line 336)

**Before:**
```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20">
```

**After:**
```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20 bg-[#2a2a2f]">
```

### 3. Section Headers (lines 338-340, 348-350)

**Before:**
```tsx
<div className="bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm">
  <div className="text-[10px] font-bold text-white uppercase tracking-wider">Main Characters</div>
</div>
```

**After:**
```tsx
<div className="bg-[#3a3a3f]/60 px-4 py-2 rounded-xl mb-3 border border-white/5">
  <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Main Characters</div>
</div>
```

This uses the recessed gray style to differentiate from the main header while staying within the dark theme.

### 4. AddCharacterPlaceholder (lines 313-327)

**Before:**
```tsx
<button className="group/add w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-300 bg-slate-100/50 hover:bg-blue-50 border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer">
  <div className="w-14 h-14 shrink-0 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 ...">
    <span className="text-2xl font-light">+</span>
  </div>
  <div className="text-left">
    <div className="text-xs font-bold text-slate-500 ...">Add / Create</div>
    <div className="text-[9px] font-black text-slate-400 ...">Character Registry</div>
  </div>
</button>
```

**After:**
```tsx
<button className="group/add w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 bg-[#3a3a3f]/30 hover:bg-[#3a3a3f]/50 border-2 border-dashed border-zinc-600 hover:border-zinc-500 cursor-pointer">
  <div className="w-14 h-14 shrink-0 rounded-xl bg-[#3a3a3f]/50 border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 transition-all duration-300 group-hover/add:border-zinc-400 group-hover/add:bg-[#3a3a3f]/70 group-hover/add:text-zinc-300">
    <span className="text-2xl font-light">+</span>
  </div>
  <div className="text-left">
    <div className="text-xs font-bold text-zinc-400 group-hover/add:text-zinc-200 transition-colors uppercase tracking-tight">Add / Create</div>
    <div className="text-[9px] font-black text-zinc-500 group-hover/add:text-zinc-400 uppercase tracking-widest mt-0.5">Character Registry</div>
  </div>
</button>
```

---

## Visual Comparison

```text
BEFORE (Light Theme)              AFTER (Dark Theme)
┌─────────────────────┐          ┌─────────────────────┐
│ Character Roster    │ (light)  │ CHARACTER ROSTER    │ (steel blue #4a5f7f)
├─────────────────────┤          ├─────────────────────┤
│                     │ (white)  │                     │ (charcoal #2a2a2f)
│ ┌─────────────────┐ │          │ ┌─────────────────┐ │
│ │ MAIN CHARACTERS │ │ (blue)   │ │ MAIN CHARACTERS │ │ (recessed gray)
│ └─────────────────┘ │          │ └─────────────────┘ │
│  [avatar] Name      │          │  [avatar] Name      │
│ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐ │          │ ┌┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┐ │
│ │ + Add/Create    │ │ (light)  │ │ + Add/Create    │ │ (dark dashed)
│ └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘ │          │ └┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┘ │
│ ┌─────────────────┐ │          │ ┌─────────────────┐ │
│ │ SIDE CHARACTERS │ │ (blue)   │ │ SIDE CHARACTERS │ │ (recessed gray)
│ └─────────────────┘ │          │ └─────────────────┘ │
└─────────────────────┘          └─────────────────────┘
```

---

## Color Palette Used

| Element | Color | Purpose |
|---------|-------|---------|
| Sidebar background | `#2a2a2f` | Dark charcoal base |
| Main header | `#4a5f7f` | Steel blue accent |
| Section headers | `#3a3a3f` at 60% | Recessed layer |
| Dashed borders | `zinc-600` | Dark dashed lines |
| Primary text | `zinc-300/400` | Readable on dark |
| Subtle text | `zinc-500` | Secondary info |

This creates a cohesive dark theme that matches the Cover Image section exactly, using the same layered gray architecture.
