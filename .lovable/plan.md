
# Restyle Avatar Panel to Match Dark Theme

## Overview

Update the Avatar Panel in `CharactersTab.tsx` to use the same dark charcoal theme as Character Goals and the other hardcoded sections. This involves restructuring the panel to use the unified container pattern with the steel blue header.

---

## Current Structure (lines 328-502)

```
<div className="space-y-6 ...">              <!-- sticky column wrapper -->
  <div className="flex ...">                  <!-- standalone header row -->
    <h2>Avatar</h2>
  </div>
  <Card className="p-6 !shadow-... border-transparent ring-1 ring-slate-900/5">
    <div className="space-y-4">
      [avatar image + buttons]
      [input fields with light styling]
    </div>
  </Card>
</div>
```

## Target Structure

```
<div className="space-y-6 ...">              <!-- sticky column wrapper -->
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[...]">
    <!-- Section Header -->
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 ...">
      <span className="text-[#a5d6a7] ...">Section</span>
      <h2 className="text-[#e8f5e9] ...">Avatar</h2>
    </div>
    <!-- Content -->
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        [avatar image + buttons with updated styling]
        [input fields with dark styling]
      </div>
    </div>
  </div>
</div>
```

---

## Technical Changes

### 1. Remove Standalone Header (lines 329-331)

Delete:
```tsx
<div className="flex justify-between items-center h-9">
  <h2 className="text-xl font-bold text-slate-900">Avatar</h2>
</div>
```

### 2. Replace Card Component (lines 332-501)

Replace `<Card className="p-6 ...">` with the unified dark container structure:

```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
  {/* Section Header */}
  <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
    <span className="text-[#a5d6a7] font-bold tracking-wide uppercase text-xs">Section</span>
    <h2 className="text-[#e8f5e9] text-xl font-bold tracking-tight">Avatar</h2>
  </div>
  {/* Content */}
  <div className="p-5">
    <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
      <div className="space-y-4">
        {/* existing content here */}
      </div>
    </div>
  </div>
</div>
```

### 3. Update Avatar Image Container (line 337)

Update the empty state and border styling to work on dark background:

**From:**
```tsx
<div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-3xl text-slate-400 border-2 border-dashed border-slate-200">
```

**To:**
```tsx
<div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-3xl text-zinc-500 border-2 border-dashed border-zinc-600">
```

### 4. Update Avatar Container Border (line 337)

**From:**
```tsx
isRepositioning ? 'ring-4 ring-blue-500 cursor-move' : 'border-2 border-slate-100'
```

**To:**
```tsx
isRepositioning ? 'ring-4 ring-blue-500 cursor-move' : 'border-2 border-white/10'
```

### 5. Replace UI Input Components with Dark-Styled Inputs (lines 454-498)

Replace all `<Input>` components with dark-themed versions matching the style used in `HardcodedInput`:

**From:**
```tsx
<Input label="Name" value={...} onChange={...} placeholder="..." />
```

**To:**
```tsx
<div>
  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name</label>
  <input
    type="text"
    value={...}
    onChange={(e) => ...}
    placeholder="..."
    className="w-full px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
  />
</div>
```

### 6. Update Toggle Buttons (Controlled By & Character Role)

**From (lines 463-476, 481-494):**
```tsx
<div className="flex p-1 bg-slate-100 rounded-xl">
  <button className="... ${selected.controlledBy === 'AI' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}">
```

**To:**
```tsx
<div className="flex p-1 bg-zinc-800 rounded-xl">
  <button className="... ${selected.controlledBy === 'AI' ? 'bg-zinc-700 text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
```

---

## Styling Summary

| Element | Current | Target |
|---------|---------|--------|
| Container bg | `bg-white` (Card) | `bg-[#2a2a2f]` |
| Container border | `ring-1 ring-slate-900/5` | `border border-white/10` |
| Container radius | Card default | `rounded-[24px]` |
| Container shadow | `shadow-[...0.15]` | `shadow-[...0.50]` |
| Header | None (standalone h2) | Steel blue `bg-[#4a5f7f]` with "Section" label |
| Inner card | None | `bg-[#3a3a3f]/30 rounded-2xl border-white/5` |
| Input labels | `text-slate-500` | `text-zinc-400` |
| Input fields | White bg | `bg-zinc-900/50 border-white/10 text-white` |
| Toggle buttons | `bg-slate-100` wrapper | `bg-zinc-800` wrapper |
| Toggle active | `bg-white text-blue-600` | `bg-zinc-700 text-blue-400` |
| Toggle inactive | `text-slate-400` | `text-zinc-500` |

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/components/chronicle/CharactersTab.tsx` | 329-331 | Remove standalone header |
| `src/components/chronicle/CharactersTab.tsx` | 332 | Replace `<Card>` with dark container |
| `src/components/chronicle/CharactersTab.tsx` | 337, 353-355 | Update avatar container styling for dark theme |
| `src/components/chronicle/CharactersTab.tsx` | 454-498 | Update all input fields to dark styling |
| `src/components/chronicle/CharactersTab.tsx` | 461-477, 479-495 | Update toggle button styling |
| `src/components/chronicle/CharactersTab.tsx` | 501 | Change `</Card>` to `</div>` closures |

---

## Visual Result

After these changes, the Avatar panel will have:
- Dark charcoal container with rounded-[24px] corners matching other sections
- Steel blue header with "Section" + "Avatar" title
- Two-layer depth with inner card wrapper
- Dark input fields with zinc-colored labels
- Dark toggle buttons for "Controlled By" and "Character Role"
- Consistent shadow and border styling with Character Goals and Preferred Clothing sections
