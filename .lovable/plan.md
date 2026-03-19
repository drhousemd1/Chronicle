

# Fix Story Arcs Style Guide Card — Match Existing Pattern

## Problem
Card 3 (Story Arcs) uses CSS classes that don't exist in the stylesheet (`spec-side`, `preview-side`, `spec-label`, `detail-col`, `detail-title`, `detail-list`), making it render completely broken compared to Cards 1 and 2. The preview is also missing key elements from the original arc system.

## Fix

**File: `public/style-guide-component-example.html`** — Replace lines 843-1103 (entire Card 3)

### Structure Changes
Rebuild Card 3 using the exact same HTML structure and CSS classes as Cards 1 and 2:

| Section | Wrong Classes (Current) | Correct Classes (Cards 1 & 2) |
|---------|------------------------|-------------------------------|
| Card header | Custom `<div>` + `<h1>` + `<p>` | `<span class="card-title">` + `<span class="card-sub">` |
| Left spec panel | `<div class="spec-side">` | `<div class="top-spec">` |
| Spec headings | `<div class="spec-label">` | `<div class="spec-h1">` |
| Spec lists | `<ul class="spec-list">` | `<ul>` (plain) |
| Right preview | `<div class="preview-side">` | `<div class="top-preview"><div class="preview-inner">` |
| Bottom columns | `<div class="detail-col">` | `<div class="bottom-col">` |
| Bottom headings | `<h3 class="detail-title">` | `<div class="spec-h1">` |
| Bottom lists | `<ul class="detail-list">` | `<ul>` (plain) |

### Preview Enhancements — Missing Elements to Add
The static preview currently only shows: title input, progress ring, mode toggle, one split connector, and two branch lanes with single fields each. Missing:

1. **Desired Outcome field** — textarea below the title (same pattern as goal name)
2. **Guidance Strength slider** — the rigid/normal/flexible bar below desired outcome
3. **Step cards with status borders** — pending (white/15), succeeded (blue-500/50), failed (red-500/50), deviated (orange-500/50) colored borders on step cards
4. **Recovery/retry badge** — amber pill badge on cloned retry steps
5. **Merge connector** — SVG connector below the branch lanes merging back to a single line
6. **Linked Phase separator** — a second phase block connected by merge→split connectors
7. **Delete button** — red-bordered 30x30 button on the arc container (same as goal delete)
8. **Add Phase button** — the `+ Add Phase` button below phases (uses same `.add-row-btn` style)

### Bottom Section — 4 Columns (matching Cards 1 & 2 grid)

**Column 1: Deleted Types** — All arc types with their full field signatures

**Column 2: Deleted Components** — File list with descriptions

**Column 3: Colors** — Color table using `<table class="color-table">` with swatches (same format as Cards 1 & 2), covering all arc-specific colors (fail strip, success strip, step cards, connector lines, etc.)

**Column 4: Replacement Info** — New component name, pattern source, type definition, feature differences

## Scope
Single file change: `public/style-guide-component-example.html` (lines 843-1103 replaced)

