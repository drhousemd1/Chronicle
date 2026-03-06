

## Add Background Images to Day/Time UI Panel

### What
Replace the CSS gradient backgrounds on the Day/Time control panel with the 4 uploaded images (Sunrise, Midday, Sunset, Night), one per time phase.

### How

1. **Copy images to `public/images/time-backgrounds/`**:
   - `user-uploads://Sunrise_background.png` → `public/images/time-backgrounds/sunrise.png`
   - `user-uploads://midday_background.png` → `public/images/time-backgrounds/day.png`
   - `user-uploads://Sunset.png` → `public/images/time-backgrounds/sunset.png`
   - `user-uploads://Night.png` → `public/images/time-backgrounds/night.png`

   Using `public/` because these are static assets referenced via URL in inline styles, not imported as ES modules.

2. **Update `getTimeBackground()` in `ChatInterfaceTab.tsx`** (line 2301):
   - Remove the gradient class returns
   - Instead return an empty string (no bg class needed)

3. **Update the `<section>` element** (line 3282):
   - Add inline `style` with `backgroundImage` pointing to the correct time image via a helper
   - Add `bg-cover bg-center` classes for proper image fitting
   - Keep existing `rounded-xl`, `shadow-lg`, `transition-all`, `border` classes
   - Add a semi-transparent overlay inside the section (before content) to maintain text readability — a `<div className="absolute inset-0 bg-black/20 rounded-xl" />` with the section set to `relative overflow-hidden`

### File Changes

**`src/components/chronicle/ChatInterfaceTab.tsx`**:

```tsx
// Replace getTimeBackground (line 2301-2312)
const getTimeBackgroundImage = (time: TimeOfDay): string => {
  switch (time) {
    case 'sunrise': return '/images/time-backgrounds/sunrise.png';
    case 'day':     return '/images/time-backgrounds/day.png';
    case 'sunset':  return '/images/time-backgrounds/sunset.png';
    case 'night':   return '/images/time-backgrounds/night.png';
  }
};

// Update the section element (line 3282)
<section
  className="flex-shrink-0 rounded-xl p-4 border border-slate-200 shadow-lg transition-all duration-700 relative overflow-hidden bg-cover bg-center"
  style={{ backgroundImage: `url(${getTimeBackgroundImage(currentTimeOfDay)})` }}
>
  {/* Semi-transparent overlay for text readability */}
  <div className="absolute inset-0 bg-black/20 rounded-xl" />
  {/* Wrap existing content in relative z-10 container */}
  <div className="relative z-10">
    {/* ...existing panel content unchanged... */}
  </div>
</section>
```

The `getTimeTextColor` helper stays as-is (black text for sunrise/day/sunset, white for night).

