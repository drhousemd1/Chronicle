

# Image Library Feature Implementation Plan

## Overview

This plan adds a comprehensive "Image Library" feature that allows users to organize, store, and access their images from anywhere in the application. The feature includes:

1. A new "Image Library" navigation tab with folder-based organization
2. A universal image picker modal for selecting images from the library
3. Updates to all existing image upload locations to support "Upload from Library"

---

## Architecture Summary

```text
+------------------------+     +------------------------+     +------------------------+
|     Image Library      |     |   Image Library Picker |     |   Existing Uploads     |
|        Page            |     |        Modal           |     |   (6 locations)        |
+------------------------+     +------------------------+     +------------------------+
         |                              |                              |
         v                              v                              v
+------------------------------------------------------------------------------------+
|                          Supabase Storage: image_library bucket                     |
+------------------------------------------------------------------------------------+
         |                              |
         v                              v
+------------------------------------------------------------------------------------+
|                          Database Tables: image_folders, library_images            |
+------------------------------------------------------------------------------------+
```

---

## Database Schema

### New Tables

**1. `image_folders` - Stores user-created folders**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users, NOT NULL |
| name | text | Folder name, NOT NULL |
| description | text | Optional description |
| thumbnail_image_id | uuid | Foreign key to library_images (nullable) |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

**2. `library_images` - Stores images within folders**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to auth.users, NOT NULL |
| folder_id | uuid | Foreign key to image_folders, NOT NULL |
| image_url | text | Supabase Storage URL, NOT NULL |
| filename | text | Original filename for display |
| is_thumbnail | boolean | If true, this is the folder thumbnail |
| created_at | timestamptz | Default now() |

### RLS Policies

Both tables will have standard user isolation policies:
- Users can only view/create/update/delete their own folders and images
- Standard USING and WITH CHECK expressions: `auth.uid() = user_id`

### Storage Bucket

- Create new public bucket: `image_library`
- Images stored at path: `{user_id}/{folder_id}/{filename}`

---

## New Types (src/types.ts)

```typescript
export type ImageFolder = {
  id: string;
  userId: string;
  name: string;
  description: string;
  thumbnailImageId: string | null;
  thumbnailUrl: string | null;  // Computed from thumbnailImageId
  imageCount: number;           // Computed from library_images
  createdAt: number;
  updatedAt: number;
};

export type LibraryImage = {
  id: string;
  userId: string;
  folderId: string;
  imageUrl: string;
  filename: string;
  isThumbnail: boolean;
  createdAt: number;
};
```

---

## Component Architecture

### 1. ImageLibraryTab (New Page)

**Location**: `src/components/chronicle/ImageLibraryTab.tsx`

**Features**:
- Grid of folder cards matching ScenarioHub styling (aspect-ratio 2/3, rounded-2xl, premium shadows)
- "New Folder" skeleton card for creating folders
- Hover reveals "Edit" and "Open" buttons (like Your Stories "Edit"/"Play")
- Trash icon in top-right on hover for deletion
- Folder card shows:
  - Thumbnail image (or first image, or placeholder)
  - Folder name
  - Description (truncated)
  - Image count badge

**States**:
- Folder grid view (default)
- Folder detail view (shows images inside selected folder)

### 2. FolderDetailView (Sub-component)

**Location**: Part of `ImageLibraryTab.tsx`

**Features**:
- Grid of image thumbnails (aspect-square for images)
- Star icon overlay to set as folder thumbnail
- Delete icon on hover
- Upload button in header
- Back button to return to folder list
- Editable folder name/description in header

### 3. FolderEditModal (New Component)

**Location**: `src/components/chronicle/FolderEditModal.tsx`

**Features**:
- Edit folder name and description
- Simple dialog with Input and TextArea fields

### 4. ImageLibraryPickerModal (Universal Picker)

**Location**: `src/components/chronicle/ImageLibraryPickerModal.tsx`

**Purpose**: Allows selecting an image from the library to use anywhere in the app

**Features**:
- Two-column layout:
  - Left: List of folders (scrollable)
  - Right: Grid of images in selected folder
- Search/filter by folder name
- "Select" button to confirm selection
- Returns the selected image URL to the caller

**Props**:
```typescript
interface ImageLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}
```

---

