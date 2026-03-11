

# Apply Style Guide Edit: Deep Navy → Graphite

## Edit from Registry

| Field | Value |
|-------|-------|
| **Card** | "Deep Navy" (app-wide text color swatch) |
| **Current** | `text-slate-900` / `#0f172a` |
| **Target** | Graphite — `hsl(228, 7%, 20%)` |
| **Comment** | "Change all instances to Graphite hsl (228 7% 20%)" |

## Scope

**139 instances** of `text-slate-900` across **13 component files**, plus typography references in the Style Guide. The CSS variable `--ui-surface-2: 228 7% 20%` already maps to this exact color, so the replacement token will be `text-[hsl(var(--ui-surface-2))]`.

Note: The **second** "Deep Navy" swatch (line 1209, `bg-slate-900` for Model Settings active card) is a separate page-specific entry and was **not** flagged in the edits registry — it stays untouched.

## Changes

### 1. Replace `text-slate-900` → `text-[hsl(var(--ui-surface-2))]` in all component files

Files affected (13 total):
- `src/pages/Index.tsx` — header titles (My Stories, Story Builder, Chat History, Character Library, Image Library, Admin Panel)
- `src/pages/Gallery.tsx` — "Community Gallery" header title
- `src/pages/CreatorProfile.tsx` — back arrow icon + "Creator Profile" header title
- `src/pages/Admin.tsx` — button text
- `src/components/chronicle/WorldTab.tsx` — "Story Setup" heading
- `src/components/chronicle/ModelSettingsTab.tsx` — headings and labels (conditional active/inactive stays: active=white, inactive changes to Graphite)
- `src/components/chronicle/UI.tsx` — secondary button text, ghost button hover text
- `src/components/chronicle/StoryHub.tsx` — "Edit" button text
- `src/components/chronicle/ChatInterfaceTab.tsx` — hover state text
- `src/components/chronicle/SideCharacterCard.tsx` — hover state text
- `src/components/chronicle/ImageLibraryTab.tsx` — "Edit" button text
- `src/pages/Auth.tsx` — (if present, will check)
- Any remaining files with matches

### 2. Update the Style Guide Tool

In `StyleGuideTool.tsx`:
- **Remove** the "Deep Navy" app-wide swatch at line 1050
- **Update** the "Graphite" swatch at line 1048 — expand `locations` to include the removed Deep Navy's locations: `"Story Setup heading, header titles, DRAFTS, SAVE AND CLOSE, SAVE DRAFT, Upload Image, header action buttons"`; add `token` entry for `text-[hsl(var(--ui-surface-2))]`
- **Update** typography cards (lines ~1239-1250) that reference `color="#0f172a (slate-900)"` to `color="hsl(228,7%,20%) (Graphite)"` and update their example content inline styles from `#0f172a` to `hsl(228,7%,20%)`
- **Update** `sg.text` constant (line 91) from `#0f172a` to the Graphite hex equivalent for the guide's own rendering
- Keep the Model Settings page-specific "Deep Navy" swatch (line 1209) as-is since it's for `bg-slate-900`, not the text color

### 3. Clear the processed edit from the database

Remove the edit entry from `styleguide_edits` in `app_settings`.

### 4. Final audit

Search for any remaining `text-slate-900` references and any `#0f172a` text-color references to confirm none were missed.

