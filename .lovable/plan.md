

# Chronicle App Guide v2 — Full Implementation Plan

This is a large, multi-phase effort covering: (A) Guide Viewer rebuild, (B) deploying the style rules file, (C) adding instruction blocks to all existing guides, (D) updating existing guide content (bug report items, empty sections), and (E) creating 4 new guide pages. Each phase is broken down below.

---

## Phase 1: Deploy GUIDE_STYLE_RULES.md

Copy the uploaded `GUIDE_STYLE_RULES.md` file to `docs/guides/GUIDE_STYLE_RULES.md` in the project repo. This file serves as the self-prompting style reference that all guide documents will reference via their instruction blocks.

---

## Phase 2: Rebuild Guide Viewer (GuideEditor.tsx)

Replace the current `marked.js` + `contentEditable` WYSIWYG editor with a split View/Edit architecture.

### 2a. View Mode (default)
- Render markdown using `<ReactMarkdown>` with `remarkGfm` plugin (already installed) and `rehype-highlight` (needs install as dependency alongside `highlight.js`)
- Read-only — no `contentEditable`, no cursor
- Apply exact dark-theme CSS styles per the spec:
  - h1: `text-white text-3xl font-bold mt-6 mb-3`
  - h2: `text-white text-2xl font-bold mt-5 mb-2 pb-2 border-b border-[#333]`
  - h3: `text-white text-xl font-semibold mt-4 mb-2`
  - h4: `text-gray-400 text-base font-semibold mt-3 mb-1`
  - p: `text-[#e2e2e2] text-sm leading-relaxed mb-3`
  - Tables: `border border-[#333]`, thead `bg-[#1a1a1a]`, th/td borders, even-row striping `bg-[#111]`
  - Code blocks: `bg-[#1e1e1e] rounded-lg p-4 border border-[#333]` with syntax highlighting
  - Inline code: `bg-[#2a2a2a] rounded px-1 py-0.5 text-xs font-mono text-[#e2e2e2]`
  - Blockquotes, lists, links, hr all with specified dark-theme styling
- Wrap tables in `overflow-x-auto` div for wide table scrolling

### 2b. Edit Mode
- Raw markdown `<textarea>` with monospace font — no WYSIWYG
- Styling: `bg-[#0d0d0d] text-[#e2e2e2] font-mono text-sm`
- Line numbers in a synced left gutter: `bg-[#1e1e1e] text-[#555] font-mono text-xs w-12`
- Line numbers scroll in sync with textarea content

### 2c. View/Edit Toggle
- Toggle button in the title bar row (top-right of viewer)
- View mode: shows "Edit" button with Pencil icon
- Edit mode: shows "View" button with Eye icon + "Save" button with Save icon (blue)
- Switching from Edit to View parses textarea content and renders
- Switching from View to Edit populates textarea with current markdown
- Save writes markdown back to `guide_documents` table using existing save logic

### 2d. Search (Ctrl+F / Cmd+F)
- Search bar appears at top of content area when triggered
- Input with dark styling, match count badge
- Highlight matches with `bg-yellow-500/30 text-yellow-200`
- Navigate between matches with Enter/Shift+Enter or arrow buttons

### 2e. What stays the same
- `GuideSidebar.tsx` — unchanged
- `AppGuideTool.tsx` — unchanged (save/sync logic stays)
- `GuideLoadErrorBoundary.tsx` — unchanged
- `guide_documents` table schema — unchanged
- GitHub sync — unchanged
- Image upload/paste/drop logic — keep for Edit mode (insert markdown image syntax instead of DOM manipulation)

### 2f. What gets removed
- `GuideEditorToolbar.tsx` — no longer needed (no WYSIWYG formatting buttons)
- `marked.js` and `turndown` imports in GuideEditor — replaced by react-markdown
- All `contentEditable` logic, resize handles, DOM manipulation helpers

### 2g. CSS Updates
- Update `.guide-preview` styles in `src/index.css` to match the exact spec (hex values, borders, spacing)
- Alternatively, apply styles via ReactMarkdown's `components` prop using Tailwind classes directly

---

## Phase 3: Add Instruction Blocks to All Existing Guide Documents

Prepend the standardized instruction block to all 8 existing guide documents in the `guide_documents` database table. The instruction block text (from Part 7 of the audit):

```text
> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
> ...
> (full instruction block as specified in Part 7)
```

This must be done by updating the `markdown` column of each row in `guide_documents`. The 8 documents are:
1. Community Gallery
2. Your Stories
3. Character Library
4. Image Library
5. Chat History
6. Scenario Builder
7. Character Builder
8. Shared Elements / Architecture

---

## Phase 4: Update Existing Guide Content

