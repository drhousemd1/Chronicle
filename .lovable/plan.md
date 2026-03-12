

# Unify Like & Save Button Colors Across Cards and Detail Modal

## Problem
The card tile hover buttons use solid **rose-500** (Like) and **amber-500** (Save) backgrounds when active, but the detail modal uses faint 20% opacity tints. Inactive states in the modal are identical gray — no color differentiation at all.

## Approach
Match the modal buttons to the card tile color language while respecting the Shadow Surface button spec for sizing/typography.

### File: `src/components/chronicle/StoryDetailModal.tsx` (lines 318-342)

**Like button** (line 318-327):
- Active: `bg-rose-500 border-rose-500 text-white` (solid, matching tile)
- Inactive: `bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] hover:bg-rose-500/20 hover:text-rose-400`

**Save button** (line 333-342):
- Active: `bg-amber-500 border-amber-500 text-white` (solid, matching tile)
- Inactive: `bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] hover:bg-amber-500/20 hover:text-amber-400`

Also apply the standard button typography (`text-[10px] font-bold uppercase tracking-wider`) and shadow (`shadow-[0_10px_30px_rgba(0,0,0,0.35)]`) to match the Play and Remove from Gallery buttons.

### Style Guide Update
Update the corresponding Like/Save button entries in `StyleGuideTool.tsx` to reflect the new active/inactive color specs.

