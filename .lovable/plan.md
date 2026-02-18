
# Restyle Chat History List to Match Dark Theme

## Problem
The chat history list is a bright white block (`bg-white`) sitting on a solid black background, creating an uncomfortably harsh contrast that doesn't match the rest of the app's dark aesthetic.

## Proposed Design
Replace the white container with a dark, borderless design that uses individual row separators -- consistent with the app's existing dark UI tokens and the slate blue (#4a5f7f) brand color used elsewhere.

### Color Scheme
- **Container**: Remove the white background and outer border/shadow entirely. Let the rows sit directly on the black background with only a subtle divider between them.
- **Row background**: Transparent by default, with a subtle hover of `bg-white/5` (very faint white overlay)
- **Row dividers**: `divide-y divide-white/10` (thin, low-contrast separators)
- **Title text**: `text-white` (currently `text-slate-900`)
- **Meta text** (message count, date, preview): `text-zinc-400` (currently `text-slate-400/500` which reads as near-invisible on dark)
- **Thumbnail border**: `border-[#4a5f7f]` (brand slate blue, matching card borders elsewhere)
- **Thumbnail fallback bg**: `bg-zinc-800` (dark placeholder instead of `bg-slate-200`)
- **Action button icons**: `text-zinc-500` default, `text-zinc-300` on hover (instead of `text-slate-400` / `text-slate-700`)
- **Delete hover**: Keep `hover:text-red-500` but change bg to `hover:bg-red-500/10` (subtle dark red)
- **Empty state text**: `text-zinc-500` / `text-zinc-600`

### Visual Result
Individual conversation rows float on the black background with minimal separation -- clean, modern, and consistent with the Stories hub, Character Library, and Gallery pages which all use black backgrounds with dark-themed content.

## Technical Details

### File: `src/components/chronicle/ConversationsTab.tsx`

**Line 35** -- Remove the white container wrapper:
```tsx
// Before
<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">

// After
<div className="rounded-2xl overflow-hidden">
```

**Line 36** -- Update dividers:
```tsx
// Before
<div className="divide-y divide-slate-100">

// After
<div className="divide-y divide-white/10">
```

**Line 47** -- Row hover:
```tsx
// Before
className="flex items-center gap-4 p-4 hover:bg-slate-50 ..."

// After
className="flex items-center gap-4 p-4 hover:bg-white/5 ..."
```

**Line 52** -- Thumbnail:
```tsx
// Before
className="... bg-slate-200 border border-slate-200 hover:ring-2 hover:ring-blue-500 ..."

// After
className="... bg-zinc-800 border border-[#4a5f7f] hover:ring-2 hover:ring-[#4a5f7f] ..."
```

**Line 61** -- Fallback icon bg:
```tsx
// Before
className="... text-slate-400 ..."

// After
className="... text-zinc-500 ..."
```

**Line 74** -- Title text:
```tsx
// Before
className="font-bold text-slate-900 truncate"

// After
className="font-bold text-white truncate"
```

**Lines 77, 80, 81** -- Meta text:
```tsx
// All instances of text-slate-400 become text-zinc-500
```

**Line 83** -- Preview text:
```tsx
// Before
className="text-sm text-slate-500 truncate ..."

// After
className="text-sm text-zinc-400 truncate ..."
```

**Line 97** -- Edit button:
```tsx
// Before
className="... text-slate-400 hover:text-slate-700 hover:bg-slate-100 ..."

// After
className="... text-zinc-500 hover:text-zinc-300 hover:bg-white/10 ..."
```

**Line 112** -- Delete button:
```tsx
// Before
className="... text-slate-400 hover:text-red-600 hover:bg-red-50 ..."

// After
className="... text-zinc-500 hover:text-red-500 hover:bg-red-500/10 ..."
```

**Lines 30-32** -- Empty state:
```tsx
// text-slate-600 -> text-zinc-500
// text-slate-500 -> text-zinc-600
```

## Files Modified
1. `src/components/chronicle/ConversationsTab.tsx` -- full dark theme restyle
