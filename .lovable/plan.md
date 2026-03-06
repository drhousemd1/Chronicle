

## Fix: Show More of Sky Images Without Letterboxing

### Problem
`object-cover` on a narrow horizontal panel crops these tall sky images heavily, showing only a tiny zoomed-in portion. `object-contain` would show the full image but leave ugly letterbox bars.

### Solution
Use `object-cover` (keeps full bleed, no bars) but give the panel significantly more height so the crop is much less aggressive. Since these are sky images with no focal point, a taller panel naturally reveals more of each image.

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

**Line 3279** — Add `min-h-[200px]` to the section so the images have more vertical room to breathe, drastically reducing how much gets cropped while keeping `object-cover` for zero letterboxing:

```tsx
className="flex-shrink-0 rounded-xl p-4 border border-slate-200 shadow-lg transition-all duration-700 relative overflow-hidden min-h-[200px]"
```

**Line 3287** — Keep `object-cover` (no letterboxing guaranteed) but add `object-center` explicitly to ensure even distribution of any remaining crop:

```tsx
className={`absolute inset-0 w-full h-full object-cover object-center rounded-xl transition-opacity duration-700 ${
  currentTimeOfDay === time ? 'opacity-100' : 'opacity-0'
}`}
```

This keeps full-bleed coverage (zero bars) while showing substantially more of each sky image.

