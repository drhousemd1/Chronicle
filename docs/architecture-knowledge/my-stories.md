# Overview

## My Stories at a Glance

### The signed-in workspace for stories connected to one account

My Stories is Chronicle's private story workspace. It brings together stories the signed-in user owns, drafts that are still being authored, owned stories that have been published, and Community Gallery publications the user has saved. Its promise is not that every item has the same ownership or lifecycle. Its promise is that the user can return to the stories connected to their account and take the next valid action without confusing an owned source, a saved public reference, or a playthrough.

The page is delivered inside Chronicle's main application shell rather than as a separate URL. A signed-out visitor can see the My Stories destination in the sidebar, but selecting it opens Chronicle's authentication interface. The collection itself is loaded only after Chronicle has an authenticated user identity. When My Stories is open, the page header, collection filters, story grid, story details, and personal background controls form one workspace.

My Stories is not the authoring surface and it is not the roleplay surface. Story Builder owns the fields and persistence operations used to create or revise a story. Community Gallery owns public discovery and engagement. Chat Interface owns a new play session after Play succeeds, and Chat History owns returning to a specific saved conversation. My Stories connects those capabilities while retaining a clear account-centered view of the underlying stories.

### What a successful visit accomplishes

A successful My Stories visit lets the user understand which stories are available, distinguish drafts from completed and published work, recognize saved work by other creators, inspect enough detail to choose the correct item, and continue through the correct next capability. The user can start a new story, open an owned story for editing, request an independently owned copy when the creator has permitted reuse of a saved publication, begin a fresh playthrough from a non-draft story, remove a saved relationship, delete an owned source, remove an owned publication from Community Gallery, or personalize the workspace background.

Those actions have different consequences. Opening Story Builder does not itself save a new story. Saving a Community Gallery publication does not transfer ownership. Removing a bookmark does not delete the creator's source. Removing a story from Community Gallery preserves the creator's owned story. Deleting an owned story removes the owned source through the story persistence path. Play creates a new conversation rather than resuming an existing one.

## Collections, Ownership, and Lifecycle

### Owned stories remain the user's editable sources

An owned story is a `stories` record whose `user_id` belongs to the authenticated account. My Stories loads those records newest-updated first and presents them as the user's editable sources. Editing an owned card loads the complete current story and hands it to Story Builder. The owned source remains the authority for its world, opening state, characters, supporting records, cover, classification, and publication eligibility.

An owned story may be a draft, a non-draft story that is not public, or a non-draft story with an active publication record. Those are separate states. A story does not become public merely because it is no longer a draft. Publication is represented separately by `published_scenarios`, and My Stories uses the signed-in creator's current publication records to decide which owned cards receive the **Published** label and public engagement totals.

### Saved stories are relationships to another creator's publication

A saved story is not copied into the user's owned collection when Save is selected in Community Gallery. Save creates an account-owned `saved_scenarios` relationship that points to the publication and its source story. My Stories translates that relationship into a card so the user can find the publication again. The original creator remains the source owner.

If the same source identifier is already present in the user's owned registry, My Stories excludes the saved representation so one source is not displayed twice. A saved card uses the publication's story title, description, cover, cover position, tags, and public creator name returned through the saved-story service. Removing the card's saved relationship leaves the creator's story and publication unchanged.

### Draft, completed, and published answer different questions

A **Draft** card identifies an owned story whose `is_draft` value is true. Drafts can be inspected, edited, or deleted, but My Stories does not present Play for them. A non-draft owned story appears in **My Stories** whether or not it has been published. **Published** is the narrower view containing owned stories that also have a current publication record. **All** combines every owned record, including drafts, with saved results whose source story data is available.

This distinction preserves the actual lifecycle. Story Builder decides when an authored story is saved as a draft or finalized and whether it is published. My Stories reflects the records it receives; it does not calculate publication readiness and it does not expose import or export controls. Import and Export currently belong to the Story Builder header after a story has been opened or created.

## Finding and Understanding a Story

### The collection selector changes the source set, not the cards themselves

The page header provides five views. **My Stories** shows owned non-draft stories. **Saved Stories** shows saved results from other creators when the service returns their source story data. **Published** shows the signed-in user's owned stories with publication records. **Drafts** shows owned drafts. **All** shows the owned collection followed by those saved results. **All** is the current default when the authenticated application state is created.

Changing the selected view updates the cards without adding search, sorting, folders, or category filtering to the collection.

### Story cards provide the first level of context

Each card is a tall cover-led summary. It shows the saved cover and crop when available, or a dark title-initial fallback when no cover exists. The card identifies draft, publication, reuse, and SFW or NSFW status when those states apply. It also shows the title, a two-line description, the creator name known to the current workspace, and publication engagement totals only when Chronicle has authoritative publication data for that item.

Selecting the card body opens Story Detail. The centered Edit, Delete, and Play controls are shortcuts to the same downstream actions without first opening details when the user's relationship to that story permits the action. Draft cards omit Play, and saved cards must omit Edit when the source publication does not permit reuse. The **New Story** card remains present in every collection view, including a view with no matching stories, so creation is always available.

### Story Detail supports a deliberate next choice

Story Detail repeats the cover, content classification, title, synopsis, structured content themes, and up to eight loaded character summaries. An owned non-draft story offers Edit and Play. An owned draft offers Edit without Play. When an owned story has an active publication, Story Detail also identifies it as published and offers **Remove from Gallery**. A saved story offers Play; its reuse-permitted Edit action and bookmark-removal action remain on the card rather than in the detail view.

The My Stories version of Story Detail is not the public Community Gallery detail experience. It does not receive Like, Save, review, public engagement, or publisher-profile controls from My Stories. Its purpose is to help the user continue from their private workspace, not to reproduce the public catalog.

## Ordinary Workflows and Their Handoffs

### Start a new story

Selecting **New Story** opens a new Story Builder workspace. At that moment Chronicle has prepared a story for editing, but no durable story has been promised yet. Story Builder becomes responsible for saving a draft or finalizing the story. Once a save succeeds and the owned collection is refreshed, the story can appear in My Stories.

### Edit an owned story

Selecting Edit loads the owned story's saved source and opens it in Story Builder. My Stories preserves the source identity and owner during that handoff; it does not create another copy of a story the current user already owns.

Story Builder owns every subsequent field change, save, draft, finalization, import, export, and publication decision. Returning to My Stories should reflect the last successfully persisted state, not merely unsaved editor state.

### Create an owned copy from a saved publication

When a saved publication permits reuse, selecting Edit first opens a clone confirmation. After confirmation, Chronicle creates a separate story owned by the current account and opens that copy in Story Builder. A saved publication that does not permit reuse must not expose this action. Source conversations do not become the new user's play history, and later changes to the copy do not edit the creator's source.

The original source is not edited. The resulting copy is a separate owned story with its own later lifecycle. That independent copy should preserve the source's authored story setup, classifications, and reusable media without retaining inaccessible dependencies on the publisher's private records. Current implementation limits against that requirement are recorded in App Architecture rather than being presented as intended product behavior.

### Begin a fresh playthrough

Selecting Play on a non-draft story loads the current story setup and creates a new conversation titled **Story Session N**, where N follows the existing conversation count. The story's opening dialog becomes the first assistant message when one exists.

My Stories then hands the new conversation and loaded story state to Chat Interface and places the new session in Chat History. This is a fresh playthrough. Resuming a previously saved playthrough is the responsibility of Chat History, not the My Stories Play action. A session should be treated as returnable only after Chronicle has durably associated that conversation with an accessible story source.

### Remove a saved relationship or delete an owned source

Delete on a saved card opens a **Remove Bookmark?** confirmation. Confirming removes the current user's saved relationship and reloads saved stories. It does not change the source story or its publication.

