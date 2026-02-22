

# Replace BlockNote with a Lightweight Markdown Editor

## Problem
BlockNote's packages are too large (~1MB+) and consistently time out during Vite's dev server pre-bundling, making the App Guide tool completely unusable. This has been the root cause of all the white screen and loading failures.

## Solution
Remove BlockNote entirely and replace it with a **zero-dependency markdown textarea editor** built with standard React and the components already in the project. This gives you a reliable, instantly-loading editor inspired by MarkText's features.

## What You Get (MarkText-inspired features)
- **Markdown editing** in a clean textarea with monospace font
- **Toolbar** with buttons for headings, bold, italic, code blocks, links, images, tables, lists
- **Document sidebar** with document list and auto-generated Table of Contents (extracted from `#` headings)
- **Keyboard shortcuts**: Ctrl+S to save, Ctrl+B for bold, Ctrl+I for italic, etc.
- **Word/character/paragraph count** in the status bar (like MarkText's document stats)
- **Auto-save** indicator and manual save button
- **Dark theme** matching your admin panel aesthetic
- **Tab switching** between documents via the sidebar
- **Create/delete documents**

## What Changes

### 1. Remove BlockNote dependencies
Uninstall `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine` -- these are the packages causing the crashes.

### 2. Rewrite `GuideEditor.tsx`
Replace the BlockNote-based editor with:
- A `<textarea>` with monospace styling for markdown input
- A formatting toolbar (headings, bold, italic, code, links, tables, lists)
- Status bar showing word count, character count, paragraph count
- Ctrl+S save, Ctrl+B bold, Ctrl+I italic shortcuts
- TOC extraction via regex on `#` headings
- Saves markdown directly to the `markdown` column (no more JSONB `content` needed)

### 3. Update `AppGuideTool.tsx`
- Remove the `docContent` (JSONB) state since we now work with markdown strings directly
- Load and save using the `markdown` column instead of `content`
- Remove `React.lazy` and BlockNote-related lazy loading since the editor is now lightweight

### 4. Update `Admin.tsx`
- Remove `React.lazy`, `Suspense`, and the error boundary wrapper since the editor no longer needs heavy lazy loading
- Direct import of `AppGuideTool` (it's now lightweight)

### 5. Minor update to `GuideSidebar.tsx`
- Add a delete button for documents

## Database
No changes needed. The `guide_documents` table already has the `markdown` text column which becomes the primary storage. The `content` JSONB column remains but won't be used going forward.

## Technical Details

The toolbar will insert markdown syntax at the cursor position in the textarea:
- Headings: inserts `# `, `## `, `### ` at line start
- Bold: wraps selection in `**`
- Italic: wraps selection in `*`
- Code block: wraps in triple backticks with language selector
- Link: inserts `[text](url)` template
- Image: inserts `![alt](url)` template
- Table: inserts a markdown table template
- Lists: inserts `- ` or `1. ` at line starts

TOC is extracted by scanning the markdown text for lines starting with `#`, `##`, `###` and building the sidebar entries from those.

Word count parses the markdown text with simple string splitting.

All of this uses zero external libraries beyond what's already installed.

