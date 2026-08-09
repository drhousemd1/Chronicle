> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format
> 5. USE REAL VALUES from the code
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`

# PAGE: ADMIN PANEL

---

## 1. Page Overview

| Field | Detail |
|---|---|
| **Tab Key** | `admin` |
| **Primary Source File** | `src/pages/Admin.tsx` (297 lines) |
| **Route Shell** | The hub renders inside Chronicle's root workspace at `/?tab=admin`; standalone operator tools use protected `/style-guide/*` routes registered in `src/App.tsx`. |
| **Purpose** | Admin hub providing ten top-level tiles: Image Generation, AI Status, App Dashboard, App Architecture, Chronicle Knowledge Base, Supabase Schema Reference, Roleplay Pipeline, Quality Hub, Validation Evidence Ledger, and Finance Dashboard. |
| **Access** | Requires asynchronous `checkIsAdmin(userId)`, which calls the `has_role()` RPC against the `user_roles` table for the `admin` role. Every standalone operator route is also wrapped in `AdminOnlyRoute`. |
| **Sidebar Label** | Settings, represented by the Lucide gear icon in Chronicle's application sidebar. |
| **Entry Points** | Select Settings in the Chronicle sidebar, or return from a standalone operator page through its back chevron to `/?tab=admin`. |

---

## 2. Layout and Structure

The Admin Panel has two presentation states. The default hub view renders the tile registry. Embedded tools replace the hub inside the Admin workspace, while standalone operator tools leave the workspace route and render their own protected page shell.

The hub grid uses `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`. Each tile uses an `aspect-[2/3]` container, a `2rem` corner radius, the Chronicle blue-gray border, a thumbnail or dark fallback, bottom-aligned title and description text, and an action overlay that appears on hover.

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

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect | Destination or State |
|---|---|---|---|
| Select an embedded-tool tile | `handleOpenTool(tool.id)` → `onSetActiveTool(tool.id)` | Replaces the Admin hub with the selected embedded tool | `image_generation`, `model_settings`, `style_guide`, or `finance_dashboard` |
| Select App Architecture | `handleOpenTool('app_architecture')` | Navigates to the standalone repository map | `/style-guide/app-architecture` |
| Select Chronicle Knowledge Base | `handleOpenTool('chronicle_knowledge_base')` | Navigates to the source-backed Chronicle product and architecture manual | `/style-guide/chronicle-knowledge-base` |
| Select Supabase Schema Reference | `handleOpenTool('supabase_schema_reference')` | Navigates to the Lovable-backed schema reference | `/style-guide/supabase-schema-reference` |
| Select Roleplay Pipeline | `handleOpenTool('roleplay_pipeline')` | Navigates to API Inspector's roleplay pipeline presentation | `/style-guide/api-inspector` |
| Select Quality Hub | `handleOpenTool('quality_hub')` | Navigates to the Quality Hub | `/style-guide/ui-audit` |
| Select Validation Evidence Ledger | `handleOpenTool('validation_evidence_ledger')` | Navigates to the validation ledger page | `/style-guide/validation-evidence-ledger` |
| Select Edit | `setEditingTool(tool)` | Opens the tile metadata modal without opening the tool | `editingTool` becomes the selected `ToolMeta` |
| Save tile metadata | `handleSaveTool(toolId, patch)` | Optimistically merges the patch, updates `app_settings.admin_tool_meta`, and inserts the setting if the update matched no row | Supabase `app_settings` |
| Close tile metadata modal | `setEditingTool(null)` | Dismisses the editor without navigating | `editingTool` becomes `null` |

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
| `style_guide` | App Dashboard | `src/components/admin/styleguide/StyleGuideTool.tsx` |
| `app_architecture` | App Architecture | `/style-guide/app-architecture` → `src/pages/style-guide/app-architecture.tsx` |
| `chronicle_knowledge_base` | Chronicle Knowledge Base | `/style-guide/chronicle-knowledge-base` → `src/pages/style-guide/chronicle-knowledge-base.tsx` |
| `supabase_schema_reference` | Supabase Schema Reference | `/style-guide/supabase-schema-reference` → `src/pages/style-guide/supabase-schema-reference.tsx` |
| `roleplay_pipeline` | Roleplay Pipeline | `/style-guide/api-inspector` → `src/pages/style-guide/api-inspector.tsx` |
| `quality_hub` | Quality Hub | `/style-guide/ui-audit` → `src/pages/style-guide/ui-audit.tsx` |
| `validation_evidence_ledger` | Validation Evidence Ledger | `/style-guide/validation-evidence-ledger` → `src/pages/style-guide/validation-evidence-ledger.tsx` |
| `finance_dashboard` | Finance Dashboard | `src/components/admin/finance/FinanceDashboardTool.tsx` |

### 6b. Metadata persistence and cache flow

```typescript
1. AdminPage mounts with DEFAULT_TOOLS.
2. AdminPage reads app_settings where setting_key = "admin_tool_meta".
3. Persisted overrides merge by stable tool ID.
4. A legacy App Dashboard description is discarded when it matches a known stale value.
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
| `avatars` storage bucket | Upload tile thumbnail | Store the selected image under `{userId}/admin-tools/...` | Authenticated storage policy |

### 6c. Embedded operational tools

Image Generation is lazy-loaded from `src/components/admin/ImageGenerationTool.tsx` and manages `art_styles` records. AI Status renders `src/components/chronicle/ModelSettingsTab.tsx`. Finance Dashboard is lazy-loaded from `src/components/admin/finance/FinanceDashboardTool.tsx`. Their data contracts remain owned by those tools rather than the Admin hub.

### 6d. App Dashboard and App Guide

`src/components/admin/styleguide/StyleGuideTool.tsx` renders the App Dashboard. `src/components/admin/guide/AppGuideTool.tsx` is reached through that dashboard rather than through a separate top-level Admin tile. App Guide reads and edits `guide_documents` and can invoke the `sync-guide-to-github` Edge Function.

### 6e. App Architecture

`src/pages/style-guide/app-architecture.tsx` remains the separate exhaustive repository-map tool at `/style-guide/app-architecture`. It uses the manual App Architecture registry plus generated relationship and metric data. Chronicle Knowledge Base does not replace this route or tile.

### 6f. Chronicle Knowledge Base and Supabase Schema Reference

`src/pages/style-guide/chronicle-knowledge-base.tsx` renders the repository-owned source-readable manual from `docs/architecture-knowledge/manifest.json` and the Markdown sources in `docs/architecture-knowledge/`. It contains capability-local tabs, checked-in reference images, and a direct reference to `/style-guide/supabase-schema-reference`.

`src/pages/style-guide/supabase-schema-reference.tsx` renders the Codex-accessible representation of Chronicle's Lovable-controlled Supabase project. The Knowledge Base links to it instead of duplicating its table, column, relationship, policy, function, trigger, or storage definitions.

### 6g. Roleplay Pipeline, Quality Hub, and Validation Evidence Ledger

`src/pages/style-guide/api-inspector.tsx`, `src/pages/style-guide/ui-audit.tsx`, and `src/pages/style-guide/validation-evidence-ledger.tsx` own their specialist presentations. The Admin hub only routes to them. API Inspector and the ledger present diagnostics or evidence; their presence does not prove that a runtime behavior is enforced.

### 6h. React Query, IndexedDB, and browser storage

The Admin hub itself does not define a React Query key, IndexedDB store, or browser-storage cache. It uses React local state for tile presentation and Supabase for persisted overrides. Individual tools may use their own query or storage layers, which remain documented by those tool owners.

---

## 7. Component Tree

```tsx
<AdminPage>  # src/pages/Admin.tsx
  <ToolCard /> ×10  # rendered inline by src/pages/Admin.tsx
  <AdminToolEditModal />  # src/components/admin/AdminToolEditModal.tsx

  <ImageGenerationTool />  # src/components/admin/ImageGenerationTool.tsx (conditional, lazy)
  <ModelSettingsTab />  # src/components/chronicle/ModelSettingsTab.tsx (conditional)
  <StyleGuideTool />  # src/components/admin/styleguide/StyleGuideTool.tsx (conditional, lazy)
    <AppGuideTool />  # src/components/admin/guide/AppGuideTool.tsx (selected from App Dashboard)
      <GuideSidebar />  # src/components/admin/guide/GuideSidebar.tsx
      <GuideEditor />  # src/components/admin/guide/GuideEditor.tsx
  <FinanceDashboardTool />  # src/components/admin/finance/FinanceDashboardTool.tsx (conditional, lazy)

<AdminOnlyRoute>  # src/App.tsx
  <AppArchitecturePage />  # src/pages/style-guide/app-architecture.tsx
  <ChronicleKnowledgeBasePage>  # src/pages/style-guide/chronicle-knowledge-base.tsx
    <KnowledgeSwitcher /> ×15  # src/components/admin/knowledge-base/KnowledgeSwitcher.tsx
    <CommunityGalleryArchitecture />  # src/components/admin/knowledge-base/CommunityGalleryArchitecture.tsx
  <SupabaseSchemaReferencePage />  # src/pages/style-guide/supabase-schema-reference.tsx
  <ApiInspectorPage />  # src/pages/style-guide/api-inspector.tsx
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

### 9b. Typography

| Element | Classes | Behavior |
|---|---|---|
| Tool title | Normally `text-base font-bold truncate`; Chronicle Knowledge Base uses `text-sm font-bold leading-tight` | Existing tiles remain one line; the longer Knowledge Base label remains fully readable. |
| Tool description | `text-xs italic line-clamp-2` | Two-line maximum. |
| Action buttons | `text-xs font-bold uppercase tracking-wider` | Compact operator-action labels. |

### 9c. Spacing and radii

| Element | Value | Class |
|---|---|---|
| Page padding | `1rem` base; `2.5rem` at `lg` | `p-4 lg:p-10` |
| Grid gap | `1rem` base; `2rem` at `lg` | `gap-4 lg:gap-8` |
| Tile radius | `2rem` | `rounded-[2rem]` |
| Tile text inset | `1.25rem` | `p-5` |
| Action button radius | `0.75rem` | `rounded-xl` |

### 9d. Icons

| Icon | Source | Size and Color | Purpose |
|---|---|---|---|
| Sparkles | `lucide-react` | `w-12 h-12`, `#52525B / text-zinc-600` | Empty-thumbnail marker only. |
| Sidebar gear | `lucide-react` through Chronicle's sidebar | Sidebar-owned | Opens the Admin workspace. |
| Standalone back chevrons | Inline SVG or page-owned icon | Page-owned | Return from each standalone route to `/?tab=admin`. |

---

## 10. Security & Access Control

| Boundary | Control | What It Enforces |
|---|---|---|
| Admin sidebar and workspace | Asynchronous `checkIsAdmin(userId)` in the Index shell | Whether the Admin workspace is offered and rendered for the current authenticated user. |
| Standalone operator routes | `AdminOnlyRoute` in `src/App.tsx` | Rechecks authenticated identity and backend Admin role before rendering App Architecture, Chronicle Knowledge Base, Supabase Schema Reference, Roleplay Pipeline, Quality Hub, or Validation Evidence Ledger. |
| Tile metadata | `app_settings` RLS using `has_role(auth.uid(), 'admin')` | Read/write authority for shared Admin tile overrides. |
| Image Generation data | `art_styles` RLS | Admin-only writes and public reads according to the live policy. |
| App Guide data | `guide_documents` RLS | Admin-only document CRUD. |
| Tile thumbnails | Authenticated storage path under `{userId}/admin-tools/...` | User-scoped upload boundary; the resulting public URL is presentation metadata. |

Cached or local Admin presentation state never grants access. Backend role verification and backend policies remain authoritative.

---

## 11. Dependencies & Cross-Page Interactions

| Dependency | Direction | Detail |
|---|---|---|
| Art styles → Gallery/Chat | Configuration | Image Generation maintains art-style prompts consumed by image operations. |
| Model settings → Chat | Configuration | AI Status exposes current model and backend configuration used by LLM operations. |
| Guide documents → GitHub | Synchronization | App Guide can synchronize repository guide files through its Edge Function workflow. |
| App Architecture ↔ Admin Panel | Navigation | Tile opens `/style-guide/app-architecture`; back control returns to `/?tab=admin`. |
| Chronicle Knowledge Base ↔ Admin Panel | Navigation | Tile opens `/style-guide/chronicle-knowledge-base`; header chevron returns to `/?tab=admin`. |
| Chronicle Knowledge Base → Supabase Schema Reference | Reference link | Every capability's Supabase Tables tab directs agents to `/style-guide/supabase-schema-reference` rather than reproducing backend definitions. |
| Supabase Schema Reference ↔ Admin Panel | Navigation | Tile opens `/style-guide/supabase-schema-reference`; back control returns to `/?tab=admin`. |
| Roleplay Pipeline ↔ Admin Panel | Navigation | Tile opens `/style-guide/api-inspector`; back control returns to `/?tab=admin`. |
| Quality Hub ↔ Admin Panel | Navigation | Tile opens `/style-guide/ui-audit`; back control returns to `/?tab=admin`. |
| Validation Evidence Ledger ↔ Admin Panel | Navigation | Tile opens `/style-guide/validation-evidence-ledger`; back control returns to `/?tab=admin`. |

---

## 12. Known Issues & Gotchas

- RESOLVED: 2026-03-04 — `app_settings` RLS previously used a hardcoded Admin UUID; it now uses the `has_role(auth.uid(), 'admin')` database function.
- RESOLVED: 2026-03-04 — Admin checks previously used synchronous `isAdminUser()` logic with a hardcoded UUID; they now call the asynchronous backend `checkIsAdmin(userId)` path.
- RESOLVED: 2026-05-09 — App Architecture, Roleplay Pipeline, and Quality Hub moved from App Dashboard navigation into distinct top-level Admin tiles and protected standalone routes.
- RESOLVED: 2026-05-10 — A zero-row `app_settings` update previously appeared successful; `handleSaveTool()` now selects updated IDs and inserts the setting when no row matched.
- RESOLVED: 2026-05-10 — Tile thumbnail uploads previously used a storage path that did not match user-scoped policies; they now write beneath `{userId}/admin-tools/...`.
- RESOLVED: 2026-07-26 — Chronicle Knowledge Base now has its own Admin tile and protected React route. It no longer replaces or competes with the separate App Architecture repository map.

---

## 13. Planned/Future Enhancements

N/A — No additional Admin Panel enhancement has been approved as part of the Chronicle Knowledge Base migration.

> Last updated: 2026-07-26 — Added Chronicle Knowledge Base as the tenth Admin tile, documented all current standalone routes, and reconciled the Admin hub's data, security, state, and navigation contracts.
