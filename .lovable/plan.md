

# Persist Style Guide Edits to Supabase

## Problem
Style guide edits and "keeps" are stored in `localStorage` only, which gets wiped when the preview domain changes between deployments. Data is unrecoverable.

## Solution
Migrate the entire edits/keeps system from localStorage to the `app_settings` table in the database, using two setting keys: `styleguide_edits` and `styleguide_keeps`. Every edit, keep, and delete auto-saves immediately.

## Changes

### 1. Database: No schema changes needed
The `app_settings` table already exists with `setting_key` (text) and `setting_value` (jsonb). We'll use:
- `setting_key = 'styleguide_edits'` → `setting_value` = array of `EditEntry` objects
- `setting_key = 'styleguide_keeps'` → `setting_value` = array of card name strings

### 2. Rewrite `StyleGuideEditsModal.tsx` storage helpers
Replace all localStorage calls with async Supabase operations:

- `getEditsRegistry()` → async function that reads from `app_settings` where `setting_key = 'styleguide_edits'`
- `upsertEdit(entry)` → async function that reads current array, upserts entry, writes back to `app_settings`
- `removeEdit(id)` → async function that filters and writes back
- `getKeeps()` / `addKeep()` / `removeKeep()` → same pattern with `styleguide_keeps` key

Each write uses upsert (`insert ... on conflict update`) on `app_settings`.

### 3. Update all consumers to handle async
- `CardEditOverlay` in `StyleGuideTool.tsx` — load keeps on mount, update state after async save
- `EditsListModal` — load edits from Supabase on open
- `KeepOrEditModal` / `EditDetailModal` — save callbacks become async
- Edits count badge in admin header — refresh from Supabase state

### 4. Keep localStorage as write-through cache
For fast reads, also cache in localStorage, but Supabase is the source of truth. On mount, load from Supabase and overwrite localStorage cache.

### 5. Auto-save on every change
Every `upsertEdit`, `removeEdit`, `addKeep`, `removeKeep` call writes to Supabase immediately — no manual save button needed.

