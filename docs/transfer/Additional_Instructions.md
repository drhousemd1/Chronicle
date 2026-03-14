# Chronicle — Sandbox Feature Transfer: Lovable Handoff

## Purpose

This document transfers completed sandbox features into the production Chronicle repo
using Lovable. Each prompt is atomic and sequenced by dependency order. Execute one
prompt, verify it completely, then proceed to the next. Do not batch prompts.

The source code in this document is authoritative. Lovable must not invent alternative
implementations. Every change must be wired end-to-end before the prompt is considered
complete.

---

## Features Being Transferred

| ID | Feature | Files Primarily Affected |
|----|---------|-------------------------|
| A | UI Audit System (style-guide route + data) | App.tsx, StyleGuideTool.tsx, ui-audit.tsx, ui-audit-schema.ts, ui-audit-utils.ts, ui-audit-findings.ts |
| B | Story Builder Import / Export | Index.tsx, StoryExportFormatModal.tsx, StoryImportModeModal.tsx, story-transfer.ts |
| C | Character Builder Left Nav Redesign | CharactersTab.tsx |
| D | Chat Interface Card + Avatar UX | ChatInterfaceTab.tsx |
| E | Chat Bubble + Color Controls | ChatInterfaceTab.tsx, types.ts |
| F | chatCanvasColor + chatBubbleColor Persistence | types.ts, utils.ts |

---

## Dependency Order — Execute Strictly in This Sequence

```
Prompt 1  →  src/types.ts + src/utils.ts          (Foundation — all other files depend on this)
Prompt 2  →  src/lib/story-transfer.ts             (Pure lib, no UI)
Prompt 3  →  src/lib/ui-audit-schema.ts            (Pure lib, no UI)
Prompt 4  →  src/lib/ui-audit-utils.ts             (Depends on schema)
Prompt 5  →  src/data/ui-audit-findings.ts         (Depends on schema)
Prompt 6  →  StoryExportFormatModal.tsx            (New component — no existing file)
Prompt 7  →  StoryImportModeModal.tsx              (New component — no existing file)
Prompt 8  →  CharactersTab.tsx                     (Large merge — Character Builder nav)
Prompt 9  →  ChatInterfaceTab.tsx                  (Large merge — Avatar UX + Color Controls)
Prompt 10 →  StyleGuideTool.tsx                    (Add UI Audit button)
Prompt 11 →  src/pages/style-guide/ui-audit.tsx   (New page — depends on audit libs)
Prompt 12 →  src/App.tsx                           (Add new route)
Prompt 13 →  src/pages/Index.tsx                  (Wire all new imports + UI)
Prompt 14 →  Full orphan + wiring verification
```

---

## Global Style Constraints — Re-Read Before Every Prompt

Repeat these in every prompt you send to Lovable. Lovable forgets style rules between prompts.

- Dark background system: primary canvas `#1a1b20`, secondary surfaces `zinc-800/zinc-900`
- No new Tailwind color values not already in the codebase
- No new component libraries — use existing `@/components/ui/*` and `@/components/chronicle/*` patterns
- Modals use `Dialog` / `DialogContent` from `@/components/ui/dialog`
- Buttons use existing variants from `@/components/chronicle/UI`
- No inline `style={}` overrides except where the source code explicitly uses them (color settings use inline style intentionally)
- Do not convert any functional component to a class component
- TypeScript strict — no implicit `any`, no `@ts-ignore` additions

---

## DO NOT TOUCH — Global List (Include in Every Prompt)

```
- supabase/functions/chat/index.ts
- src/services/llm.ts
- Any Supabase RLS policy or migration file
- src/services/supabase-data.ts (unless a prompt explicitly targets it)
- src/contexts/ModelSettingsContext.tsx
- src/hooks/use-auth.ts
- Authentication logic anywhere
```

---

---

# PROMPT 1 OF 14 — Foundation Types + Utilities

## Context

`src/types.ts` and `src/utils.ts` are the foundation layer. All subsequent prompts
depend on type definitions and utility functions being in place first. Two new
persistent settings fields (`chatCanvasColor`, `chatBubbleColor`) are being added
to the `UiSettings` type, and a `normalizeHexColor` utility is being added to utils.

