

# Fix: Findings and Scan Data Not Appearing + Rename "Review Coverage Units"

## Root Cause
The Quality Hub persists its state to localStorage (`chronicle-quality-hub-v1`). When the page loads, it checks localStorage first (line 120) and only falls back to the code-defined registry if localStorage is empty or unparseable. Your browser still has the **old empty registry** from before the 17 findings were added. That is why everything shows "NOT-STARTED" and the findings list is empty -- the code has the data, but localStorage is overriding it with stale data.

## Changes

### 1. `src/pages/style-guide/ui-audit.tsx` — Auto-detect stale localStorage
Add a staleness check in the initialization logic: if the stored registry's `lastRunId` differs from the code-defined initial registry's `lastRunId`, discard localStorage and use the fresh code-defined data. This ensures new scan results always appear without requiring a manual "Reset Hub" click.

### 2. `src/pages/style-guide/ui-audit.tsx` — Rename section
Change "Review Coverage Units" heading to **"App Pages"**.

### 3. `src/data/ui-audit-findings.ts` — Add all missing app pages
Replace the 4 review units with 12 entries covering every page/tab in the app:

| Page | Route/Tab | Key Files |
|------|-----------|-----------|
| My Stories | hub tab | StoryHub.tsx, StoryCardView.tsx |
| Story Builder | world tab | WorldTab.tsx, ContentThemesSection.tsx |
| Character Builder | characters tab | CharactersTab.tsx, CharacterEditForm.tsx |
| Chat History | conversations tab | ConversationsTab.tsx |
| Chat Interface | chat_interface tab | ChatInterfaceTab.tsx |
| Image Library | image_library tab | ImageLibraryTab.tsx |
| Community Gallery | gallery tab | GalleryHub.tsx, GalleryStoryCard.tsx |
| Account | account tab | AccountSettingsTab.tsx, PublicProfileTab.tsx, SubscriptionTab.tsx |
| Admin Panel | admin tab | StyleGuideTool.tsx, AppGuideTool.tsx |
| Creator Profile | /creator/:userId | CreatorProfile.tsx |
| Quality Hub | /style-guide/ui-audit | ui-audit.tsx |
| API Inspector | /style-guide/api-inspector | api-inspector.tsx |

