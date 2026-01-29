
# Implementation Plan: 6 UI Fixes

## Fix #1: Add Upload Source Menu to Character Edit Modal

**File:** `src/components/chronicle/CharacterEditModal.tsx`

**Problem:** The "Upload Image" button in the Edit Character modal only allows uploading from device - it should have the split dropdown with "From Device" and "From Library" options like other upload buttons in the app.

**Changes:**
- Import `UploadSourceMenu` component and required dependencies
- Replace the existing "Upload Image" button with `UploadSourceMenu` component
- Add a handler function for selecting an image from the library that sets the avatar URL in the draft

---

## Fix #2: Add AI Generate Button to Scene Gallery

**File:** `src/components/chronicle/WorldTab.tsx`

**Problem:** The Scene Gallery section only has an "Upload Scene" button - it needs an "AI Generate" button similar to the Cover Image section that opens a modal for entering a prompt and selecting a style.

**Changes:**
- Add state for `showSceneGenModal` and `isGeneratingScene`
- Create a new `SceneImageGenerationModal` component (or reuse `CoverImageGenerationModal` with modified dimensions for landscape 4:3)
- Add the "AI Generate" button next to the existing "Upload Scene" button
- Handle the generated image by creating a new scene entry

For simplicity, I will adapt the existing `CoverImageGenerationModal` by:
1. Creating a new edge function `generate-scene-image` for 4:3 landscape images
2. Or creating a new `SceneImageGenerationModal` that uses appropriate dimensions (1024x768)

---

## Fix #3: Make "NEW STORY" Text Black

**File:** `src/components/chronicle/ScenarioHub.tsx`

**Problem:** The "New Story" text on the placeholder card blends into the background because it uses `text-slate-400` which is too light.

**Changes:**
- Line 113: Change `text-slate-400` to `text-black` for the "New Story" span
- This will make the text clearly visible against the light background

---

## Fix #4: Add Settings Gear Button to Image Library Page

**File:** `src/components/chronicle/ImageLibraryTab.tsx` and `src/pages/Index.tsx`

**Problem:** The Image Library page header is missing the settings gear button that allows users to set the page background, unlike the "Your Stories" page which has this feature.

**Changes:**
1. Add state for Image Library backgrounds in `Index.tsx` (or reuse hub backgrounds):
   - `imageLibraryBackgrounds`, `selectedImageLibraryBackgroundId`, `isImageLibraryBackgroundModalOpen`
   
2. In `Index.tsx` header section for `image_library` tab:
   - Add the Settings dropdown with "Change Background" option (similar to hub tab at lines 1089-1107)

3. Pass the background settings to `ImageLibraryTab` or handle in the parent component

---

## Fix #5: Remove "Click to create" Text from Scenario Builder Nav

**File:** `src/pages/Index.tsx`

**Problem:** The Scenario Builder navigation item shows "Click to create" subtitle text which is unnecessary and cluttered.

**Changes:**
- Line 950: Remove the `subtitle` prop from the Scenario Builder `SidebarItem`
- Change from: `subtitle={activeId ? (activeMeta?.title || "Unsaved Draft") : "Click to create"}`
- Change to: `subtitle={activeId ? (activeMeta?.title || "Unsaved Draft") : undefined}`

---

## Fix #6: Replace Native Confirm Dialog with Styled AlertDialog

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`

**Problem:** The delete character confirmation uses the browser's native `confirm()` dialog which:
- Shows an ugly embedded URL at the top
- Appears at the top of the screen instead of centered
- Doesn't match the app's styling

**Changes:**
1. Add state for the delete confirmation dialog:
   - `isDeleteDialogOpen: boolean`
   - `characterToDelete: string | null`

2. Import and use the `AlertDialog` components from `@/components/ui/alert-dialog`

3. Replace the `confirm()` call (line 1619) with:
   - Set `characterToDelete` and open the dialog
   - Move the actual delete logic to the dialog's confirm handler

4. Add the AlertDialog JSX near other dialogs in the component:
   - Styled with white background, centered on screen
   - Shows "Are you sure you want to delete this character? This cannot be undone."
   - Has Cancel and Delete buttons matching the app's style

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/CharacterEditModal.tsx` | Add UploadSourceMenu for avatar upload |
| `src/components/chronicle/WorldTab.tsx` | Add AI Generate button + modal for Scene Gallery |
| `src/components/chronicle/ScenarioHub.tsx` | Change "New Story" text color to black |
| `src/pages/Index.tsx` | Add settings gear to Image Library header, remove Scenario Builder subtitle |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Replace confirm() with AlertDialog for delete character |

---

## Technical Notes

- The `UploadSourceMenu` component already exists and is used in other parts of the app (WorldTab for cover/scene uploads)
- The `AlertDialog` component from shadcn/ui is already installed and configured
- The scene generation will need either a new edge function or modification of the existing cover image function to support different aspect ratios
- Background settings for Image Library can either use a separate set of backgrounds or share with the hub backgrounds

