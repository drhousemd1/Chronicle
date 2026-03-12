

# Restore Deleted Story Builder Swatches

## Problem
During the Ghost White consolidation, I incorrectly deleted approximately 12-15 swatch cards from the Story Builder section. The section currently has only **5 swatches** (Slate Blue, Dark Charcoal, Soft Black, Graphite, Ghost White) when it should have ~18-20 covering all colors used across `WorldTab.tsx`, `CharactersTab.tsx`, `CharacterEditModal.tsx`, and `Index.tsx` (Story Builder tab).

## Missing Swatches to Restore
Based on source code audit of the Story Builder page components, these swatches were deleted and must be restored:

| Color | Name | Used For |
|-------|------|----------|
| `#64748b` | Cool Gray | Sidebar subtitles, description text (text-slate-500) |
| `rgba(24,24,27,0.5)` | Smoke Black | Input field backgrounds (bg-zinc-900/50) |
| `#3f3f46` | Mid Charcoal | Input field borders (border-zinc-700) |
| `#3b82f6` | True Blue | Add buttons, links, focus rings, active pills |
| `#a1a1aa` | Silver Gray | Form labels, placeholder text (text-zinc-400) |
| `#71717a` | Stone Gray | Secondary text, chevrons (text-zinc-500) |
| `#27272a` | Dark Zinc | Dropdown/select backgrounds (bg-zinc-800) |
| `hsl(210,20%,93%)` | Pale Silver | Light text on dark panels (text-slate-200) |
| `#e2e8f0` | Light Steel | Divider lines, secondary text |
| `rgba(58,58,63,0.3)` | Muted Charcoal | Card inner backgrounds (bg-[#3a3a3f]/30) |
| `#d4d4d8` | Light Zinc | Bright text on dark containers |
| `rgba(248,250,252,0.5)` | Frosted White | Focused/active text state |
| `#ef4444` | Bright Red | Validation error borders/text |
| `#52525b` | Ash Gray | Dashed add-button borders (border-zinc-600) |
| `#ffffff` | White | Header text, button text, panel titles |

## Plan

### Step 1 — Add missing swatch cards to Story Builder section
Insert ~14 `SwatchCardV2` entries after the existing 5 swatches (before the closing `</div>` at line 1082). Each card will include:
- `color`, `name`, `value`, `token` matching the source code
- `locations` listing all Story Builder usages found in source
- `pageSpecific` / `appWide` flags
- `locationImages` arrays referencing existing `guide_images/story-builder/` screenshots where available (some may reference shared screenshots)

### Step 2 — Verify no duplicates
Ensure no swatch appears twice within the Story Builder section.

### Files Modified
- `src/components/admin/styleguide/StyleGuideTool.tsx` — add ~14 SwatchCardV2 entries to Story Builder section

