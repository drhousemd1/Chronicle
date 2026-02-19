

# Add Edit Button and Customization to Admin Tool Tiles

## Problem

The admin panel tool tiles are missing the "Edit" hover button that the Image Library folders have. Currently, hovering only shows an "Open" button. The user wants to be able to edit the tool's title, description, and thumbnail image -- matching the Image Library's dual-button hover pattern (Edit + Open).

## Changes

### File: `src/pages/Admin.tsx`

**1. Add Edit + Open dual-button hover overlay (matching Image Library exactly)**

Replace the current single "Open" button hover overlay with the exact same pattern from `ImageLibraryTab.tsx` lines 478-498:
- Two side-by-side buttons: "Edit" (white bg) and "Open" (blue bg)
- Same classes: `bg-white text-slate-900` for Edit, `bg-blue-600 text-white` for Open
- `e.stopPropagation()` on Edit to prevent opening the tool
- `bg-black/30` overlay background (not `bg-black/50`)

**2. Add editable tool state**

- Convert the hardcoded `TOOLS` array into default values
- Store tool customizations (title, description, thumbnailUrl) in the `app_settings` table under a `"admin_tool_meta"` key
- Load on mount, merge with defaults, and allow editing

**3. Add an AdminToolEditModal component**

Create a modal matching `FolderEditModal` styling with:
- Title input field
- Description textarea
- Thumbnail section with Upload / Remove buttons (uploads to `avatars` storage bucket under `admin/tools/`)
- Save and Cancel buttons

**4. Wire up the Edit button to open the modal**

- Track `editingTool` state (similar to `editingFolder` in ImageLibraryTab)
- On save, persist to `app_settings` and update local state

### File: `src/components/admin/AdminToolEditModal.tsx` (new)

A modal component following the exact same pattern as `FolderEditModal`:
- Dialog with title "Edit Tool"
- Fields: Tool Name (Input), Description (Textarea), Thumbnail (image preview + Upload/Remove buttons)
- Save writes to `app_settings` table
- Same button styling as FolderEditModal

## Technical Details

### Hover overlay change in `Admin.tsx`

From:
```tsx
<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 ...">
  <button>Open</button>
</div>
```

To:
```tsx
<div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/30">
  <button onClick={(e) => { e.stopPropagation(); setEditingTool(tool); }}
    className="px-4 py-2 bg-white text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-slate-100 transition-colors">
    Edit
  </button>
  <button onClick={(e) => { e.stopPropagation(); setActiveTool(tool.id); }}
    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-700 transition-colors">
    Open
  </button>
</div>
```

### State persistence

Tool metadata is stored in the `app_settings` table (already exists with admin-only write RLS) under the key `"admin_tool_meta"`, with a JSON value like:
```json
{
  "image_generation": {
    "title": "Image Generation",
    "description": "Edit art style names...",
    "thumbnailUrl": "/images/styles/cinematic-2-5d.png"
  }
}
```

On mount, fetch from `app_settings` and merge with hardcoded defaults so new tools always appear even before customization.

## Files Modified

| File | Change |
|---|---|
| `src/pages/Admin.tsx` | Add Edit+Open dual hover buttons, editable tool state with app_settings persistence, edit modal integration |
| `src/components/admin/AdminToolEditModal.tsx` | New modal for editing tool title, description, and thumbnail |

