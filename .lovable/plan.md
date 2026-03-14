
# Sandbox Feature Transfer — Master Tracker

## Source Documents
- `docs/transfer/Additional_Instructions.md` — 14-prompt execution plan
- `docs/transfer/chronicle_transfer_pack.md` — Full source blocks

## Features Being Transferred
| ID | Feature | Status |
|----|---------|--------|
| F | chatCanvasColor + chatBubbleColor Persistence (types.ts, utils.ts) | ✅ |
| B | Story Transfer Library (story-transfer.ts) | ✅ |
| A | UI Audit System (schema, utils, findings, page) | 🔄 |
| B | Story Export/Import Modals | ✅ |
| C | Character Builder Left Nav Redesign (CharactersTab.tsx) | ✅ |
| D+E | Chat Interface Card/Avatar UX + Bubble Color Controls (ChatInterfaceTab.tsx) | ⬜ |
| - | StyleGuideTool.tsx audit button | ⬜ |
| - | App.tsx route wiring | ⬜ |
| - | Index.tsx full wiring | ⬜ |

## Prompt Execution Status

| # | Target File(s) | Status | Notes |
|---|---------------|--------|-------|
| 1 | `src/types.ts` + `src/utils.ts` | ✅ DONE | chatCanvasColor + chatBubbleColor added to UiSettings type, defaults, and normalization |
| 2 | `src/lib/story-transfer.ts` | ✅ DONE | New file created, turndown dependency added |
| 3 | `src/lib/ui-audit-schema.ts` | ✅ DONE | New file — 16 const arrays, 17 types, 7 interfaces for audit taxonomy |
| 4 | `src/lib/ui-audit-utils.ts` | ✅ DONE | New file — 8 utility functions: sortFindings, groupFindingsBy, countBySeverity, countByConfidence, getReviewedVsUnreviewed, countReviewStatus, getSystemicFindings, getQuickWins, getRequiresDesignDecision, getBatchableFindings |
| 5 | `src/data/ui-audit-findings.ts` | ✅ DONE | New file — 38 findings (uia-001 through uia-038), 11 interaction-state matrix rows (ism-001 through ism-011), 6 component-variant drift items (cvm-001 through cvm-006), 18 color consolidation plan items (color-plan-001 through color-plan-018), 19 review units, tokenDriftSnapshot |
| 6 | `src/components/chronicle/StoryExportFormatModal.tsx` | ✅ DONE | New component — 3 format options (Markdown, JSON, Word), uses Dialog/DialogContent |
| 7 | `src/components/chronicle/StoryImportModeModal.tsx` | ✅ DONE | New component — 2 mode options (Merge, Rewrite), imports StoryImportMode from story-transfer |
| 8 | `src/components/chronicle/CharactersTab.tsx` | ✅ DONE | Full file replacement — new left nav sidebar with card-style buttons, progress rings (SidebarProgressRing), character reference tile in blue header, nav image editor dialog, dark charcoal (#1a1b20) background, section-by-section visibility via activeTraitSection state. Changed model fallback from sandbox's grok-4-1 to existing grok-3 to match production codebase. |
| 9 | `ChatInterfaceTab.tsx` | ✅ DONE | Targeted merge — Avatar UX (expand/collapse/reposition tiles with drag, Done button, pointer handlers), Bubble Color Controls (color modal with hex inputs + color family labels, Palette button in footer), chatCanvasColor/chatBubbleColor derivation via normalizeHexColor, square avatar chips (rounded-md), removed hardcoded bubble borders, style={{ backgroundColor }} for canvas and bubbles, isExpandedTileInMainCharacters overflow handling |
| 10 | `StyleGuideTool.tsx` | ✅ DONE | Added `useNavigate` import, `openUiAudit` callback, UI Audit button in both narrow (horizontal) and desktop (sidebar) navs |
| 11 | `src/pages/style-guide/ui-audit.tsx` | ✅ DONE | New page — full 22-section audit dashboard with findings, color consolidation, interaction state matrix, component variant drift |
| 12 | `src/App.tsx` | ✅ DONE | Added UiAuditPage import and `/style-guide/ui-audit` route |
| 13 | `src/pages/Index.tsx` | ✅ DONE | Added story-transfer imports, Upload icon, state vars (export/import modals, file ref, notice), 7 handler functions, Import/Export buttons in Story Builder header, modal JSX renders, hidden file input. onUpdateUiSettings already wired. |
| 14 | Full verification | ⬜ TODO | Orphan + wiring check across all transferred files |

## Transfer Pack Source Block Locations (line numbers in chronicle_transfer_pack.md)
- `src/types.ts`: line 11507
- `src/utils.ts`: line 12138
- `src/lib/story-transfer.ts`: line 9812
- `src/lib/ui-audit-schema.ts`: line 21329
- `src/lib/ui-audit-utils.ts`: line 21565
- `src/data/ui-audit-findings.ts`: line 18967
- `StoryExportFormatModal.tsx`: line 9642
- `StoryImportModeModal.tsx`: line 9731
- `CharactersTab.tsx`: line 2893
- `ChatInterfaceTab.tsx`: line 5004
- `src/pages/style-guide/ui-audit.tsx`: line 17867
- `src/App.tsx`: line 95
- Index.tsx + CharactersTab + ChatInterfaceTab: large blocks throughout
