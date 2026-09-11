> **PAGE-REFERENCE MECHANICS**
>
> This document describes the current Admin Panel architecture. It does not decide when Chronicle work requires an audit, document update, Issue, Changelog entry, check package, or review.
>
> When the user requests a factual update to this reference, use `docs/guides/GUIDE_STYLE_RULES.md` for formatting mechanics, edit the applicable section in place, preserve the 13-section structure, and use verified source values. If a section does not apply, write `N/A — [specific reason]`.

# PAGE: ADMIN PANEL

---

## 1. Page Overview

| Field | Detail |
|---|---|
| **Tab Key** | `admin` |
| **Primary Source File** | `src/pages/Admin.tsx` |
| **Route Shell** | The hub renders inside Chronicle's root workspace at `/?tab=admin`; standalone operator tools use protected `/style-guide/*` routes registered in `src/App.tsx`. |
| **Purpose** | Admin hub providing ten top-level tiles: Image Generation, AI Status, Chronicle UI Guide, Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, Validation Evidence Ledger, Finance Dashboard, Research & Development, and Roadmap. |
| **Access** | Requires asynchronous `checkIsAdmin(userId)`, which calls the `has_role()` RPC against the `user_roles` table for the `admin` role. Every standalone operator route is also wrapped in `AdminOnlyRoute`. |
| **Sidebar Label** | Settings, represented by the Lucide gear icon in Chronicle's application sidebar. |
| **Entry Points** | Select Settings in the Chronicle sidebar, or return from a standalone operator page through its back chevron to `/?tab=admin`. |

---

## 2. Layout and Structure

The Admin Panel has two presentation states. The default hub view renders the tile registry. Embedded tools replace the hub inside the Admin workspace, while standalone operator tools leave the workspace route and render their own protected page shell.

The hub grid uses `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`. Each tile uses an `aspect-[2/3]` container, a `2rem` corner radius, the Chronicle blue-gray border, a thumbnail or dark fallback, bottom-aligned title and description text, and an action overlay that appears on hover.

Research & Development is an embedded tool. It uses a responsive navigation rail plus an uninterrupted white document surface. Every mock-up page includes the same protected preview shell immediately below its metadata divider, whether or not coded source has been registered. Editable text and reference images share one ordered document flow beneath that shell. IndexedDB provides a temporary recovery draft, while the explicit Save action writes the current record and original images into the Chronicle repository. Repository registration populates the shell's otherwise empty preview and factual-details record without changing its structure.

| Viewport | Grid Columns | Outer Padding | Gap |
|---|---|---|---|
| Base | 1 | `#000000 / bg-black`, `1rem / p-4` | `1rem / gap-4` |
| `sm` | 2 | `1rem / p-4` | `1rem / gap-4` |
| `lg` | 3 | `2.5rem / lg:p-10` | `2rem / lg:gap-8` |
| `xl` | 4 | `2.5rem / lg:p-10` | `2rem / lg:gap-8` |
| `2xl` | 5 | `2.5rem / lg:p-10` | `2rem / lg:gap-8` |

---

## 3. UI Elements — Complete Inventory

| Element | Type | Label/Text | Position | Color—BG | Color—Text | Size/Weight | Interaction | Component File | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Admin page | Workspace | N/A | Full available Admin workspace | `#000000 / bg-black` | N/A | `w-full h-full` | Scrolls vertically when the grid exceeds the viewport | `src/pages/Admin.tsx` | Uses responsive padding and a responsive tile grid. |
| Tool tile | Card | Tool title and description from `ToolMeta` | One cell in the responsive grid | `#18181B / bg-zinc-900` when no thumbnail | `#FFFFFF / text-white`; `#CBD5E1 / text-slate-300` | `aspect-[2/3]`; title `text-base font-bold`; description `text-xs italic` | Selecting the tile calls `handleOpenTool(tool.id)` | `src/pages/Admin.tsx` | `rounded-[2rem]`; `#4A5F7F / border-[#4a5f7f]`; hover lifts the card by `0.75rem`. |
| Tool thumbnail | Image | Current tool title as alternative text | Fills the card | Image content / `object-cover` | N/A | `w-full h-full` | No separate action; the card owns selection | `src/pages/Admin.tsx` | URL may come from the default registry or the persisted metadata override. |
| Empty-thumbnail fallback | Icon surface | Sparkles icon | Center of a card without a thumbnail | `#18181B / bg-zinc-900` | `#52525B / text-zinc-600` | Icon `w-12 h-12` | No separate action | `src/pages/Admin.tsx` | Does not imply an AI action; it is only a visual placeholder. |
| Tool title | Heading | Current `ToolMeta.title` | Bottom information block | Transparent / N/A | `#FFFFFF / text-white` | Normally `text-base font-bold` with one-line truncation; Chronicle Knowledge Base uses `text-sm` and natural wrapping so its approved label remains readable | Inherits the card selection action | `src/pages/Admin.tsx` | Persisted overrides can change the visible label without changing the stable tool ID. |
| Tool description | Text | Current `ToolMeta.description` | Directly below the title | Transparent / N/A | `#CBD5E1 / text-slate-300` | `text-xs italic`; two-line clamp | Inherits the card selection action | `src/pages/Admin.tsx` | Describes the tool but does not grant authority to it. |
| Hover action overlay | Overlay | N/A | Covers the entire tile | `rgba(0,0,0,0.30) / bg-black/30` | N/A | Full inset | Becomes visible on group hover | `src/pages/Admin.tsx` | Contains Edit and Open; both stop propagation so the card does not also fire. |
| Edit button | Button | `Edit` | Center of hover overlay | `#FFFFFF / bg-white`; hover `#F1F5F9 / hover:bg-slate-100` | `#303137 / text-[hsl(var(--ui-surface-2))]` | `text-xs font-bold uppercase tracking-wider` | Sets `editingTool` and opens `AdminToolEditModal` | `src/pages/Admin.tsx` | Edits only tile presentation metadata. |
| Open button | Button | `Open` | Center of hover overlay | `#3B82F6 / bg-blue-500`; hover `#2563EB / hover:bg-blue-600` | `#FFFFFF / text-white` | `text-xs font-bold uppercase tracking-wider` | Calls `handleOpenTool(tool.id)` | `src/pages/Admin.tsx` | Embedded tools use `activeTool`; standalone tools navigate to protected routes. |

