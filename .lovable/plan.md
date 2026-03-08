

# Plan: Move Download Button to Admin Panel Header

## Problem
The download button was placed inside the Style Guide's own white content header with custom `sg.primary` styling. It should be in the **top admin panel header bar** (the dark bar with "< ADMIN PANEL") — the same location where App Guide has its Save/Sync All buttons. It should use the **Shadow Surface button standard** (HSL token styling), not custom inline styles.

## Changes

### 1. `src/pages/Index.tsx` (~line 1915)
Add a new conditional block for `tab === "admin" && adminActiveTool === "style_guide"`, right after the existing `app_guide` block. Include:
- A Download button using the exact same Shadow Surface className as the App Guide Save/Sync buttons: `inline-flex items-center justify-center h-10 px-6 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider`
- Download icon from lucide-react (size 14)
- Text: "Download"
- onClick triggers a ref callback (like guideSaveRef pattern) that opens the download modal inside StyleGuideTool

### 2. `src/pages/Index.tsx` — Add ref + prop wiring
- Add `styleGuideDownloadRef` (same pattern as `guideSaveRef`)
- Pass an `onRegisterDownload` callback prop to `AdminPage`

### 3. `src/pages/Admin.tsx`
- Accept `onRegisterDownload` prop, forward it to `LazyStyleGuide`

### 4. `src/components/admin/styleguide/StyleGuideTool.tsx`
- Accept `onRegisterDownload` prop
- Register `() => setShowDownloadModal(true)` via the callback on mount
- **Remove** the download button from the white content header (lines 304-319)

This keeps the modal and all generation logic in StyleGuideTool unchanged — only the trigger button moves to the correct header location with correct styling.

