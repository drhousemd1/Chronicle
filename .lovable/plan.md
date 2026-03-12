

# Add Crisp Text Shadow to All Card Pages

## Scope
Three files need the same `textShadow` style applied to their bottom info containers, matching what's already on `StoryHub.tsx`:

### 1. `src/components/chronicle/GalleryStoryCard.tsx` — line 141
Add `style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}` to the bottom info `<div>`.

### 2. `src/pages/CreatorProfile.tsx` — line 321
Same `style` prop on the bottom info `<div>`.

### 3. `src/components/account/PublicProfileTab.tsx` — line 498
Same `style` prop on the bottom info `<div>`.

All three are identical one-line additions — no other changes needed.

