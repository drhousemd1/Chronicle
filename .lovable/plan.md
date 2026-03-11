

# Apply Style Guide Edit: White → Ghost White on Header Bars

## Edit from Registry

| Field | Value |
|-------|-------|
| **Card** | "White" swatch |
| **Current** | `bg-white` / `#ffffff` — Token used on top header bar backgrounds |
| **Target** | `rgba(248,250,252,0.3)` — Ghost White |
| **Comment** | "Change every location that has this color to the Ghost White rgba (248,250,252,0.3)" |

## Step 1: Replace `bg-white` with `bg-[rgba(248,250,252,0.3)]` on all header bars

Three files have header bars using `bg-white`:

1. **`src/pages/Index.tsx`** (line 1589) — main app header bar
   - `bg-white` → `bg-[rgba(248,250,252,0.3)]`

2. **`src/pages/Gallery.tsx`** (line 42) — gallery page header
   - `bg-white` → `bg-[rgba(248,250,252,0.3)]`

3. **`src/pages/CreatorProfile.tsx`** (line 169) — creator profile header
   - `bg-white` → `bg-[rgba(248,250,252,0.3)]`

Note: Other `bg-white` usages (toggle thumbs, frosted glass cards, chat sidebar, etc.) are different UI elements and are NOT targeted by this edit.

## Step 2: Update Style Guide swatches

In **`src/components/admin/styleguide/StyleGuideTool.tsx`**:

- **Remove** the "White" swatch at line 1049 (`color="#ffffff" name="White" locations="Top header bar background"`) — no longer in use for headers.
- **Update** the "Ghost White" swatch at line 1050 — change `locations` from `"Main content area behind panels"` to `"Top header bar backgrounds, Main content area behind panels"` and change `pageSpecific` to `false` and `appWide` to `true` since it's now used across multiple pages.
- **Keep** the Creator Profile "White" swatch at line 1173 — check if it should also change. Since the edit says "every location," this header should also change. Update line 1173: remove that swatch and update the Creator Profile Ghost White or the main Ghost White locations field.

## Step 3: Clear the processed edit from the database

After implementation, remove the processed edit entry from `styleguide_edits` in `app_settings` so it doesn't show as pending.

## Step 4: Final audit

Search for any remaining `bg-white` on `<header>` elements to confirm no orphaned references.