### 3a. Research & Development workspace

| Element | Type | Label/Text | Position | Color—BG | Color—Text | Size/Weight | Interaction | Component File | Notes |
|---|---|---|---|---|---|---|---|---|---|
| R&D navigation rail | Navigation | `Research & Development`; prototype-only notice | Left side at `lg`; stacked above content below `lg` | Base `#2A2A2F / bg-[#2a2a2f]`; header `#3C3E47 / bg-[#3c3e47]` | `#FFFFFF / text-white`; muted `45% white` | `250–300px / lg:w-[clamp(250px,28vw,300px)]` | Scrolls independently when mock-up names exceed the available height | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | Uses the exact Story Builder roster-rail base, header, sizing, and inset-divider colors. |
| Canonical guide destination | Button | `Chronicle UI Guide`; `Open the canonical guide` | First navigation item | `#3C3E47 / bg-[#3c3e47]` | `#EAEDF1 / text-[#eaedf1]` | `text-sm font-bold` | Saves the active draft, then opens `/style-guide/chronicle-ui-guide` | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | Uses the Story Builder rail surface color and shadow treatment. |
| Add mock-up button | Shared header `SurfaceButton` | `Add New Mock-up` | Chronicle application header, immediately left of Save | `#303035 / bg-[#303035]` | `#EAEDF1 / text-[#eaedf1]` | `h-10 px-5 text-xs font-bold` | Invokes the registered R&D add handler and selects a blank `Untitled Mock-up` document | `src/components/app-shell/AppShellTopBar.tsx` | Uses the same shared action styling as Story Builder Import and Export. It is not rendered in the navigation rail. |
| Mock-up group header | Static section header | `Mock-ups` | Navigation rail above mock-up records | `#5A7292→#4A5F7F / bg-gradient-to-b` | `#FFFFFF / text-white` | `text-[10px] font-bold uppercase` | Non-interactive grouping label | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | Matches the Story Builder Main Characters and Side Characters section-header treatment. |
| Mock-up navigation item | Button | Current editable display title | Navigation list | `#3C3E47 / bg-[#3c3e47]`; selected border `#7891B3` | `#EAEDF1 / text-[#eaedf1]` | `h-10 text-xs font-bold` | Saves the prior dirty draft before changing selection | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | Stable record ID does not change when the label changes; rows reuse the Story Builder rail surface and shadow treatment. |
| Document heading | Borderless form fields | Title, Date created, Last edited, Purpose | Top of the white document | `#FFFFFF / bg-white` | Labels and title `#000000 / text-black`; values `#3F3F46 / text-zinc-700` | Title `text-3xl font-bold`; labels `text-sm font-bold` | Title and purpose are spellchecked editable fields; dates are read-only | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | A thin divider separates metadata from the document; no card, header container, or recessed field surrounds it. |
| Repository Save button | Shared header `SurfaceButton` | `Save` or `Saving...` | Right side of Chronicle's white application header | `#303035 / bg-[#303035]` | `#EAEDF1 / text-[#eaedf1]` | `h-10 px-6 text-xs font-bold` | Invokes the R&D repository-save handler registered with the application shell | `src/components/app-shell/AppShellTopBar.tsx` | Uses the exact shared header-action styling used by Account, Story Builder, and other Chronicle pages. One click, no modal, confirmation, persistent success label, or inline repository-path text. |
| Protected preview header | Static title/source strip | Current display title; registered source path or `Protected mock-up preview` | Top of every mock-up page's protected shell | `#5A7292→#4A5F7F / bg-gradient-to-b` | `#FFFFFF / text-white` | Title `text-[13px] font-black uppercase`; source `text-[11px]` | Hosts only the approved preview-background swatches | `src/components/admin/research-development/RndPrototypeShell.tsx` | Uses the retained slate preview header without badges or copy controls. User notes cannot edit or delete this region. |
| Preview background swatches | Four-button group | White, Light gray, Medium gray, Charcoal | Top-right of the protected preview header | `#FFFFFF`, `#D4D4D8`, `#71717A`, `#1A1A1E` | Selected ring `#FFFFFF` | `h-5 w-5 rounded-full` | Changes only the protected preview field and persists the selection through the existing draft/save path | `src/components/admin/research-development/RndPrototypeShell.tsx` | Each circle has an accessible label and `aria-pressed`; no dropdown or separate toolbar is rendered. |
| Coded preview canvas | Protected interactive region | Registered preview or an empty field | Center of every protected shell | Selected white, light gray, medium gray, or charcoal background; charcoal is the default | Preview-owned | Minimum `340px / min-h-[340px]`; grows with taller preview content | Registered prototypes may remain interactive; a local error boundary isolates render failure | `src/components/admin/research-development/RndPrototypeShell.tsx` | The field is present and visually empty before a repository definition is registered. Browser content cannot create executable preview code. |
| Component details accordion | Collapsible factual record | `Component Details` | Bottom of every protected shell | `#FFFFFF / bg-white` | `#555555 / text-[#555]` | `text-[11px] font-extrabold uppercase` | Toggles the stable ID and any registered source dates, path, and factual details | `src/components/admin/research-development/RndPrototypeShell.tsx` | Uses the white details row and remains collapsed by default. Browser records never store implementation facts, HTML, or JSX. |
| Document text block | Auto-growing textarea | Free text | Natural white-page flow | Transparent on `#FFFFFF` | `#18181B / text-zinc-900` | `text-[16px] leading-8` | Accepts spellchecked text; Enter creates the next document position and Shift+Enter inserts a line break | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | Blocks have no visible container, border, or toolbar. |
| Inline reference image | Draggable figure | Original image | At its ordered position between text blocks | Transparent on `#FFFFFF` | N/A | Maximum `70vh`; natural aspect ratio | Dropping a desktop image beneath a text block inserts it there; dragging the rendered image moves it after another block | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` | There is no import button, image card, gallery, or executable HTML. The original blob is preserved; SVG and files over 10 MB are rejected. |

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect | Destination or State |
|---|---|---|---|
| Select an embedded-tool tile | `handleOpenTool(tool.id)` → `onSetActiveTool(tool.id)` | Replaces the Admin hub with the selected embedded tool | `image_generation`, `model_settings`, `finance_dashboard`, or `research_development` |
| Select Chronicle UI Guide | `handleOpenTool('chronicle_ui_guide')` | Opens the page-specific UI reference, initially Story Builder | `/style-guide/chronicle-ui-guide` |
| Select Chronicle Knowledge Base | `handleOpenTool('chronicle_knowledge_base')` | Navigates to the source-backed Chronicle product and architecture manual | `/style-guide/chronicle-knowledge-base` |
| Select Supabase Schema Reference | `handleOpenTool('supabase_schema_reference')` | Navigates to the Lovable-backed schema reference | `/style-guide/supabase-schema-reference` |
| Select Quality Hub | `handleOpenTool('quality_hub')` | Navigates to the Quality Hub | `/style-guide/ui-audit` |
| Select Validation Evidence Ledger | `handleOpenTool('validation_evidence_ledger')` | Navigates to the validation ledger page | `/style-guide/validation-evidence-ledger` |
| Select Edit | `setEditingTool(tool)` | Opens the tile metadata modal without opening the tool | `editingTool` becomes the selected `ToolMeta` |
| Save tile metadata | `handleSaveTool(toolId, patch)` | Optimistically merges the patch, updates `app_settings.admin_tool_meta`, and inserts the setting if the update matched no row | Supabase `app_settings` |
| Close tile metadata modal | `setEditingTool(null)` | Dismisses the editor without navigating | `editingTool` becomes `null` |
| Add new R&D mock-up | `addNewMockup()` | Saves the prior dirty draft, creates a stable UUID record, persists it, selects it, and focuses Title | Device-local IndexedDB `mockups` store |
| Select another R&D mock-up | `selectMockup(id)` | Saves the prior dirty draft before changing the selected record | `selectedId`, `draft`, and `chronicle-rnd-last-selected-v1` |
| Autosave R&D changes | 500 ms debounce → `persistDraft()` | Trims an empty title to `Untitled Mock-up`, updates `contentUpdatedAt`, and atomically writes metadata, ordered blocks, and image mutations | IndexedDB transaction across `mockups` and `assets` |
| Save current mock-up to the repository | `saveToRepository()` → `saveRndMockupToRepository()` → `POST /__rnd-repository/save` | Writes a staged `mockup.json` and original image files, then atomically replaces only that stable mock-up folder | `docs/research-development/mockups/{mockupId}/` |
| Open Chronicle UI Guide from R&D | `openStyleGuide()` | Saves the current draft and calls `onOpenStyleGuide()` | Protected `/style-guide/chronicle-ui-guide` page |
| Leave R&D through Chronicle navigation | `runAfterAdminWorkspaceSave()` → registered `persistDraft()` | Waits for the current device-local save and changes destination only after success | Admin Back action plus Chronicle sidebar destinations |
| Change preview background | `setDraftField('previewBackground', background)` | Changes only the protected preview field and marks the current draft dirty | `RndMockupRecord.previewBackground` |
| Expand factual details | `Collapsible.onOpenChange` | Reveals source-owned dates, path, and component details | Local `detailsOpen` presentation state |
| Drop desktop images into the document | `addReferenceFiles(files, insertAfterBlockId)` | Validates type/count/size/total quota, inserts image blocks beneath the targeted text, and leaves a text position after trailing images | `documentBlocks`, unsaved `pendingAssets`; persisted by autosave |
| Move an image in the document | `moveImageBlock(draggedBlockId, insertAfterBlockId)` | Reorders the image after the targeted text or image block | `documentBlocks` plus projected `assetIds` |
| Remove reference image | `removeReferenceImage(assetId)` | Removes it from the draft and stages persisted deletion or discards a pending addition | `assetIds`, `pendingAssets`, or `removedAssetIds` |

---

## 5. Modals, Dialogs & Sheets

### 5a. Tile metadata editor

#### Modal: AdminToolEditModal

| Field | Detail |
|---|---|
| **Trigger** | Edit button in a tool tile's hover overlay |
| **Component File** | `src/components/admin/AdminToolEditModal.tsx` |
| **Purpose** | Edit the selected tool's title, description, and optional thumbnail while preserving its stable tool ID and routing behavior. |
| **Overlay** | Chronicle dark modal treatment owned by `AdminToolEditModal`. |
| **Dimensions** | Responsive modal dimensions owned by `AdminToolEditModal`; the Admin hub passes no size override. |
| **Header** | Identifies the selected tool being edited. |

| Form Field | Input Type | Default | Validation | Notes |
|---|---|---|---|---|
| Title | Text | Current `ToolMeta.title` | Modal-owned text validation | Changes the visible label only. |
| Description | Text | Current `ToolMeta.description` | Modal-owned text validation | Changes the visible two-line card description only. |
| Thumbnail | Upload and preview | Current `ToolMeta.thumbnailUrl` or no image | Requires an authenticated user for upload | Stores the resulting public URL in the metadata JSON after Save. |

| Button | Label | BG Color | Text Color | Icon | Action |
|---|---|---|---|---|---|
| Save | Modal-defined Save label | Chronicle modal token / component-owned class | Chronicle modal token / component-owned class | Component-owned | Calls `handleSaveTool()` and closes only after the save path succeeds. |
| Cancel or Close | Modal-defined dismiss label | Chronicle modal token / component-owned class | Chronicle modal token / component-owned class | Component-owned | Calls `onClose()` and leaves the persisted metadata unchanged. |

After a successful save, `tools` contains the merged presentation metadata and the modal closes. If persistence fails, `handleSaveTool()` restores the previous `tools` array, logs the failure, and rethrows so the modal can retain failure state. Cancel closes the modal without changing the registry.

---

## 6. Data Architecture

### 6a. Tool metadata registry

Ten default tiles are defined in `DEFAULT_TOOLS` inside `src/pages/Admin.tsx`.

| Tool ID | Title | Render Target |
|---|---|---|
| `image_generation` | Image Generation | `src/components/admin/ImageGenerationTool.tsx` |
| `model_settings` | AI Status | `src/components/chronicle/ModelSettingsTab.tsx` |
| `chronicle_ui_guide` | Chronicle UI Guide | `/style-guide/chronicle-ui-guide` → `src/pages/style-guide/chronicle-ui-guide.tsx` |
| `chronicle_knowledge_base` | Chronicle Knowledge Base | `/style-guide/chronicle-knowledge-base` → `src/pages/style-guide/chronicle-knowledge-base.tsx` |
| `supabase_schema_reference` | Supabase Schema Reference | `/style-guide/supabase-schema-reference` → `src/pages/style-guide/supabase-schema-reference.tsx` |
| `quality_hub` | Quality Hub | `/style-guide/ui-audit` → `src/pages/style-guide/ui-audit.tsx` |
| `validation_evidence_ledger` | Validation Evidence Ledger | `/style-guide/validation-evidence-ledger` → `src/pages/style-guide/validation-evidence-ledger.tsx` |
| `finance_dashboard` | Finance Dashboard | `src/components/admin/finance/FinanceDashboardTool.tsx` |
| `research_development` | Research & Development | `src/components/admin/research-development/ResearchDevelopmentTool.tsx` |

### 6b. Metadata persistence and cache flow

```typescript
1. AdminPage mounts with DEFAULT_TOOLS.
2. AdminPage reads app_settings where setting_key = "admin_tool_meta".
3. Persisted overrides merge by stable tool ID.
4. Only IDs in the current registry receive overrides; stored metadata does not restore removed tools.
5. Editing updates local tools state optimistically.
6. AdminPage updates the existing app_settings row and selects its ID.
7. If no row was updated, AdminPage inserts the admin_tool_meta setting.
8. On failure, AdminPage restores the previous local tools array and rethrows.
```

| Supabase Object | Operation | Purpose | Authority |
|---|---|---|---|
| `app_settings` | Select `setting_value` | Load title, description, and thumbnail overrides | Backend RLS plus verified Admin access |
| `app_settings` | Update `setting_value` and `updated_at` | Persist the complete override map | Backend RLS plus verified Admin access |
| `app_settings` | Insert `setting_key` and `setting_value` | Create the setting when no existing row matched | Backend RLS plus verified Admin access |
| `guide_images` storage bucket | Upload tile thumbnail | Store the selected image under `{userId}/admin-tools/...`; preview its public URL before Save Tile persists the override | Administrator-only storage writes; public image reads |

### 6c. Embedded operational tools

Image Generation is lazy-loaded from `src/components/admin/ImageGenerationTool.tsx` and manages `art_styles` records. AI Status renders `src/components/chronicle/ModelSettingsTab.tsx`. Finance Dashboard is lazy-loaded from `src/components/admin/finance/FinanceDashboardTool.tsx`. Research & Development is lazy-loaded from `src/components/admin/research-development/ResearchDevelopmentTool.tsx`; it combines a browser-local recovery draft with explicitly saved repository records. Coded previews and factual details remain separately source-registered. Their data contracts remain owned by those tools rather than the Admin hub.

### 6d. Repository-backed manuals

#### Chronicle Knowledge Base

`src/pages/style-guide/chronicle-knowledge-base.tsx` renders the repository-owned source-readable manual from `docs/architecture-knowledge/manifest.json` and the Markdown sources in `docs/architecture-knowledge/`. It contains capability-local tabs, checked-in reference images, and a direct reference to `/style-guide/supabase-schema-reference`.

#### Chronicle UI Guide

`src/pages/style-guide/chronicle-ui-guide.tsx` is a separate protected manual page. It stacks all registered regional references in catalog order, without a region selector; each keeps its own seven tabs and reading panel. `docs/ui-guide/catalog.json` registers each region's Markdown, section labels, and image metadata. `src/data/chronicle-ui-guide/document.ts` parses that source for both the React page and `scripts/read-chronicle-ui-guide.mjs`. The browser resolves PNG imports from `src/assets/ui-guide/<region>/`; the reader returns plain Markdown and absolute image paths for direct image-tool loading. `npm run -s ui-guide:read -- --list` lists available regions. For example, `npm run -s ui-guide:read -- story-builder --section fields,panels,mockups --images --json` includes that region's foundations with the requested sections. `--full-source` includes supporting implementations. There is no Supabase content table or browser editing path. `docs/ui-guide/README.md` owns maintenance instructions and the sequential coverage inventory.

### 6e. Supabase Schema Reference

`src/pages/style-guide/supabase-schema-reference.tsx` renders the Codex-accessible representation of Chronicle's Lovable-controlled Supabase project. The Knowledge Base links to it instead of duplicating its table, column, relationship, policy, function, trigger, or storage definitions.

### 6g. Quality Hub and Validation Evidence Ledger

`src/pages/style-guide/ui-audit.tsx` and `src/pages/style-guide/validation-evidence-ledger.tsx` own their specialist presentations. The Admin hub only routes to them. Their diagnostics and evidence do not by themselves prove that a runtime behavior is enforced.

### 6h. R&D repository files, IndexedDB, and browser storage

The Admin hub does not define a React Query key. It uses React local state for tile presentation and Supabase for persisted tile overrides. Research & Development owns a device-local IndexedDB recovery database named `chronicle-rnd-workspace` and a loopback-only Vite development endpoint that reads and writes repository files. No R&D note or reference image is sent to Supabase.

| Browser store or key | Record shape | Purpose | Limits |
|---|---|---|---|
| IndexedDB `mockups` | `RndMockupRecord` keyed by stable `id` | Display title, purpose, timestamps, selected preview background, and ordered text/image `documentBlocks`; `notes` and `assetIds` remain compatibility projections | Schema version `1`; new choices are white, light gray, medium gray, and charcoal. Legacy ink and checkerboard values remain readable and normalize to charcoal or light gray. Structured plain text and asset references only; no HTML, JSX, preview source, or factual component record |
| IndexedDB `assets` | `RndReferenceAsset` keyed by `id`, indexed by `mockupId` | Original JPEG, PNG, or WebP blobs plus filename, type, size, and created date | 10 MB per image; 20 images per mock-up; 50 MB total R&D asset budget |
| Repository `docs/research-development/mockups/{mockupId}/mockup.json` | Repository format `1` manifest containing `RndMockupRecord`, save timestamp, and image metadata | Durable, readable source-controlled copy restored when browser storage is empty | Stable safe ID directory; staged write followed by directory replacement |
| Repository `docs/research-development/mockups/{mockupId}/assets/` | `{assetId}.jpg`, `{assetId}.png`, or `{assetId}.webp` | Durable original image bytes referenced by the manifest | Same MIME, per-image, count, and 50 MB limits as the browser workspace |
| Local storage `chronicle-rnd-last-selected-v1` | Stable mock-up ID string | Restores the last selected R&D record when reopening the embedded tool | Presentation preference only; it does not grant Admin access |

```typescript
1. ResearchDevelopmentTool loads IndexedDB recovery data and `GET /__rnd-repository/workspace` in parallel.
2. `mergeRndWorkspaces()` selects the newer record by `contentUpdatedAt`; repository records restore the workspace when browser data is empty.
3. Source-controlled registry entries missing from both stores receive default editable records.
4. Add New Mock-up writes a blank stable-ID recovery record before displaying it.
5. Text, metadata, preview-background choice, and asset selection remain draft state during a 500 ms quiet period.
6. Local autosave uses one IndexedDB transaction across mockups and assets; navigation also flushes any dirty draft before leaving.
7. Explicit Save serializes the complete current record and assets to the loopback-only middleware, which stages and replaces that mock-up's repository folder.
8. A failed or quota-exceeded transaction preserves the previous persisted state and leaves the unsaved UI available for recovery.
```

---

## 7. Component Tree

```tsx
<AdminPage>  # src/pages/Admin.tsx
  <ToolCard /> ×10  # rendered inline by src/pages/Admin.tsx
  <AdminToolEditModal />  # src/components/admin/AdminToolEditModal.tsx

  <ImageGenerationTool />  # src/components/admin/ImageGenerationTool.tsx (conditional, lazy)
  <ModelSettingsTab />  # src/components/chronicle/ModelSettingsTab.tsx (conditional)
  <FinanceDashboardTool />  # src/components/admin/finance/FinanceDashboardTool.tsx (conditional, lazy)
  <ResearchDevelopmentTool />  # src/components/admin/research-development/ResearchDevelopmentTool.tsx (conditional, lazy)
    <RndPrototypeShell />  # src/components/admin/research-development/RndPrototypeShell.tsx
      <RegisteredPreview />  # source-controlled registry component; empty field when absent
      <Collapsible />  # src/components/ui/collapsible.tsx

