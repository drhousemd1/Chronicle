

# Apply Style Guide Edit: Coral Red → Bright Red

## Edit from Registry

| Field | Value |
|-------|-------|
| **Card** | "Coral Red" swatch |
| **Current** | `red-400` / `#f87171` |
| **Target** | `red-500` / `#ef4444` (Bright Red) |
| **Comment** | "Change to Bright Red" |

## 1. Global replacement: `red-400` → `red-500` across ~21 component files

Every Tailwind class containing `red-400` shifts to `red-500`. This includes `text-red-400`, `hover:text-red-400`, `text-red-400/80`, `border-red-400/50`. Hex `#f87171` → `#ef4444`.

Where hover contrast would collapse (e.g. a `text-red-500 hover:text-red-500`), the hover shifts to `hover:text-red-400` to maintain feedback.

### Files affected (grouped):

**chronicle/ (16 files):**
- `ContentThemesSection.tsx` — NSFW badge `text-red-400` → `text-red-500`
- `CharacterEditModal.tsx` — 3 delete buttons `text-red-400 hover:text-red-300` → `text-red-500 hover:text-red-400`
- `CharactersTab.tsx` — 3 delete buttons, same pattern
- `PersonalitySection.tsx` — rigid trait color `text-red-400` → `text-red-500`, delete button
- `ConversationsTab.tsx` — delete hover `hover:text-red-400` → `hover:text-red-500`
- `ChatInterfaceTab.tsx` — cancel edit `text-red-400` → `text-red-500`
- `StoryDetailModal.tsx` — NSFW badge + trigger warnings text
- `StoryHub.tsx` — NSFW badge text
- `GalleryStoryCard.tsx` — NSFW badge text
- `ReviewModal.tsx` — delete review button text
- `WorldTab.tsx` — warning icon
- `StoryGoalsSection.tsx` — delete arc button border `border-red-400/50` → `border-red-500/50`
- `DraftsModal.tsx` — delete hover
- `MemoriesModal.tsx` — delete hover
- `arc/ArcPhaseCard.tsx` — delete button border `border-red-400/50` → `border-red-500/50`
- `arc/ArcBranchLane.tsx` — failed badge `text-red-400/80` → `text-red-500/80`, delete button border

**account/ (2 files):**
- `PublicProfileTab.tsx` — genre remove hover, NSFW badge
- `AccountSettingsTab.tsx` — error text

**pages/ (2 files):**
- `Auth.tsx` — 4 validation error messages
- `CreatorProfile.tsx` — unfollow hover, NSFW badge

**admin/ (1 file):**
- `GuideSidebar.tsx` — delete document hover

### Hover-state logic
- `text-red-400 hover:text-red-300` → `text-red-500 hover:text-red-400` (shift both one step)
- Standalone `text-red-400` → `text-red-500`
- `hover:text-red-400` (on non-red base) → `hover:text-red-500`
- `border-red-400/50` → `border-red-500/50`
- `text-red-400/80` → `text-red-500/80`

## 2. Update Style Guide Tool (`StyleGuideTool.tsx`)

- **Remove** both "Coral Red" swatches (app-wide at line ~1075 AND page-specific at line ~1130)
- **Merge locations** into the "Bright Red" swatch — add: "NSFW badge text, delete button hover icon, cancel edit icon, rigid personality trait, trigger warnings text, unfollow hover, validation errors, warning icons"
- **Update** all preview/metadata references: `#f87171` → `#ef4444`, `text-red-400` → `text-red-500` in ButtonCardV2 previews (Chat Message Action Icons, ExtraRow Delete Button, Conversation Delete, Follow/Unfollow, Icon Colors entry)

## 3. Clear processed edit from database

Migration to remove the entry from `styleguide_edits` in `app_settings`.

## 4. Final audit

Search for remaining `red-400` and `#f87171` to confirm zero orphans.

