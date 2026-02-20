

# Fix Creator Profile Width, Avatar Size, and "Remove from Gallery" Button

## 1. Creator Profile Full Width

**File**: `src/pages/CreatorProfile.tsx` (line 179)

Remove `max-w-4xl mx-auto` from the content wrapper so it uses full page width, matching PublicProfileTab.

Change: `max-w-4xl mx-auto px-6 py-10 space-y-8` to `px-6 py-10 space-y-6`

## 2. Publisher Avatar Size in ScenarioDetailModal

**File**: `src/components/chronicle/ScenarioDetailModal.tsx` (line 351)

Increase the publisher avatar from `w-10 h-10` (40px) to `w-14 h-14` (56px) so it matches the character avatars below.

## 3. "Remove from Gallery" Button Placement

**File**: `src/components/chronicle/ScenarioDetailModal.tsx`

Move the "Remove from Gallery" button out of the ScrollArea (right column) and into the left column, directly below the action buttons (Edit/Play or Like/Save/Play). It will be a full-width button spanning the same width as the action row above it, similar to how the "Reposition" button works elsewhere.

**Current structure:**
```text
Left Column:                Right Column (ScrollArea):
  Cover Image                 Title, Synopsis, Characters...
  [Edit] [Play]               ...scrollable content...
                              [Remove from Gallery] <-- buried in scroll
```

**New structure:**
```text
Left Column:                Right Column (ScrollArea):
  Cover Image                 Title, Synopsis, Characters...
  [Edit] [Play]               ...scrollable content (no button here)
  [Remove from Gallery]
```

The button will use the same ghost styling but span full width of the left column, placed with a small gap below the action buttons.