<AdminOnlyRoute>  # src/App.tsx
  <ChronicleUiGuidePage />  # src/pages/style-guide/chronicle-ui-guide.tsx
  <ChronicleKnowledgeBasePage>  # src/pages/style-guide/chronicle-knowledge-base.tsx
    <KnowledgeSwitcher /> ×15  # src/components/admin/knowledge-base/KnowledgeSwitcher.tsx
    <CommunityGalleryArchitecture />  # src/components/admin/knowledge-base/CommunityGalleryArchitecture.tsx
  <SupabaseSchemaReferencePage />  # src/pages/style-guide/supabase-schema-reference.tsx
  <UiAuditPage />  # src/pages/style-guide/ui-audit.tsx
  <ValidationEvidenceLedgerPage />  # src/pages/style-guide/validation-evidence-ledger.tsx
```

---

## 8. State Management

| State | Type | Authority | Purpose |
|---|---|---|---|
| `tools` | `ToolMeta[]` | React presentation state reconciled from `DEFAULT_TOOLS` and `app_settings.admin_tool_meta` | Supplies every visible card's title, description, and thumbnail. |
| `editingTool` | `ToolMeta \| null` | Local modal state | Identifies the card currently being edited. |
| `activeTool` | `string` | Parent `Index.tsx` workspace state | Selects an embedded Admin tool. |
| `adminActiveTool` | Parent-owned string | `Index.tsx` | Preserves the selected embedded Admin view inside the root workspace. |
| Protected route state | Authenticated user plus `checkIsAdmin()` result | `AdminOnlyRoute` in `src/App.tsx` | Prevents standalone operator pages from rendering before backend Admin verification. |
| Knowledge tab state | Active tab ID per `KnowledgeSwitcher` | Local React state inside each switcher | Changes only the visible manual panel and metadata; it does not mutate Chronicle data. |
| `mockups`, `assets` | `RndMockupRecord[]`, `RndReferenceAsset[]` | Newest merged repository or IndexedDB copy projected into React state | Supplies the R&D navigation, editable metadata, selected preview background, ordered document blocks, and original reference images. |
| `selectedId`, `draft` | `string \| null`, `RndMockupRecord \| null` | Local R&D selection and working copy | Keeps navigation identity separate from editable display title and unsaved fields. |
| `pendingAssets`, `removedAssetIds` | `RndReferenceAsset[]`, `string[]` | Unsaved R&D asset transaction state | Makes image additions/removals atomic with the next record save. |
| `saveState`, `errorMessage` | `idle \| saving \| saved \| error`, `string` | Local workflow status | Drives document `aria-busy`, navigation locks during persistence, and persistent failure feedback. Autosave runs silently without a recovery-status row. |
| `repositorySaveState`, `repositoryMessage` | `idle \| saving \| saved \| error`, `string` | Explicit repository-save workflow | Drives the shared application-header button through the registered shell callback. Success is silent and returns the button to `Save`; only failure feedback appears in the document. |
| `adminBeforeLeaveRef` | Registered `() => Promise<boolean>` | Index-owned navigation guard | Prevents Back, sidebar, account, and sign-out navigation from discarding a dirty R&D draft when device-local persistence fails. |
| `RND_PROTOTYPE_DEFINITIONS` | Read-only `RndPrototypeDefinition[]` | Repository-owned source registry | Joins a stable record ID to a coded preview and factual details without persisting executable content in the browser. |

---

## 9. Styling Reference

### 9a. Colors

| Use | Hex and Tailwind/Class | Notes |
|---|---|---|
| Hub background | `#000000 / bg-black` | Full Admin workspace background. |
| Empty thumbnail | `#18181B / bg-zinc-900` | Card fallback when no image URL exists. |
| Card border | `#4A5F7F / border-[#4a5f7f]` | Chronicle blue-gray outline. |
| Card title | `#FFFFFF / text-white` | Primary tile label. |
| Card description | `#CBD5E1 / text-slate-300` | Secondary two-line description. |
| Edit button | `#FFFFFF / bg-white`; `#303137 / text-[hsl(var(--ui-surface-2))]` | Presentation-metadata action. |
| Open button | `#3B82F6 / bg-blue-500`; `#FFFFFF / text-white` | Tool navigation action. |
| Hover overlay | `rgba(0,0,0,0.30) / bg-black/30` | Reveals card actions without changing the tool state. |
| R&D document | `#FFFFFF / bg-white` | Uninterrupted editable page with no cards or recessed fields. |
| R&D navigation | Base `#2A2A2F / bg-[#2a2a2f]`; header and rows `#3C3E47 / bg-[#3c3e47]` | Reuses the Story Builder roster-rail palette beside the document. |
| R&D protected-shell header | `#5A7292→#4A5F7F / bg-gradient-to-b` | Thin title/source strip inside the permanent protected shell. Chronicle's shared application header remains white. |
| R&D preview backgrounds | `#FFFFFF`, `#D4D4D8`, `#71717A`, `#1A1A1E` | User-selected contrast surface for the protected preview only. |
| Protected details surface | `#FFFFFF / bg-white`; `#555555 / text-[#555]` | Separates the protected preview's factual record from the ordinary editable white document below. |