## Data Service Updates (src/services/supabase-data.ts)

### New Functions

```typescript
// Folders
export async function fetchImageFolders(): Promise<ImageFolder[]>
export async function createImageFolder(userId: string, name: string, description?: string): Promise<ImageFolder>
export async function updateImageFolder(id: string, patch: { name?: string; description?: string; thumbnailImageId?: string }): Promise<void>
export async function deleteImageFolder(id: string, userId: string): Promise<void>

// Images
export async function fetchFolderImages(folderId: string): Promise<LibraryImage[]>
export async function uploadLibraryImage(userId: string, folderId: string, file: Blob, filename: string): Promise<LibraryImage>
export async function deleteLibraryImage(id: string, imageUrl: string): Promise<void>
export async function setImageAsThumbnail(imageId: string, folderId: string): Promise<void>
```

---

## Navigation Update (src/pages/Index.tsx)

Add new sidebar item after "Character Library":

```typescript
<SidebarItem 
  active={tab === "image_library"} 
  label="Image Library" 
  icon={<IconsList.Images />}  // New icon
  onClick={() => { setTab("image_library"); }} 
  collapsed={sidebarCollapsed} 
/>
```

Add new TabKey to types:
```typescript
export type TabKey = "hub" | "characters" | "world" | "conversations" | "model_settings" | "builder" | "chat_interface" | "image_library";
```

---

## Upload Location Updates

All existing "Upload Image" buttons will be enhanced with a dropdown or dual-button approach:

### Locations to Update (6 total)

| Location | File | Current Behavior | New Behavior |
|----------|------|------------------|--------------|
| Character Avatar (Scenario Builder) | `CharactersTab.tsx` | Single "Upload Image" button | Dropdown: "From Device" / "From Library" |
| Character Avatar (Session Edit Modal) | `CharacterEditModal.tsx` | Single "Upload Image" button | Dropdown: "From Device" / "From Library" |
| Cover Image (Scenario Builder) | `WorldTab.tsx` | Single "Upload Image" button | Dropdown: "From Device" / "From Library" |
| Scene Images (Scenario Builder) | `WorldTab.tsx` | Single "+ Upload Scene" button | Dropdown: "From Device" / "From Library" |
| Hub Background | `BackgroundPickerModal.tsx` | Single "+ Upload Background" button | Dropdown: "From Device" / "From Library" |
| Sidebar Background | `SidebarThemeModal.tsx` | Single "+ Upload" button | Dropdown: "From Device" / "From Library" |

### UI Pattern: Upload Source Dropdown

Instead of changing all buttons to dropdowns, create a reusable component:

