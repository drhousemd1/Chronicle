
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
| C | Character Builder Left Nav Redesign (CharactersTab.tsx) | ⬜ |
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
| 8 | `CharactersTab.tsx` | ⬜ TODO | Large merge — Character Builder left nav redesign |
| 9 | `ChatInterfaceTab.tsx` | ⬜ TODO | Large merge — Avatar UX + Bubble Color Controls |
| 10 | `StyleGuideTool.tsx` | ⬜ TODO | Add UI Audit button |
| 11 | `src/pages/style-guide/ui-audit.tsx` | ⬜ TODO | New page — full audit dashboard |
| 12 | `src/App.tsx` | ⬜ TODO | Add route for /style-guide/ui-audit |
| 13 | `src/pages/Index.tsx` | ⬜ TODO | Wire all new imports + UI (export/import modals, bubble color controls, etc.) |
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
- `src/pages/style-guide/ui-audit.tsx`: line 17867
- `src/App.tsx`: line 95
- Index.tsx + CharactersTab + ChatInterfaceTab: large blocks throughout