### 9b. Typography

| Element | Classes | Behavior |
|---|---|---|
| Tool title | Normally `text-base font-bold truncate`; Chronicle Knowledge Base uses `text-sm font-bold leading-tight` | Existing tiles remain one line; the longer Knowledge Base label remains fully readable. |
| Tool description | `text-xs italic line-clamp-2` | Two-line maximum. |
| Action buttons | `text-xs font-bold uppercase tracking-wider` | Compact operator-action labels. |
| R&D title | `text-4xl font-bold tracking-[-0.035em]` | Editable display title; it does not change the stable ID. |
| R&D document text | `text-[16px] leading-8` | Auto-growing spellchecked text blocks in the ordered document flow. |
| R&D utility labels | `text-[10px]` to `text-[11px] font-black uppercase tracking-widest` | Navigation grouping, protected-shell headings, factual metadata, and accordion labels. |

### 9c. Spacing and radii

| Element | Value | Class |
|---|---|---|
| Page padding | `1rem` base; `2.5rem` at `lg` | `p-4 lg:p-10` |
| Grid gap | `1rem` base; `2rem` at `lg` | `gap-4 lg:gap-8` |
| Tile radius | `2rem` | `rounded-[2rem]` |
| Tile text inset | `1.25rem` | `p-5` |
| Action button radius | `0.75rem` | `rounded-xl` |
| R&D navigation width | `15.625–18.75rem` at `lg`; full-width below `lg` | `lg:w-[clamp(250px,28vw,300px)]` |
| R&D document padding | `1.5rem` base; `3.5rem` at `lg` | `px-6 sm:px-10 lg:px-14` |

