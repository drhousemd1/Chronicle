

## Fix Dropdown Menu Theming Issues

Two issues identified:

### 1. "Set Theme" dropdown uses light theme (default popover)
**File:** `src/components/chronicle/ChatInterfaceTab.tsx` (line 3269)

The `DropdownMenuContent` at line 3269 has no dark theme classes — it falls back to the default `bg-popover` (light). Need to add `bg-zinc-800 border-white/10 text-zinc-200` to match the SidebarThemeModal upload dropdown.

### 2. Character card dropdown hover is white instead of gray
**File:** `src/components/chronicle/ChatInterfaceTab.tsx` (line 3191) and `src/components/chronicle/SideCharacterCard.tsx` (line 96)

Both character card dropdowns use `bg-zinc-800` for the dark variant, but the `DropdownMenuItem` default `focus:bg-accent` resolves to a light accent color. Need to add `hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white` to each `DropdownMenuItem` in these dark dropdowns — matching the pattern already used in `SidebarThemeModal.tsx`.

### Changes

**`ChatInterfaceTab.tsx`:**
- Line 3269: Add `bg-zinc-800 border-white/10 text-zinc-200` to the "Set Theme" `DropdownMenuContent`
- Line 3270: Add `hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white` to the "Set Theme" `DropdownMenuItem`
- Lines 3192-3202: Add `hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white` to both menu items in the dark variant of the main character card dropdown (the `sidebarBgIsLight` branch)
- Also fix the delete item's `focus:bg-red-50` to `focus:!bg-red-900/30` for dark theme consistency

**`SideCharacterCard.tsx`:**
- Lines 97-108: Add same dark hover classes (`hover:!bg-zinc-700 focus:!bg-zinc-700 focus:!text-white`) to both menu items in the dark variant
- Fix delete item `focus:bg-red-50` → `focus:!bg-red-900/30`

