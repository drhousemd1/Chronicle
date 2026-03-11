

# Apply Two Style Guide Edits

## Edit 1: Half White → Ghost White

| Field | Value |
|-------|-------|
| **Card** | "Half White" swatch (line 1081) |
| **Current** | `text-white/50` / `rgba(255,255,255,0.5)` |
| **Target** | `text-[rgba(248,250,252,0.3)]` (Ghost White) |
| **Comment** | "Change all instances to Ghost White rgba(248,250,252,0.3)" |

### Files to update (all `text-white/50` → `text-[rgba(248,250,252,0.3)]`)

| File | Instances | Context |
|------|-----------|---------|
| `GalleryStoryCard.tsx` | 2 | Stats row, "Created by" |
| `StoryHub.tsx` | 2 | Stats row, "Created by" |
| `CreatorProfile.tsx` | 2 | Stats row, "Written by" |
| `PublicProfileTab.tsx` | 4 | Loading, checkbox label, stats, "Written by" |
| `AccountSettingsTab.tsx` | 1 | "Basic access" text |
| `SubscriptionTab.tsx` | 1 | "Upgrade" subtitle |
| `CharacterEditModal.tsx` | 1 | Section title placeholder |
| `ImageLibraryTab.tsx` | 1 | Delete button icon |
| `ChatInterfaceTab.tsx` | any remaining |

### Style Guide cleanup
- **Remove** "Half White" swatch (line 1081)
- **Update** the app-wide "Ghost White" swatch (line 1049) locations to include "Story card stats, 'Created by' text, form labels"

---

## Edit 2: Near Black Blue → Dark Zinc

| Field | Value |
|-------|-------|
| **Card** | "Near Black Blue" swatch (line 1074) |
| **Current** | `from-slate-950` / `bg-slate-950` / `#020617` |
| **Target** | `from-zinc-800` / `bg-zinc-800` / `#27272a` (Dark Zinc) |
| **Comment** | "Change all instances to Dark Zinc #27272a" |

### Files to update (`from-slate-950` → `from-zinc-800`, `bg-slate-950` → `bg-zinc-800`)

| File | Context |
|------|---------|
| `GalleryStoryCard.tsx` | Gradient overlay |
| `StoryHub.tsx` | Gradient overlay |
| `CreatorProfile.tsx` | Gradient overlay |
| `PublicProfileTab.tsx` | Gradient overlay |
| `Admin.tsx` | Tool card gradient overlay |
| `CharactersTab.tsx` | Character card gradient |
| `ImageLibraryTab.tsx` | Folder card gradient |
| `ImageLibraryPickerModal.tsx` | Folder card gradient |
| `ChatInterfaceTab.tsx` | Loading screen bg |

### Style Guide cleanup
- **Remove** "Near Black Blue" swatch (line 1074)
- **Update** "Dark Zinc" swatch (line 1057) locations to add "Story card gradient overlay, admin card gradient, folder card gradient, loading screen background"
- **Update** PanelCardV2 "Story Card" entry (line ~3250) from `from-slate-950` to `from-zinc-800` and its preview

---

## Step 3: Clear processed edits from database

Remove both entries from `styleguide_edits` in `app_settings`.

## Step 4: Final audit

Search for remaining `text-white/50`, `slate-950`, and `#020617` to confirm no orphans.