Delete on an owned card opens a **Delete Scenario?** confirmation and warns that the entire story cannot be recovered through this workflow. Confirming requests deletion of the owned source and refreshes the story and conversation collections. The confirmation does not describe bookmark removal or unpublishing because those are different operations.

### Remove an owned publication without deleting the story

An owned published story can be removed from Community Gallery from Story Detail. After the removal succeeds, the story is no longer presented as published in that detail view. The owned story itself is preserved and remains available through the appropriate My Stories view.

### Personalize the workspace background

The page settings menu contains **Change Background**. The background interface lets the user return to Chronicle's default background, select an existing account-owned background, add a JPEG, PNG, or WebP from the device, copy an image from My Images into the private background destination, delete a background, and adjust a selected background's black or white overlay and opacity. The selected My Stories background is account-owned preference data; changing it does not change any story. My Stories and My Images draw from the same background library, so deleting one of those shared records in My Stories also removes it from the backgrounds available to My Images.

## Access, Privacy, and Permission Boundaries

### Authentication is the first boundary

The My Stories sidebar action is protected by Chronicle's authentication gate. The authenticated user identifier scopes owned story reads, saved relationships, publication records, profile data, backgrounds, and later mutations. A signed-out visitor is not given a neutral or public version of the collection.

### The page combines records with different visibility rules

Owned stories are loaded through owner-scoped story queries. Saved relationships are owner-only account records, even though the related publication can have a public presentation. Publication-control rows are read directly for the current publisher and through curated Gallery or saved-story flows for public consumption. My Stories must preserve those distinctions rather than treating every visible card as an owned story.

Story and character content can contain adult material. The card displays the saved SFW or NSFW classification when available, but My Stories does not provide the Community Gallery's adult-cover visibility toggle or age-confirmation flow. The user reached the saved collection through an authenticated account, and the current page renders the cover it receives.

### The shared Supabase reference is the documented policy boundary

The source-readable architecture explains which records the current code requests and how it uses them. The separate **Supabase Tables** tab is the last synchronized reference for documented table purposes, fields, storage buckets, and row-level access summaries. It is not proof that every deployed detail is unchanged or represented. When the code's intended ownership and the synchronized reference disagree, that disagreement must be investigated; prose in this manual is not an alternative access-control mechanism.

## Loading, Empty, Failure, and Recovery Expectations

### Loading should preserve the difference between unknown and empty

The initial collection depends on owned stories, saved results, publication status, displayed creator and classification data, and the user's background preference. A later scroll can request another page of owned stories. The workspace should distinguish initial loading from a confirmed empty collection, preserve already loaded cards during later paging, and explain a failed request without presenting it as an empty account. An empty view should identify the selected collection and keep New Story available. A retry should repeat the failed request without discarding the user's selected collection.

### Destructive actions require deliberate confirmation

Removing a saved relationship, deleting an owned story, and creating an editable copy of another creator's source all require confirmation before the operation continues. The confirmation must identify the actual consequence: removing a relationship, deleting an owned source, or creating a new copy. Cancel leaves the current records unchanged. When Edit, copy creation, Play, removal, publication, or background work fails, My Stories should preserve the last confirmed state, explain what did not complete, and provide a safe way to retry. App Architecture records where the delivered implementation does not yet meet those recovery expectations.

## Handoffs to the Rest of Chronicle

### Community Gallery produces saved relationships and public publications

Community Gallery is the upstream owner for public discovery, Likes, Saves, reviews, and public play entry. A successful Save produces the saved relationship that My Stories later presents. A creator's successful publication produces the publication record My Stories uses to identify an owned story as published. My Stories does not own public search, engagement, reviews, or publication eligibility.

### Story Builder owns authored changes

New Story, owned Edit, and confirmed saved-story copy all end in Story Builder. My Stories provides the correct identity and ownership context; Story Builder owns the editable fields, persistence, draft/final state, transfer controls, and publication workflow. Import and Export are Builder controls, not My Stories collection controls.

### Chat Interface and Chat History own conversations

Play ends My Stories' responsibility once the current story source has been loaded and a new conversation has been constructed for Chat Interface. Chat Interface owns the live roleplay and accepted conversation state. Chat History owns listing, resuming, and deleting persisted conversations. Deleting an owned story can also affect the conversations related to that source, but My Stories does not provide per-conversation management.

### Public Profile and My Images remain separate owners

Saved-story data can carry a creator name, but the current My Stories detail does not expose the public creator-profile control used by Community Gallery. Public Profile owns creator identity and following and also presents that creator's active, non-hidden published works. My Images owns reusable private media. The My Stories background picker can request that an image be copied from My Images into background storage; after that handoff, the background record and destination media are owned by the shared background system rather than by the source library item.

# UI Elements and Functions

This chapter defines the durable My Stories interface contract: what the user should see, what each control means, and how normal, empty, loading, and failure states should behave. Delivered departures from that contract are consolidated under **App Architecture → Current Implementation Limitations** so a current defect is not mistaken for an approved UI rule.

## Workspace Entry and Header

### Sidebar entry and authenticated access

The main sidebar includes **My Stories** with a four-tile hub icon. When the sidebar is expanded, the label is visible; when it is collapsed, the icon remains and a pointer hover reveals a **My Stories** tooltip. The navigation control must retain the same accessible name in either sidebar state. Selecting the entry while authenticated changes the main application tab to the My Stories hub. Selecting it while signed out opens the authentication modal and does not load the private collection.

The application header reads **My Stories**. This header belongs to the shared application shell and remains above the scrollable story workspace. The page itself has no browser-route breadcrumb because My Stories is an internal application tab at `/`.

### Collection selector

The header's segmented selector contains these exact options:

- **My Stories** — owned stories whose draft flag is false.
- **Saved Stories** — saved results whose source story data is available, excluding a source already present in the owned collection.
- **Published** — owned stories with a current publication record.
- **Drafts** — owned stories whose draft flag is true.
- **All** — every loaded owned story followed by those available saved results.

The selected option receives the active segmented treatment. **All** is initially selected in a newly created application state. Changing an option immediately replaces the visible cards with those that match and leaves the workspace background unchanged.

### Story Hub settings

The gear button is named **Story Hub settings**. Selecting it opens a small menu whose current action is **Change Background**. The My Stories header does not contain Import, Export, bulk delete, search, sort, or publication controls. Import and Export appear only when the Story Builder tab is active.

## Story Grid and Cards

### Responsive collection grid

The main workspace is vertically scrollable and displays one column on narrow widths, then two, three, four, or five columns as space increases. The workspace may use the user's selected background image with its saved overlay. Cards are rendered in the order supplied by the current collection view; the page does not expose a user-facing reorder control.

### Cover, fallback, and status badges

Each story card uses a 2:3 cover area. When a cover is present, its saved crop position controls the image's object position. When no cover is present, the card shows the first character of the title, or `?` when the title has no first character, on a dark field.

An owned draft receives a **DRAFT** badge. An owned, non-draft story in the current publication set receives **Published**. When that owned story's attached publication data says reuse is allowed, a purple pencil indicator appears beside the status. When content-theme data contains a story type, the upper-right badge reads **SFW** in blue or **NSFW** in red. These are indicators rather than buttons.

### Title, summary, counts, and creator

The lower card overlay shows the story title or **Unnamed Story**, followed by the description or **No summary provided.** The summary is limited to two visible lines. When authoritative publication data is attached, the card shows four icon totals in the order views, likes, saves, and plays. A card without authoritative publication data must not present a fallback value as a verified lifetime total.

The final line begins **Created by:**. Owned cards use the signed-in account's display name or username when loaded. Saved cards use the creator name assembled by the saved-story service. If no name is available, the card shows **Anonymous**.

### Card body and keyboard interaction

