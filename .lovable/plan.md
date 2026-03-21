

# Fix: Remove Dark Boxes From API Payload Text, Keep Only Callout Boxes Styled

## Problem
The `buildPageHtml()` function wraps **every** section of content in `<pre class="api-payload-block">` — a dark navy box with colored background. The user only wants the **callout explanation boxes** (World Context, Character Data, etc.) to be visually distinct. The actual API payload text should sit on the normal white/default background like regular content.

## Fix

### `public/api-call-inspector-chronicle.html`

1. **Remove the dark box wrapper from payload text** — Change line 5201 from:
   ```
   html += '<pre class="api-payload-block">' + escapeHtml(trimmed) + '</pre>';
   ```
   to:
   ```
   html += '<pre style="white-space:pre-wrap;word-wrap:break-word;margin:0 0 20px;font-size:11.5px;line-height:1.55;">' + escapeHtml(trimmed) + '</pre>';
   ```
   This keeps the text monospaced and pre-formatted but on the default background — no dark box.

2. **Remove or keep `.api-payload-block` CSS** — Remove the class definition (lines 713-727) since it's no longer used, or leave it harmless.

3. **Callout boxes remain unchanged** — The `.callout-blue`, `.callout-green`, `.callout-amber`, `.callout-purple` styles stay exactly as they are, rendering as colored padded boxes that stand out from the plain-background payload text.

## Result
- Callout boxes: colored background + padding + border (visually distinct)
- API payload text: plain white background, monospaced font (just regular content)

## File Modified
- `public/api-call-inspector-chronicle.html`

