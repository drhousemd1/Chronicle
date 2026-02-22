

# WYSIWYG Guide Editor

## The Problem
The editor currently shows raw markdown in a textarea with the toolbar operating on that textarea. You want to edit directly in the styled/rendered view, with toolbar buttons applying formatting at your cursor position -- exactly like Word, Notion, or Google Docs.

## Solution

Convert the rendered preview into an editable rich-text area using `contentEditable`. The toolbar uses the browser's built-in `document.execCommand()` API to apply formatting (bold, italic, headings, lists, etc.) directly to the styled content. On every edit, the HTML is converted back to markdown for storage.

### New dependency
- **turndown** + **turndown-plugin-gfm** -- lightweight library that converts HTML back to markdown (needed to sync edits back to the markdown stored in the database). These are small, well-established packages.

### Changes

**`src/components/admin/guide/GuideEditorToolbar.tsx`** -- Rewrite to operate on a contentEditable div instead of a textarea:
- Remove all textarea-based logic (wrapSelection, prependLine, insertAtCursor, etc.)
- Each button calls `document.execCommand()`:
  - Bold -> `execCommand('bold')`
  - Italic -> `execCommand('italic')`
  - H1/H2/H3 -> `execCommand('formatBlock', false, 'h1')` etc.
  - Bullet List -> `execCommand('insertUnorderedList')`
  - Numbered List -> `execCommand('insertOrderedList')`
  - Code Block -> Insert a `<pre><code>` block at cursor
  - Horizontal Rule -> `execCommand('insertHorizontalRule')`
  - Table -> Same popover grid picker, but inserts an HTML `<table>` element at cursor
- Props change from `textareaRef` to `editorRef` (a ref to the contentEditable div)

**`src/components/admin/guide/GuideEditor.tsx`** -- Replace the textarea + MarkdownRenderer split with a single editable view:
- Remove the `<textarea>` entirely
- Remove the separate MarkdownRenderer preview
- Add a single `contentEditable` div that:
  - Initially renders the markdown as HTML (using react-markdown's output or a simple markdown-to-HTML conversion)
  - Is directly editable by the user (click, type, select, format)
  - On every `onInput` event, converts the div's innerHTML back to markdown via turndown, and calls `onMarkdownChange`
- The div keeps the same styling as the current preview (the `guide-preview` CSS class)
- The toolbar sits above this editable area

**`src/components/admin/guide/MarkdownRenderer.tsx`** -- No longer used directly in the editor (may still be used elsewhere). The editor will handle its own rendering.

### User Experience
- You see only the styled view (headings, tables, bold text, code blocks, etc.)
- Click anywhere to place your cursor
- Select text and click Bold/Italic to format it
- Click H1/H2/H3 to turn the current paragraph into a heading
- Click the Table button, pick dimensions from the grid, and a table appears at your cursor
- Click Code Block to insert a code block
- Everything you see is what gets saved -- true WYSIWYG

### Technical Details
- `contentEditable` is the same technology that powers most web-based editors (Google Docs, Notion, etc.)
- `document.execCommand()` handles the formatting natively in the browser
- `turndown` with the GFM plugin converts HTML tables, strikethrough, etc. back to proper markdown
- The markdown in the database stays as the source of truth -- the editor just provides a rich editing interface on top of it
- Initial content is set by converting markdown to HTML (using a simple marked/showdown library or by rendering react-markdown to string)

### Files Changed
| File | Change |
|------|--------|
| `src/components/admin/guide/GuideEditorToolbar.tsx` | Rewrite to use execCommand on contentEditable div |
| `src/components/admin/guide/GuideEditor.tsx` | Replace textarea + preview with single contentEditable div |
| `package.json` | Add `turndown` + `@types/turndown` + `turndown-plugin-gfm` + `marked` (markdown-to-HTML for initial render) |

