

## Fix: Preload & Crossfade Time Background Images

### Problem
When switching time phases, the browser fetches the new image on demand, causing a blank flash while it loads.

### Solution
Render all four background images simultaneously as stacked `<img>` elements, toggling opacity. This preloads every image on mount and crossfades between them with no blank gap.

### Changes

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

**1. Replace the inline `style={{ backgroundImage }}` approach** (line 3278-3283) with four stacked `<img>` tags inside the section, each with `absolute inset-0` positioning. Only the active time's image gets `opacity-100`; others get `opacity-0`. All use `transition-opacity duration-700` for smooth crossfade.

```tsx
<section className="flex-shrink-0 rounded-xl p-4 border border-slate-200 shadow-lg transition-all duration-700 relative overflow-hidden">
  {/* Preloaded background images — all mounted, only active one visible */}
  {(['sunrise', 'day', 'sunset', 'night'] as const).map((time) => (
    <img
      key={time}
      src={getTimeBackgroundImage(time)}
      alt=""
      className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-700 ${
        currentTimeOfDay === time ? 'opacity-100' : 'opacity-0'
      }`}
    />
  ))}
  {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/20 rounded-xl" />
  <div className="relative z-10">
    {/* ...existing content unchanged... */}
  </div>
</section>
```

Remove the `bg-cover bg-center` classes and the `style` prop from the section since images are now `<img>` elements.

This ensures all four images are loaded into the DOM on first render — subsequent transitions are instant crossfades with zero network delay.

