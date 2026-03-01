

# Hide AI Instruction Block from View Mode

## What Changes

### 1. `src/components/admin/guide/GuideEditor.tsx` — View Mode Filter

In the view mode ReactMarkdown render, strip the instruction block from the displayed markdown before passing it to `<ReactMarkdown>`. The block starts with `> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**` and ends when the blockquote stops (next non-`>` line). A simple regex or line-based filter removes it from the display string only — the raw markdown in the database and edit mode remain untouched.

### 2. `src/components/admin/guide/GuideEditor.tsx` — Edit Mode

No change. The raw textarea still shows the full markdown including the instruction block, so you can see and edit it if needed.

### 3. `src/components/admin/guide/AppGuideTool.tsx` — Auto-Insert on New Page

Update `handleNewDoc` to insert the standard instruction block as the default `markdown` content when creating a new document, so every new page starts with it already embedded.

### Technical Approach

- Add a `useMemo` that computes `displayMarkdown` by stripping lines matching the instruction blockquote pattern from `docMarkdown`
- Pass `displayMarkdown` to `<ReactMarkdown>` in view mode
- Pass unmodified `docMarkdown` to the edit buffer
- Define the instruction block template as a constant string in `AppGuideTool.tsx`

