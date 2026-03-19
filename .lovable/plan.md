

# Reorganize Style Guide Cards — Collapsible Details

## Current Layout (per card)
```text
┌─ Card Header ─────────────────────────────┐
├─ Top Section ─────────────────────────────┤
│  Spec blocks (left 55%)  │  Preview (45%) │
├─ Bottom Section (4 columns) ─────────────┤
│  Col1  │  Col2  │  Col3  │  Col4         │
└───────────────────────────────────────────┘
```

## New Layout
```text
┌─ Card Header ─────────────────────────────┐
├─ Preview (full width, dark bg) ───────────┤
│         Element preview centered          │
├─ White bar with ▼ chevron ────────────────┤
│  (click to expand)                        │
├─ Expanded details (hidden by default) ────┤
│  All spec blocks + bottom columns         │
└───────────────────────────────────────────┘
```

## Changes — `public/style-guide-component-example.html`

### CSS additions
- `.details-toggle` — white bar, flex row, right-aligned chevron, cursor pointer, border-top
- `.details-toggle svg` — rotate 180deg when open
- `.details-content` — hidden by default (`display:none`), contains two sections:
  - Spec blocks (formerly `top-spec`) in a single column
  - Bottom columns (unchanged 4-col grid)
- `.details-content.open` — `display:block`

### HTML restructure (both cards)

**Physical Appearance card:**
1. Keep `.card-header` unchanged
2. Remove `.top-section` grid — make preview full-width: wrap the existing `.top-preview` content in a new full-width div
3. Add `.details-toggle` bar with "Details" label + chevron SVG
4. Wrap all existing spec blocks (from `top-spec`) + bottom-section content inside `.details-content`

**Chat Settings card:**
Same pattern — preview full-width, then toggle bar, then collapsible details

### JavaScript
Add a small `<script>` at bottom:
```js
document.querySelectorAll('.details-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const content = btn.nextElementSibling;
    content.classList.toggle('open');
    btn.classList.toggle('open');
  });
});
```

### What stays unchanged
- All colors, text sizes, element styling in the preview sections
- All spec block content and bottom column content — just moved into the collapsible wrapper
- Card header styling

