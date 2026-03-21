

# Fix Callout Boxes: Render as Styled HTML Elements

## Problem
The callout boxes have correct CSS (colored backgrounds, borders, padding) and correct HTML markup in the JS constants (`CALLOUT_REQUEST_BODY`, `CALLOUT_WORLD_CONTEXT`, etc.), but line 5204 uses `el.textContent = text` which strips all HTML tags and renders them as raw text. The callouts never actually appear as styled boxes.

## Fix

### `public/api-call-inspector-chronicle.html`

1. **Change injection to use `.innerHTML`** — Replace `el.textContent = text` (line 5204) and `ta.value = text` (line 5209) with proper HTML rendering. The content blocks need a two-layer approach:
   - The callout boxes render as styled HTML elements (`.innerHTML`)
   - The raw API payload text stays in a `<pre>` block so it remains monospaced and literal

2. **Restructure each page's content** so the callout HTML divs are inserted as real DOM elements above each corresponding `<pre>` code block, not mixed into the same text string. The injection function should:
   - Parse the existing text content
   - Insert callout HTML divs at the correct positions (before World Context section, before Character Data section, before Current Value section, before Field Instruction section)
   - Wrap the raw payload text in `<pre>` tags
   - Set the container's `.innerHTML` so callouts render as styled boxes and payload renders as code

3. **Result**: Each section shows colored callout boxes (like the reference image — cream/colored background with padding) clearly separated from the monospaced raw API payload text below them.

## File Modified
- `public/api-call-inspector-chronicle.html` — fix injection function rendering