The card body is a focusable button-like region named **View details for [story title]**. Pointer selection, Enter, or Space opens Story Detail. The action controls are nested visually over that region and stop their pointer click from opening the detail view.

Pointer hover enlarges the cover and reveals the action tray. Keyboard focus must reveal the same actionable state, and every nested action must remain visibly focused and named without requiring pointer hover. The card body and its nested actions must have unambiguous click and keyboard targets.

### Edit, Delete, and Play shortcuts

The centered tray presents the actions permitted by the card's ownership, draft, and publication state. Owned cards receive **Edit** and **Delete**. Saved cards receive **Delete** and receive **Edit** only when the source publication permits reuse. A non-draft also receives **Play**.

- **Edit** on an owned story loads that source and opens Story Builder.
- **Edit** on a reuse-permitted saved story opens the clone confirmation instead of editing the creator's source.
- **Delete** on an owned story opens the owned-story deletion confirmation.
- **Delete** on a saved story opens the bookmark-removal confirmation.
- **Play** starts a fresh conversation and hands it to Chat Interface. Drafts do not render Play.

An action in progress should prevent duplicate submission without disguising which card and action are active. Play may transfer progress presentation to Chat Interface after the handoff begins. If an Edit, Delete, or Play request fails, Chronicle should preserve or restore the last confirmed My Stories state, explain the failure, and allow the action to be retried.

### New Story card

The final grid item is always a button containing a large plus sign and **New Story**. It appears even when the selected collection has no stories. Selecting it opens a new, not-yet-saved Story Builder workspace. There is no confirmation because no persisted story has yet been replaced or deleted.

## Automatic Paging and Collection States

### Infinite-scroll sentinel

When more owned records may exist, scrolling near the end of the grid automatically requests the next owned page. A spinning loader appears below the cards only while that additional request is running.

### Empty view

When the active collection has no matching story cards, the grid keeps **New Story** available and should explain which collection is empty. An empty Saved Stories view should give the user a clear path back to Community Gallery without implying that owned stories or drafts are also absent.

### Initial load and failure feedback

Initial loading must be visually distinct from a confirmed empty collection. A collection-level failure should identify that stories could not be loaded and provide Retry for the same selected view. Later paging should keep existing cards visible, show progress only for the additional page, and keep a paging failure distinct from reaching the end.

## Story Detail

### Opening and closing

Selecting a card opens the shared Story Detail overlay. The surrounding page is darkened. Selecting outside the detail body or selecting the Close control closes it. The information pane scrolls independently so long descriptions, theme lists, and characters remain reachable. The modal must identify itself to assistive technology, keep focus within the overlay while open, expose an accessible Close name, and indicate when supplemental detail is still loading.

### Cover and indicators

The left column repeats the cover and saved crop, with a title-initial fallback when no image exists. The SFW or NSFW badge appears when classification data is present. On an owned active publication, the information pane shows **PUBLISHED**. When that owned publication allows reuse, the cover receives a purple pencil and the information pane shows **EDITABLE** with explanatory text.

### Actions for an owned story

An owned story receives **Edit**. A non-draft also receives **Play**. A draft omits Play. When the detail represents an active owned publication, **Remove from Gallery** appears below the primary actions. While unpublishing is in progress, that action is disabled and its globe icon becomes a spinner. Success must clear the published state in the detail, card badge, and Published collection while preserving the owned source. Failure must preserve the last confirmed publication state and explain that removal did not complete.

### Actions for a saved story

A saved story receives **Play** in Story Detail. My Stories does not turn this private detail into the Community Gallery experience: Like, Save, reviews, publisher-profile navigation, and public engagement controls remain Gallery responsibilities. Editing an eligible saved source and removing the saved relationship are available from the card tray rather than the saved-story detail body. Reuse presentation and Edit availability must agree with the publication permission that authorizes creating an owned copy.

### Synopsis, classification, and characters

The right column displays the complete title and synopsis, using **Untitled Story** or **No description provided.** when either value is absent. When present, labeled text groups list Genre, Character Types, Story Origin, Trigger Warnings, and Custom Tags as comma-separated values. Empty groups are omitted. Characters are requested when the shared detail component opens. The panel can show loading skeletons, **No characters yet**, or up to eight avatar-and-name summaries. These character items are informational in this modal.

Story Detail should clear story-specific supplemental state when the selected card changes, show progress while classifications, publication status, or characters are still loading, and never show a prior story's values under a new title. Character failure must be distinguishable from **No characters yet** and should offer recovery without closing the whole workspace.

## Confirmation Interfaces

### Delete owned story

Selecting Delete for an owned card opens an alert titled **Delete Scenario?** with the message **Delete this entire scenario? This cannot be undone.** The actions are **Cancel** and **Delete**. Cancel closes the alert without starting removal. Confirming starts owned-source deletion. The confirmation must remain honest about progress, remove the card only after success, and explain a failure while preserving the source and a safe retry path.

### Remove saved story

Selecting the removal action for a saved card opens an alert titled **Remove Bookmark?** with the message **Remove this story from your bookmarks?** Cancel preserves the relationship. The confirming action must be labelled according to bookmark removal rather than source deletion. Success refreshes Saved Stories and removes the card; failure preserves the saved relationship, explains what did not complete, and permits retry.

### Clone saved story for editing

Selecting Edit for an eligible saved source opens **Clone Story for Editing**. The message explains that Chronicle will create a version in My Stories and will not affect the original creator's story. The confirming action must describe creating the copy rather than deleting anything. Success opens the independent owned copy in Story Builder. Failure keeps the user in My Stories, explains that no usable copy was created, and permits retry. Cancel preserves the saved story without creating a copy.

## My Stories Background

### Background picker shell

**Change Background** opens a dialog titled for assistive technology as **My Stories Background**. The visible header uses that title in uppercase. Its background library contains an upload menu, the default background card, the user's stored background cards, and overlay controls when a stored background is selected.

The dialog supports a clearly labelled Close action as well as Escape and outside-click dismissal. Selecting a background requests the change immediately; there is no separate Save button.

### Default and stored backgrounds

The **Default** card clears the My Stories background selection. Each stored background shows its image. A selected card receives a blue border and check. Selecting Default or another stored card updates the selection and the workspace behind the dialog only after persistence succeeds. A failed selection must leave the prior confirmed background in place and explain the failure. Hovering or focusing a stored card reveals its labelled delete action. Because deletion affects the shared background library used by My Images, the interface must make that consequence clear, confirm the destructive action, and remove the background from both consumers only after success.

### Upload from device or My Images

**+ Upload Background** opens a menu with **From Device** and **From Library**. From Device accepts JPEG, PNG, or WebP and, on success, adds the processed result to the background library. The button reads **Uploading...** and is disabled while this path is active. A newly uploaded device background is not automatically selected. A read, processing, upload, or record-creation failure must end the Uploading state, explain the failed stage, and allow another attempt without changing the selected background.

From Library opens a nested dialog titled **Select from Image Library**. Its first view shows the account's folders with image counts, names, and descriptions. A folder opens its image grid; **Back to folder list** returns to the folder view. Each available image is a button titled with its filename. Choosing one gives it a blue border, ring, and check indicator. Folder and image requests show an identified loading state. Their inline failure messages begin **Folder load failed:** or **Image load failed:** and include **Retry**; the same failures also produce a toast. Empty states read **No folders yet** with **Create folders in the Image Library first**, or **No images in this folder**. An image missing the required storage path is disabled and marked **Migration pending**.

The picker footer contains **Cancel** and **Select Image**. Select Image stays disabled until an available image is chosen, changes to **Copying…** during the copy, and is disabled together with Cancel while that work runs. A copy failure keeps the picker open and shows **Could not use that image. Please try again.** A successful copy should not be presented as complete until the new background record exists and its requested selection is confirmed. If a later stage fails, the interface must distinguish whether no background was created or whether an unselected background was created, explain the recovery action, and avoid presenting an unconfirmed selection. The original My Images item is not the control for later background selection, overlays, or deletion.

