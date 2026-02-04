

# Redesign Scene Gallery Layout: Buttons Next to HintBox

## Overview

Move the action buttons from the section header to sit alongside the hint box, and update the hint text to be shorter and more scannable.

---

## Changes

### 1. Update SceneGalleryActionButtons Label

**File:** `src/components/chronicle/SceneGalleryActionButtons.tsx` (line 50)

Change button text from "Upload Scene" to "Upload Image":

```tsx
// Current
<span className="whitespace-nowrap">{isUploading ? "Uploading..." : "Upload Scene"}</span>

// Updated
<span className="whitespace-nowrap">{isUploading ? "Uploading..." : "Upload Image"}</span>
```

---

### 2. Restructure Scene Gallery Section Layout

**File:** `src/components/chronicle/WorldTab.tsx` (lines 612-646)

**Current structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: [Icon] Scene Gallery          [Buttons here]   │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  HintBox (full width)                           │    │
│  └─────────────────────────────────────────────────┘    │
│  Grid of scene images...                                │
└─────────────────────────────────────────────────────────┘
```

**New structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: [Icon] Scene Gallery                            │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ ┌─────────────┐ │
│  │  HintBox (shorter text)            │ │  [Upload]   │ │
│  │  • Upload images for scenes        │ │  [AI Gen]   │ │
│  │  • Add "tags" for each image       │ └─────────────┘ │
│  │  • Background adapts to tags       │                 │
│  │  • Recommend: 1024x768, 4:3        │                 │
│  └────────────────────────────────────┘                 │
│  Grid of scene images...                                │
└─────────────────────────────────────────────────────────┘
```

**Code changes:**

1. **Remove buttons from header** - Change `justify-between` to just flex items, remove SceneGalleryActionButtons

2. **Add flex row for HintBox + Buttons** - Create a horizontal layout inside the content area:

```tsx
{/* Scene Gallery Section - Dark Theme */}
<section>
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Header - No buttons now */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
      <svg .../>
      <h2 className="text-white text-xl font-bold tracking-tight">Scene Gallery</h2>
    </div>
    
    <div className="p-6">
      <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
        {/* New flex row: HintBox + Buttons */}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <HintBox hints={[
              "Upload images to be used for different scenes.",
              "Add \"tags\" for each image.",
              "Background adapts based on tags mentioned in dialog.",
              "Recommend: 1024x768, 4:3 aspect ratio."
            ]} />
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <SceneGalleryActionButtons
              onUploadFromDevice={() => fileInputRef.current?.click()}
              onSelectFromLibrary={...}
              onGenerateClick={() => setShowSceneGenModal(true)}
              disabled={isUploading || isGeneratingScene}
              isUploading={isUploading}
              isGenerating={isGeneratingScene}
            />
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" ... />
        
        {/* Scene grid below */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          ...
        </div>
      </div>
    </div>
  </div>
</section>
```

---

### 3. Updated Hint Text

New shorter bullet points:
- Upload images to be used for different scenes.
- Add "tags" for each image.
- Background adapts based on tags mentioned in dialog.
- Recommend: 1024x768, 4:3 aspect ratio.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/SceneGalleryActionButtons.tsx` | Line 50: "Upload Scene" → "Upload Image" |
| `src/components/chronicle/WorldTab.tsx` | Lines 612-646: Move buttons next to HintBox, update hint text |

