

# Replace Three-Dot Icons with Pencil Edit Icon on Character Tiles

## Summary
Change the `MoreVertical` (three dots) icon to `Pencil` (edit) icon on character tile card dropdown triggers in 3 files. The icon style matches the story builder's existing edit button (seen in the uploaded reference image).

## Changes

### 1. `src/components/chronicle/SideCharacterCard.tsx` (line 93)
- Replace `<MoreVertical className="w-4 h-4" />` with `<Pencil className="w-4 h-4" />`
- Remove `MoreVertical` from the import, `Pencil` is already imported

### 2. `src/components/chronicle/CharactersTab.tsx` (line 1451)
- Replace `<MoreVertical className="w-4 h-4" />` with `<Pencil className="w-4 h-4" />`
- Remove `MoreVertical` from the import, add `Pencil` if not already present

### 3. `src/components/chronicle/ChatInterfaceTab.tsx` (line 3854)
- Replace `<MoreVertical className="w-4 h-4" />` with `<Pencil className="w-4 h-4" />`
- **Only** the character tile dropdown (line 3854), NOT the message action dropdown (line 4278) which is a different context
- `Pencil` is already imported; remove `MoreVertical` only if the message dropdown (line 4278) doesn't use it — it does, so keep the import

