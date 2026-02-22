

# Replace Guide Editor with Rendered Markdown Viewer

## What's Changing

The current Guide Editor shows raw markdown in a `<textarea>` -- pipe characters for tables, `#` symbols for headings, backtick fences for code. It's unreadable for humans. We're replacing the entire editor content area with a **rendered markdown viewer** that displays formatted HTML: proper tables, styled headings, syntax-highlighted code blocks, colored inline code, etc.

- **No toggle.** The rendered view is the only view.
- **No textarea.** No toolbar buttons (Bold, Italic, H1, etc.) since there's nothing to type into.
- **Editing happens through me** (AI updating the database directly), so the raw markdown stays perfectly parseable.
- **Title remains editable** inline (click to rename).
- **Save button and unsaved-changes tracking are removed** since content isn't edited in the UI anymore.

## What You'll See

The guide will look similar to the Notion screenshots you shared:
- Large bold headings with clear hierarchy
- Tables with proper columns, header rows, borders, and alternating row backgrounds
- Inline code with a highlighted background
- Code blocks with dark background and monospace font
- Bold and italic text rendered properly
- Lists with proper indentation
- Horizontal rules as visible separators

## Technical Details

### New Dependency
- `react-markdown` -- renders markdown string into React elements
- `remark-gfm` -- GitHub Flavored Markdown plugin (required for tables, strikethrough, task lists)

### Files Changed

**`src/components/admin/guide/GuideEditor.tsx`** -- Major simplification:
- Remove: textarea, toolbar, all `insertAround`/`insertAtLineStart`/`insertBlock` helpers, keyboard shortcuts for formatting, `handleChange`, `countStats`, word/char/paragraph stats bar, `useImperativeHandle` save handle
- Keep: title display (click-to-edit), TOC extraction from markdown, empty state ("Select or create a document")
- Add: `<ReactMarkdown remarkPlugins={[remarkGfm]}>` component rendering the markdown as formatted HTML
- The component becomes a read-only viewer with an editable title

**`src/components/admin/guide/AppGuideTool.tsx`** -- Simplification:
- Remove: Save button from header, `hasUnsaved` state, `isSaving` state, `editorRef` (no longer needed since there's no save action from the UI)

**`src/index.css`** -- Add scoped styles:
- `.guide-preview` class with dark-themed styles for all rendered HTML elements:
  - `h1`: `~1.75rem`, bold, white, bottom border, top margin
  - `h2`: `~1.375rem`, bold, white, bottom border
  - `h3`: `~1.125rem`, bold, white
  - `table`: full width, collapsed borders, `border-color: rgba(255,255,255,0.1)`
  - `th`: `bg-white/10`, bold, left-aligned, padded
  - `td`: padded, top border
  - `code` (inline): `bg-white/10`, small rounded pill, slight padding
  - `pre > code`: block-level, `bg-[#1e1e22]`, padded, rounded, monospace, overflow-x scroll
  - `ul/ol`: left padding, proper list-style
  - `li`: margin between items
  - `hr`: `border-white/10`
  - `a`: `text-blue-400`, underline on hover
  - `strong`: white text
  - `blockquote`: left border accent, italic, muted text
  - `p`: line-height relaxed, bottom margin

### What Stays the Same
- The markdown content stored in the `guide_documents` table is unchanged (raw markdown)
- The sidebar document list and TOC extraction work identically
- Title click-to-edit still works and saves to the database
- I (the AI) read the raw markdown from the database when I need to reference the guide

