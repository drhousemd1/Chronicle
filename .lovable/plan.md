

## Plan: Fix tooltip positioning for chat interface time mode hint

### Problem
The tooltip on the "Manual/Automatic" label in the chat interface displays off-screen to the left, getting cut off behind the navigation bar. This is because `side="top"` positions it above but it can still overflow horizontally.

### Fix in `src/components/chronicle/ChatInterfaceTab.tsx` (line 3239)

Change the `TooltipContent` from `side="top"` to `side="right"` so the tooltip renders to the right of the icon instead of above it, preventing it from being clipped by the left sidebar.

```tsx
<TooltipContent side="right" className="text-xs normal-case tracking-normal">
```