### 9d. Icons

| Icon | Source | Size and Color | Purpose |
|---|---|---|---|
| Sparkles | `lucide-react` | `w-12 h-12`, `#52525B / text-zinc-600` | Empty-thumbnail marker only. |
| Sidebar gear | `lucide-react` through Chronicle's sidebar | Sidebar-owned | Opens the Admin workspace. |
| Standalone back chevrons | Inline SVG or page-owned icon | Page-owned | Return from each standalone route to `/?tab=admin`. |
| BookOpen, Plus, FileImage | `lucide-react` | `h-4 w-4` | Canonical guide destination, Add New Mock-up, and notes-only navigation item. |
| ChevronDown | `lucide-react` | `h-5 w-5` | Opens and closes the protected shell's Component Details record. |
| Trash2 | `lucide-react` | `h-3.5 w-3.5` | Removes an inline reference image. The shared header Save action is text-only, matching Chronicle's existing header pattern. |

---

## 10. Security & Access Control

| Boundary | Control | What It Enforces |
|---|---|---|
| Admin sidebar and workspace | Asynchronous `checkIsAdmin(userId)` in the Index shell | Whether the Admin workspace is offered and rendered for the current authenticated user. |
| Standalone operator routes | `AdminOnlyRoute` in `src/App.tsx` | Rechecks authenticated identity and backend Admin role before rendering Chronicle UI Guide, Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, or Validation Evidence Ledger. |
| Tile metadata | `app_settings` RLS using `has_role(auth.uid(), 'admin')` | Read/write authority for shared Admin tile overrides. |
| Image Generation data | `art_styles` RLS | Admin-only writes and public reads according to the live policy. |
| Tile thumbnails | `guide_images` storage policies require `has_role(auth.uid(), 'admin')` for writes; paths use `{userId}/admin-tools/...` | Administrator-only upload boundary; the resulting public URL is presentation metadata. The `avatars` profile-filename policy does not apply to this bucket. |
| R&D workspace visibility | Existing asynchronous Admin check in the Index shell | R&D is rendered only inside the already Admin-gated workspace. |
| R&D local recovery | Browser IndexedDB in the current browser profile | Provides automatic short-term recovery but is not presented as the durable source. It is never sent to Supabase. |
| R&D repository write | `rndRepositoryDevPlugin()` with loopback address enforcement | Accepts writes only through the local Vite development server; deployed/static Chronicle does not expose this filesystem endpoint. |
| R&D repository paths | Safe stable-ID grammar, manifest validation, generated asset filenames, realpath containment, symlink checks, and staged replacement | Prevents traversal and limits each Save to `docs/research-development/mockups/{mockupId}/`. |
| R&D image input | MIME, per-file size, per-page count, and total-byte validation in `rnd-storage.ts` | Accepts JPEG, PNG, and WebP only; rejects SVG and oversized batches before writing. |
| R&D source boundary | Empty registry by default plus `RndPrototypeShell` | Browser content cannot store or execute HTML/JSX; only repository code can attach a coded preview and factual details. |

