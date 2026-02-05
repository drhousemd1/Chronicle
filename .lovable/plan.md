

# Rework Chat Interface Character Cards and Edit Modal

## Summary

This plan addresses four issues:
1. Remove redundant "View character card" text link from main and side character cards
2. Add missing "Delete character" option to the main character card dropdown menu
3. Remove the Edit/Editing toggle button from the CharacterEditModal header
4. Restyle the CharacterEditModal to match the dark charcoal theme used in the Scenario Builder CharactersTab

---

## Current State Analysis

**Issue 1: Redundant "View character card" link**
- Main character cards in `ChatInterfaceTab.tsx` (lines 2144-2150) have both a 3-dot menu that opens the edit modal AND a "View character card" text link
- Side character cards in `SideCharacterCard.tsx` (lines 83-89) have the same redundancy

**Issue 2: Missing delete option for main characters**
- The dropdown menu for main characters only shows "Edit for this session" (lines 2161-2166)
- Side character cards correctly show both Edit and Delete options

**Issue 3: Edit/Editing toggle button**
- The `CharacterEditModal.tsx` has a toggle button (lines 453-462) that switches between View and Edit modes
- The user reports this is unnecessary since fields are editable in both states

**Issue 4: Modal styling doesn't match Scenario Builder**
- Current modal uses light theme: `bg-slate-50`, `border-slate-200`, white backgrounds
- Scenario Builder uses dark charcoal theme: `bg-[#2a2a2f]`, `bg-[#4a5f7f]` headers, `border-white/10`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Remove "View character card" link from main character cards, add Delete option to dropdown |
| `src/components/chronicle/SideCharacterCard.tsx` | Remove "View character card" text link |
| `src/components/chronicle/CharacterEditModal.tsx` | Remove Edit/Editing toggle, apply dark charcoal theme styling |

---

## Technical Changes

### 1. ChatInterfaceTab.tsx - Main Character Cards

**Remove the "View character card" link (lines 2144-2150):**

```tsx
// DELETE THESE LINES:
{/* View character card link */}
<button
  onClick={() => openCharacterEditModal(char)}
  className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors"
>
  View character card
</button>
```

**Add Delete option to dropdown menu (around line 2165):**

```tsx
<DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-lg z-50">
  <DropdownMenuItem onClick={() => openCharacterEditModal(char)}>
    <Pencil className="w-4 h-4 mr-2" />
    Edit character
  </DropdownMenuItem>
  <DropdownMenuItem 
    onClick={() => handleDeleteMainCharacter(char.id)}
    className="text-red-600 focus:text-red-600 focus:bg-red-50"
  >
    <Trash2 className="w-4 h-4 mr-2" />
    Delete character
  </DropdownMenuItem>
</DropdownMenuContent>
```

**Add handler for deleting main characters:**

```tsx
// Handler to delete a main character - opens confirmation dialog
const handleDeleteMainCharacter = (charId: string) => {
  setCharacterToDelete(charId);
  setIsMainCharacterDelete(true);
  setIsDeleteDialogOpen(true);
};
```

**Add state to track if deleting main vs side character:**

```tsx
const [isMainCharacterDelete, setIsMainCharacterDelete] = useState(false);
```

**Update confirmation handler to support both types:**

```tsx
const confirmDeleteCharacter = async () => {
  if (!characterToDelete) return;
  
  try {
    if (isMainCharacterDelete) {
      // Remove from scenario characters
      const updatedCharacters = appData.characters.filter(c => c.id !== characterToDelete);
      // Propagate update through parent
      // Note: This may need to trigger onUpdateCharacters callback
    } else {
      await supabaseData.deleteSideCharacter(characterToDelete);
      // Update local ref and propagate
    }
    toast.success('Character deleted');
  } catch (error) {
    console.error('Failed to delete character:', error);
    toast.error('Failed to delete character');
  } finally {
    setIsDeleteDialogOpen(false);
    setCharacterToDelete(null);
    setIsMainCharacterDelete(false);
  }
};
```

