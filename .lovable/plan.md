

# Write "Your Stories" Page Documentation

## What We're Doing
Writing comprehensive documentation for the "Your Stories" page (the scenario hub) in the same detailed format as the existing Community Gallery guide document. The documentation will be saved as markdown into the existing `guide_documents` row (ID: `4af3bbf2-9b3e-4673-a95b-cfb76fa066c8`).

## Scope
A single database UPDATE to set the `markdown` column on the existing row. No source code files are modified.

## What the Documentation Will Cover

All 13 sections matching the Community Gallery template:

1. **Page Overview** -- Route (`tab === "hub"` in Index.tsx), primary source file (`ScenarioHub.tsx`), purpose (personal scenario management hub), user role access, navigation sidebar position, entry points.

2. **Layout and Structure** -- The hub renders inside the main app shell from Index.tsx. Details the header row (title "Your Stories" + filter pill bar with My Stories / Saved Stories / Published / All), the optional background image layer, the responsive card grid (`grid-cols-1 sm:2 lg:3 xl:4 2xl:5`), the "New Story" dashed card, the empty state with CTA, and settings dropdown (Change Background).

3. **UI Elements -- Complete Inventory** -- Full table of every interactive element: filter pills, settings gear, scenario cards (cover image, badges, hover action buttons, stats row), the "New Story" card, and the empty state CTA.

4. **Cards / List Items -- Scenario Card** -- Detailed breakdown of the `ScenarioCard` component: aspect ratio (2/3), rounded corners (2rem), cover image with object-position, gradient overlay, top-left badge container (Published badge + Remix/Edit icon), top-right SFW/NSFW badge, hover actions (Edit / Delete / Play buttons with scale animation), bottom info bar (title, description, stats: views/likes/saves/plays, "Written by" line).

5. **Modals and Overlays** -- Three modals documented:
   - `ScenarioDetailModal` -- Full detail view with cover image, action buttons (Edit + Play for owned, Like + Save + Play for gallery), content themes, character roster, reviews section, creator section, unpublish button
   - `ShareScenarioModal` -- Publish/unpublish flow with Allow Edits toggle
   - `DeleteConfirmDialog` -- Confirmation dialog for scenario deletion
   - `BackgroundPickerModal` -- Background image upload/select for the hub

6. **Data Architecture** -- Tables involved: `scenarios`, `published_scenarios`, `saved_scenarios`, `content_themes`, `profiles`, `user_backgrounds`. Key data flows: initial load (parallel fetch of scenarios, saved scenarios, published data, content themes, profile, backgrounds), hub filter logic (My Stories vs Saved vs Published vs All), how saved/bookmarked scenarios are converted to ScenarioMetadata with `isBookmarked: true`.

7. **Component Tree** -- Hierarchy from Index.tsx down through ScenarioHub, ScenarioCard, ScenarioDetailModal, ShareScenarioModal, DeleteConfirmDialog, BackgroundPickerModal.

8. **Custom Events and Callbacks** -- All handler functions: `handlePlayScenario` (optimized fetch for play), `handleEditScenario` (with remix/clone logic for bookmarked scenarios), `handleDeleteScenario` (bookmark removal vs own scenario deletion), `handleCreateNewScenario`, background handlers, filter state management.

9. **Styling Reference** -- Color tokens, the dark pill bar (`bg-[#2b2b2e]`), active pill (`bg-[#4a5f7f]`), card shadow (`shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`), hover translate (`-translate-y-3`), gradient overlay colors, badge styles.

10. **Cross-Page Dependencies** -- How the hub interacts with: Scenario Builder (edit flow), Chat Interface (play flow), Community Gallery (saved scenarios appear here), Chat History (conversation registry refresh), Creator Profile page (via detail modal links).

11. **Security and Access Control** -- RLS policies on `scenarios` (own or published), `saved_scenarios` (own only), `published_scenarios` (published + not hidden for read, own for write). The hub filter shows only the authenticated user's own scenarios plus their saved/bookmarked scenarios.

12. **Known Issues / Quirks** -- The remix clone flow for bookmarked scenarios, the `confirm()` dialog for deletion (browser native, not the styled DeleteConfirmDialog), the background image overlay opacity, the empty state showing a light theme while the card grid is dark.

13. **Planned / Future Changes** -- Placeholder section for upcoming features.

## Technical Details
- **Table:** `guide_documents`
- **Row ID:** `4af3bbf2-9b3e-4673-a95b-cfb76fa066c8`
- **Operation:** UPDATE the `markdown` column with the full documentation
- **No source code changes**

