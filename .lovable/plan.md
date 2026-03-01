

# Fix Guide Editor Visual Styling — Richer Color Coordination

## Problem

The current `GuideEditor.tsx` markdown renderer uses nearly invisible color distinctions:

1. **Table header background** (`#1a1a1a`) is almost indistinguishable from the page background (`#000000`)
2. **Table row striping** is defined as a variable (`stripeBg`) but never applied — the `tr` component has an empty `style={{ }}`
3. **Headings** are all plain white with no accent color or visual weight differentiation
4. **Blockquotes** blend into the background
5. **Light mode** has the same problem — `#f9fafb` header on white is nearly invisible

## Changes

### `src/components/admin/guide/GuideEditor.tsx`

Update `createMarkdownComponents()` with richer, more visually distinct colors:

**Dark mode improvements:**
- Table header (`thead`): Change from `#1a1a1a` to `#1e293b` (slate-800 blue-gray) for clear visual separation
- Table header text (`th`): Use a brighter accent like `#94a3b8` (slate-400) instead of plain white
- Table row striping: Actually apply alternating backgrounds on `tr` using CSS `nth-child(even)` via a className or by wrapping the table body. Since ReactMarkdown's `tr` component doesn't get row index, use a CSS approach with `& tbody tr:nth-child(even)` on the table wrapper
- H2 border-bottom: Use teal accent `#00F0FF` (matches the app's accent-teal) instead of `#333`
- Blockquote: Use a left border of `#00F0FF` (teal accent) instead of `#444`
- Inline code: Use a slightly tinted background `#1e293b` instead of plain `#2a2a2a`

**Light mode improvements:**
- Table header (`thead`): Change from `#f9fafb` to `#e2e8f0` (slate-200) for clear separation
- Table header text: Use `#1e293b` (slate-800, darker)
- Table row striping: `#f8fafc` (slate-50) alternating with white
- H2 border-bottom: Use `#3b82f6` (blue-500) accent
- Blockquote left border: `#3b82f6` (blue-500)
- Inline code background: `#e2e8f0` (slate-200)

**Striping implementation:**
- Add a CSS class `.guide-table-dark tbody tr:nth-child(even)` and `.guide-table-light tbody tr:nth-child(even)` to `src/index.css`
- Apply the class to the table wrapper div based on theme

### `src/index.css`

Add table row striping rules:

```css
.guide-table-dark tbody tr:nth-child(even) {
  background: #111827;
}
.guide-table-light tbody tr:nth-child(even) {
  background: #f8fafc;
}
```

### Summary of visual changes

| Element | Dark Before | Dark After | Light Before | Light After |
|---------|------------|------------|-------------|-------------|
| thead bg | `#1a1a1a` | `#1e293b` | `#f9fafb` | `#e2e8f0` |
| th text | `#ffffff` | `#94a3b8` | `#111827` | `#1e293b` |
| tr stripe | none | `#111827` every other | none | `#f8fafc` every other |
| h2 border | `#333` | `#00F0FF` | `#d1d5db` | `#3b82f6` |
| blockquote border | `#444` | `#00F0FF` | `#d1d5db` | `#3b82f6` |
| inline code bg | `#2a2a2a` | `#1e293b` | `#e5e7eb` | `#e2e8f0` |