Cached or local Admin presentation state never grants access. Backend role verification and backend policies remain authoritative.

---

## 11. Dependencies & Cross-Page Interactions

| Dependency | Direction | Detail |
|---|---|---|
| Art styles → Gallery/Chat | Configuration | Image Generation maintains art-style prompts consumed by image operations. |
| Model settings → Chat | Configuration | AI Status exposes current model and backend configuration used by LLM operations. |
| Chronicle UI Guide ↔ Admin Panel | Navigation | Tile opens `/style-guide/chronicle-ui-guide`; shared header and back chevron return to `/?tab=admin`. |
| Chronicle Knowledge Base ↔ Admin Panel | Navigation | Tile opens `/style-guide/chronicle-knowledge-base`; header chevron returns to `/?tab=admin`. |
| Chronicle Knowledge Base → Supabase Schema Reference | Reference link | Every capability's Supabase Tables tab directs agents to `/style-guide/supabase-schema-reference` rather than reproducing backend definitions. |
| Supabase Schema Reference ↔ Admin Panel | Navigation | Tile opens `/style-guide/supabase-schema-reference`; back control returns to `/?tab=admin`. |
| Quality Hub ↔ Admin Panel | Navigation | Tile opens `/style-guide/ui-audit`; back control returns to `/?tab=admin`. |
| Validation Evidence Ledger ↔ Admin Panel | Navigation | Tile opens `/style-guide/validation-evidence-ledger`; back control returns to `/?tab=admin`. |
| Research & Development → Chronicle UI Guide | Protected-route navigation | Preserves the active local draft and opens `/style-guide/chronicle-ui-guide`; no guide copy is created. |
| R&D local workspace ↔ source registry | Stable-ID join | `RndMockupRecord.id` links editable browser content to `RND_PROTOTYPE_DEFINITIONS`; renaming never changes the join. |
| R&D repository client ↔ Vite middleware | Same-origin loopback API | Save writes the current mock-up folder; workspace load restores manifests and original images before merging with local recovery data. |
| R&D README | Prototype reference | `src/components/admin/research-development/README.md` documents the isolated prototype workspace and its preservation boundaries. |

