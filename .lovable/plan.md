
Audit first — your feedback is correct. The modal is still a forked, older mini-editor, not the builder shell.

Color/style verification from source before any changes:
- `src/components/chronicle/CharacterEditModal.tsx:1051` → modal header still uses `bg-white` + `border-b border-ghost-white` (old chrome)
- `src/components/chronicle/CharacterEditModal.tsx:1274` → avatar frame still uses `bg-zinc-800 border-2 border-ghost-white`
- `src/components/chronicle/CharacterEditModal.tsx:1328` → name field still uses `bg-zinc-900/50 border border-ghost-white`
- `src/components/chronicle/CharacterEditModal.tsx:1334-1340` → Change button still uses old bordered surface classes (`border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] hover:bg-ghost-white`)
- `src/components/chronicle/CharacterEditModal.tsx:1892` → custom-section value input still uses `bg-zinc-900/50 border border-ghost-white`
- `src/components/chronicle/CharacterEditModal.tsx:1958-1964` → Add Category button still uses old bordered surface classes
- `src/components/chronicle/CharacterEditModal.tsx:1249, 1453` → character mode is still a long-scroll `grid grid-cols-1 lg:grid-cols-3` with stacked sections
- `src/components/chronicle/CharacterEditModal.tsx` search audit → no `activeTraitSection`, `sidebarTraitNavItems`, `TraitSidebarButton`, `SidebarProgressRing`, or `TabFieldNavigator` at all, so the real builder nav architecture is missing entirely

Exact builder references to match:
- `src/components/chronicle/CharactersTab.tsx:1287-1389` → real Character Builder shell = left nav + `TabFieldNavigator`
- `src/components/chronicle/CharactersTab.tsx:697-713` → active-section routing (`activeTraitSection`, nav item list, `isTraitVisible`)
- `src/components/chronicle/CharactersTab.tsx:1406-1602` → 1:1 Basics layout (avatar left, fields/toggles right)
- `src/components/chronicle/CharactersTab.tsx:458-474` → section shell/header/inner-card styling
- `src/components/chronicle/CharactersTab.tsx:487-529` → exact hardcoded row geometry, including lock alignment
- `src/components/chronicle/CharactersTab.tsx:1569, 1586, 1703` → exact toggle tray / builder button styles

Style Guide registry cross-reference:
- `src/components/admin/styleguide/StyleGuideTool.tsx:748` → `#4a5f7f` Slate Blue
- `src/components/admin/styleguide/StyleGuideTool.tsx:749` → `#2a2a2f` Dark Charcoal
- `src/components/admin/styleguide/StyleGuideTool.tsx:752` → `rgba(248,250,252,0.3)` Ghost White
- `src/components/admin/styleguide/StyleGuideTool.tsx:756` → `#3b82f6` True Blue
- `src/components/admin/styleguide/StyleGuideTool.tsx:766` → `#52525b` Ash Gray
- Builder-only exact literals also verified in source and will be copied exactly, not approximated: `#5a7292`, `#1c1c1f`, `#2e2e33`, `#3c3e47`, `#303035`

Design approach:
Stop “restyling the fork.” Rebuild the modal’s character mode around the same builder architecture so it cannot drift again.

Implementation plan:
1. Replace the modal’s character-mode body with the real Character Builder shell
- Add the same left sidebar nav used in `CharactersTab`:
  - header tile with avatar + mapped position
  - section buttons with `TraitSidebarButton`
  - `SidebarProgressRing`
  - custom-section nav entries
- Add `activeTraitSection` routing so only one section shows at a time instead of the current long-scroll stack
- Use `TabFieldNavigator` for the content pane exactly like the builder

2. Rebuild the modal “Basics” section to match 1:1
- Replace the current stacked avatar/info block with the real builder profile layout from `CharactersTab:1406-1602`
- Use the exact two-column grid, `120px 1fr` age/identity sub-grid, builder toggle trays, and builder field classes
- Replace old name field and Change button styling with builder-equivalent surfaces/buttons

3. Replace modal-specific row components with shared builder row primitives
- Use the real builder `HardcodedRow`/`ExtraRow` geometry so lock icons align exactly
- This fixes the current mismatch where the modal rows are close visually but not structurally identical
- If needed, wire the same sparkle-button slot/layout so row spacing matches perfectly even when enhancement is disabled

4. Remove all remaining legacy modal surfaces/buttons/borders
- Replace every remaining `border-ghost-white`, `bg-zinc-900/50`, `bg-zinc-800`, old bordered buttons, and `hover:bg-white/10` leftovers inside character mode
- Normalize custom-section structured rows, freeform rows, avatar frame, section controls, and Add Category button to builder classes only

5. Keep scenario mode aligned to Story Builder patterns
- Scenario mode already uses the right story-builder section shell in `StoryCardView`, so only normalize any leftover modal chrome/buttons that still use old tokens
- Do not invent new colors; only reuse exact story-builder/source literals already verified

6. Prevent future drift
- Preferred implementation: extract shared builder primitives/state helpers from `CharactersTab` into reusable chronicle builder components/hooks, then use them in both places
- That way Character Builder and CharacterEditModal render from the same source of truth instead of two near-duplicates

Validation after implementation:
- Character mode shows builder sidebar nav instead of long-scroll sections
- Basics section matches builder geometry exactly
- Lock icons align identically to builder rows
- No old `border-ghost-white` / `bg-zinc-900/50` / bordered legacy buttons remain in character mode
- Scenario mode still matches the Story Builder styling
- No new palette entries required; Style Guide swatches stay unchanged because all colors already exist in source
