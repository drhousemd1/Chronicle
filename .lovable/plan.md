
# Fix Missing "EDITABLE" Badge in Your Stories Modal

## Problem

The `ScenarioDetailModal` is not receiving the `allowRemix` prop when opened from the "Your Stories" page. The tile card correctly shows the pencil icon because it uses `publishedData?.allow_remix`, but the modal never gets this value passed to it.

## Root Cause

In `ScenarioHub.tsx` lines 260-281, the modal props don't include `allowRemix`:

```tsx
<ScenarioDetailModal
  open={detailModalOpen}
  onOpenChange={setDetailModalOpen}
  scenarioId={selectedScenario.id}
  title={selectedScenario.title}
  // ... other props
  isPublished={!!publicationStatus?.is_published}
  // MISSING: allowRemix={publicationStatus?.allow_remix}
  onPlay={() => { ... }}
/>
```

## Solution

Add the missing `allowRemix` prop to the `ScenarioDetailModal` component in `ScenarioHub.tsx`:

```tsx
<ScenarioDetailModal
  open={detailModalOpen}
  onOpenChange={setDetailModalOpen}
  scenarioId={selectedScenario.id}
  title={selectedScenario.title}
  description={selectedScenario.description || ""}
  coverImage={selectedScenario.coverImage || ""}
  coverImagePosition={selectedScenario.coverImagePosition || { x: 50, y: 50 }}
  tags={selectedScenario.tags || []}
  contentThemes={selectedContentThemes || undefined}
  isOwned={!selectedScenario.isBookmarked}
  isPublished={!!publicationStatus?.is_published}
  allowRemix={publicationStatus?.allow_remix}  // <-- ADD THIS LINE
  onPlay={() => {
    onPlay(selectedScenario.id);
    setDetailModalOpen(false);
  }}
  onEdit={() => {
    onEdit(selectedScenario.id);
    setDetailModalOpen(false);
  }}
  onUnpublish={handleUnpublish}
/>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ScenarioHub.tsx` | Add `allowRemix={publicationStatus?.allow_remix}` prop to ScenarioDetailModal (around line 270) |

## Result

After this fix, the modal for "Acotar" will show both badges:

```
Acotar
[PUBLISHED] [EDITABLE]
```
