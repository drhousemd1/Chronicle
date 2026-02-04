

# Community Gallery - Match Scenario Builder Dark Theme

## Overview

Update the Community Gallery search header to match the dark charcoal theme from the Scenario Builder page (Image 1), including:
1. Dark container with recessed search area
2. Dark-themed sort filter toggle that fits the aesthetic

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/GalleryHub.tsx` | Restyle search section to match Scenario Builder dark theme |

---

## Detailed Changes

### 1. Overall Header Container (line 170)

**Current:**
```tsx
<div className="p-6 bg-[#4a5f7f]">
```

**Updated:**
```tsx
<div className="bg-[#2a2a2f] border-b border-white/10">
  {/* Steel blue header bar */}
  <div className="bg-[#4a5f7f] px-6 py-4">
    <h2 className="text-white text-xl font-bold tracking-tight text-center">Discover Stories</h2>
  </div>
  
  {/* Content area */}
  <div className="p-6">
```

This creates the same structure as the Scenario Builder sections - a dark charcoal container with a steel blue header bar.

### 2. Search Input Container (lines 171-189)

**Updated structure:**
```tsx
<div className="max-w-2xl mx-auto space-y-4">
  {/* Search input - dark recessed style */}
  <div className="relative">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
    <input
      ...
      className="w-full pl-12 pr-24 py-4 bg-[#3a3a3f]/50 border border-white/10 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] focus:border-transparent"
    />
    <button
      onClick={handleSearch}
      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#4a5f7f] text-white rounded-xl font-semibold text-sm hover:bg-[#5a6f8f] transition-colors"
    >
      Search
    </button>
  </div>
```

Changes:
- Search input: `bg-white` → `bg-[#3a3a3f]/50` (dark recessed)
- Text: `text-slate-900` → `text-white`
- Placeholder: `text-slate-400` → `text-zinc-500`
- Border: `border-white` → `border-white/10`
- Search button: Matches steel blue theme

### 3. Filter Tags Display (lines 192-209)

Keep the current white/opacity styling as it already works with the dark theme.

### 4. Sort Filter Toggle - Dark Theme (lines 213-236)

**Current:**
```tsx
<div className="flex items-center bg-slate-200 rounded-full p-1 gap-0.5">
  ...
  className={cn(
    "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
    sortBy === option.key 
      ? "bg-white text-slate-900 shadow-sm" 
      : "text-slate-500 hover:text-slate-700"
  )}
```

**Updated (dark theme variant):**
```tsx
<div className="flex items-center bg-white/10 rounded-full p-1 gap-0.5 border border-white/10">
  ...
  className={cn(
    "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
    sortBy === option.key 
      ? "bg-[#4a5f7f] text-white shadow-sm" 
      : "text-zinc-400 hover:text-zinc-200"
  )}
```

Changes:
- Container: `bg-slate-200` → `bg-white/10 border border-white/10` (dark semi-transparent)
- Active button: `bg-white text-slate-900` → `bg-[#4a5f7f] text-white` (steel blue active)
- Inactive button: `text-slate-500` → `text-zinc-400 hover:text-zinc-200` (muted gray)

### 5. Close the Container (after line 237)

Add closing div for the content area and outer container.

---

## Visual Summary

| Element | Before | After |
|---------|--------|-------|
| Outer container | `bg-[#4a5f7f]` only | `bg-[#2a2a2f]` with steel blue header |
| Search input bg | `bg-white` | `bg-[#3a3a3f]/50` (dark recessed) |
| Search input text | `text-slate-900` | `text-white` |
| Search button | `bg-white text-[#4a5f7f]` | `bg-[#4a5f7f] text-white` |
| Filter container | `bg-slate-200` | `bg-white/10 border-white/10` |
| Active filter | `bg-white text-slate-900` | `bg-[#4a5f7f] text-white` |
| Inactive filter | `text-slate-500` | `text-zinc-400` |

This creates a cohesive dark-themed search header that matches the Scenario Builder's charcoal + steel blue aesthetic, with the sort toggle using the same design language.

