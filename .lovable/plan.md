
# Fix Gallery Card - Complete Rewrite

## The Problems (Honest Assessment)

| Issue | Root Cause |
|-------|------------|
| Glitchy hover/corners | Multiple conflicting CSS transitions on container + image + overlay |
| No publisher on card | Publisher info is fetched but never rendered in `GalleryScenarioCard` |
| Counters wrong position | They're in a flex row at left, should be bottom-right |
| Text glitching | `transition-colors` on title conflicts with container transitions |
| Modal missing counters | Conditional rendering `{!isOwned &&` hiding stats |

## Solution: Simplify and Fix

### File: `src/components/chronicle/GalleryScenarioCard.tsx`

**Complete rewrite with these specific fixes:**

### 1) Simplify transitions to prevent glitches
Remove conflicting transitions. Use only:
- Container: `transition-transform duration-300` (just the lift)
- Image: `transition-transform duration-500` (just the zoom)
- No transition on gradient, no transition on title color

### 2) Add publisher info to bottom-left
```tsx
{/* Bottom Left - Publisher */}
<div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
  <div className="w-6 h-6 rounded-full bg-white/20 overflow-hidden">
    {published.publisher?.avatar_url ? (
      <img src={published.publisher.avatar_url} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-bold">
        {published.publisher?.username?.charAt(0)?.toUpperCase() || '?'}
      </div>
    )}
  </div>
  <span className="text-xs text-white/70 font-medium truncate max-w-[100px]">
    {published.publisher?.username || 'Anonymous'}
  </span>
</div>
```

### 3) Move counters to bottom-right
```tsx
{/* Bottom Right - Stats */}
<div className="absolute bottom-4 right-4 flex items-center gap-3 z-10">
  <span className="flex items-center gap-1 text-[10px] font-bold text-white/60">
    <Eye className="w-3 h-3" /> {published.view_count}
  </span>
  <span className="flex items-center gap-1 text-[10px] font-bold text-white/60">
    <Heart className="w-3 h-3" /> {published.like_count}
  </span>
  <span className="flex items-center gap-1 text-[10px] font-bold text-white/60">
    <Bookmark className="w-3 h-3" /> {published.save_count}
  </span>
  <span className="flex items-center gap-1 text-[10px] font-bold text-white/60">
    <Play className="w-3 h-3" /> {published.play_count}
  </span>
</div>
```

### 4) Restructure card layout
The current bottom info section tries to do too much. New structure:

```text
┌─────────────────────────────────────┐
│ [Remixable]              [SFW/NSFW] │  <- Top badges (existing)
│                                     │
│         (Cover Image)               │
│                                     │
│     [Like] [Save] [Play]            │  <- Hover actions (existing)
│                                     │
│─────────────────────────────────────│  <- Gradient starts
│ Title                               │
│ Description (2 lines)               │
│                                     │
│ [👤 Username]    [👁 12 ❤ 5 🔖 3 ▶ 8] │  <- Bottom row
└─────────────────────────────────────┘
```

### 5) Final structure
```tsx
<div className="group relative cursor-pointer" onClick={onViewDetails}>
  <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-800 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-transform duration-300 group-hover:-translate-y-3 ring-1 ring-slate-900/5 relative">
    
    {/* Badges - Top */}
    {/* ... existing badge code ... */}
    
    {/* Cover Image */}
    {scenario?.cover_image_url ? (
      <img
        src={scenario.cover_image_url}
        alt={scenario.title}
        style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
        <span className="font-black text-white/10 text-6xl">{scenario?.title?.charAt(0) || '?'}</span>
      </div>
    )}
    
    {/* Gradient Overlay - NO transition */}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
    
    {/* Hover Actions - Center */}
    <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
      {/* Like, Save, Play buttons */}
    </div>
    
    {/* Title & Description - Mid-bottom */}
    <div className="absolute inset-x-0 bottom-12 px-5 pointer-events-none z-10">
      <h3 className="text-lg font-black text-white leading-tight truncate">
        {scenario?.title || "Untitled Story"}
      </h3>
      <p className="text-xs text-white/70 line-clamp-2 mt-1">
        {scenario?.description || "No description."}
      </p>
    </div>
    
    {/* Bottom Bar - Publisher left, Stats right */}
    <div className="absolute inset-x-0 bottom-0 h-10 px-4 flex items-center justify-between z-10 pointer-events-none">
      {/* Publisher - Left */}
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-white/20 overflow-hidden">
          {/* avatar */}
        </div>
        <span className="text-[10px] text-white/60 font-medium truncate max-w-[80px]">
          {published.publisher?.username || 'Anon'}
        </span>
      </div>
      
      {/* Stats - Right */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5 text-[9px] text-white/50">
          <Eye className="w-2.5 h-2.5" /> {published.view_count}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] text-white/50">
          <Heart className="w-2.5 h-2.5" /> {published.like_count}
        </span>
        <span className="flex items-center gap-0.5 text-[9px] text-white/50">
          <Play className="w-2.5 h-2.5" /> {published.play_count}
        </span>
      </div>
    </div>
  </div>
</div>
```

## Key Changes Summary

1. **Remove `transition-all`** from container - use only `transition-transform`
2. **Remove `transition-colors`** from title - prevents glitching
3. **Remove `transition-opacity`** from gradient - static opacity
4. **Add publisher info** - bottom-left with avatar + username
5. **Move stats to bottom-right** - Eye, Heart, Play icons with counts
6. **Simplify bottom section** - separate positioning for title block vs bottom bar
7. **Use `absolute inset-0`** on image - ensures it fills the rounded container properly

## Files Changed

- `src/components/chronicle/GalleryScenarioCard.tsx` - Complete rewrite

## Why This Will Work

The glitches are caused by `transition-all` which tries to animate everything including border-radius changes. By being explicit about what transitions (`transition-transform` only), we prevent the stuttering. Adding the publisher and fixing counter positions are straightforward additions.
