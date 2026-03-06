

## Plan: Fix tooltip overflow on chat interface mode hint

The tooltip with `side="right"` gets clipped by the background image/container. Change to `side="bottom"` so it renders below the icon where there's space, and add `max-w-[250px]` to constrain width.

### Change in `src/components/chronicle/ChatInterfaceTab.tsx` (line 3239)

```tsx
// From:
<TooltipContent side="right" className="text-xs normal-case tracking-normal">

// To:
<TooltipContent side="bottom" className="text-xs normal-case tracking-normal max-w-[250px]">
```