### Overlay settings and background empty state

When a stored background is selected, **Overlay Settings** offers labelled black and white color buttons, an opacity slider from 0 to 80 percent in five-point increments, and the current percentage. Changes may preview immediately, but a failed persistence request must restore the last confirmed overlay or identify that the preview was not saved. The color choices, slider, stored-background delete action, and close action must expose descriptive accessible names.

If the account has no stored backgrounds, the library also shows **No backgrounds uploaded** and **Upload images to customize your page background.** The Default card remains available.

# App Architecture

## What This Architecture Account Covers

### Current implementation, not an alternative product contract

This chapter records the My Stories code path inspected on August 21, 2026. It explains how the delivered `/` application tab constructs the collection, how actions transfer state and identifiers, which services persist the result, where security is enforced, and which current limitations affect the visible behavior. The Overview defines the stable meaning of the capability. This chapter must be rechecked when the shell, story lifecycle, Gallery services, persistence adapters, or synchronized Supabase reference change.

### Curated scope

The source set begins at the registered application route and follows only code that participates in My Stories or owns a boundary the capability hands off: shell navigation and header controls, authenticated registry loading, collection filtering, card and detail presentation, story lifecycle actions, Story Builder save/draft/import/export ownership, background management, Gallery saved/publication services, story and conversation persistence, signed-media hydration, and the synchronized schema reference. Retired App Architecture pages, Roleplay Pipeline prose, old screenshots, and generated inventories were not used as implementation authority.

## Delivery Boundary and Runtime Entry

### Registered route and internal tab

`src/App.tsx` registers `src/pages/Index.tsx` at `/`. `Index.tsx` owns the application-wide `tab` state and lazy-loads `StoryHub.tsx` as `ScenarioHub`. My Stories is rendered when `tab === "hub"`; there is no standalone `/my-stories` route. `AppSidebar.tsx` emits the navigation callback, and `Index.tsx` wraps the hub transition in `requireAuth`. If authentication is absent, `openAuthModal` runs and the tab does not change.

When My Stories is selected while leaving **Admin → Research & Development**, `runAfterAdminWorkspaceSave` first waits for the registered before-leave save handler. A false result retains the R&D workspace so an unsaved draft is not discarded. Navigation from other origins proceeds directly through the existing authentication and tab-selection path.

The default application tab is Community Gallery, while the default My Stories filter state is `all`. Entering the hub mounts the shared `AppShellTopBar`, the selected background layers, and `ScenarioHub` inside `AppShellWorkspace`. The lazy fallback is an empty height-filling surface with a black translucent background; it is marked `aria-hidden`.

### Shell state is the immediate UI authority

`Index.tsx` owns the in-memory registries and selected workspace state supplied to My Stories. These include owned `registry`, `savedScenarios`, `publishedScenariosData`, `contentThemesMap`, user profile, background records and selections, active story identity and data, and the active conversation identity. `StoryHub.tsx` owns only detail-overlay state and the infinite-scroll observer. It does not make the initial collection request and it does not persist story edits.

## Initial Authenticated Data Flow

### Ordered load sequence

After authentication provides a user identifier, `src/hooks/use-index-authenticated-data.ts` executes this sequence through the exported `useIndexAuthenticatedData` hook:

1. It sets the shared `isLoading` flag and runs `backfillCanonicalWorldCoreForUser` with a 20-second fallback. This is a compatibility repair, not a My Stories display query.
2. It starts owner-paginated stories, Character Library, Chat History registry, user backgrounds, My Images background preference, saved publications, the user's publication-control rows, and profile data in parallel. Each request has a 15-second neutral fallback.
3. It installs the resulting owned stories, publication maps, saved relationships, profile, related registries, and background state in `Index.tsx`.
4. It builds one combined identifier list from the owned story page and eligible saved sources, then requests their content themes. This request is outside the individually protected parallel set; a rejection reaches the outer catch.
5. It derives the selected My Stories and My Images background identifiers from the loaded preferences and clears the shared loading flag in `finally`.

The first owned page requests 50 stories ordered by `updated_at` descending. `hasMoreScenarios` is set when that page contains at least 50 rows. This deliberately permits an additional request when exactly 50 rows were returned; that next request determines whether another page actually exists.

### Neutral fallbacks have precedence over visible error state

The timeout helper resolves with the supplied fallback rather than rejecting. Owned stories, saved stories, characters, conversations, and backgrounds therefore become empty arrays after their timeout; publication data becomes an empty map and profile or background preference becomes null. The hook's outer catch logs other failures. Neither path stores a My Stories-specific error object. `Index.tsx` maintains `isLoading`, but the hub rendering path does not consult it.

As a result, the current precedence is: successfully returned data wins; a timeout substitutes the neutral value; an unhandled later failure leaves whatever state was installed before the throw; and the visible grid renders that in-memory state. The UI cannot distinguish a confirmed empty account from a fallback empty registry.

The selected-background restoration occurs after the unprotected combined theme request. If that theme request rejects, the already loaded background rows remain installed but the My Stories and My Images selected-background identifiers are not restored during that load. The failure is logged and both surfaces can render their default background until a later successful load.

## Collection Construction and Paging

### Owned registry

`fetchMyScenariosPaginated` in `src/services/persistence/scenarios.ts` queries `stories` for the authenticated `user_id`, orders by `updated_at` descending, applies the requested range, converts rows to `ScenarioMetadata`, and hydrates private cover references through the signed-media path. The service throws on query failure. The caller's initial timeout converts a slow request to `[]`; later paging catches and logs errors without changing `hasMoreScenarios`.

### Saved registry

`fetchSavedScenarios` in `src/services/gallery-data.ts` calls the authenticated `get_saved_scenarios_for_user` RPC. It then fetches the returned publisher profiles and attaches public identity to the sanitized saved-story result. `Index.tsx` removes saved rows whose `source_scenario_id` is already in the owned registry and translates the remaining rows to `ScenarioMetadata` with `isBookmarked: true`.

Saved stories use publication tags and the source story's title, description, cover URL, and cover crop. Their local created and updated times are both based on the save relationship's `created_at`. They are appended after owned stories in the **All** view and are not included in the owned-story paging offset.

### Publication and filter authority

`fetchUserPublishedScenarios` directly reads `published_scenarios` where `publisher_id` is the current user and `is_published` is true. It returns a map keyed by source `scenario_id`. `Index.tsx` derives `publishedScenarioIds` from that map. The **Published** filter and owned-card publication badges therefore depend on the owner's publication-control query, not on the story's draft flag or a Gallery feed response.

The filter switch has this exact precedence:

- `my` selects owned `registry` rows whose `isDraft` is false.
- `bookmarked` selects the translated eligible saved rows.
- `published` selects owned rows whose identifier appears in `publishedScenarioIds`.
- `drafts` selects owned rows whose `isDraft` is true.
- `all` concatenates all owned rows and the eligible saved rows.

No secondary sort is applied after this switch. Owned rows retain the database update order, while saved rows retain the RPC order. The **All** view is grouped by source kind rather than globally interleaved by date.

### Later owned-story pages

`StoryHub.tsx` observes a sentinel with a 200-pixel root margin. When it intersects and a request is not already running, `Index.tsx` calls the paginated story service with the current owned registry length as the offset. Returned rows are appended. Fewer than 50 rows clear `hasMoreScenarios`. A failed request logs an error and leaves `hasMoreScenarios` true, so another intersection can attempt the same offset again. There is no visible error or manual retry control.

`hasMoreScenarios` belongs to the owned registry, but the same sentinel is mounted beneath every active filter. Scrolling Saved Stories, Published, or Drafts can therefore request another owned page and show the paging spinner even though the visible collection is narrower or comes from saved relationships.

