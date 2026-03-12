

# Update Card Sub-Text Opacity to 70% — Complete List

Update `rgba(248,250,252,0.3)` to `rgba(248,250,252,0.7)` for all card-level sub-text (descriptions, stats, attributions) below titles. Excludes non-card UI like headers, buttons, placeholders, delete icons, and the StyleGuideTool (which documents colors).

## Files & Changes

### 1. `src/components/chronicle/GalleryStoryCard.tsx` (3 changes)
- Line 145: Description text
- Line 148: Stats counters
- Line 166: "Created by" attribution

### 2. `src/pages/CreatorProfile.tsx` (4 changes)
- Line 268: Stats header values
- Line 325: Card description text
- Line 328: Card stats counters
- Line 346: "Written by" attribution

### 3. `src/components/account/PublicProfileTab.tsx` (4 changes)
- Line 445: Stats header values
- Line 502: Card description text
- Line 505: Card stats counters
- Line 523: "Written by" attribution

### 4. `src/components/chronicle/StoryDetailModal.tsx` (2 changes)
- Line 458: Creator rating text (sub-text under title area)
- Line 578: Character name labels below avatars

### 5. `src/components/chronicle/GalleryHub.tsx` (1 change)
- Line 505: Empty state description text

### 6. `src/components/chronicle/ImageLibraryTab.tsx` (1 change)
- Line 614: Folder description text below folder title

### 7. `src/components/account/SubscriptionTab.tsx` (1 change)
- Line 63: Subtitle under "Choose Your Plan" heading

### 8. `src/components/account/AccountSettingsTab.tsx` (1 change)
- Line 64: "Basic access to all features" subtitle under plan tier

### 9. `src/components/chronicle/ReviewModal.tsx` (1 change)
- Line 146: Overall score number text

### Not changing (intentionally kept at 0.3):
- Header backgrounds (`bg-[rgba(...)]`) — not text
- Delete button icon colors — interactive hover states
- Placeholder text colors — input field styling
- "Load more" button text — interactive element
- Unpublish button text — interactive element
- "No characters yet" italic — empty state hint
- StyleGuideTool — documentation/reference component
- CharactersTab placeholder/delete — form UI, not card sub-text

**Total: 18 text opacity changes across 9 files.**

