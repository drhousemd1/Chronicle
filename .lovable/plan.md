
# Sandbox Feature Transfer — Master Tracker

## Source Documents
- `docs/transfer/Additional_Instructions.md` — 14-prompt execution plan
- `docs/transfer/chronicle_transfer_pack.md` — Full source blocks

## Features Being Transferred
| ID | Feature | Status |
|----|---------|--------|
| F | chatCanvasColor + chatBubbleColor Persistence (types.ts, utils.ts) | ⬜ |
| B | Story Transfer Library (story-transfer.ts) | ⬜ |
| A | UI Audit System (schema, utils, findings, page) | ⬜ |
| B | Story Export/Import Modals | ⬜ |
| C | Character Builder Left Nav Redesign (CharactersTab.tsx) | ⬜ |
| D+E | Chat Interface Card/Avatar UX + Bubble Color Controls (ChatInterfaceTab.tsx) | ⬜ |
| - | StyleGuideTool.tsx audit button | ⬜ |
| - | App.tsx route wiring | ⬜ |
| - | Index.tsx full wiring | ⬜ |

## Prompt Execution Status

| # | Target File(s) | Status | Notes |
|---|---------------|--------|-------|
| 1 | `src/types.ts` + `src/utils.ts` | ✅ DONE | chatCanvasColor + chatBubbleColor added to UiSettings type, defaults, and normalization |
| 2 | `src/lib/story-transfer.ts` | ⬜ TODO | New file, pure lib |
| 3 | `src/lib/ui-audit-schema.ts` | ⬜ TODO | New file, types only |
| 4 | `src/lib/ui-audit-utils.ts` | ⬜ TODO | New file, depends on schema |
| 5 | `src/data/ui-audit-findings.ts` | ⬜ TODO | New file, depends on schema |
| 6 | `StoryExportFormatModal.tsx` | ⬜ TODO | New component |
| 7 | `StoryImportModeModal.tsx` | ⬜ TODO | New component |
| 8 | `CharactersTab.tsx` | ⬜ TODO | Large merge — Character Builder nav |
| 9 | `ChatInterfaceTab.tsx` | ⬜ TODO | Large merge — Avatar UX + Color Controls |
| 10 | `StyleGuideTool.tsx` | ⬜ TODO | Add UI Audit button |
| 11 | `src/pages/style-guide/ui-audit.tsx` | ⬜ TODO | New page |
| 12 | `src/App.tsx` | ⬜ TODO | Add route |
| 13 | `src/pages/Index.tsx` | ⬜ TODO | Wire all imports + UI |
| 14 | Full verification | ⬜ TODO | Orphan + wiring check |

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