## Card and Detail Data Flow

### Card construction

`ScenarioCard` receives one normalized `ScenarioMetadata` row plus derived publication, content-theme, and author data. It does not request its own data. Owned publication totals and `allow_remix` come from `publishedScenariosData`, which contains only the signed-in user's publication rows. Consequently, saved cards do not receive their publication aggregate data through this prop and display the single play fallback of zero even when the public publication has engagement.

For saved cards, `bookmarkedCreatorNames` is built from the saved RPC result. Owned cards use the current user's loaded profile. Content classifications arrive in `contentThemesMap`; if the combined theme request fails, the outer load catch logs the error and no SFW or NSFW badge is shown for entries absent from the map. Unlike the initial parallel requests, this combined theme request has no 15-second neutral fallback.

### Detail opening

Selecting a card finds the story in the currently filtered registry, sets it as selected, opens the overlay, and starts `fetchContentThemes` and `getPublishedScenario` in parallel. Each request converts its own failure to null, so the surrounding catch is rarely reached. Their results become the selected content themes and publication status.

`getPublishedScenario` reads the publication-control row by `scenario_id` and expects a single active or inactive row or null. The synchronized schema reference describes raw `published_scenarios` reads as Owner/Admin, so the repository-defined boundary intends this direct detail request for the current publisher rather than as a public saved-story publication lookup. That reference is not live-policy proof, and this review did not exercise the deployed authorization result. The saved RPC already carries some publication fields, including `allow_remix`, yet `StoryHub` does not pass that saved data into the detail state. A saved story can therefore lose its editable indication in My Stories detail even when the publication was returned as editable upstream.

The detail passes `allow_remix` independently from `is_published`. Reopening an owned story whose retained publication row is inactive can therefore show **EDITABLE** without **PUBLISHED** when that inactive row still has reuse enabled.

The detail request stores `isLoadingDetails`, but no JSX reads it. The selected classification and publication status are not cleared before the next request. These two decisions produce the missing loading presentation and stale-detail race recorded under Current Implementation Limitations below.

### Shared detail ownership modes

`StoryHub` passes `isOwned={!selectedScenario.isBookmarked}` into `ScenarioDetailModal`. In owned mode, the shared component exposes Edit, Play when not a draft, the published badge, and Remove from Gallery when an active publication exists. In saved mode, My Stories supplies Play but omits the Gallery's Like, Save, publisher, review, public totals, and profile-navigation props. The shared component correctly suppresses controls that were not supplied.

The shared component requests character summaries after opening. That lightweight request reads `characters.avatar_url` directly; it does not read `avatar_path` or run the private-avatar signed-media hydration used by the full edit and play loaders. Legacy or public avatar URLs can render, but a private storage sentinel is not resolved by this detail path. Character-read failures are logged and resolve to the component's non-loading state without a distinct error message. The component is visually presented above `DialogOverlay`, but its body is an ordinary fixed `div` rather than `DialogContent`. Focus trapping, Escape semantics, and accessible modal structure are therefore not established by the usual Radix dialog content in this path.

## Action Flows and Persistence

### New Story to Story Builder

`handleCreateNewScenario` generates a UUID, creates default `ScenarioData`, clears cover and classification state, and sets `tab` to `world`. It does not call `saveScenario` or insert a `stories` row. Story Builder receives the new identifier and becomes responsible for the first successful persistence operation. The New Story action is therefore a state transition, not evidence that a durable draft exists.

### Edit owned source

`handleEditScenario` calls `fetchScenarioById`. That service issues parallel reads for the story, characters, world-reference records, scenes, and conversation metadata, followed by at most 5,000 messages across the returned conversations. It checks the story query error, but it does not inspect errors from the four related-record queries; those paths can therefore become empty arrays while the story still opens. The follow-up message query also discards its error by reading only `data`, so returned conversation records can contain empty message arrays after a failed message read. The full loader hydrates private story-cover, character-avatar, and scene-image references that have durable paths. The lifecycle separately calls `getScenarioOwner`. A matching owner proceeds to Story Builder; any different result—including null after an owner-read error—opens the clone confirmation when a user identifier is present.

Before the transition, the handler checks `localStorage` for `draft_<story-id>`. Modern local snapshots are used only when the database result has no characters and the local snapshot does. In that recovery case, Chronicle opens the local data and asynchronously attempts to repair the database as a draft. When the database already has characters, the stale local snapshot is removed. Database state otherwise wins.

### Clone saved source

After confirmation, `executeRemixClone` reloads the source and calls `cloneScenarioForRemix`. The clone service generates new identifiers for story-owned characters, world-reference entries, and scenes; makes supported scene images portable; removes conversations and side characters; and persists the new owned story. It then refreshes the owned registry and opens the clone in Story Builder.

If the source is still present in `savedScenarios`, the lifecycle calls `trackRemix` with the publication identifier and new story identifier. The persistence implementation logs remix-tracking failure rather than rolling back the already-created clone. The resulting story is therefore authoritative even if provenance telemetry was not recorded.

Current enforcement limitation: the My Stories lifecycle decides whether to clone by comparing the source owner with the signed-in user. It does not check the publication's `allow_remix` value before displaying the confirmation or calling the clone service. The card Edit control is rendered for all saved stories, not only saved stories marked editable. The current UI indicator and the mutation authorization are therefore not the same boundary.

Current portability limitation: the clone service explicitly normalizes supported scene media and generates independent structural identifiers, but it does not make the cover or character avatars owner-independent. Its call receives the hydrated cover presentation without the source `coverImagePath` and passes that presentation URL into the new story's save metadata, so a short-lived signed source URL can be persisted as the clone's cover fallback. Each cloned character also retains the source character's `avatarPath`; `characterToDb` writes that original private path and its storage sentinel under the new story row. The synchronized reference describes `character_avatars_private` reads as Owner/Admin, so under that documented boundary a remixer can receive character-avatar references the new owner cannot resolve. The deployed storage-policy result was not exercised in this review. The copy should not be described as fully media-independent.

Current classification limitation: `fetchScenarioById` does not read `content_themes`, `cloneScenarioForRemix` does not persist a content-theme row for the new identifier, and `executeRemixClone` opens Story Builder with `defaultContentThemes`. A saved source can therefore be copied with its structural story data while its classifications are replaced by Builder defaults. That delivered behavior does not satisfy the Overview requirement that an independent copy preserve the source classifications.

### Play to Chat Interface

`handlePlayScenario` immediately sets the active story identifier, sets the active conversation marker to `loading`, and changes `tab` to `chat_interface`. It then calls `fetchScenarioForPlay`, which issues parallel reads for the source story, characters, world-reference records, scenes, and an existing-conversation count. As in the edit loader, only the story query error is checked; an error in a related query can silently supply an empty collection or zero count. The handler separately requests content themes, and a theme-read failure is logged without blocking Play.

It constructs a new conversation UUID and title using the returned conversation count. Opening dialog text becomes an assistant message with its own message and generation identifiers. Starting day, time of day, progression mode, and interval come from the story opening configuration with defaults. The handler starts `saveConversation` without awaiting it, inserts a matching conversation summary into the in-memory Chat History registry, sets the loaded story data, and replaces the `loading` marker with the new conversation identifier.

This ordering favors a fast Chat Interface handoff, but persistence is not a gate. If `saveConversation` later fails, the error is logged while the running UI and in-memory Chat History entry remain. The temporary Chat History summary looks for a title only in the owned registry, so a conversation started from a saved story initially receives the fallback scenario title **Story** until a later registry refresh or enrichment replaces it. If the initial source load fails, the lifecycle returns to My Stories and clears the conversation marker without a visible explanation.

### Chat History resume depends on the current source