```typescript
// src/components/chronicle/UploadSourceMenu.tsx

interface UploadSourceMenuProps {
  onUploadFromDevice: () => void;
  onUploadFromLibrary: () => void;
  disabled?: boolean;
  label?: string;  // Default: "Upload Image"
  variant?: 'primary' | 'ghost';
  className?: string;
}

export const UploadSourceMenu: React.FC<UploadSourceMenuProps> = ({...}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} disabled={disabled} className={className}>
          {label || "Upload Image"} <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onUploadFromDevice}>
          <Upload className="mr-2 h-4 w-4" />
          Upload from Device
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onUploadFromLibrary}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Upload from Library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## Implementation Phases

### Phase 1: Database & Storage Setup
1. Create `image_folders` table with RLS
2. Create `library_images` table with RLS
3. Create `image_library` storage bucket
4. Add type definitions to `src/types.ts`
5. Add data service functions to `src/services/supabase-data.ts`

### Phase 2: Image Library Page
1. Create `ImageLibraryTab.tsx` component
2. Create `FolderEditModal.tsx` component
3. Add "Image Library" to sidebar navigation
4. Update `TabKey` type
5. Wire up the new tab in `Index.tsx`

### Phase 3: Image Library Picker Modal
1. Create `ImageLibraryPickerModal.tsx` component
2. Implement folder browsing and image selection
3. Add proper loading states and empty states

### Phase 4: Upload Location Integration
1. Create `UploadSourceMenu.tsx` reusable component
2. Update `CharactersTab.tsx` - character avatar upload
3. Update `CharacterEditModal.tsx` - session avatar upload
4. Update `WorldTab.tsx` - cover image and scene uploads
5. Update `BackgroundPickerModal.tsx` - hub background upload
6. Update `SidebarThemeModal.tsx` - sidebar background upload

---

## Visual Design Specifications

### Folder Card (Grid View)

Matches ScenarioHub cards exactly:
- `aspect-[2/3]` ratio
- `rounded-[2rem]` corners
- Premium shadow: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Hover: `-translate-y-3`, scale thumbnail
- Gradient overlay at bottom for text readability
- Name in bold, description in italic

### Image Grid (Folder Detail)

- `aspect-square` thumbnails
- `rounded-xl` corners
- Hover reveals:
  - Star icon (top-left) to set as folder thumbnail
  - Trash icon (top-right) to delete

### Empty States

- Folder list empty: "Create your first folder" CTA
- Folder empty: "Upload images to this folder" CTA

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/chronicle/ImageLibraryTab.tsx` | Main library page with folder grid and detail view |
| `src/components/chronicle/FolderEditModal.tsx` | Modal for editing folder name/description |
| `src/components/chronicle/ImageLibraryPickerModal.tsx` | Universal modal for selecting library images |
| `src/components/chronicle/UploadSourceMenu.tsx` | Reusable dropdown for upload source selection |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add ImageFolder, LibraryImage types; update TabKey |
| `src/services/supabase-data.ts` | Add folder/image CRUD functions |
| `src/pages/Index.tsx` | Add sidebar item, state, and tab rendering |
| `src/components/chronicle/CharactersTab.tsx` | Replace upload button with UploadSourceMenu |
| `src/components/chronicle/CharacterEditModal.tsx` | Replace upload button with UploadSourceMenu |
| `src/components/chronicle/WorldTab.tsx` | Replace cover/scene upload buttons with UploadSourceMenu |
| `src/components/chronicle/BackgroundPickerModal.tsx` | Replace upload button with UploadSourceMenu |
| `src/components/chronicle/SidebarThemeModal.tsx` | Replace upload button with UploadSourceMenu |

## Database Migration

```sql
-- Create image_folders table
CREATE TABLE public.image_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New Folder',
  description text DEFAULT '',
  thumbnail_image_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create library_images table
CREATE TABLE public.library_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.image_folders(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  filename text DEFAULT '',
  is_thumbnail boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for thumbnail
ALTER TABLE public.image_folders 
ADD CONSTRAINT fk_thumbnail_image 
FOREIGN KEY (thumbnail_image_id) REFERENCES public.library_images(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.image_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_images ENABLE ROW LEVEL SECURITY;

-- Policies for image_folders
CREATE POLICY "Users can view own folders" ON public.image_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own folders" ON public.image_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.image_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.image_folders FOR DELETE USING (auth.uid() = user_id);

-- Policies for library_images
CREATE POLICY "Users can view own images" ON public.library_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own images" ON public.library_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON public.library_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON public.library_images FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('image_library', 'image_library', true);

-- Storage policies
CREATE POLICY "Users can upload to image_library" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'image_library' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view image_library" ON storage.objects FOR SELECT USING (bucket_id = 'image_library');
CREATE POLICY "Users can delete own image_library files" ON storage.objects FOR DELETE USING (
  bucket_id = 'image_library' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Expected User Flow

### Creating and Using a Library Image

1. User clicks "Image Library" in sidebar
2. Sees empty state with "Create your first folder" CTA
3. Clicks to create folder, enters name "Character Portraits"
4. Opens folder, clicks "Upload Images"
5. Selects multiple images from device
6. Images appear in grid with upload progress
7. Clicks star icon on favorite image to set as folder thumbnail
8. Returns to folder grid, sees thumbnail on "Character Portraits" card

### Using Library Image in Character Builder

1. User is editing a character in Scenario Builder
2. Clicks "Upload Image" dropdown
3. Selects "Upload from Library"
4. Picker modal opens showing all folders
5. Clicks "Character Portraits" folder
6. Sees images in that folder
7. Clicks desired image and confirms selection
8. Character avatar updates with selected image

---

## Optimization Considerations

- Images are compressed before upload (using existing `resizeImage` utility)
- Folder list includes image count without loading all images
- Picker modal lazy-loads images when folder is selected
- Thumbnails are optimized for grid display

