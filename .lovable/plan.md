

## Fix Delete Character Hover Color

The delete menu items currently use `focus:!bg-red-900/30` (dark red background) for hover/focus. The user wants the same gray hover as other items, keeping only the red text.

### Changes

**`src/components/chronicle/ChatInterfaceTab.tsx` (line 3198):**
- Replace `focus:!bg-red-900/30 hover:!bg-zinc-700` → `focus:!bg-zinc-700 hover:!bg-zinc-700`

**`src/components/chronicle/SideCharacterCard.tsx` (line 104):**
- Replace `focus:!bg-red-900/30 hover:!bg-zinc-700` → `focus:!bg-zinc-700 hover:!bg-zinc-700`

Both keep `text-red-600 focus:text-red-600` so the text stays red for semantic meaning, but the background hover is neutral gray like every other item.