`handleResumeFromHistory` receives the conversation's `scenario_id` and reloads the current story through `fetchScenarioForPlay` in parallel with the recent conversation thread and side characters. The conversation row and message history do not contain a complete snapshot of the story source, cast, codex, scenes, or themes. There is no snapshot fallback when the current source query returns null or a related source read is no longer authorized.

This creates a saved-source continuity limit. A conversation begun from another creator's publication can become non-resumable if the publisher later removes visibility and the deployed policy consequently prevents the player from re-reading the source. The repository proves the runtime dependency and absence of a snapshot fallback; it does not prove the current deployed RLS outcome for that later visibility change.

### Unsave, delete, and unpublish

`handleDeleteScenario` decides between saved and owned behavior by finding a matching saved relationship and confirming that the source identifier is absent from the owned registry. Saved confirmation calls `unsaveScenario`, then refetches saved stories. Owned confirmation calls `deleteScenario`, then refetches owned stories and the conversation registry; it also clears active story state if the deleted identifier was active.

`deleteScenario` first calls best-effort cleanup for a managed public story-cover mirror and then deletes the `stories` row. A thrown cleanup failure is logged and does not block deletion; a resolved Edge Function response that carries an error is not inspected by this caller. Dependent-row behavior is owned by database relationships and policies, not enumerated in the card handler.

`handleUnpublish` in `StoryHub.tsx` calls the Gallery service's `unpublishScenario`. That service updates every RLS-visible publication row for the supplied `scenario_id` to `is_published: false`; it does not delete the publication row. It then invokes the managed public-cover cleanup path. Inside that Edge Function's unpublish branch, both the storage removal and story-cover update are awaited without inspecting their returned `error` values, after which the function returns `ok: true`. Cover cleanup can therefore be reported as successful even when one of those internal operations returned an error. The detail state becomes unpublished on success. `Index.tsx` does not refresh `publishedScenariosData` from this callback, so the underlying card can retain its Published badge and public totals until another application refresh rebuilds that map.

## Background Data Flow

### Account-owned records and private media

`useIndexBackgroundWorkspace.ts` owns My Stories background state. The initial account load retrieves `user_backgrounds` and uses the row marked selected for the hub. The synchronized schema reference describes these rows as owner-readable and owner-mutable and identifies `user_backgrounds_private` as the private storage destination for owner-facing background images.

Device upload reads the file, resizes and JPEG-encodes it, uploads it to `user_backgrounds_private`, and creates an initially unselected account background row. It adds the row to the in-memory library but does not automatically select it. The My Images picker first copies the selected private image into that same destination, then creates an initially unselected background row, adds it to the in-memory library, and requests My Stories selection. A record-creation failure leaves the copied storage object without a corresponding visible row cleanup. A later selection failure leaves the new row visible but unselected.

Selection is persisted before local selected state changes, but the persistence service uses two updates rather than one transaction: it clears every account background's `is_selected` flag and then, when an identifier was supplied, marks that row selected. If the second update fails, the database can have no selected row while the unchanged local UI still shows the previous selection. Overlay changes are optimistic: local color and opacity update first, followed by persistence, with only a console error and no rollback on failure. Deletion asks storage to remove the file and then deletes the row; the storage API's returned error is not inspected, so row deletion can continue while an object remains behind. Only after the service returns does the hook remove the local row. If the deleted row was selected for My Stories, local selection returns to default. The same background collection is also consumed by the My Images background picker, so deleting a shared background can affect availability in that other surface.

## State Authority and Conflict Precedence

### Authority order

The effective authority order for My Stories is:

1. Supabase authentication owns the current account identity.
2. Live database rows and curated RPC results own durable stories, saved relationships, publication controls, conversation records, profile data, and background preferences.
3. Persistence services translate those rows and hydrate managed private media for the React application.
4. `Index.tsx` owns the current in-memory registries, filter, active identifiers, and capability handoffs.
5. `StoryHub.tsx` owns transient detail selection, detail request results, and paging observation.
6. A narrowly scoped `draft_<story-id>` browser-local snapshot can temporarily override an unexpectedly empty character set during owned-story editor recovery; it is not the general durable source.

A card label or console diagnostic never outranks the underlying row. The Published badge reflects the last loaded publication map, not an independent enforcement decision. The purple pencil reflects loaded `allow_remix` data, but the clone action currently does not enforce that value. The zero shown on a card without publication data is a UI fallback, not an authoritative count.

### Identifier boundaries

The owned story identifier is the source key used by Story Builder, publication control, themes, characters, scenes, and conversation creation. A saved relationship also carries its own identifier and the publication identifier, but My Stories normalizes the visible card to `source_scenario_id`. A new clone receives a new story identifier and regenerated child identifiers. A Play action receives the source story identifier but generates a distinct conversation identifier. Preserving these differences prevents a bookmark, publication, clone, and playthrough from being treated as the same object.

## Security and Privacy Boundaries

### Application checks versus database enforcement

`requireAuth` prevents the normal sidebar transition without a signed-in session, and lifecycle handlers return when they lack a user identifier. These are interaction guards. Durable enforcement belongs to Supabase row-level security, authenticated RPCs, storage policies, and edge-function validation.

The synchronized schema reference documents `stories` and `characters` at both table and field level as Owner/Admin/Public for eligible visible publications, with owner-only mutation. It describes `saved_scenarios`, `remixed_scenarios`, and `user_backgrounds` as owner-scoped, and raw `published_scenarios` control rows as Owner/Admin reads with owner mutations. Publication metadata visibility is therefore documented through the curated saved/publication flows and the table summaries available to this review.

The saved-source runtime needs a broader boundary than publication metadata. `fetchScenarioById` and `fetchScenarioForPlay` directly query `stories`, `characters`, `codex_entries`, and `scenes`; Play also directly queries `content_themes`, while saved-source Edit reaches the clone branch before loading themes. The synchronized reference is internally inconsistent for that source: the `codex_entries`, `scenes`, and `content_themes` table rationales say public reads are allowed for visible published stories, while their individual field rows say Owner/Admin. Because Codex cannot reconcile that disagreement against the deployed policies, complete saved-source authorization and field completeness are not proven live. The Chronicle Work Manual governs any later task that needs a live comparison or synchronized-reference update before making a stronger claim.

The synchronized reference covers tables and storage, not database-function definitions. Curated Gallery and saved-list RPCs remain the documented way to obtain publication presentation, but their successful metadata response does not by itself prove that every direct full-source read will succeed.

Owned collection covers and the full edit/play loaders resolve durable private-media paths through signed-media helpers. The lightweight Story Detail character request is an exception: it reads `avatar_url` without resolving `avatar_path`. Public publication presentation can use a managed public story-cover mirror. Owned story deletion attempts mirror cleanup before deleting the story row; unpublishing marks the publication inactive before invoking mirror cleanup. Both cleanup calls are best-effort, and the client services do not consistently inspect a resolved Edge Function error. The Edge Function's unpublish branch likewise does not inspect the storage-removal or story-update error objects before returning success, so the primary row mutation can succeed while mirror cleanup is unproved.

`supabase/functions/publish-cover/index.ts` authenticates the bearer token with `auth.getUser`, then delegates story authorization and cover-path lookup to `promote_story_cover_to_public`. The inspected migration `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql` defines that function as `SECURITY DEFINER`, rejects a missing `auth.uid()`, and permits only the story owner or an account for which `has_role(..., 'admin')` succeeds. The generated Supabase types expose the current callable signature. This establishes the repository-defined owner/admin check; the live RPC grant and runtime policy result were not exercised in this review.

### Adult story data

My Stories does not sanitize adult story titles, descriptions, classifications, covers, character summaries, or authored source data. That material is ordinary product data and remains subject to the same ownership and storage boundaries as other story content. Unlike Community Gallery, My Stories currently has no local show/hide NSFW presentation preference or age-confirmation branch.

