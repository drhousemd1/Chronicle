

# Audit & Update Auth Page Section in Style Guide

## Summary of Current State

The style guide's "Auth Page" section is outdated — it only documents the standalone `/auth` page and is missing the **AuthModal** entirely. The recent changes added OAuth buttons (Google/Apple), show/hide password eye icons, and the AuthModal uses a completely different color system (`#4a5f7f` Slate Blue accent instead of purple). The description still says "light-themed" which is incorrect.

## Color Audit — What Exists vs What's Missing

### Auth.tsx (standalone page) colors currently documented:
- Navy-to-Purple Gradient ✓
- Dark Slate Glass (bg-slate-800/50) ✓
- Slate Glass (bg-slate-700/50) ✓ — needs location update for OAuth buttons
- Vivid Purple (#7c3aed) ✓
- Soft Purple (#a78bfa) ✓

### Auth.tsx — missing from swatches:
- **Slate 600** (#475569) — OAuth button borders, divider lines, input borders
- **Slate 500** (#64748b) — "or" divider text, eye icon default, placeholder text (already in ALL_SWATCHES as "Cool Gray" but not in Auth section)
- **Slate 400** (#94a3b8) — Card description text (already "Muted Slate")
- **Slate 300** (#cbd5e1) — Form labels (already "Slate 300")
- **Error Red** (#ef4444) — Validation error text (already "Bright Red")

### AuthModal.tsx — entirely missing from style guide:
- **Auth Modal Background** — `hsl(240,6%,10%)` (~#18181a) — unique to modal
- **Dark Charcoal** (#2a2a2f) — OAuth buttons, input fields (already in ALL_SWATCHES)
- **Faint White** (rgba(255,255,255,0.10)) — borders throughout modal (already in ALL_SWATCHES)
- **Slate Blue** (#4a5f7f) — Submit button, focus ring, toggle link, logo (already in ALL_SWATCHES)
- **Light Slate Blue** (#5a6f8f) — Submit button hover (already in ALL_SWATCHES)
- **Steel Blue** (#7ba3d4) — Toggle link hover (already in ALL_SWATCHES)
- **White/30** (rgba(255,255,255,0.3)) — Subtitle text (already "Milky White")
- **White/25** — Placeholder text, divider text — NEW
- **White/50** — Label text — part of existing?
- **White/8** — Divider lines — NEW
- **White/40** — Close button icon — NEW
- **Red 400** (#f87171) — Error text in modal — NEW

## Plan

### 1. Update Auth Page swatches section (lines ~1740-1754)
- Fix description: "The light-themed authentication page..." → "Authentication page and modal colors."
- Update existing swatches with new locations (Slate Glass now also used for OAuth buttons)
- Add new swatches:
  - **Slate 600** (#475569) — divider lines, OAuth borders, input borders on Auth page
  - **Auth Modal Surface** (hsl(240,6%,10%)) — modal background
  - **White/8** (rgba(255,255,255,0.08)) — divider lines in AuthModal
  - **White/25** (rgba(255,255,255,0.25)) — placeholder & divider text in AuthModal
  - **White/40** (rgba(255,255,255,0.4)) — close button icon in AuthModal
  - **White/50** (rgba(255,255,255,0.5)) — label text in AuthModal
  - **Red 400** (#f87171 / red-400) — error text in AuthModal
- Update "Slate Glass" locations to include "OAuth button backgrounds on Auth page"
- Remove or update inconsistency note — AuthModal now uses #4a5f7f (consistent), but Auth.tsx still uses purple

### 2. Update Auth Page buttons section (lines ~2593-2616)
- Update "Auth Submit Button" to document both variants:
  - Auth.tsx: still `bg-purple-600` (note inconsistency)
  - AuthModal: `bg-[#4a5f7f]` (consistent with app)
- Add new button card: **OAuth Provider Button** — Apple/Google side-by-side buttons
- Update "Auth Toggle Link" to document both variants:
  - Auth.tsx: `text-purple-400`
  - AuthModal: `text-[#4a5f7f]`

### 3. Update Auth Page inputs section (lines ~3037-3060)
- Add AuthModal input variant: `bg-[#2a2a2f] border-[hsl(0_0%_100%_/_0.10)] rounded-xl` with eye icon toggle
- Update Auth.tsx input to include eye icon in preview
- Update inconsistency note

### 4. Update Auth Page panels section (lines ~4181-4199)
- Add **Auth Modal** panel: `bg-[hsl(240_6%_10%)]` with rounded-2xl, shadow, etc.
- Update existing Auth Card preview to include OAuth buttons

### 5. Update ALL_SWATCHES array (lines ~746-816)
Add new entries:
- `{ color: '#475569', name: 'Slate 600' }`
- `{ color: 'hsl(240,6%,10%)', name: 'Auth Modal Surface' }`
- `{ color: 'rgba(255,255,255,0.08)', name: 'Divider White' }`
- `{ color: 'rgba(255,255,255,0.25)', name: 'Muted White' }`
- `{ color: 'rgba(255,255,255,0.4)', name: 'Soft White' }`
- `{ color: 'rgba(255,255,255,0.5)', name: 'Half White' }`
- `{ color: '#f87171', name: 'Red 400' }`
- `{ color: '#35353b', name: 'Dark Charcoal Hover' }`

### 6. Screenshots (locationImages)
Navigate to `/auth` and the AuthModal to capture real screenshots of:
- Auth page full background gradient
- Auth card with OAuth buttons
- OAuth buttons close-up
- Input fields with eye icon
- Submit button
- Toggle link
- AuthModal full view
- AuthModal inputs, buttons, dividers

All screenshots uploaded to `guide_images` storage bucket and linked via `locationImages` arrays.

### Files Modified
- `src/components/admin/styleguide/StyleGuideTool.tsx` — all changes in this single file