## Task

Replace the full contents of `src/types.ts` and `src/utils.ts` with the source blocks
provided below. These are non-truncated complete files from the sandbox. Use full-file
replacement — do not attempt to merge inline.

## Implementation Guidance

- `src/types.ts` → full replacement with source block below
- `src/utils.ts` → full replacement with source block below
- After replacement, run TypeScript compilation check. Fix any import errors before declaring complete.
- Do not remove any type that existed in the previous file unless it is also absent from the source block below.

## Style Constraints

- No changes to visual output — these are pure type/utility files
- Do not add `export default` to any named export

## Constraints — Do Not Touch

- Do not modify any file outside of `src/types.ts` and `src/utils.ts` in this prompt
- Do not add new Supabase columns or migrations — type additions here are client-side only

## Source: src/types.ts

```ts
[PASTE FULL CONTENTS OF src/types.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Source: src/utils.ts

```ts
[PASTE FULL CONTENTS OF src/utils.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 1

- [ ] App compiles with no TypeScript errors after this change
- [ ] `UiSettings` type now includes `chatCanvasColor?: string` and `chatBubbleColor?: string`
- [ ] `normalizeHexColor` is exported from `src/utils.ts`
- [ ] No existing features are visually broken
- [ ] No console errors on app load

**Return to this document before sending Prompt 2.**

---

---

# PROMPT 2 OF 14 — Story Transfer Library

## Context

`src/lib/story-transfer.ts` does not exist in the production repo yet. It is a pure
utility library (no React, no UI) that handles JSON / Markdown / Word export and
multi-format import parsing for the Story Builder. Index.tsx will import from it in
Prompt 13.

## Task

Create `src/lib/story-transfer.ts` as a new file using the source block below.
Do not modify any existing file in this prompt.

## Implementation Guidance

- File location: `src/lib/story-transfer.ts`
- This is a new file — there is no existing file to merge into
- Exports required by later prompts: `exportScenarioToJson`, `exportScenarioToText`,
  `exportScenarioToWordDocument`, `importScenarioFromAny`, `StoryImportMode`
- The Word export uses RTF content with `.rtf` extension (Word-compatible)
- All imports within this file come from `@/types` and `@/utils` only — no external packages

## Style Constraints

- Pure TypeScript — no JSX
- No new npm packages — use only browser-native APIs and existing project imports

## Constraints — Do Not Touch

- Do not modify `src/types.ts`, `src/utils.ts`, or any component file
- Do not create any other file

## Source: src/lib/story-transfer.ts

```ts
[PASTE FULL CONTENTS OF src/lib/story-transfer.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 2

- [ ] File `src/lib/story-transfer.ts` exists and exports `exportScenarioToJson`, `exportScenarioToText`, `exportScenarioToWordDocument`, `importScenarioFromAny`, `StoryImportMode`
- [ ] No TypeScript errors in this file
- [ ] No other files were modified
- [ ] App still loads without errors

---

---

# PROMPT 3 OF 14 — UI Audit Schema

## Context

`src/lib/ui-audit-schema.ts` does not exist in the production repo. It defines all
TypeScript interfaces and union types used by the UI audit system. The audit utils
and audit findings files depend on it.

## Task

Create `src/lib/ui-audit-schema.ts` as a new file using the source block below.
Do not modify any existing file.

## Implementation Guidance

- File location: `src/lib/ui-audit-schema.ts`
- New file — no existing file to merge into
- Pure TypeScript types and interfaces — no React, no runtime code
- All downstream audit files import from this path

## Style Constraints

- No runtime code — types and interfaces only
- No default export — named exports only

## Constraints — Do Not Touch

- Do not modify any existing file in this prompt

## Source: src/lib/ui-audit-schema.ts

```ts
[PASTE FULL CONTENTS OF src/lib/ui-audit-schema.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 3

- [ ] File exists at `src/lib/ui-audit-schema.ts`
- [ ] No TypeScript errors
- [ ] No other files modified
- [ ] App loads without errors

---

---

# PROMPT 4 OF 14 — UI Audit Utilities

## Context

`src/lib/ui-audit-utils.ts` does not exist in production. It imports from
`src/lib/ui-audit-schema.ts` (created in Prompt 3) and exports grouping,
sorting, and counting utility functions for audit findings.

## Task

Create `src/lib/ui-audit-utils.ts` as a new file using the source block below.

## Implementation Guidance

- File location: `src/lib/ui-audit-utils.ts`
- New file — imports only from `@/lib/ui-audit-schema`
- Exports: `sortFindings`, `groupFindingsBy`, `countBySeverity`, `countByConfidence`,
  `getReviewedVsUnreviewed`, `countReviewStatus`, `getSystemicFindings`,
  `getQuickWins`, `getRequiresDesignDecision`, `getBatchableFindings`

## Style Constraints

- Pure TypeScript utility functions — no React, no JSX

## Constraints — Do Not Touch

- Do not modify any existing file in this prompt

## Source: src/lib/ui-audit-utils.ts

```ts
[PASTE FULL CONTENTS OF src/lib/ui-audit-utils.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 4

- [ ] File exists at `src/lib/ui-audit-utils.ts`
- [ ] All listed exports are present
- [ ] No TypeScript errors
- [ ] No other files modified

---

---

# PROMPT 5 OF 14 — UI Audit Findings Data

## Context

`src/data/ui-audit-findings.ts` does not exist in production. It is a static data
file that exports the actual audit finding objects, matrices, and progress data.
The audit page (Prompt 11) imports from it. It depends on types from
`src/lib/ui-audit-schema.ts`.

## Task

Create `src/data/ui-audit-findings.ts` as a new file using the source block below.

## Implementation Guidance

- File location: `src/data/ui-audit-findings.ts`
- New file — imports only from `@/lib/ui-audit-schema`
- Required exports (the audit page will import all of these):
  `uiAuditFindings`, `uiAuditProgress`, `uiAuditScope`, `uiAuditTaxonomy`,
  `uiAuditColorConsolidationPlan`, `uiAuditInteractionStateMatrix`,
  `uiAuditComponentVariantDriftMatrix`

## Constraints — Do Not Touch

- Do not modify any existing file in this prompt

## Source: src/data/ui-audit-findings.ts

```ts
[PASTE FULL CONTENTS OF src/data/ui-audit-findings.ts FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 5

- [ ] File exists at `src/data/ui-audit-findings.ts`
- [ ] All seven named exports listed above are present
- [ ] No TypeScript errors
- [ ] No other files modified

---

---

# PROMPT 6 OF 14 — StoryExportFormatModal Component

## Context

`src/components/chronicle/StoryExportFormatModal.tsx` does not exist in production.
It is a modal that presents three export format choices (Markdown, JSON, Word Document)
using a card-grid layout. Index.tsx will import it in Prompt 13.

## Task

Create `src/components/chronicle/StoryExportFormatModal.tsx` as a new file using
the source block below. Do not modify any existing file.

## Implementation Guidance

- New file — no merge needed
- Imports: `Dialog`/`DialogContent` from `@/components/ui/dialog`, icons from `lucide-react`, `cn` from `@/lib/utils`
- Exports: `StoryExportFormatModal` (named), `StoryExportFormat` (type)
- The modal uses a `sm:grid-cols-3` card layout with hover border and shadow effects
- Cards use `rounded-[28px]` border radius — do not change this
- Icon containers use `rounded-3xl` — do not change this
- The close button is hidden via `[&>button]:hidden` on DialogContent — this is intentional

## Style Constraints

- Background: `bg-zinc-900`
- Card background: `bg-zinc-800/45`
- No new color tokens — use existing zinc/sky/emerald/indigo Tailwind classes as in source
- Title: `text-4xl font-black tracking-tight` — do not reduce font size

## Constraints — Do Not Touch

- Do not modify any existing file in this prompt
- Do not change the export format options or their IDs (`markdown`, `json`, `word`)

## Source: src/components/chronicle/StoryExportFormatModal.tsx

```tsx
[PASTE FULL CONTENTS OF src/components/chronicle/StoryExportFormatModal.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 6

- [ ] File exists at `src/components/chronicle/StoryExportFormatModal.tsx`
- [ ] `StoryExportFormat` type and `StoryExportFormatModal` component are both exported
- [ ] No TypeScript errors
- [ ] No other files modified

---

---

# PROMPT 7 OF 14 — StoryImportModeModal Component

## Context

`src/components/chronicle/StoryImportModeModal.tsx` does not exist in production.
It is a modal that presents two import mode choices (Merge, Rewrite). It imports
`StoryImportMode` from `@/lib/story-transfer` (created in Prompt 2).

## Task

Create `src/components/chronicle/StoryImportModeModal.tsx` as a new file using
the source block below. Do not modify any existing file.

## Implementation Guidance

- New file — no merge needed
- Imports `StoryImportMode` type from `@/lib/story-transfer`
- Uses the same `Dialog`/`DialogContent` modal pattern as StoryExportFormatModal
- Exports: `StoryImportModeModal` (named)
- After the user selects a mode, a hidden file input is triggered for file upload

## Style Constraints

- Match the visual style of StoryExportFormatModal exactly — same card radius, same font sizing
- Background: `bg-zinc-900`, card bg: `bg-zinc-800/45`

## Constraints — Do Not Touch

- Do not modify any existing file in this prompt
- Do not change the mode IDs (`merge`, `rewrite`)

## Source: src/components/chronicle/StoryImportModeModal.tsx

```tsx
[PASTE FULL CONTENTS OF src/components/chronicle/StoryImportModeModal.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 7

- [ ] File exists at `src/components/chronicle/StoryImportModeModal.tsx`
- [ ] `StoryImportModeModal` is exported
- [ ] Imports `StoryImportMode` from `@/lib/story-transfer` without error
- [ ] No TypeScript errors
- [ ] No other files modified

---

---

# PROMPT 8 OF 14 — CharactersTab Redesign (Character Builder Left Nav)

## Context

`src/components/chronicle/CharactersTab.tsx` exists in production and needs to be
replaced with the sandbox version. This is the largest single-file change. The
sandbox version rebuilds the left navigation to use a card-style system with:
- Dynamic progress rings (percent + checkmark on completion) on every nav button
- Consistent "Custom Content" and "Edit Buttons (Admin)" action cards
- Top character reference tile in the blue header band
- Main background changed to dark charcoal (`#1a1b20`)

## Task

Replace the full contents of `src/components/chronicle/CharactersTab.tsx` with
the source block below. Full-file replacement — do not attempt inline merging.

## Implementation Guidance

- This is a complete replacement of an existing file
- All prop interfaces, internal state, and component exports must come from the source block exactly
- The component must export `CharactersTab` as a named export — do not change this
- Progress ring rendering uses a local `CircularProgress` component import — verify this import resolves
- The "Custom Content" and "Edit Buttons (Admin)" cards must be rendered in the same visual family as the nav buttons
- Do not add routing logic — tab navigation is handled by the parent (Index.tsx)

## Style Constraints

- Main background: `#1a1b20` (dark charcoal) — applied via inline `style` on the root container
- Nav button cards: match the card-style system in the source block exactly
- Progress rings: use `@/components/chronicle/CircularProgress` — do not substitute another component
- Do not introduce any new Tailwind color classes not present in the source block

## Constraints — Do Not Touch

- Do not modify `src/pages/Index.tsx` in this prompt — CharactersTab's prop interface must remain backward-compatible
- Do not touch any Supabase query or mutation logic
- Do not modify any file other than `CharactersTab.tsx`

## Source: src/components/chronicle/CharactersTab.tsx

```tsx
[PASTE FULL CONTENTS OF src/components/chronicle/CharactersTab.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 8

- [ ] Character Builder tab loads without errors
- [ ] Left nav renders card-style buttons with progress rings
- [ ] "Custom Content" and "Edit Buttons (Admin)" cards are visible in the nav
- [ ] Character reference tile appears in the blue header band
- [ ] Main background is dark charcoal, not the previous color
- [ ] Clicking nav buttons switches sections correctly
- [ ] Progress rings show correct completion percentage and checkmark when complete
- [ ] No console errors
- [ ] No other tab or feature is broken

---

---

# PROMPT 9 OF 14 — ChatInterfaceTab (Avatar UX + Color Controls)

## Context

`src/components/chronicle/ChatInterfaceTab.tsx` exists in production and needs to be
replaced with the sandbox version. This adds:
- Hover darken overlay on character tiles
- Click-to-expand image with sidebar reflow
- "Reposition image" menu action with drag-to-reposition and "Done" control
- Removal of always-on dark overlay at tile rest state
- "Change Color" button near Chat Settings / Generate Image
- Color picker modal with chatCanvasColor and chatBubbleColor pickers
- Message bubble borders removed
- In-dialog avatar chips are square (`rounded-md`), not circular

The `chatCanvasColor` and `chatBubbleColor` values come from `appData.uiSettings`
and are persisted via `onUpdateUiSettings` prop (wired in Index.tsx in Prompt 13).

## Task

Replace the full contents of `src/components/chronicle/ChatInterfaceTab.tsx` with
the source block below. Full-file replacement.

## Implementation Guidance

- Full replacement — do not merge inline
- The `normalizeHexColor` helper is defined locally inside this file — do not import it from utils (it is intentionally local per the sandbox source)
- The `onUpdateUiSettings` prop must match the type signature exactly as defined in the source block
- The color modal uses two `<input type="color">` elements with controlled hex state — no third-party color picker library
- `chatCanvasColor` is applied as an inline `style` on the chat canvas container — this is intentional
- `chatBubbleColor` is applied as inline `style` on individual message bubbles when not in transparent mode
- Drag-to-reposition uses `onMouseDown`/`onMouseMove`/`onMouseUp` on the image container — no drag library

## Style Constraints

- Bubble borders: removed entirely — no `border` class on message bubble elements
- Avatar chips in dialogs: `rounded-md` (square) — not `rounded-full`
- "Change Color" button: placed near the Chat Settings / Generate Image controls as shown in source
- Color modal background: `bg-zinc-900` consistent with other modals
- Do not introduce any new npm packages

## Constraints — Do Not Touch

- Do not modify `src/pages/Index.tsx` in this prompt
- Do not touch `src/services/supabase-data.ts`
- Do not modify any file other than `ChatInterfaceTab.tsx`

## Source: src/components/chronicle/ChatInterfaceTab.tsx

```tsx
[PASTE FULL CONTENTS OF src/components/chronicle/ChatInterfaceTab.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 9

- [ ] Chat interface loads without errors
- [ ] Character tiles show hover darken effect (no always-on dark overlay at rest)
- [ ] Clicking a character tile expands the image without clipping under section headers
- [ ] Right-click or context menu on tile shows "Reposition image" option
- [ ] Reposition mode enables drag; "Done" exits reposition mode
- [ ] "Change Color" button is visible near Chat Settings controls
- [ ] Clicking "Change Color" opens a modal with two color pickers
- [ ] Changing canvas color updates the chat background immediately
- [ ] Changing bubble color updates message bubbles immediately
- [ ] Message bubbles have no border outlines
- [ ] Avatar chips in dialogs are square (`rounded-md`)
- [ ] No console errors
- [ ] No other tab or feature is broken

---

---

# PROMPT 10 OF 14 — StyleGuideTool: Add UI Audit Button

## Context

`src/components/admin/styleguide/StyleGuideTool.tsx` exists in production. The sandbox
version adds a button (in at least two locations within the tool) that navigates to
`/style-guide/ui-audit`. The button uses `useNavigate` from `react-router-dom`.

## Task

Replace the full contents of `src/components/admin/styleguide/StyleGuideTool.tsx`
with the source block below. Full-file replacement.

## Implementation Guidance

- Full replacement
- The `openUiAudit` callback is defined as:
  `const openUiAudit = useCallback(() => navigate('/style-guide/ui-audit'), [navigate]);`
- This callback is wired to button `onClick` handlers at the locations shown in the source
- The `useNavigate` hook must be imported from `react-router-dom`
- Do not add `BrowserRouter` here — routing is already provided by `App.tsx`
- All existing style guide functionality (keeps, edits, swatches, download modal) must remain intact

## Style Constraints

- UI Audit button must visually match the existing admin tool button style
- Do not change any color tokens or layout in the style guide tool
- Do not introduce new component imports not present in the source block

## Constraints — Do Not Touch

- Do not modify `src/App.tsx` in this prompt — the route is added in Prompt 12
- Do not modify `StyleGuideEditsModal.tsx` or `StyleGuideDownloadModal.tsx`
- Do not modify any file other than `StyleGuideTool.tsx`

## Source: src/components/admin/styleguide/StyleGuideTool.tsx

```tsx
[PASTE FULL CONTENTS OF src/components/admin/styleguide/StyleGuideTool.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 10

- [ ] Style guide tool loads without errors
- [ ] UI Audit button is visible (in the locations defined in source)
- [ ] Clicking UI Audit button navigates to `/style-guide/ui-audit` (page will 404 until Prompt 11 — that is expected)
- [ ] All existing style guide features (keeps, edits, download) still function
- [ ] No console errors
- [ ] No other file was modified

---

---

# PROMPT 11 OF 14 — New UI Audit Page

## Context

`src/pages/style-guide/ui-audit.tsx` does not exist in production. It is the full
audit dashboard page, importing from:
- `@/data/ui-audit-findings` (Prompt 5)
- `@/lib/ui-audit-schema` (Prompt 3)
- `@/lib/ui-audit-utils` (Prompt 4)

The route `/style-guide/ui-audit` is added to App.tsx in Prompt 12. This file
must exist before that route is registered.

## Task

Create `src/pages/style-guide/ui-audit.tsx` as a new file using the source block below.
Also create the directory `src/pages/style-guide/` if it does not exist.

## Implementation Guidance

- New file in a new directory
- The page component is the default export: `export default function UiAuditPage()`
- Imports all audit data from `@/data/ui-audit-findings`
- Imports utility functions from `@/lib/ui-audit-utils`
- Imports schema types from `@/lib/ui-audit-schema`
- This page is standalone (not nested inside the main app layout) — it has its own full-page layout
- No Supabase queries — this page is purely static/read-only

## Style Constraints

- This page has its own layout — do not wrap it in the main app's sidebar/nav
- Use the dark background system consistent with the rest of the app
- Do not introduce new npm packages

## Constraints — Do Not Touch

- Do not modify `src/App.tsx` in this prompt — the route is added in Prompt 12
- Do not modify any other existing file

## Source: src/pages/style-guide/ui-audit.tsx

```tsx
[PASTE FULL CONTENTS OF src/pages/style-guide/ui-audit.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 11

- [ ] File exists at `src/pages/style-guide/ui-audit.tsx`
- [ ] Default export `UiAuditPage` is present
- [ ] All three audit lib imports resolve without errors
- [ ] No TypeScript errors in this file
- [ ] No other files modified

---

---

# PROMPT 12 OF 14 — App.tsx: Register New Route

## Context

`src/App.tsx` needs one addition: a route for `/style-guide/ui-audit` that renders
`UiAuditPage`. The sandbox version of App.tsx also adds a `/auth` redirect route.
Both must be present.

## Task

Replace the full contents of `src/App.tsx` with the source block below.

## Implementation Guidance

- Full replacement — this file is small and safe to replace entirely
- New route: `<Route path="/style-guide/ui-audit" element={<UiAuditPage />} />`
- New import: `import UiAuditPage from "./pages/style-guide/ui-audit";`
- New route: `<Route path="/auth" element={<Navigate to="/?auth=1" replace />} />`
- New import: `import { Navigate } from "react-router-dom";`
- All new routes must be placed ABOVE the catch-all `path="*"` NotFound route
- The existing routes (`/`, `/creator/:userId`) must remain unchanged

## Style Constraints

- No visual changes — this is pure routing configuration

## Constraints — Do Not Touch

- Do not modify `ArtStylesProvider`, `QueryClientProvider`, `TooltipProvider`, or `BrowserRouter` setup
- Do not modify any file other than `src/App.tsx`

## Source: src/App.tsx

```tsx
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ArtStylesProvider } from "@/contexts/ArtStylesContext";
import Index from "./pages/Index";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";
import UiAuditPage from "./pages/style-guide/ui-audit";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ArtStylesProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Navigate to="/?auth=1" replace />} />
            <Route path="/creator/:userId" element={<CreatorProfile />} />
            <Route path="/style-guide/ui-audit" element={<UiAuditPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ArtStylesProvider>
  </QueryClientProvider>
);

export default App;
```

## Validation — Prompt 12

- [ ] Navigating to `/style-guide/ui-audit` renders the audit page without a 404
- [ ] `/` still loads the main app correctly
- [ ] No TypeScript errors
- [ ] No other files modified

---

---

# PROMPT 13 OF 14 — Index.tsx: Wire All New Imports + UI

## Context

`src/pages/Index.tsx` is the main application shell. It needs to be updated to:
1. Import all new components and lib functions (story transfer, modals)
2. Add state variables for the export/import modals
3. Add handler functions for export and import workflows
4. Add Export and Import buttons to the Story Builder header area
5. Render `StoryExportFormatModal` and `StoryImportModeModal` in the JSX
6. Wire the `onUpdateUiSettings` prop to `ChatInterfaceTab` so color settings persist

This is the largest wiring prompt. All prior prompts must be verified complete
before sending this one.

## Task

Replace the full contents of `src/pages/Index.tsx` with the source block below.
Full-file replacement.

## Implementation Guidance

**New imports to verify are present after replacement:**
```typescript
import {
  exportScenarioToJson,
  exportScenarioToText,
  exportScenarioToWordDocument,
  importScenarioFromAny,
  StoryImportMode,
} from "@/lib/story-transfer";
import { StoryExportFormatModal, StoryExportFormat } from "@/components/chronicle/StoryExportFormatModal";
import { StoryImportModeModal } from "@/components/chronicle/StoryImportModeModal";
```

**New state variables:**
```typescript
const [storyExportModalOpen, setStoryExportModalOpen] = useState(false);
const [storyImportModalOpen, setStoryImportModalOpen] = useState(false);
const [storyImportMode, setStoryImportMode] = useState<StoryImportMode>('merge');
```

**New handlers:**
- `handleExportStoryTransfer(format: StoryExportFormat)` — calls the appropriate export function
- `handleOpenStoryExport()` — opens the export format modal
- `handleOpenStoryImport()` — opens the import mode modal
- `handleSelectStoryImportMode(mode: StoryImportMode)` — sets the import mode
- `handleImportStoryTransferFile(event)` — reads the file and calls `importScenarioFromAny`

**New JSX (modal renders near bottom of return, before closing tag):**
```tsx
<StoryExportFormatModal
  open={storyExportModalOpen}
  onClose={() => setStoryExportModalOpen(false)}
  onSelect={handleExportStoryTransfer}
/>
<StoryImportModeModal
  open={storyImportModalOpen}
  onClose={() => setStoryImportModalOpen(false)}
  onSelect={handleSelectStoryImportMode}
/>
```

**UiSettings wiring for ChatInterfaceTab:**
The `onUpdateUiSettings` prop passed to `ChatInterfaceTab` must call:
```typescript
supabaseData.updateStoryUiSettings(activeId, merged)
```
where `merged` is the current `uiSettings` object merged with the incoming patch.

## Style Constraints

- Import and Export buttons in the Story Builder header: use existing button variant
  patterns from `@/components/chronicle/UI` — do not invent a new button style
- Button placement: immediately adjacent in the header area, as shown in source
- Icons: `Download` for Export, `Upload` for Import — both from `lucide-react`

## Constraints — Do Not Touch

- Do not modify authentication logic
- Do not modify any Supabase query outside of the `onUpdateUiSettings` handler
- Do not touch navigation/routing setup (managed in App.tsx)
- Do not modify any file other than `src/pages/Index.tsx`

## Source: src/pages/Index.tsx

```tsx
[PASTE FULL CONTENTS OF src/pages/Index.tsx FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]
```

## Validation — Prompt 13

- [ ] App loads without TypeScript errors or console errors
- [ ] Story Builder header shows Import and Export buttons
- [ ] Clicking Export opens the StoryExportFormatModal with three format options
- [ ] Selecting Markdown triggers a `.md` file download
- [ ] Selecting JSON triggers a `.json` file download
- [ ] Selecting Word Document triggers a `.rtf` file download
- [ ] Clicking Import opens the StoryImportModeModal with Merge and Rewrite options
- [ ] Selecting an import mode opens a file picker; selecting a file imports the story
- [ ] ChatInterfaceTab receives `onUpdateUiSettings` and color changes persist on reload
- [ ] All existing tabs (Characters, World, Chat, etc.) still function correctly
- [ ] Auth flow unaffected

---

---

# PROMPT 14 OF 14 — Orphan Cleanup + Full Wiring Verification

## Context

This cleanup prompt runs after all features are visually confirmed working.
Its purpose is to remove any dead code, orphaned imports, or zombie references
that may have survived the replacement process, and to verify full end-to-end
wiring for each feature.

## Task

Search the entire codebase for the following and clean up each:

### Orphan cleanup targets

1. **Any import statement** referencing a component or module that no longer exists
   in the codebase (e.g., old modal components that were replaced)

2. **Any TODO or FIXME comment** added during this session by the AI assistant
   that refers to placeholder logic or unfinished wiring

3. **Any `console.log`, `console.warn`, or `console.error`** statements added
   during this session that are not part of intentional error handling

4. **Any unused state variables** in `Index.tsx` that reference features no longer
   in the current implementation

5. **Any dead import** in `src/pages/Index.tsx` — every import must be used
   somewhere in the file's JSX or logic

### Wiring verification checklist

For each feature, confirm the full data flow is connected:

**Story Export:**
- Button → `handleOpenStoryExport` → `setStoryExportModalOpen(true)`
- Modal renders when `storyExportModalOpen === true`
- `onSelect` → `handleExportStoryTransfer(format)` → calls correct export function → downloads file

**Story Import:**
- Button → `handleOpenStoryImport` → `setStoryImportModalOpen(true)`
- Modal renders when `storyImportModalOpen === true`
- `onSelect` → `handleSelectStoryImportMode(mode)` → triggers file input
- File input `onChange` → `handleImportStoryTransferFile` → `importScenarioFromAny` → updates scenario state

**Chat Color Settings:**
- "Change Color" button → color modal opens
- Canvas color picker → `handleChatCanvasColorInput` → `handleUpdateUiSettings({ chatCanvasColor })` → `onUpdateUiSettings` prop → `supabaseData.updateStoryUiSettings`
- Canvas color reads from `appData.uiSettings?.chatCanvasColor` on mount
- Bubble color picker → same flow with `chatBubbleColor`
- Both colors survive page reload (Supabase-backed)

**UI Audit Route:**
- `/style-guide/ui-audit` renders `UiAuditPage` without errors
- `UiAuditPage` correctly imports from all three audit lib files
- Navigation button in `StyleGuideTool` routes to this page

## Constraints — Do Not Touch

- Do not change any feature behavior
- Do not refactor working logic — remove dead code only
- Do not add new features

## Validation — Prompt 14

- [ ] No unused import statements in any modified file
- [ ] No TODO/FIXME comments from this session remain
- [ ] No stray `console.log` statements from this session remain
- [ ] All four end-to-end wiring flows verified above pass manual testing
- [ ] App compiles clean with zero TypeScript errors
- [ ] No console errors on any tab
- [ ] Full regression check: Characters tab, Chat tab, World tab, Gallery, Admin panel all load and function

---

---

## How to Use This Document with Lovable

1. Open this document alongside the original transfer pack (which contains the full source blocks)
2. For each prompt, copy the prompt text into Lovable
3. Where the prompt says `[PASTE FULL CONTENTS OF ... FROM SECTION 4 OF THE ORIGINAL TRANSFER PACK]`,
   paste the corresponding source block from the original document
4. Execute the prompt in Lovable
5. Complete every validation checkbox before moving to the next prompt
6. If a validation check fails, stop and debug before proceeding — do not skip forward

**If Lovable fails on a prompt three times in a row:**
Stop prompting Lovable. Return to Claude with the full error message, the file where
the error occurs, and what action triggered it. Do not send variations of the same
failing prompt without a diagnostic review first.

**If Lovable adds code that wasn't in the source block:**
Reject the change and re-prompt with an explicit "Do not add anything not present in
the provided source block" constraint added to the top of the prompt.

**Database note:**
No Supabase schema changes are required by any of these prompts. The `chatCanvasColor`
and `chatBubbleColor` values are stored in an existing JSONB `uiSettings` column.
Do not let Lovable create migrations for these fields.
