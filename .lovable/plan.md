

# Replace StyleGuideTool with Clean Dashboard Shell

## Problem
The current `StyleGuideTool.tsx` (5135 lines) still contains all the old style guide section data and is missing the left navigation bar with the 4 dashboard tool buttons. The user wants it erased and replaced with the clean version from the transfer pack.

## Changes

### 1. Rewrite `src/components/admin/styleguide/StyleGuideTool.tsx`
Replace the entire 5135-line file with the clean version from the transfer pack (lines 3233-4347). This version:
- Keeps the EditsContext, CardEditOverlay, and edits system infrastructure (keeps/edits modals still work)
- Adds the **left nav bar** with 4 buttons: App Style Guide (active/current), App Guide, Quality Hub, API Inspector
- Removes all the old section content (Colors, Typography, Buttons, Form Inputs, Badges, Panels, Icons, and the Master Inconsistency Report)
- Shows a clean empty state message: "Style guide data has been reset and cleared"
- Embeds the Physical Appearance spec sheet via iframe (`/style-guide-component-example.html`)
- Nav buttons route to: App Guide → `/?tab=admin&adminTool=app_guide`, Quality Hub → `/style-guide/ui-audit`, API Inspector → `/style-guide/api-inspector`

### 2. Create `public/style-guide-component-example.html`
Extract the full Physical Appearance spec sheet HTML from the transfer pack (lines 12217-12810). This is the single element the user referenced.

### Files
- `src/components/admin/styleguide/StyleGuideTool.tsx` — full rewrite (~200 lines replacing ~5135)
- `public/style-guide-component-example.html` — new file (~600 lines)