## Responsibility and Handoff Map

### My Stories owns

My Stories owns the account-centered story collection, the meaning of its five filters, distinction between owned and saved cards, card and private-detail presentation, initial selection of story lifecycle actions, owned-story paging, and the personal workspace background entry point.

### Receiving capabilities own

Story Builder owns edits, new-story persistence, draft and final state, import and export, validation, and publication. Community Gallery owns public discovery, public publication presentation, engagement, reviews, and the upstream Save relationship. Chat Interface owns the new live session after Play. Chat History owns persisted conversation discovery and resume. Public Profile owns public creator identity and following. My Images owns reusable private source images; the background system owns the copied destination after selection.

### Shared systems own

The application shell owns route delivery, authentication gating, tab state, responsive workspace framing, and shared header controls. Persistence services own row translation, child-record loading, signed media, save/delete sequences, and service errors. Supabase owns durable rows, row-level access, functions, and storage policy. The Knowledge Base renderer owns only the documentation presentation and cannot enforce product behavior.

## Diagnostics Versus Actual Enforcement

Console messages currently report initial load failures, page-load failures, detail failures, story-not-found results, edit and clone failures, conversation-save failures, unpublish failures, background failures, and some thrown best-effort media-cleanup failures. A resolved Edge Function response carrying an error is not consistently logged by these cleanup callers. Development timeouts can also log which neutral fallback was used. These messages help an engineer locate a failing branch; they are not user feedback, a retry mechanism, an audit record, or proof that a mutation succeeded.

Visible labels are likewise not enforcement. **Published** is derived from the last publication map. **EDITABLE** is derived from loaded `allow_remix`. **DRAFT** is derived from the story row. The backend policy and successful service response determine whether the corresponding durable operation actually occurred.

The current page has no My Stories-specific telemetry event contract, request status ledger, or automated end-to-end evidence that connects a clicked control to a persisted downstream result. This review therefore does not establish the relationship between a clicked control and the persisted downstream result; the Chronicle Work Manual governs the evidence selected for later work.

## Current Implementation Limitations

### User-visible state and recovery

- The initial loading flag is not rendered in My Stories, and timeouts use empty fallbacks. Empty, timed-out, and failed initial collections can look identical.
- An empty filter has no explanatory copy or recovery link; only New Story remains.
- Later paging failure has no message or Retry control and leaves the sentinel eligible to retry the same offset.
- The owned-story paging sentinel is mounted under every filter, so scrolling a saved or otherwise narrowed collection can trigger an unrelated owned-page request and spinner.
- Edit, Play, delete, unsave, detail-theme, character, unpublish, and background failures are generally console-only.
- Card Edit, Delete, and Play do not have a per-action busy or duplicate-submission guard. The delete/bookmark and clone confirmations close as soon as they start their asynchronous work, so the user is not given an in-dialog pending state or a protected retry boundary while those operations settle.
- New conversation persistence is fire-and-forget, so Chat Interface can open before the conversation save is confirmed.
- Chat History resume reloads the current source by `scenario_id`; conversations and messages do not retain a complete story snapshot. A saved-source conversation has no fallback if later visibility changes make that source unreadable.
- The edit and play loaders check the story query but not each parallel related-record query, so a partial backend failure can look like empty characters, world references, scenes, conversations, or a zero conversation count. Edit also discards the follow-up message-query error and can open returned conversations with empty message arrays.
- A combined content-theme load failure occurs before selected-background restoration and can leave already loaded background rows present while both page selections remain at their default for that load.

### Collection and action consistency

- Saved cards do not receive their public publication totals and show a play fallback of zero.
- The My Stories detail request uses an owner-oriented raw publication lookup; saved detail does not reuse the publication data already returned by the saved-story RPC.
- An inactive owned publication row can still supply `allow_remix`, so reopening its detail can show **EDITABLE** without **PUBLISHED**.
- Every saved card exposes Edit, and the clone lifecycle does not enforce `allow_remix` before creating a copy.
- An owner-lookup error returns null and is treated as non-ownership, so Edit can open the clone confirmation for an owned story when that separate check fails.
- Clone persistence regenerates structural child identifiers and copies cross-owner scene media, but it can persist the source cover's hydrated presentation URL and source-owner private avatar paths without creating new owner-scoped media objects.
- Clone persistence does not load or save `content_themes`, and the lifecycle opens the new copy in Story Builder with `defaultContentThemes` rather than the source classifications.
- Removing an owned publication updates detail state but does not refresh the parent publication map, so the card can remain visually published until later refresh.
- A saved-story Play entry initially uses **Story** as the in-memory Chat History scenario title because the temporary summary looks only in the owned registry.
- The clone and bookmark confirmations reuse a destructive control whose affirmative label is **Delete**, even when the operation creates a copy or removes only a relationship.

### Interaction and accessibility

- Hover actions remain focusable while visually transparent, and the focusable card body contains interactive descendants.
- Pointer selection of the nested card region can be ambiguous because the card body and action tray occupy the same area.
- Story Detail opens before its supplemental requests settle, renders no loading state, and can temporarily retain the previous story's supplemental values.
- The visible Story Detail body does not use the shared dialog-content primitive, and its X icon has no accessible name.
- The background dialog hides the standard visible close button, and background-card delete buttons lack a descriptive accessible label.
- The background delete action has no confirmation even though the shared row also disappears from My Images after success; the overlay color buttons, opacity slider, and nested library loading spinners also lack complete descriptive labelling.
- My Stories background selection uses two non-transactional updates; a second-step failure can leave the database with no selected row while the UI retains its prior selection. Overlay color and opacity update optimistically, and a persistence failure is logged without rolling the controls back or marking their displayed values as unsaved. Background copy or deletion can also leave an unreferenced private storage object when later row work fails.
- Story Detail's lightweight character request does not resolve private avatar paths, so private-only avatar references can fail to render there even though the full edit and play loaders hydrate them.

These limitations are implementation facts, not stable product requirements. **MS-ISSUE-001** tracks the misleading loading, partial-data, action-feedback, and stale-state branches; **MS-ISSUE-002** tracks the clone, private-media, conversation-durability, and resume boundary. The capability's **Issues** tab is the operational status authority. No active Current Work or modern accepted closeout is currently registered for My Stories. Its Changelog tab does include two positively mapped historical Quality Hub records for the shared story-detail and review flows; their historical status is not modern product acceptance.

## Curated Source Map

### Delivery and shell

- `src/App.tsx` — registers the delivered root application route.
- `src/pages/Index.tsx` — owns tab state, registries, My Stories filter construction, capability handoffs, modal wiring, and hub rendering.
- `src/components/app-shell/AppSidebar.tsx` — renders the My Stories navigation entry and shared account shell.
- `src/components/app-shell/AppShellTopBar.tsx` — renders the title, five collection filters, and Story Hub settings menu; also establishes that Import and Export are Story Builder controls.
- `src/hooks/use-auth.ts` — exposes authenticated session state used by the shell guard.

### My Stories presentation

- `src/components/chronicle/StoryHub.tsx` — renders cards, New Story, paging sentinel, supplemental detail requests, and My Stories' shared-detail props.
- `src/components/chronicle/StoryDetailModal.tsx` — shared story-detail presentation, ownership modes, character request, badges, primary actions, and unpublish control.
- `src/components/chronicle/DeleteConfirmDialog.tsx` — shared Cancel/Delete confirmation used for owned deletion, bookmark removal, and saved-story cloning.
- `src/components/chronicle/BackgroundPickerModal.tsx` — background library, upload menu, selection, deletion, and overlay UI.
- `src/components/chronicle/ImageLibraryPickerModal.tsx` — source picker used by the My Images-to-background copy handoff.

### State and lifecycle ownership

