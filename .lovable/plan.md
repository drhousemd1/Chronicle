
# Fix Sidebar Collapse Animation

## Problem
When collapsing the sidebar, the header area jumps vertically because:
1. Padding changes abruptly from `p-8` to `p-4`, shifting the logo upward
2. The `justify-between` layout causes the toggle button to reposition awkwardly in the narrow space
3. The "CHRONICLE" text just disappears with no transition

## Solution
Use consistent padding and a column-based layout for collapsed state so the logo stays in the same vertical position during the transition.

### Changes in `src/pages/Index.tsx` (lines 1254-1275)

**1. Fix padding** -- Use the same vertical padding in both states, only change horizontal:
- Change from `sidebarCollapsed ? 'p-4' : 'p-8'` to `py-8 ${sidebarCollapsed ? 'px-4' : 'px-8'}` so the top position never changes

**2. Fix layout** -- In collapsed mode, stack the logo and toggle vertically (centered) instead of using `justify-between` in a tiny 72px row:
- Collapsed: `flex flex-col items-center gap-3` (logo on top, toggle below)
- Expanded: `flex items-center justify-between` (current horizontal layout)

**3. Add text transition** -- The "CHRONICLE" text already conditionally renders; the width transition on the sidebar handles the visual smoothness. With the padding fix, the logo won't jump.

### Exact change (lines 1254-1275):
```tsx
<div className={`py-8 ${sidebarCollapsed ? 'px-4' : 'px-8'} transition-all duration-300`}>
  <div className={`flex ${sidebarCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
      <div className="w-10 h-10 rounded-xl bg-[#4a5f7f] flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 flex-shrink-0">C</div>
      {!sidebarCollapsed && (
        <div className="font-black uppercase tracking-tighter text-2xl leading-none text-white whitespace-nowrap overflow-hidden">Chronicle</div>
      )}
    </div>
    <Tooltip delayDuration={0}>
      ... (toggle button unchanged)
    </Tooltip>
  </div>
</div>
```

## Result
- The "C" logo stays at the exact same vertical position during collapse -- no jumping
- The toggle button moves below the logo when collapsed (fits naturally in 72px width)
- The horizontal width transition remains smooth via the existing `transition-all duration-300` on the aside

## Files Modified
1. `src/pages/Index.tsx` -- sidebar header padding and layout fix (lines 1254-1275)