---

## 12. Known Issues & Gotchas

- RESOLVED: 2026-03-04 — `app_settings` RLS previously used a hardcoded Admin UUID; it now uses the `has_role(auth.uid(), 'admin')` database function.
- RESOLVED: 2026-03-04 — Admin checks previously used synchronous `isAdminUser()` logic with a hardcoded UUID; they now call the asynchronous backend `checkIsAdmin(userId)` path.
- RESOLVED: 2026-05-10 — A zero-row `app_settings` update previously appeared successful; `handleSaveTool()` now selects updated IDs and inserts the setting when no row matched.
- RESOLVED: 2026-05-10 — Tile thumbnail uploads previously used a storage path that did not match user-scoped policies; they now write beneath `{userId}/admin-tools/...`.
- RESOLVED: 2026-08-09 — Obsolete standalone documentation entries were removed from the Admin registry and protected route table; current product and architecture guidance now opens through Chronicle Knowledge Base.
- RESOLVED: 2026-08-10 — IndexedDB is no longer the only R&D persistence path. The explicit top-right Save action writes a durable repository folder that reloads after browser storage is cleared.
- ACTIVE: 2026-08-10 — Repository Save is intentionally available only from Chronicle's loopback local development server; a deployed static build cannot write its source checkout.
- ACTIVE: 2026-08-15 — The R&D source registry is intentionally empty until Codex attaches a coded mock-up to a user-created stable ID. Every browser-created page still displays the shared empty protected shell; only repository code can populate its preview and factual details.

---

## 13. Planned/Future Enhancements

The Chronicle UI Guide contains twelve regional references using the preserved Story Builder reference as its formatting template. `docs/ui-guide/catalog.json` identifies published coverage; `docs/ui-guide/README.md` describes regional coverage and illustration limits. Each reference is a representative styling menu, not a complete inventory of every component.

> Last updated: 2026-08-15 — Simplified every R&D page to the permanent App Style Guide-style protected shell, kept editable notes below it, and added four compact per-mock-up preview-background swatches while preserving IndexedDB recovery and explicit repository Save.

> Last updated: 2026-09-07 — Added the Chronicle UI Guide tile, protected route, shared Markdown source, and direct image access for coding agents.
