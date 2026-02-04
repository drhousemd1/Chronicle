

# Update ScenarioHub Modal with Content Themes, Styling & Unpublish Button

## Overview

The "Your Stories" page modal (ScenarioHub) is missing the Content Themes display, uses incorrect SFW/NSFW badge colors, and lacks an unpublish option for published scenarios. This plan addresses all four issues:

1. Add content themes display to the owner's detail modal
2. Update SFW/NSFW badge to use blue-400/vibrant red colors
3. Apply dark theme styling to match Scenario Builder
4. Add unpublish button for published scenarios

---

## Changes Required

### 1. SFW/NSFW Badge Color Updates

Update both `GalleryScenarioCard.tsx` and `ScenarioDetailModal.tsx`:

| Current | Updated |
|---------|---------|
| SFW: `bg-black/50 text-white/80` | SFW: `bg-blue-500/20 text-blue-400` |
| NSFW: `bg-rose-950/80 text-rose-400` | NSFW: `bg-red-500/20 text-red-400` (more vibrant) |

Applies to:
- Gallery card badges
- Modal badges (if displayed)

---

### 2. ScenarioHub - Pass Content Themes to Modal

**File:** `src/components/chronicle/ScenarioHub.tsx`

Current implementation:
- Only passes basic scenario metadata (title, description, tags)
- Missing content themes, publication status

New implementation:
- Fetch content themes when scenario is selected
- Fetch publication status for the scenario
- Pass to ScenarioDetailModal

```tsx
// Add state for content themes and publication status
const [selectedContentThemes, setSelectedContentThemes] = useState<ContentThemes | null>(null);
const [publicationStatus, setPublicationStatus] = useState<PublishedScenario | null>(null);

// On scenario selection, fetch content themes and publication status
const handleViewDetails = async (id: string) => {
  const scenario = registry.find(s => s.id === id);
  if (scenario) {
    setSelectedScenario(scenario);
    setDetailModalOpen(true);
    
    // Fetch content themes
    try {
      const themes = await fetchContentThemes(id);
      setSelectedContentThemes(themes);
    } catch (e) {
      setSelectedContentThemes(null);
    }
    
    // Fetch publication status
    try {
      const published = await getPublishedScenario(id);
      setPublicationStatus(published);
    } catch (e) {
      setPublicationStatus(null);
    }
  }
};
```

Pass to modal:
```tsx
<ScenarioDetailModal
  ...
  contentThemes={selectedContentThemes}
  isPublished={!!publicationStatus?.is_published}
  onUnpublish={handleUnpublish}
/>
```

---

### 3. ScenarioDetailModal - Add Unpublish Support & Fix Display

**File:** `src/components/chronicle/ScenarioDetailModal.tsx`

Add new props:
```tsx
interface ScenarioDetailModalProps {
  // ... existing props
  isPublished?: boolean;
  onUnpublish?: () => void;
}
```

Display content themes block for owner mode:
- Currently only shows for `!isOwned` (gallery items)
- Update to show for both owner and gallery scenarios
- The content themes block is already in the component, just need to ensure it renders for owned scenarios too

Add unpublish button (for published, owned scenarios):
```tsx
{isOwned && isPublished && onUnpublish && (
  <button
    onClick={handleUnpublish}
    className="px-6 py-3 bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-white/70 rounded-xl font-bold text-sm shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
  >
    <GlobeX className="w-4 h-4" />
    Remove from Gallery
  </button>
)}
```

---

### 4. Modal Dark Theme Styling Updates

Update the modal background and elements to match Scenario Builder dark theme:

| Element | Current | Updated |
|---------|---------|---------|
| Modal background | `bg-slate-900` | `bg-[#1a1a1f]` (darker charcoal) |
| Content themes box | `bg-white/5` | `bg-[#2a2a2f]` with steel blue header |
| Buttons (Edit Story) | `bg-white text-slate-900` | Premium shadow surface style |
| Action buttons | Various | Match Scenario Builder button styling |
| Border colors | `ring-white/10` | `border-[hsl(var(--ui-border))]` |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Fetch content themes + publication status, pass to modal, add unpublish handler |
| `src/components/chronicle/ScenarioDetailModal.tsx` | Add isPublished/onUnpublish props, unpublish button, show content themes for owner, update styling |
| `src/components/chronicle/GalleryScenarioCard.tsx` | Update SFW/NSFW badge colors |

---

## Visual Summary

### Updated Badge Colors

```text
SFW Badge:
- Background: bg-blue-500/20 (semi-transparent blue)
- Text: text-blue-400 (vibrant blue matching "+ Add custom" buttons)
- Maintains same padding/size

NSFW Badge:
- Background: bg-red-500/20 (semi-transparent red)
- Text: text-red-400 (vibrant red, equally saturated as blue)
- Maintains same padding/size
```

### Modal Layout for Owned Scenarios

```text
+----------------------------------------------------------+
|                                           [X Close]      |
|                                                          |
|  [Cover Image]   Title                                   |
|                                                          |
|                  Description...                          |
|                                                          |
|                  +----------------------------------+    |
|                  | Content Themes Box               |    |
|                  | Genre: ...                       |    |
|                  | Character Types: ...             |    |
|                  | Story Origin: ...                |    |
|                  | Trigger Warnings: ...            |    |
|                  +----------------------------------+    |
|                                                          |
|                  #tag1  #tag2  #tag3                     |
|                                                          |
|                  [Edit Story]  [Play Story]              |
|                  [Remove from Gallery] <- if published   |
|                                                          |
|  ──────────────────────────────────────────────────────  |
|  Characters                                              |
|  (avatar) (avatar) (avatar)                              |
+----------------------------------------------------------+
```

---

## Implementation Details

### Content Themes Rendering Logic

Update the condition to show content themes:
```tsx
// Current: {contentThemes && (
// Updated: Always show if contentThemes exists
{contentThemes && (contentThemes.genres.length > 0 || 
                   contentThemes.characterTypes.length > 0 || 
                   contentThemes.origin.length > 0 || 
                   contentThemes.triggerWarnings.length > 0 ||
                   contentThemes.customTags.length > 0) && (
  <div className="space-y-3 mb-4 p-4 bg-[#2a2a2f] rounded-xl border border-white/10">
    {/* ... content themes display ... */}
  </div>
)}
```

### Unpublish Handler in ScenarioHub

```tsx
const handleUnpublish = async () => {
  if (!selectedScenario) return;
  try {
    await unpublishScenario(selectedScenario.id);
    setPublicationStatus(null);
    toast.success('Your story has been removed from the Gallery');
  } catch (e) {
    console.error('Failed to unpublish:', e);
    toast.error('Failed to remove from gallery');
  }
};
```

---

## Summary of Style Updates

| Component | Style Change |
|-----------|--------------|
| SFW badge | `bg-blue-500/20 text-blue-400` with existing padding |
| NSFW badge | `bg-red-500/20 text-red-400` with existing padding |
| Modal background | Darker charcoal `bg-[#1a1a1f]` |
| Content themes box | `bg-[#2a2a2f]` matching Scenario Builder |
| Edit Story button | Premium shadow surface style |
| Remove from Gallery button | Premium shadow surface style with subtle warning tone |

