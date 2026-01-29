

# Fix: Image Library Background Picker

## Problem Summary

When clicking the gear icon on the "Image Library" page, the background picker modal shows:
1. Title says "Your Stories Background" (incorrect for Image Library page)
2. Cannot select the same image for both pages (selections are shared instead of independent)

Currently both pages share:
- Same modal open state (`isBackgroundModalOpen`)
- Same selection state (`selectedHubBackgroundId`)
- Same hardcoded title in the modal

## Recommended Solution: Shared Library, Separate Selections

Keep a **shared pool** of uploaded backgrounds but allow **independent selection per page**. This means:
- Users upload once, backgrounds appear in both pickers
- Each page (Your Stories, Image Library) maintains its own active background selection
- Modal title changes based on which page opened it

This approach is cleaner than duplicating the entire background system.

---

## Changes to Implement

### 1. Add title prop to BackgroundPickerModal

**File:** `src/components/chronicle/BackgroundPickerModal.tsx`

Add a `title` prop to the component:
- Update `BackgroundPickerModalProps` interface to include `title?: string`
- Use the prop with a default value: `title = "Your Backgrounds"`
- Replace hardcoded "Your Stories Background" with the `title` prop

### 2. Add separate state for Image Library in Index.tsx

**File:** `src/pages/Index.tsx`

Add new state variables:
- `selectedImageLibraryBackgroundId: string | null` (default: `null`)
- `isImageLibraryBackgroundModalOpen: boolean` (default: `false`)

### 3. Create separate handlers for Image Library background selection

**File:** `src/pages/Index.tsx`

Add new handler:
- `handleSelectImageLibraryBackground(id: string | null)` - sets the Image Library page's selected background

### 4. Update gear button for Image Library to use its own modal state

**File:** `src/pages/Index.tsx`

Change the Image Library gear button (around line 1118):
- From: `onClick={() => setIsBackgroundModalOpen(true)}`
- To: `onClick={() => setIsImageLibraryBackgroundModalOpen(true)}`

### 5. Render a second BackgroundPickerModal for Image Library

**File:** `src/pages/Index.tsx`

Add a second modal instance specifically for Image Library:
```jsx
<BackgroundPickerModal
  isOpen={isImageLibraryBackgroundModalOpen}
  onClose={() => setIsImageLibraryBackgroundModalOpen(false)}
  title="Image Library Background"
  selectedBackgroundId={selectedImageLibraryBackgroundId}
  backgrounds={hubBackgrounds}  // Shared pool
  onSelectBackground={handleSelectImageLibraryBackground}
  onUpload={handleUploadBackground}  // Shared upload
  onDelete={handleDeleteBackground}  // Shared delete
  isUploading={isUploadingBackground}
/>
```

### 6. Update existing modal to pass title prop

**File:** `src/pages/Index.tsx`

Update the existing BackgroundPickerModal (around line 1297):
- Add: `title="Your Stories Background"`

### 7. Apply background to Image Library page

**File:** `src/pages/Index.tsx`

Currently Image Library tab (line 1171-1173) has no background styling. Update to:
```jsx
{tab === "image_library" && (
  <div 
    className="relative w-full h-full"
    style={selectedImageLibraryBackgroundUrl ? {
      backgroundImage: `url(${selectedImageLibraryBackgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : undefined}
  >
    {selectedImageLibraryBackgroundUrl && (
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
    )}
    <ImageLibraryTab />
  </div>
)}
```

### 8. Add computed value for Image Library background URL

**File:** `src/pages/Index.tsx`

Add a computed variable similar to `selectedBackgroundUrl`:
```jsx
const selectedImageLibraryBackgroundUrl = selectedImageLibraryBackgroundId
  ? hubBackgrounds.find(bg => bg.id === selectedImageLibraryBackgroundId)?.imageUrl
  : null;
```

---

## Result After Implementation

| Feature | Before | After |
|---------|--------|-------|
| Modal title | Always "Your Stories Background" | Context-aware ("Your Stories Background" or "Image Library Background") |
| Selection behavior | Shared selection for both pages | Independent selection per page |
| Background library | Shared | Shared (unchanged) |
| Can use same image on both pages | No (blocked) | Yes (independent selections) |

---

## Files to Modify

1. `src/components/chronicle/BackgroundPickerModal.tsx` - Add `title` prop
2. `src/pages/Index.tsx` - Add Image Library background state, handlers, and second modal

---

## Technical Notes

- The shared `hubBackgrounds` array is still used for both modals - uploads and deletes affect both
- Each page has its own selection state so the same image can be "selected" on both pages simultaneously
- No database changes needed - we're only adding client-side selection state
- The empty state text in the modal ("Upload images to customize your hub background") should also be updated to be generic

