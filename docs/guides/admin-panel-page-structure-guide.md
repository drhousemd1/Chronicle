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
|-------|--------|
| **Tab Key** | `admin` |
| **Source File** | `src/pages/Admin.tsx` (174 lines) |
| **Purpose** | Admin hub providing access to 3 sub-tools: Image Generation, Model Settings, and App Guide. Only visible to users with `admin` role. |
| **Access** | Requires async `checkIsAdmin(userId)` — calls `has_role()` RPC against `user_roles` table for `admin` role |
| **Sidebar Label** | Settings (gear icon from lucide) |

---

## 2. Layout & Structure

The Admin Panel has two states:
1. **Hub view** (default): Grid of tool cards
2. **Tool view**: Full-screen rendering of the selected tool

Hub layout: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8`

Tool cards use the standard Chronicle card style: `aspect-[2/3] rounded-[2rem] border border-[#4a5f7f]` with gradient overlay and hover lift effect (`group-hover:-translate-y-3`).

---

## 3. UI Elements — Complete Inventory

| Element | Type | Label | Color—BG | Color—Text | Interaction | Notes |
|---------|------|-------|----------|-----------|-------------|-------|
| Tool card | Card | Tool title | `bg-zinc-900` (no thumbnail) | `text-white` (title), `text-slate-300` (desc) | Click → open tool | Aspect 2:3, rounded-2rem |
| Edit button | Button | Edit | `bg-white` | `text-slate-900` | Opens `AdminToolEditModal` | Appears on hover |
| Open button | Button | Open | `bg-blue-600` | `text-white` | Navigates to tool | Appears on hover |
| Sparkles icon | Icon | — | — | `text-zinc-600` | — | Shown when no thumbnail |

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect |
|--------|---------|--------|
| Click tool card | `onSetActiveTool(tool.id)` | Opens the selected tool |
| Click Edit | `setEditingTool(tool)` | Opens AdminToolEditModal |
| Save tool metadata | `handleSaveTool` | Persists to `app_settings` table, key `admin_tool_meta` |

---

## 5. Modals, Dialogs & Sheets

#### Modal: AdminToolEditModal

| Field | Detail |
|-------|--------|
| **Trigger** | Edit button on tool card hover |
| **Component** | `src/components/admin/AdminToolEditModal.tsx` |
| **Purpose** | Edit tool title, description, and thumbnail URL |
| **Form Fields** | Title (text), Description (text), Thumbnail URL (text) |
| **Save** | Updates `app_settings.admin_tool_meta` in Supabase |

---

## 6. Data Architecture

### 6a. Tool Metadata

3 default tools defined in `DEFAULT_TOOLS` constant:

| Tool ID | Title | Lazy-loaded Component |
|---------|-------|-----------------------|
| `image_generation` | Image Generation | `src/components/admin/ImageGenerationTool.tsx` |
| `model_settings` | Model Settings | `src/components/chronicle/ModelSettingsTab.tsx` |
| `app_guide` | App Guide | `src/components/admin/guide/AppGuideTool.tsx` |

Custom metadata (title/description/thumbnail overrides) stored in `app_settings` table with key `admin_tool_meta`.

### 6b. Sub-Tool: Image Generation

Manages art style configurations:
- Table: `art_styles` (id, display_name, thumbnail_url, backend_prompt, backend_prompt_masculine, backend_prompt_androgynous, sort_order)
- RLS: Admin-only write, public read

### 6c. Sub-Tool: Model Settings

Component: `ModelSettingsTab` — manages LLM model selection and shared API key configuration.
- Uses `app_settings` table for shared key storage
- Edge Function: `check-shared-keys` for API key validation

### 6d. Sub-Tool: App Guide

Component: `AppGuideTool` → `GuideEditor` + `GuideSidebar`
- Table: `guide_documents` (id, title, markdown, sort_order, content, created_at, updated_at)
- RLS: Admin-only CRUD
- GitHub sync via `sync-guide-to-github` Edge Function
- View/Edit split: ReactMarkdown view + raw textarea edit

---

## 7. Component Tree

```tsx
<AdminPage>  # src/pages/Admin.tsx
  {/* Hub view */}
  <ToolCard> (×3)
  <AdminToolEditModal>  # src/components/admin/AdminToolEditModal.tsx
  
  {/* Tool views (conditional) */}
  <ImageGenerationTool>  # src/components/admin/ImageGenerationTool.tsx (lazy)
  <ModelSettingsTab>  # src/components/chronicle/ModelSettingsTab.tsx
  <AppGuideTool>  # src/components/admin/guide/AppGuideTool.tsx (lazy)
    <GuideSidebar>  # src/components/admin/guide/GuideSidebar.tsx
    <GuideEditor>  # src/components/admin/guide/GuideEditor.tsx
```

---

## 8. State Management

| State | Type | Purpose |
|-------|------|--------|
| `tools` | `ToolMeta[]` | Tool metadata (merged defaults + overrides) |
| `editingTool` | `ToolMeta \| null` | Currently editing tool |
| `activeTool` | `string` | Lifted to Index.tsx as `adminActiveTool` |

---

## 9. Styling Reference

| Element | Classes |
|---------|--------|
| Page bg | `bg-black` |
| Card container | `aspect-[2/3] rounded-[2rem] border border-[#4a5f7f]` |
| Card gradient | `bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent` |
| Hover overlay | `bg-black/30 opacity-0 group-hover:opacity-100` |
| Hover lift | `group-hover:-translate-y-3 group-hover:shadow-2xl` |

---

## 10. Security & Access Control

- Admin panel tab only visible when async `checkIsAdmin(userId)` resolves to `true` (uses `isAdminState` in `Index.tsx`)
- `app_settings` table: Admin-only insert/update via `has_role(auth.uid(), 'admin')` RLS
- `art_styles` table: Admin-only write, public read
- `guide_documents` table: Admin-only CRUD via `has_role(auth.uid(), 'admin')` RLS
- All Edge Functions use CORS hardening with dynamic origin check (`getCorsHeaders(req)`) against `ALLOWED_ORIGINS` whitelist

---

## 11. Dependencies & Cross-Page Interactions

| Dependency | Direction | Detail |
|-----------|-----------|--------|
| Art styles → Gallery/Chat | Config | Art style prompts used in image generation |
| Model settings → Chat | Config | Selected model used by LLM in chat |
| Guide docs → GitHub | Sync | Docs synced to `docs/guides/` in repo |

---

## 12. Known Issues & Gotchas

- **RESOLVED — 2026-03-04**: `app_settings` RLS previously used hardcoded admin UUID — now uses `has_role(auth.uid(), 'admin')` database function.
- **RESOLVED — 2026-03-04**: Admin check previously used sync `isAdminUser()` with hardcoded UUID — now uses async `checkIsAdmin(userId)` calling `has_role()` RPC in `src/services/app-settings.ts`.
- **ACTIVE**: Tool metadata persistence uses upsert pattern (update then insert on failure) which may race. (2026-03-01)

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-03-04 — Admin security hardened: hardcoded UUID replaced with database role check via `has_role()` RPC. CORS hardening applied.