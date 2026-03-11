

# Apply Style Guide Edit: Royal Blue → True Blue

## Edit from Registry

| Field | Value |
|-------|-------|
| **Card** | "Royal Blue" swatch (line 1078) |
| **Current** | `blue-600` / `#2563eb` |
| **Target** | True Blue — `blue-500` / `#3b82f6` |
| **Comment** | "Change to True Blue" |

## 1. Replace all `blue-600` → `blue-500` across component files

All instances of `bg-blue-600`, `text-blue-600`, `hover:bg-blue-600`, and `#2563eb` will shift one step to `blue-500` / `#3b82f6`. Hover states that pair with the base color shift accordingly (e.g. `bg-blue-600 hover:bg-blue-500` → `bg-blue-500 hover:bg-blue-400`; `bg-blue-600 hover:bg-blue-700` → `bg-blue-500 hover:bg-blue-600`).

| File | What changes |
|------|-------------|
| `GalleryStoryCard.tsx` | `bg-blue-600 hover:bg-blue-500` → `bg-blue-500 hover:bg-blue-400` |
| `StoryHub.tsx` | Same Play button pattern |
| `CharactersTab.tsx` | Tag badges `bg-blue-600`, reposition overlay/button |
| `ImageLibraryTab.tsx` | Folder badge `bg-blue-600`, Open button `bg-blue-600 hover:bg-blue-700` → `bg-blue-500 hover:bg-blue-600` |
| `Admin.tsx` | Open button `bg-blue-600 hover:bg-blue-700` → `bg-blue-500 hover:bg-blue-600` |
| `ShareStoryModal.tsx` | `!bg-blue-600 hover:!bg-blue-500` → `!bg-blue-500 hover:!bg-blue-400` |
| `ContentThemesSection.tsx` | Plus buttons `bg-blue-600 hover:bg-blue-500` → `bg-blue-500 hover:bg-blue-400` |
| `ChronicleApp.tsx` | Logo `bg-blue-600` → `bg-blue-500` |
| `GuideLoadErrorBoundary.tsx` | Retry button `bg-blue-600 hover:bg-blue-700` → `bg-blue-500 hover:bg-blue-600` |
| `PublicProfileTab.tsx` | Reposition overlay/button `bg-blue-600` → `bg-blue-500` |
| `CharacterEditForm.tsx` | `bg-blue-500 hover:bg-blue-600` → `bg-blue-500 hover:bg-blue-600` (already blue-500 base, hover changes from 600→500 not needed — actually hover stays as-is since the base is already blue-500) |
| `ModelSettingsTab.tsx` | `text-blue-600` → `text-blue-500` (Provider label, Learn More link) |
| `ChatInterfaceTab.tsx` | `text-blue-600` in Time of Day selectors, day counter arrows, exit scenario hover |
| `CircularProgress.tsx` | `text-blue-600` → `text-blue-500` |
| `StoryDetailModal.tsx` | `hover:bg-[#2563eb]` → `hover:bg-[#3b82f6]` (the base `bg-[#3b82f6]` is already True Blue) |
| `ArcFlowConnector.tsx` | `stroke="#2563eb"` → `stroke="#3b82f6"` |
| `GuideEditor.tsx` | `#2563eb` light-mode link color and title hover — keep as-is since these are guide-internal rendering, not app UI. Actually these should change too for consistency. |

## 2. Update Style Guide Tool (`StyleGuideTool.tsx`)

- **Remove** "Royal Blue" swatch at line 1078
- **Update** "True Blue" swatch (line 1054) — merge locations to add: "Play button on card hover, tag badges, Open buttons, Plus buttons, reposition overlay, Chronicle logo, Provider label, Learn More link, day counter arrows, time-of-day active state, arc flow connectors"
- **Update** button card previews and metadata that reference `bg-blue-600` or `#2563eb` to use `bg-blue-500` / `#3b82f6`
- **Update** Time of Day selector button card metadata (`textColor` field referencing `text-blue-600`)
- **Update** Day Counter stepper card metadata (`hover:text-blue-600`)

## 3. Clear processed edit from database

Migration to remove the edit entry from `styleguide_edits` in `app_settings`.

## 4. Final audit

Search for remaining `blue-600` and `#2563eb` references to confirm none were missed.

