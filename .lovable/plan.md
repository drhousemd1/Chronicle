

# Plan: Fix Style Guide Header

## Changes in `src/components/admin/styleguide/StyleGuideTool.tsx`

### 1. Remove "Visual Reference" badge
Delete lines 301-304 — the `<div>` with "Visual Reference" text, the rounded pill badge.

### 2. Change header background to slate blue
Line 296: Change `background: sg.surface` to `background: '#4a5f7f'` (Chronicle Blue / slate blue).

### 3. Change header text to white
- Line 305: Change `color: '#111827'` to `color: '#ffffff'` on the "Chronicle Style Guide" h1
- Line 308: Change `color: '#475569'` to `color: 'rgba(255,255,255,0.8)'` on the description paragraph
- Line 296: Change `borderBottom` to use a subtle white/opacity border instead of `sg.border`

