

# Admin Panel with Image Generation Style Manager

## Overview

Build an admin-only navigation hub accessible from the left sidebar, visible only to the admin user (ID: `98d690d7-ac5a-4b04-b15e-78b462f5eec6`). The first tool on this hub is an "Image Generation" style manager that lets you edit art style names, thumbnails, and injection prompts in real-time -- no more code changes needed to tweak image generation.

## Architecture

The art styles are currently hardcoded in `src/constants/avatar-styles.ts`. To make them editable at runtime, we need to move them into the database and have the app load styles from there instead.

### Database

Create an `art_styles` table that mirrors the current `AvatarStyle` interface:

| Column | Type | Description |
|---|---|---|
| id | text (PK) | Style slug, e.g. "cinematic-2-5d" |
| display_name | text | Human-readable name |
| thumbnail_url | text | Path to thumbnail image |
| backend_prompt | text | Default/feminine prompt |
| backend_prompt_masculine | text (nullable) | Masculine variant |
| backend_prompt_androgynous | text (nullable) | Androgynous variant |
| sort_order | integer | Display ordering |
| updated_at | timestamptz | Last modified |

RLS: Public read (all users need styles for generation), admin-only write.

Seed the table with the 5 existing styles from `avatar-styles.ts`.

### Data Flow Change

Currently, `AVATAR_STYLES` is a hardcoded array imported everywhere. The change:

1. Create a React context (`ArtStylesContext`) that fetches styles from the database on app load and caches them
2. Replace all direct imports of `AVATAR_STYLES` / `getStyleById` / `getStylePromptForGender` with context access
3. When the admin saves changes in the style manager, the context re-fetches and the entire app updates instantly

**Files that import from `avatar-styles.ts` (all need updating):**
- `src/components/chronicle/AvatarGenerationModal.tsx`
- `src/components/chronicle/CoverImageGenerationModal.tsx`
- `src/components/chronicle/SceneImageGenerationModal.tsx`
- `src/components/chronicle/ChatInterfaceTab.tsx`
- `src/components/chronicle/WorldTab.tsx`

**Edge functions with duplicated style blocks (these receive the prompt from the frontend, so they already work dynamically):**
- `supabase/functions/generate-cover-image/index.ts` -- receives `stylePrompt` from frontend, no change needed
- `supabase/functions/generate-side-character-avatar/index.ts` -- receives `stylePrompt` from frontend, no change needed
- `supabase/functions/generate-scene-image/index.ts` -- has hardcoded `STYLE_BLOCKS` for scene generation; needs to receive style prompts from the frontend instead

## New Files

### 1. `src/contexts/ArtStylesContext.tsx`
- Fetches `art_styles` from database, provides them via React context
- Exposes `styles`, `getStyleById()`, `getStylePromptForGender()`, `refreshStyles()`
- Falls back to hardcoded defaults if DB fetch fails (safety net)

### 2. `src/pages/Admin.tsx`
- Admin navigation hub page (route: `/admin`)
- Grid of tool tiles matching app aesthetic (dark background, slate blue cards)
- First tile: "Image Generation" -- clicking navigates to the style manager

### 3. `src/components/admin/ImageGenerationTool.tsx`
- 5-column layout (scrollable on smaller screens) showing all art styles side-by-side
- Each column contains:
  - **Editable title** (input field)
  - **Thumbnail preview** with Upload / Reposition / Delete buttons
  - **Editable prompt textarea** (the main backend prompt)
  - **Gender variant prompts** (masculine, androgynous) in collapsible sections
  - **Save button** per style (with the brightness-based hover fix already applied)
- Save writes to the `art_styles` table and triggers a context refresh
- Thumbnail uploads go to the existing `avatars` storage bucket (or a new `admin-assets` bucket)

## Modified Files

### `src/types.ts`
- Add `"admin"` to the `TabKey` union type

### `src/pages/Index.tsx`
- Add "Admin" sidebar item (only visible when `isAdminUser(user?.id)`)
- Add `tab === "admin"` rendering that shows the Admin page content
- Import `isAdminUser` from `app-settings.ts`

### `src/constants/avatar-styles.ts`
- Keep as fallback defaults, but exports become secondary to the context
- Add a `DEFAULT_STYLES` export for seeding

### `src/components/chronicle/AvatarGenerationModal.tsx`
- Replace `import { AVATAR_STYLES }` with `useArtStyles()` context hook

### `src/components/chronicle/CoverImageGenerationModal.tsx`
- Same context hook replacement

### `src/components/chronicle/SceneImageGenerationModal.tsx`
- Same context hook replacement

### `src/components/chronicle/ChatInterfaceTab.tsx`
- Replace `getStyleById` / `DEFAULT_STYLE_ID` imports with context

### `src/components/chronicle/WorldTab.tsx`
- Replace `AVATAR_STYLES` / `DEFAULT_STYLE_ID` imports with context

### `src/App.tsx`
- Wrap with `ArtStylesProvider` context
- Add `/admin` route

### `supabase/functions/generate-scene-image/index.ts`
- Remove hardcoded `STYLE_BLOCKS` object
- Accept full style prompt from the frontend (like the other edge functions already do)

## UI Details

The admin hub and style manager will use the existing app aesthetic:
- Black background with the standard card styling (`bg-[hsl(var(--ui-surface-2))]`, `border-[hsl(var(--ui-border))]`, `shadow-[0_10px_30px_rgba(0,0,0,0.35)]`)
- Tool tiles on the hub use the same card pattern as Image Library folders
- Save buttons use `hover:brightness-125 active:brightness-150 disabled:pointer-events-none` (the iPad-safe pattern)
- Text inputs and textareas styled consistently with the rest of the app

## Implementation Order

1. Create `art_styles` database table with seed data and RLS policies
2. Create `ArtStylesContext` provider
3. Update `App.tsx` with provider and `/admin` route
4. Update `TabKey` type
5. Build Admin hub page and Image Generation tool component
6. Add Admin sidebar item in `Index.tsx`
7. Update all 5 components to use context instead of hardcoded imports
8. Update `generate-scene-image` edge function to accept dynamic style prompts