- `src/hooks/use-index-authenticated-data.ts` — authenticated initial load, timeouts, neutral fallbacks, registry installation, theme request, and selected-background restoration.
- `src/hooks/use-index-scenario-lifecycle.ts` — New, Edit, clone, Play, unsave, and owned-delete transitions.
- `src/hooks/use-index-scenario-persistence.ts` — Story Builder save and draft persistence, import and export ownership, local safety snapshots, and the transition back to My Stories after save.
- `src/hooks/use-index-background-workspace.ts` — background upload, selection, deletion, overlay persistence, and local selected-background state.
- `src/types.ts` — normalized story, story-source, content-theme, conversation, and background shapes used across these boundaries.

### Services and durable data

- `src/services/gallery-data.ts` — saved-story RPC translation, owner publication map, unpublish, unsave, and Gallery relationship types.
- `src/services/persistence/scenarios.ts` — owner queries, full edit load, play load, pagination, clone persistence, remix tracking, and owned deletion.
- `src/services/persistence/conversations.ts` — new conversation persistence used by the Play handoff.
- `src/services/persistence/content-themes.ts` — card and detail classification reads.
- `src/services/persistence/media-settings.ts` — owner background rows, private background upload, selection flags, overlay persistence, and storage deletion.
- `src/services/persistence/library-copy.ts` — copies a selected private My Images object into the background destination before the consumer persists it.
- `src/services/persistence/scene-media-portability.ts` — enforces owner-scoped scene-image paths during clone persistence.
- `src/services/persistence/characters.ts` — translates and hydrates full character records used by edit and play loads.
- `src/services/persistence/signed-media.ts` — private media hydration used when owner story records are rendered.
- `src/services/supabase-data.ts` — compatibility barrel through which Index and lifecycle hooks reach persistence operations.
- `supabase/functions/publish-cover/index.ts` — authenticates the caller, delegates story authorization to the cover-promotion RPC, and performs service-role public story-cover promotion or cleanup for publish, unpublish, and delete flows.
- `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql` — defines the inspected `SECURITY DEFINER` cover-promotion RPC and its owner-or-admin authorization check.
- `src/integrations/supabase/types.ts` — generated client types confirming the current `promote_story_cover_to_public` callable signature.
- `src/data/supabase-schema-reference.ts` — synchronized table, storage, field, and RLS reference used for the durable-data security boundary; it is not a function-definition inventory.

### Current focused test evidence

- `src/services/persistence/scenario-delete-cover-cleanup.test.ts` — checks that managed public-cover cleanup is attempted without making cleanup failure block story deletion.
- `src/services/persistence/scene-media-portability.test.ts` — checks supported scene-media portability behavior used by clone persistence.
- `src/data/chronicle-knowledge-base/manifest.test.ts` — repository-coupled Knowledge manifest contract, including the seven-tab capability shape and capability-derived Issue counters.
- `src/data/chronicle-knowledge-base/my-stories-manifest.test.ts` — capability-isolated source, heading, stable-tab, Supabase-link, operational-tab isolation, and source-path checks.
- `src/pages/style-guide/chronicle-knowledge-base.my-stories.test.tsx` — focused renderer test for the My Stories manual tabs without editing the concurrently owned application-wide Knowledge test.

There is no current component test dedicated to `StoryHub.tsx`, no lifecycle test that drives New/Edit/clone/Play/delete across `use-index-scenario-lifecycle.ts`, and no end-to-end My Stories test proving the visible result and database mutation together. Existing service tests establish only their named boundaries.

## Review Metadata

### Source state

- Reviewed on: **08/21/2026**.
- Inspected base commit: `cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7`.
- Worktree boundary: the checkout contained concurrent unrelated changes. This review used the current on-disk versions of only the paths listed below and did not treat unrelated dirty files as accepted My Stories behavior.
- Inspected-source count: **34 paths**.
- Inspected-source composite SHA-256: `ccf19bb9b553c7eea1aeb81e066421632fb32995fcb02705173e5f7c21b8ad46`, computed from the ordered `shasum -a 256` output for the paths below.

Source-only reconciliation on **09/06/2026** inspected the changes since that base in `App.tsx`, `Index.tsx`, `AppShellTopBar.tsx`, and the three changed Knowledge tests in the source list. The changes add Work Manual routes, R&D-specific header and departure handling, shared button presentation, and documentation checks. The remaining 28 source inputs are unchanged from the recorded base; My Stories controls, ownership, persistence, lifecycle, and schema are unchanged. The departure guard is documented above. This updates the source fingerprint and its narrow entry-boundary account, not the August 21 live observation or its verification limits.

### Direct live observation

The authenticated local application at `http://127.0.0.1:8080/` was inspected as the **Dr. House** account on August 21, 2026. The live page confirmed the five header filters and **All** default, the Story Hub settings button and its sole **Change Background** action, a custom background, owned published/non-published/draft cards, the permanent New Story card, draft omission of Play, empty Saved Stories presentation with only New Story, and owned Story Detail with Edit, Play, Remove from Gallery, PUBLISHED, EDITABLE, synopsis, content classifications, and character summaries. Read-only inspection also opened and cancelled the owned Delete confirmation, the My Stories Background dialog, its two-source upload menu, and the nested My Images picker through folder navigation and image selection enablement. No affirmative destructive, publication, edit, clone, play, upload, background, image-copy, or persistence action was executed.

The live account had no saved-story card, so saved-detail and clone-confirmation behavior was verified from the current source rather than claimed as direct observation. Network failure presentations and database mutation outcomes were also not exercised live.

### Inspected source paths

- `src/App.tsx`
- `src/pages/Index.tsx`
- `src/components/app-shell/AppSidebar.tsx`
- `src/components/app-shell/AppShellTopBar.tsx`
- `src/components/chronicle/StoryHub.tsx`
- `src/components/chronicle/StoryDetailModal.tsx`
- `src/components/chronicle/DeleteConfirmDialog.tsx`
- `src/components/chronicle/BackgroundPickerModal.tsx`
- `src/components/chronicle/ImageLibraryPickerModal.tsx`
- `src/hooks/use-auth.ts`
- `src/hooks/use-index-authenticated-data.ts`
- `src/hooks/use-index-scenario-lifecycle.ts`
- `src/hooks/use-index-scenario-persistence.ts`
- `src/hooks/use-index-background-workspace.ts`
- `src/services/gallery-data.ts`
- `src/services/persistence/scenarios.ts`
- `src/services/persistence/conversations.ts`
- `src/services/persistence/content-themes.ts`
- `src/services/persistence/media-settings.ts`
- `src/services/persistence/library-copy.ts`
- `src/services/persistence/scene-media-portability.ts`
- `src/services/persistence/characters.ts`
- `src/services/persistence/signed-media.ts`
- `src/services/supabase-data.ts`
- `supabase/functions/publish-cover/index.ts`
- `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql`
- `src/integrations/supabase/types.ts`
- `src/data/supabase-schema-reference.ts`
- `src/types.ts`
- `src/services/persistence/scenario-delete-cover-cleanup.test.ts`
- `src/services/persistence/scene-media-portability.test.ts`
- `src/data/chronicle-knowledge-base/manifest.test.ts`
- `src/data/chronicle-knowledge-base/my-stories-manifest.test.ts`
- `src/pages/style-guide/chronicle-knowledge-base.my-stories.test.tsx`

### Verification limit

This manual is source-backed and includes one authenticated read-only UI inspection. It does not prove a successful database insert, update, delete, unpublish, clone, background mutation, or conversation save in the inspected session. It does not replace the shared Supabase Tables reference, and it does not establish that dormant, legacy, generated, or retired documents match current behavior. Changes to the route, shell state, persistence services, RPCs, storage policies, or live RLS can make the related claims stale; the Chronicle Work Manual governs any later factual update.