### 4a. Bug Report Integration (Part 4)
Add bugs #1-6 from the bug report to the Known Issues (Section 12) of the appropriate guides:
- **Character Builder**: Bugs #1 (buildCharacterStateBlock omits empty sections), #2 (personality.traits missing from TRACKABLE FIELDS), #3 (preferredClothing field name mismatch), #4 (wrong AI model grok-3-mini), #6 (memory system incomplete)
- **Scenario Builder**: Bugs #1, #4, #5 (extraction prompt shallow), #6
- **Shared Elements**: Bugs #2, #3
- Note bugs #7 and #8 as RESOLVED in relevant sections

### 4b. Fill Empty Known Issues and Planned Changes
- Review and populate the "Cleared" sections in Community Gallery, Your Stories, and Character Library with actual findings or explicit "No active issues" with dates

### 4c. Partial Section Completion
- Scenario Builder: Complete Section 4 (Cards/List Items) and Section 5 (Modals)
- Character Builder: Complete Section 4 and Section 5 (AI modals)

---

## Phase 5: Create New Guide Pages

### 5a. App Overview and Global Systems (CRITICAL PRIORITY)
The foundational page covering:
- Tech stack, navigation structure, app shell
- User role system, data caching (IndexedDB + React Query)
- Image handling, security model, toast system
- Shared component library, critical rules, troubleshooting
- File structure overview
- Follow 13-section template

### 5b. Chat Interface (CRITICAL PRIORITY)
The core product page covering:
- Message rendering, LLM integration
- System prompt injection (`llm.ts`)
- Character state tracking, conversation management
- Message types, streaming
- `extract-character-updates` Edge Function flow
- Follow 13-section template

### 5c. Admin Panel (HIGH PRIORITY)
- Admin hub layout
- 3 sub-tools: Image Generation, Model Settings, App Guide
- Follow 13-section template for each sub-tool

### 5d. Account Page (MEDIUM PRIORITY)
- Public profile, avatar management
- Account settings, auth flow
- Profile data (profiles table)
- Follow 13-section template

### 5e. Edge Functions and AI Services (MEDIUM PRIORITY)
- All Edge Functions documentation
- `character-ai.ts`, `world-ai.ts` services
- AI model chain, prompt templates
- Enhancement flow

### 5f. UI Styling and Theme Reference (MEDIUM PRIORITY)
- Master color palette
- Typography scale
- Component variants (chronicle/UI.tsx vs shadcn)
- Icon library usage, responsive breakpoints

---

## Phase 6: Tab Ordering

Reorder the guide document tabs to match the outline Section 0 order:
1. App Overview and Global Systems
2. Community Gallery
3. Your Stories
4. Character Library
5. Image Library
6. Chat History
7. Scenario Builder
8. Admin Panel
9. Account

This is done by updating the `sort_order` column in `guide_documents`.

---

## Technical Details

### New Dependencies
- `rehype-highlight` — syntax highlighting for fenced code blocks
- `highlight.js` — underlying syntax highlighting engine (peer dep of rehype-highlight)

### Files Modified
| File | Change |
|------|--------|
| `src/components/admin/guide/GuideEditor.tsx` | Complete rewrite: View/Edit split, ReactMarkdown, textarea, search, line numbers |
| `src/components/admin/guide/MarkdownRenderer.tsx` | Update with full styled components prop or remove in favor of inline in GuideEditor |
| `src/index.css` | Update `.guide-preview` styles to match exact spec |
| `docs/guides/GUIDE_STYLE_RULES.md` | New file — copy from uploaded file |

### Files Removed
| File | Reason |
|------|--------|
| `src/components/admin/guide/GuideEditorToolbar.tsx` | No longer needed — no WYSIWYG toolbar in the new architecture |

### Database Changes
- Update `markdown` column on all existing `guide_documents` rows (prepend instruction blocks, add bug report items)
- Insert new rows for new guide pages (App Overview, Chat Interface, Admin Panel, Account, Edge Functions, UI Styling)
- Update `sort_order` on all rows to match outline order

### Execution Order
1. Install `rehype-highlight` + `highlight.js`
2. Deploy `GUIDE_STYLE_RULES.md` to repo
3. Rebuild `GuideEditor.tsx` (View/Edit split)
4. Update CSS styles
5. Update existing guide documents (instruction blocks + bug items)
6. Create new guide pages (content written by reading actual codebase)
7. Update tab sort order

This is a substantial effort. The guide viewer rebuild (Phase 2) and the new page creation (Phase 5) are the two largest pieces. The viewer rebuild is self-contained code work. The new pages require reading through the actual codebase to document real component trees, Tailwind classes, data hooks, and RLS policies — not placeholder content.

