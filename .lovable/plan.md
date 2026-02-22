

# Speed Up App Guide Tool Loading

## Problem
The App Guide tool is stuck on "Loading..." for a long time because `react-markdown` and `remark-gfm` are large dependencies bundled into the lazy-loaded `AppGuideTool` chunk. Vite has to pre-bundle these on first load, causing significant delay. The previous memory note confirms this exact pattern has caused issues before.

## Solution
Split the heavy markdown rendering into its own lazy-loaded component so the App Guide shell (sidebar + header) loads instantly. The markdown only renders when you actually click on a document.

### Changes

**`src/components/admin/guide/GuideEditor.tsx`**
- Remove the direct imports of `react-markdown` and `remark-gfm`
- Lazy-load a small `MarkdownRenderer` component only when `docMarkdown` is non-empty
- The title bar, empty state, and shell render immediately with zero heavy dependencies
- Use `React.lazy()` for the markdown renderer with a lightweight inline fallback

**`src/components/admin/guide/MarkdownRenderer.tsx`** (new file)
- A tiny wrapper component that imports `react-markdown` and `remark-gfm`
- Accepts `markdown: string` prop and renders `<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>`
- This isolates the heavy deps into their own chunk that only loads when needed

### Result
- Clicking "App Guide" in the admin panel shows the sidebar and document list almost instantly (only fetches a lightweight list of titles from the database)
- The heavy markdown renderer only loads when you select a document to view
- No change to save functionality or any other behavior

### Technical Notes
- The `AppGuideTool` itself no longer imports any heavy deps (it was already clean), so it can stop being lazy-loaded entirely OR stay lazy -- either way it'll be fast since its imports are lightweight (just `supabase/client`, native HTML sidebar)
- Only `GuideEditor` had the heavy `react-markdown` import, and that's what we're splitting out

