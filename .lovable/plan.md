

# Apply Style Guide Edit: Hazy White → Ghost White

## Edit from Registry

| Field | Value |
|-------|-------|
| **Card** | "Hazy White" swatch (line 1080) |
| **Current** | `text-white/60` / `rgba(255,255,255,0.6)` |
| **Target** | `text-[rgba(248,250,252,0.3)]` (Ghost White) |
| **Comment** | "Change all instances to Ghost White rgba(248,250,252,0.3)" |

## 1. Replace `text-white/60` → `text-[rgba(248,250,252,0.3)]` across 11 files

| File | Instances | Context |
|------|-----------|---------|
| `GalleryStoryCard.tsx` | 1 | Description text |
| `StoryHub.tsx` | 1 | Description text |
| `CreatorProfile.tsx` | 2 | Stats values, description text |
| `PublicProfileTab.tsx` | 2 | Stats values, description text |
| `StoryDetailModal.tsx` | 2 | Unpublish button text, character name label |
| `GalleryHub.tsx` | 1 | Empty state paragraph |
| `GalleryCategorySidebar.tsx` | 4 | Chevrons, default icon color, close button |
| `ModelSettingsTab.tsx` | 1 | "Powered by xAI Grok" subtitle |
| `ReviewModal.tsx` | 1 | Overall score text |
| `ImageLibraryTab.tsx` | 1 | Folder description |
| `AccountSettingsTab.tsx` | 1 | Password toggle hover state (hover target only — keep `text-white/30` base, change `hover:text-white/60` → `hover:text-[rgba(248,250,252,0.3)]`) |

## 2. Update Style Guide Tool (`StyleGuideTool.tsx`)

- **Remove** "Hazy White" swatch at line 1080
- **Update** "Ghost White" swatch (line 1049) locations to add: "Story card description, folder description, sidebar chevrons, empty state text, unpublish button, character labels, model subtitle, review score"
- **Update** typography card at line 1325-1331: change preview from `text-white/60` to `text-[rgba(248,250,252,0.3)]`, update `color` prop from `"rgba(255,255,255,0.6) (white/60)"` to `"rgba(248,250,252,0.3) (Ghost White)"`
- **Update** "Remove from Gallery" button card (lines 1694-1707): change `textColor` and preview from `text-white/60` to `text-[rgba(248,250,252,0.3)]`
- **Update** any other Style Guide preview instances using `text-white/60` (character card notes at line 3690, section header preview at line 3282)

## 3. Clear processed edit from database

Migration to remove the edit entry from `styleguide_edits` in `app_settings`.

## 4. Final audit

Search for remaining `text-white/60` references to confirm none were missed outside the Style Guide's own descriptive/preview content that should also be updated.