---

### 2. SideCharacterCard.tsx - Remove "View character card" Link

**Remove lines 83-89:**

```tsx
// DELETE THESE LINES:
{/* View character card link */}
<button
  onClick={onStartEdit}
  className="text-xs text-purple-500 hover:text-purple-600 hover:underline transition-colors"
>
  View character card
</button>
```

---

### 3. CharacterEditModal.tsx - Remove Toggle & Restyle

**Remove the Edit/Editing toggle button (lines 453-462):**

```tsx
// DELETE THESE LINES:
{/* Edit toggle button */}
<Button
  variant={isEditMode ? "default" : "outline"}
  size="sm"
  onClick={() => setIsEditMode(!isEditMode)}
  className="gap-2"
>
  <Pencil className="w-4 h-4" />
  {isEditMode ? 'Editing' : 'Edit'}
</Button>
```

**Remove isEditMode state and always show fields as editable:**

```tsx
// REMOVE:
const [isEditMode, setIsEditMode] = useState(!viewOnly);

// REMOVE viewOnly-related useEffect

// Change isEditMode references to always be true (editing mode)
```

**Apply dark charcoal theme to match Scenario Builder:**

**Header styling update:**
```tsx
<DialogHeader className="px-6 py-4 border-b border-white/20 bg-[#4a5f7f]">
  <DialogTitle className="text-lg font-bold text-white">
    Edit Character
  </DialogTitle>
  <p className="text-xs text-white/70 mt-1">
    Changes apply only to this playthrough
  </p>
</DialogHeader>
```

**Main content area:**
```tsx
<DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-[#2a2a2f] border-white/10">
```

**ScrollArea background:**
```tsx
<ScrollArea className="flex-1 max-h-[calc(90vh-140px)] bg-[#2a2a2f]">
  <div className="p-6">
```

**Section wrapper update:**
```tsx
const Section: React.FC<{...}> = ({ title, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center gap-2">
      <h4 className="text-xs font-black text-white uppercase tracking-wider">{title}</h4>
      <div className="flex-1 h-px bg-white/20" />
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);
```

**FieldInput component update for dark theme:**
```tsx
const FieldInput: React.FC<{...}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 text-sm bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:ring-blue-500/20 focus:border-blue-500"
    />
  </div>
);
```

**Section panels update (Physical Appearance, Currently Wearing, etc.):**
```tsx
<Section title="Physical Appearance" className="p-5 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
```

**Footer update:**
```tsx
<DialogFooter className="px-6 py-5 border-t border-white/20 bg-[#4a5f7f] gap-3">
  <Button
    variant="outline"
    onClick={() => onOpenChange(false)}
    disabled={isSaving}
    className="bg-zinc-900 hover:bg-zinc-800 text-white border-white/20"
  >
    Cancel
  </Button>
  <Button
    onClick={handleSave}
    disabled={isSaving}
    className="bg-blue-600 hover:bg-blue-500 text-white"
  >
    {isSaving ? 'Saving...' : 'Save Changes'}
  </Button>
</DialogFooter>
```

---

## Visual Result

**Character Cards (Main & Side):**
- 3-dot menu only (no redundant text link)
- Dropdown shows "Edit character" and "Delete character" options

**Edit Modal (Dark Theme):**
- Steel blue header (`#4a5f7f`) with white text
- Dark charcoal body (`#2a2a2f`) with subtle inner containers
- Dark input fields with white text
- No Edit/Editing toggle - modal opens in edit mode by default
- Blue "Save Changes" button, dark "Cancel" button

---

## Additional Considerations

- The `viewOnly` prop on CharacterEditModal can be removed entirely since we're removing the toggle
- All references to `isEditMode` conditional rendering should be updated to always show edit mode
- The delete functionality for main characters may require coordination with the parent component's state management

