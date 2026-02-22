

# Build the App Guide Tool -- Admin Panel Documentation Editor

## Overview

Add a new "App Guide" tile to the Admin Panel that opens a full-page BlockNote rich text editor with a document sidebar and live table of contents. This tool will serve as a living documentation system for the entire Chronicle application, stored in the database and accessible to any AI or developer.

## Sequencing

This plan covers **Step 1 only** -- building the tool itself. Documentation writing (Steps 2 and 3 from the instructions) will happen in a follow-up once the tool is confirmed working.

---

## Part A: Database Setup

Create a new `guide_documents` table:

```text
guide_documents
  id           UUID (PK, default gen_random_uuid())
  title        TEXT NOT NULL DEFAULT 'Untitled Document'
  content      JSONB          -- BlockNote JSON block tree
  markdown     TEXT           -- Plain markdown export for LLM consumption
  created_at   TIMESTAMPTZ DEFAULT now()
  updated_at   TIMESTAMPTZ DEFAULT now()
  sort_order   INTEGER DEFAULT 0
```

RLS policy: Admin-only access (matching the existing `app_settings` pattern using the hardcoded admin UUID `98d690d7-ac5a-4b04-b15e-78b462f5eec6`).

---

## Part B: Install Dependencies

Add BlockNote packages:
- `@blocknote/react`
- `@blocknote/core`
- `@blocknote/mantine`

---

## Part C: New Files to Create

### 1. `src/components/admin/guide/GuideSidebar.tsx`
- Background: `#111111`, fixed width 240px
- Top label: "APP GUIDE" in small caps, muted text
- **Documents section**: "DOCUMENTS" header, scrollable list of documents from `guide_documents` ordered by `sort_order`. Active item has `bg-[#2a2a2a]` with left accent border `2px solid #00F0FF`. Hover: `bg-[#1f1f1f]`. Click loads document in editor.
- "+ New Document" button at bottom of document list
- Divider line
- **Table of Contents section**: "ON THIS PAGE" header. Auto-generated from heading blocks in the currently open BlockNote document. H1 = no indent, H2 = `ml-3`, H3 = `ml-6`. Click scrolls editor to that heading. Text: `text-xs`, `#9CA3AF`, hover white. Updates live.

### 2. `src/components/admin/guide/GuideEditor.tsx`
- Takes remaining horizontal space
- Top bar (40px): left side = editable document title (click to rename, blur/Enter saves), right side = Save button (blue, visible only when unsaved changes exist) + last-saved timestamp
- Editor area: BlockNote in dark theme, full height
- Keyboard shortcut: Cmd/Ctrl+S triggers save
- Save logic: extract BlockNote JSON document + convert to markdown string, UPDATE both `content` and `markdown` columns in Supabase, show toast "Guide saved"

### 3. `src/components/admin/guide/AppGuideTool.tsx`
- Main wrapper component for the App Guide tool
- Layout: `flex h-full` with GuideSidebar on left, GuideEditor filling remaining space
- Manages state: selected document ID, document list, current document content
- Fetches document list from Supabase on mount
- No loading spinners -- render sidebar immediately with whatever data is available

---

## Part D: Modify Existing Files

### `src/pages/Admin.tsx`
- Add `app_guide` entry to `DEFAULT_TOOLS` array:
  - id: `'app_guide'`
  - title: `'App Guide'`
  - description: `'Complete documentation for every page and system'`
  - thumbnailUrl: none (will show BookOpen-style Sparkles icon)
- Add handler: `if (activeTool === 'app_guide') return <AppGuideTool />;`

No other existing files are modified.

---

## Part E: BlockNote Dark Theme

Override BlockNote CSS variables in `src/index.css` (or a scoped wrapper):

```text
[data-color-scheme="dark"] {
  --bn-colors-editor-background: #0d0d0d;
  --bn-colors-editor-text: #e2e2e2;
  --bn-colors-menu-background: #1a1a1a;
  --bn-colors-menu-text: #e2e2e2;
  --bn-colors-hovered-background: #2a2a2a;
  --bn-colors-selected-background: #2a2a2a;
  --bn-colors-border: #333333;
}
```

Force dark mode via `<BlockNoteView editor={editor} theme="dark" />`.

---

## Part F: Key Behaviors

- **Document switching**: clicking a sidebar item loads that document's `content` JSON into BlockNote. If content is null, editor starts empty.
- **New document**: inserts a new row with default title "Untitled Document", `sort_order` = max + 1, opens it immediately.
- **Title editing**: inline editable in the top bar. On blur/Enter, updates the `title` column in Supabase and refreshes the sidebar list.
- **TOC generation**: parses `editor.document` for heading-type blocks, extracts level + text + id. Clicking a TOC entry uses `document.querySelector([data-id="blockId"])?.scrollIntoView({ behavior: 'smooth' })`.
- **Save**: Cmd/S or button. Writes JSON to `content`, markdown string to `markdown`, and current timestamp to `updated_at`. Toast: "Guide saved".
- **No loading screens**: document list renders immediately. If Supabase is slow, the sidebar is simply empty until data arrives.

---

## Deliverable Checklist (from Document 1, Part 5)

1. Admin Panel shows "App Guide" tile matching existing tile style
2. Clicking tile sets `activeTool` to `'app_guide'` and renders AppGuideTool
3. Guide sidebar shows document list from Supabase
4. Clicking a document opens it in BlockNote editor
5. BlockNote renders in dark theme matching Chronicle colors
6. Slash (`/`) command menu works for inserting blocks
7. Floating format toolbar works on text selection
8. TOC section in sidebar updates when document is loaded
9. Clicking TOC item scrolls to that heading in editor
10. Save button / Cmd+S saves content + markdown to Supabase
11. Toast shows on save
12. "New Document" button creates blank document and opens it
13. Inline title editing works
14. No existing pages or components were modified (except Admin.tsx tile list)
15. No loading spinners anywhere

