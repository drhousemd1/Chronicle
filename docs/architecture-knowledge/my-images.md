# Overview

## My Images at a Glance

My Images is Chronicle's private, account-owned library for visual material that a person may want to reuse. The Knowledge Base calls the capability **My Images**. The current application navigation and page header call the same workspace **Image Library**. That label difference is intentional documentation of the delivered interface; it does not identify two different libraries.

The capability gives an authenticated user one place to upload images, place them in named folders, give them useful titles and tags, search within a folder, inspect them at a larger size, choose a folder thumbnail, and remove material that is no longer wanted. Its central promise is durable private source ownership: the library keeps the reusable original, while a consuming capability receives its own copied media object when the user deliberately selects an image for a story cover, character avatar, scene, page background, or chat sidebar theme.

My Images is not a publishing surface and is not an AI image generator. Story Builder, Character Builder, the page-background workspace, and Chat Interface own their own generation and destination-saving workflows. My Images supplies an uploaded source to those workflows. Community Gallery does not browse a person's private library; it sees only media that another capability has deliberately attached to published work under that capability's rules.

## Entry, Authentication, and Preconditions

My Images lives in Chronicle's main application shell. The current sidebar entry is **Image Library**, and the current page header repeats **Image Library**. Opening it requires an authenticated Chronicle account. A signed-out selection opens Chronicle's sign-in dialog instead of revealing the library. The shell also returns a signed-out user to Community Gallery if a private tab remains selected after authentication ends.

No active story is required. Navigating from Story Builder first leaves the active builder workspace in the same way as other account destinations: Chronicle attempts to preserve the current editor state in the browser's draft cache, clears the active story and conversation selection, and then opens My Images. The library itself is account-scoped rather than story-scoped.

A folder is required before an image can be uploaded. At the folder-list level, the user creates or opens a folder. Inside that folder, the shared top bar exposes upload and search. A user who has no folders receives a folder-level empty state and a **New Folder** action. A user who has opened an empty folder receives an image-level empty state and an upload path.

Using a library image from another capability has separate preconditions. The person must already be authenticated, the source image must have a durable private-storage path, and the requesting capability must name the destination storage area. A legacy row without that path remains visible for migration awareness but must not be copied as though it were a portable source.

## Ownership and Media Lifecycle

### The account owns folders and source images

Every folder and image belongs to one Chronicle account. A folder provides organization and can hold a name, optional description, image count, and selected thumbnail. An image record belongs to a folder and carries the original filename, an optional display title, up to ten tags, creation information, and the private media reference needed to render it through temporary signed access.

The reusable media object and its database row form one logical source item. The durable reference is the private storage path, not the temporary signed URL used by the browser. Signed URLs are display credentials with a limited lifetime. They must never become the long-term identity of a library image or be copied into another record as though they were permanent.

Folder deletion is destructive for the folder and all source images in it. Image deletion is destructive for the selected library source. Both require explicit confirmation that describes the consequence. Deleting a library source must not silently delete destination copies that Story Builder, Character Builder, page backgrounds, or Chat Interface already own. Those copies have independent paths and independent lifecycles.

### A handoff creates an independent destination copy

When a consumer opens **Select from Image Library**, My Images supplies folder and image discovery. After the user chooses an eligible image and confirms **Select Image**, Chronicle reads the private source bytes and writes new bytes into the requesting capability's destination bucket. Only after that copy succeeds does the picker return the destination reference to the consumer.

This is a copy boundary, not a live link. Later title, tag, thumbnail, folder, or deletion changes in My Images do not rewrite the destination copy. Later edits or deletion at the destination do not rewrite or remove the My Images original. The requesting capability becomes responsible for adopting the returned destination reference into its own record or local editor state.

The separation protects both sides of the workflow. A user can organize or eventually remove a private source without unexpectedly breaking a story cover that was already copied. A user can replace a character avatar or scene without changing the reusable source that may be selected elsewhere.

## Folder and Image Workflows

### Create and describe a folder

From the folder grid, **New Folder** creates an account-owned folder and opens **Edit Folder**. The editor presents **Folder Name** and **Description (optional)**, plus **Cancel** and **Save**. A nonblank name is preserved after surrounding whitespace is removed; an empty submitted name becomes **Untitled Folder**. The resulting folder appears in the library and can be opened, edited again, used as a source-picker category, assigned a thumbnail, or deleted.

### Open, search, and return

Opening a folder replaces the folder grid with the folder workspace. Chronicle shows the folder name and optional description, loads its images newest first, and changes the shared header to include **Back**, search, and **+ Upload Images**. Search is scoped to the open folder. It matches tag text, the display title, and the original filename without requiring exact case. Clearing the query restores every loaded image in that folder. **Back** returns to the folder grid and clears the folder search.

### Upload one or more images

Inside a folder, **+ Upload Images** opens the device file chooser and allows multiple image files. Chronicle processes the selected files in order. Each source is decoded and normalized in the browser while preserving its aspect ratio, encoded as JPEG, stored under the authenticated account and folder, and represented by a new library image row. The original filename remains available as identifying text even though Chronicle assigns a unique storage filename.

A successful image appears at the start of the open folder, receives a temporary signed display URL, and increments the folder's visible count. Upload changes the library source only. It does not automatically select the image as a folder thumbnail or send it to a story, character, scene, background, or conversation.

### Inspect and organize an image

Selecting an image preview opens **Image Details**. The larger preview is accompanied by a **Title** field and a **Tags** area. The title provides a user-facing name while preserving the original filename as fallback identification. A tag is entered by typing a value and pressing Enter. Chronicle normalizes a new tag to lowercase, ignores duplicates, and limits the image to ten tags. Each displayed tag includes an individual remove action.

The detail editor treats the title and tags as durable image metadata. **Save** commits the title, while tag additions and removals are their own persistence actions. Closing or cancelling must never be represented as deleting the source image. The image card uses the title when present and the original filename otherwise.

An image card also exposes a star action for **Set as folder thumbnail** and a named delete action. The selected thumbnail becomes the folder's visual cover in the main library and in consumer pickers. Thumbnail selection does not copy, move, or duplicate the image; it updates the folder's reference to an existing member.

### Delete an image or a folder

Deleting an individual image opens a confirmation that says the image will be permanently deleted. Confirmation removes the source media and its image record, removes the card from the open folder, and reduces the folder count. Cancelling leaves both unchanged.

Deleting a folder opens a stronger confirmation that says the folder and all its images will be permanently deleted. Confirmation removes the folder's stored images and the folder row; the database relationship is responsible for removing its image rows with the folder. Cancelling leaves the entire folder intact. A folder or image deletion does not revoke destination copies created earlier by consumer workflows.

## Page Background Workflow

The My Images page has an account-level appearance setting separate from the reusable image folders. The top-bar settings menu exposes **Change Background**, which opens **Image Library Background**. The modal offers Chronicle's **Default**, previously stored account backgrounds, **+ Upload Background**, and overlay controls for a selected background.

**From Device** creates a page-background object from a local file. **From Library** opens the same private folder-and-image picker used by other consumers, copies the chosen source into the page-background destination, creates a separate account background record, and selects it for My Images. The selected background belongs to the shared account background collection used by My Stories and My Images, but each page has its own selection flag. Choosing a background for My Images must not implicitly choose it for My Stories.

For a selected non-default background, the modal exposes black or white overlay color and an opacity slider from 0 to 80 percent in five-point steps. The selection and overlay settings are intended to persist as account preferences. Deleting a background removes that shared background object, so the action can affect its availability in both page pickers; it does not delete the original My Images source from which that background may have been copied.

## Handoffs to the Rest of Chronicle

### Story Builder

Story Builder can request a My Images source for a story cover or a scene. A cover selection is copied into the private story-cover destination. Story Builder then owns whether that reference becomes the story's cover and whether publication later promotes an appropriate public cover. A scene selection is copied into scene storage, and Story Builder owns adding or updating the corresponding scene record. My Images does not publish either asset.

### Character Library and Character Builder

The shared Character Builder can request a My Images source for an avatar. Chronicle copies the bytes into private character-avatar storage before the builder adopts the returned reference. Character Library or Story Builder then owns the character record, avatar path, preview, crop, and later saving. Replacing or deleting that avatar does not change the My Images source.

### My Stories and My Images page backgrounds

Both page-background pickers can request a My Images source. The selected image is copied into private account-background storage and represented by a `user_backgrounds` record. The page workspace owns selection and overlay preferences. My Images continues to own the reusable original.

### Chat Interface

Chat Interface can request a My Images source from the **Sidebar Theme** workspace. Chronicle copies it into private sidebar-background storage, after which Chat Interface owns creation, selection, categorization, ordering, overlay, and deletion of the theme object. Conversations never take ownership of the original My Images source.

### Community Gallery, Public Profile, and Chat History

Community Gallery receives only media that a publishing capability has deliberately made part of public story presentation. It has no permission to browse private My Images folders or source objects. Chat History resumes conversations and does not serve as a library destination.

Public Profile is an intended consumer of reusable private media in Chronicle's application-level product contract. A valid profile handoff would follow the same independent-copy rule: My Images would own the source until the profile destination copy succeeds, then Public Profile would own the adopted avatar or profile image. The current implementation status of that handoff is kept in App Architecture rather than weakening this stable ownership rule.

## Privacy, Permissions, and Security Expectations

The library is private by default. The account identity is the ownership boundary for `image_folders`, `library_images`, and objects under the private `image_library` bucket. The browser sends the current account identifier when it creates folders, image rows, and storage paths, but client-side filtering is not security enforcement. Deployed row-level security, storage policies, and the folder-summary function must independently prevent one account from listing, reading, changing, or deleting another account's folders and media.

Temporary signed URLs are presentation credentials. They may be cached in memory for responsive rendering and renewed before expiry, but they must not be persisted as durable application data. A consumer must copy the source bytes into an explicit destination rather than retaining a signed source URL. A legacy public URL may remain readable for compatibility, but it does not replace the private-path contract for a portable library image.

The synchronized Supabase Schema Reference describes the repository's last documented `image_folders`, `library_images`, `user_backgrounds`, and storage boundaries. It is not proof that every live database detail is unchanged or represented. The separate **Supabase Tables** tab supplies reference and handoff mechanics; the Chronicle Work Manual governs whether a task uses them.

## Loading, Empty, Failure, and Recovery Expectations

The workspace must distinguish initial loading, an empty account, an empty folder, a filtered no-match state, and a failed request. Loading the folder list or an open folder should show progress without presenting incomplete results as a confirmed empty library. An account with no folders should see the folder empty state and **New Folder**. An open folder with no images should see **No images yet** and the upload path. A nonempty folder whose search has no matches should say that the query found nothing and make clearing the search obvious.

Folder and image load failures should preserve the user's location, present the failure inline, show the returned message when it is safe to do so, and provide **Retry**. A toast may reinforce the failure but must not be the only recovery path. If an individual private preview cannot receive a signed URL, the affected tile should show a meaningful placeholder and retry or refresh guidance rather than implying the source is gone.

Mutation feedback must make the consequence and final state clear. Create, edit, title, tag, thumbnail, upload, background, copy, and delete actions should prevent duplicate submission while work is pending. A successful action should update the visible state. A failed action should retain or restore the user's input, avoid claiming success, and explain whether any earlier step completed. Multi-file upload should distinguish completed, failed, and unattempted files. Destructive actions must not dismiss their confirmation until the outcome is known.

The consumer picker has its own recovery contract. Folder and image failures present inline **Retry** actions. An image without a portable private path is visibly disabled and directs the user to re-upload it. During a destination copy, **Select Image** becomes **Copying…** and the picker prevents another submission. A copy failure keeps the picker open and reports **Could not use that image. Please try again.** A successful copy closes the picker and hands the destination reference to the requesting capability; that consumer remains responsible for confirming its own save.

## Stable Product Invariants

The following rules define My Images even when the delivered implementation has a limitation recorded later in this manual:

- My Images sources are private, account-owned, and organized through account-owned folders.
- A signed URL is temporary display data; the private path is the durable source reference.
- Upload preserves aspect ratio and creates a source inside the currently open folder.
- Search is limited to the current folder and covers tags, title, and original filename.
- Title and tags describe the source; folder thumbnail selection changes presentation, not ownership.
- Deletion requires clear confirmation and affects the selected source scope only.
- A consumer receives an independent destination copy, never a persisted signed source URL.
- Destination copies survive later library organization or source deletion.
- Page-background records and sidebar themes are destinations, not library folders or library images.
- Community Gallery cannot browse private My Images content, and publication is owned elsewhere.

# UI Elements and Functions

## Workspace Entry and Shared Header

### Sidebar destination

Chronicle's main sidebar labels this capability **Image Library**. The entry uses the image-library icon, highlights while the page is active, and follows the sidebar's collapsed or expanded presentation. Selecting it while signed out opens the **Sign in** dialog. Selecting it while signed in leaves any active story workspace and opens the account's image library.

The approved Knowledge Base label remains **My Images**. User-facing instructions should acknowledge the runtime label so a person can find the right control without treating the two names as separate features.

### Folder-list header

At the folder-list level, the shared top bar shows the section title **Image Library**. Its right side contains a settings button represented by a gear. Opening that menu reveals **Change Background**. Upload and search are intentionally absent until a folder is open because every uploaded source must belong to a folder and search is folder-scoped.

### Open-folder header

Inside a folder, the shared header adds three controls:

- **Back** leaves the folder, returns to the folder grid, and clears the folder search.
- The search field is displayed with the current placeholder **Search by tags...**. Its functional scope also includes image title and original filename. Results update as the query changes.
- **+ Upload Images** opens the device file chooser. The chooser accepts images and permits more than one selection.

The settings gear and **Change Background** remain available inside a folder. The header does not move an image, create a scene, generate art, or publish content.

## Folder Library

### Loading and failed folder load

While the account's folders are loading, the main content area shows a centered spinner. It must not show the empty-state conclusion until the request has completed.

A folder-list failure appears in an inline error panel above the grid as **Folder load failed:** followed by the available message. **Retry** starts the folder request again without requiring navigation away. Chronicle also raises **Failed to load image folders. Please try again.** as supporting toast feedback. The inline panel is the durable recovery control.

### Folder cards

Each folder is represented by a portrait card. When the folder summary provides a displayable image—either the selected thumbnail or the current fallback—it fills the card. A folder with no returned displayable image uses the folder placeholder. A dark lower gradient supports the folder's visible metadata:

- an image-count badge using singular **image** or plural **images**;
- the folder name;
- the optional folder description.

The card itself is an **Open folder _name_** action. A pointer click, Enter, or Space opens the folder. Hover or equivalent accessible action presentation exposes **Edit** and **Open**. **Edit** opens the folder editor without entering the folder. **Open** enters the folder. The named **Delete folder _name_** trash action opens the folder deletion confirmation without also opening the folder.

Folder-card actions must remain discoverable and operable without relying exclusively on pointer hover. Keyboard focus must identify the folder and expose or reach its edit, open, and delete choices.

### New Folder card

The final dashed portrait card is **New Folder**. Activating it creates a folder and opens **Edit Folder** so the default name and description can be replaced. While creation is pending, the action should prevent duplicate activation. Success adds the folder to the visible collection. Failure keeps the library usable and reports **Failed to create folder:** with the returned message.

### No-folder empty state

When a completed folder request returns no folders, the grid is accompanied by the empty state:

- **Image Library**
- **Create folders to organize your images**

The **New Folder** card is the recovery action. This state means the account has no folders; it must not be used for a failed or still-loading request.

## Edit Folder Dialog

**Edit Folder** is a modal editor for both a newly created folder and an existing folder. It contains:

- **Folder Name**, a single-line field with placeholder **Enter folder name**;
- **Description (optional)**, a multiline field with placeholder **Enter a description for this folder**;
- **Cancel**, which closes the editor without submitting the fields;
- **Save**, which trims the fields, submits the name and description, and closes only after the save has been safely accepted.

Submitting an empty name uses **Untitled Folder**. A successful edit updates both the folder grid and an already-open folder header. A failed edit should preserve the entered fields and report **Failed to update folder:** with the returned message. Closing or cancelling a newly created folder editor does not mean the already-created default folder has been deleted; deleting that folder remains a separate confirmed action.

## Open Folder Workspace

### Folder identity

The open-folder content begins with the folder name and, when present, its description. The shared top bar owns the navigation, search, upload, and background controls; the content header identifies the folder rather than duplicating those actions.

### Image loading and failed image load

Opening a folder shows a centered spinner while its images load. A failed request presents an inline **Image load failed:** panel with the available message and **Retry**. Retry requests the same folder again. A supporting toast says **Failed to load folder images. Please try again.** Existing library state should not be mislabeled as a completed empty folder while the request is pending or failed.

### Image grid and cards

Images appear newest first in a responsive square-card grid. Every card includes:

- a square preview using the temporary signed source URL or a compatible legacy source;
- accessible alternative text from the title when present, otherwise the original filename;
- a footer that uses the title when present and filename otherwise;
- the nearest recognized aspect-ratio label and a portrait, landscape, or square indicator after the preview can be measured;
- **Set _name_ as folder thumbnail**, represented by a star at the upper left;
- **Delete image _name_**, represented by a trash action at the upper right.

The star remains visibly selected for the current folder thumbnail. Choosing another image updates the folder's thumbnail reference and visual cover but leaves every image in place. A thumbnail-save failure reports **Failed to set thumbnail:** and must not visually claim that the new thumbnail is durable.

Selecting the preview opens **Image Details**. Image-detail entry, thumbnail selection, and deletion are distinct consequences. The preview must be keyboard reachable, and thumbnail and delete actions must remain discoverable without pointer-only hover.

### Search results and no matches

The folder search compares the query to lowercase tag text, display title, and original filename. It does not search other folders. Matching cards remain in their existing newest-first order. Clearing the field restores the full loaded folder.

A folder that contains images but has no matches should present a specific no-results state that identifies the active query and offers a clear-search action. That state is different from **No images yet** because the underlying folder is not empty.

### Empty folder

After a successful image request returns no images, the workspace shows:

- **No images yet**
- **Upload images to this folder**

The shared **+ Upload Images** control is the recovery action. The state must remain visible until an upload succeeds or a later reload finds images.

## Upload Images

**+ Upload Images** activates a hidden file input that accepts image files and permits multiple selection. Chronicle processes selected files in order. The upload control should change to a progress or busy presentation while the batch is running and prevent a second batch from starting through the same control.

For each file, Chronicle preserves aspect ratio, normalizes the image in the browser, converts the result to JPEG, assigns a unique storage name, keeps the original filename as metadata, writes the private object, creates the image record, obtains a temporary display URL, and adds the image to the beginning of the grid. The folder count increases after each completed image.

Successful files must remain visible even if a later file in the batch fails. Failure feedback should identify the failed item, which earlier files completed, and whether later files were attempted. The current shared error wording begins **Failed to upload image(s):** and includes the returned message. The file input resets after the attempt so the same local file can be selected again. Upload does not automatically set a title, tag, folder thumbnail, or destination handoff.

## Image Details Editor

### Dialog frame and preview

Selecting an image opens a centered overlay titled **Image Details**. The dialog contains a large contained preview and a named **Close image editor** button. Escape and clicking outside also close the editor. Closing does not delete the image.

The dialog should behave as an accessible modal: focus enters it, remains within its controls, and returns to the triggering card when it closes. Its title and close action must be announced to assistive technology.

### Title

The **Title** field opens with the current title, or the original filename when no title exists. Its placeholder is **Enter image title...**. **Save** persists the current field value and updates the card footer. A title failure reports **Failed to save image title:** with the returned message, preserves the person's input, and keeps the editor open for retry. The filename remains the fallback when a saved title is empty.

### Tags

The **Tags** region renders every current tag as a chip. Each chip has a named **Remove tag _tag_** action. The entry field says **Add tag and press Enter...**. Pressing Enter trims and lowercases the value, ignores an empty or duplicate value, adds the tag when fewer than ten exist, and persists the new array. The count reads **_n_/10 tags • Press Enter to add**.

Removing a chip persists the remaining tags. Add or remove failure reports **Failed to update tags:** with the returned message and leaves the durable displayed list consistent with the confirmed server state. Tag changes are individual metadata actions; **Save** is the title action and must not misleadingly promise to roll back a tag change already confirmed by the server.

### Cancel and Save

**Cancel** closes the editor without submitting an unsaved title. **Save** submits the title. Both controls leave the underlying image and any already-confirmed tags intact. While the title save is pending, the editor should prevent duplicate submission and preserve the preview and fields until success or failure is known.

## Folder and Image Deletion Confirmations

Selecting a folder or image trash action opens the shared destructive dialog. Its heading is **Are you sure you want to delete this?** unless a caller supplies another title. **Cancel** closes the dialog without mutation. **Delete** confirms the exact target.

For a folder, the consequence text is **This will permanently delete this folder and all its images.** Confirmation removes the folder-level source scope. For an image, it is **This will permanently delete this image.** Confirmation removes only that library source.

The confirmation must remain pending until storage and row work reaches a known outcome. Success removes the corresponding card and updates the count. Failure leaves the visible target present and reports **Failed to delete folder:** or **Failed to delete image:** with the returned message. Neither confirmation claims that destination copies will be removed.

## Image Library Background

### Entry and modal frame

The header gear opens a menu with **Change Background**. That item opens a modal titled **Image Library Background** with an assistive description: **Select and manage background images for this page.** Its central panel is labelled **Background Library**.

The modal manages page appearance rather than the reusable folder library. A background tile is a destination object in the account's shared background collection, even when it was copied from My Images.

### Default and stored background tiles

The first tile is **Default**. Choosing it removes the My Images page's selected-background preference without deleting any stored background. The selected tile carries a check indicator.

Each stored background is a landscape tile with image alternative text **Background**. Selecting it makes that object the current My Images page background. Each tile also has a delete action. The tile and its delete action require clear accessible names because their visual image alone is not sufficient identification.

When no stored backgrounds exist, the modal shows **No backgrounds uploaded** and **Upload images to customize your page background.** The Default tile remains available.

### Upload Background menu

**+ Upload Background** opens a menu with:

- **From Device**, which opens a chooser restricted to JPEG, PNG, and WebP and creates a new account background;
- **From Library**, which opens **Select from Image Library** and creates a background from an independent copy of the selected source.

While a device upload is active, the trigger reads **Uploading...** and is disabled. A device upload adds the background object; selecting it is a separate user choice. A successful From Library copy creates the background and selects it for My Images. Each path must show a user-visible failure and preserve the modal for recovery.

### Overlay Settings

When a stored background is selected and overlay editing is available, **Overlay Settings** appears. **Color:** provides black and white choices. **Opacity:** provides a slider from 0 to 80 in increments of five and displays the current percentage. Each color control needs a meaningful name such as **Black overlay** or **White overlay**, and the slider must expose its label and value.

Selection and overlay changes should update the page after persistence succeeds or roll back with visible failure feedback. Deleting a background must explain that the shared account background object will disappear from both My Images and My Stories background choices if both surfaces use it.

## Select from Image Library Consumer Picker

The consumer picker is part of My Images even though a requesting capability opens it. It is the visible copy boundary used by Story Builder, Character Builder, page backgrounds, and Chat Interface.

### Folder step

The dialog title is **Select from Image Library**. It loads account folders into portrait cards with the summary-provided selected thumbnail or fallback image, a folder placeholder when neither is available, image count, name, and optional description. Choosing a folder opens its images. The completed no-folder state reads **No folders yet** and **Create folders in the Image Library first**.

A failure appears as **Folder load failed:** with the returned message and **Retry**. A spinner identifies the loading state. **Cancel** closes the picker without copying anything, and **Select Image** remains disabled until an eligible source is selected.

### Image step

After a folder is chosen, the header shows **Back to folder list**, the selected folder name, and the image-library icon. **Back to folder list** clears the current folder images and selection without closing the picker.

Images appear as square buttons. Choosing an eligible tile adds the visible selected check. The tile title uses the original filename. A legacy row without a private path is disabled and titled **Migration pending — re-upload required**; its tile says **Migration pending**. If the person somehow attempts to use that row, the picker reports **This image needs to be re-uploaded before it can be used.**

The completed empty-folder state reads **No images in this folder**. A folder-image failure appears as **Image load failed:** with the message and **Retry**. A private preview that cannot be signed should show a meaningful unavailable state rather than a blank but apparently selectable tile.

### Confirmation and outcome

**Select Image** confirms the selected source. While Chronicle copies the bytes into the requesting destination, the button reads **Copying…**, both footer actions are protected from conflicting submission, and the selected tile remains visible. Failure keeps the picker open and shows **Could not use that image. Please try again.** Success closes it and returns the new destination reference to the consumer.

The dialog confirms a copy, not adoption into the consumer's parent record. Story Builder, Character Builder, the page-background workspace, or Chat Interface must still show whether its own save succeeded. A user must never be told that selecting an image changed the source folder, moved the source, or created a public asset by itself.

## Feedback and Accessibility Contract

All visible icon-only controls need names that communicate their action and target. Folder cards, image previews, background tiles, picker tiles, back controls, settings, close, thumbnail, tag removal, and destructive actions must support keyboard use and visible focus. Pointer hover can supplement but cannot be the only route to an action.

Loading spinners need an announced status. Inline error panels and Retry controls must remain near the failed region. Toasts provide secondary feedback for mutations, but they do not replace a recoverable state. Pending actions need disabled or busy presentation; success needs a visible state change; failure needs preserved or restored state and an actionable message.

The page must keep four visually similar scopes distinct in its language:

- **folder** means an organizational container in My Images;
- **image** means the private reusable source;
- **background** means a copied account appearance object;
- **destination copy** means media now owned by a requesting capability.

Clear scope language prevents a user from mistaking deletion of a folder for deletion of already-copied story media, or deletion of a page background for deletion of its reusable My Images source.

# App Architecture

## Coverage and Review Boundary

This architecture account explains the current repository implementation behind the My Images capability, whose delivered runtime label is **Image Library**. It covers the main application route and authentication gate, folder and image reads and mutations, private-media rendering, the shared page-background workspace, the consumer picker and copy boundary, destination adoption, state authority, persistence, security, failure propagation, current implementation limitations, and the evidence used for review.

Review date: **08/22/2026**. Inspected revision: **`cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7`**, plus the concurrent working-tree state reviewed on that date. Product source was inspected directly. The current local application was inspected in both the in-app browser and Chrome through the signed-out path: the sidebar displayed **Image Library**, selecting it opened the current **Sign in** dialog, and no private content was exposed. Neither browser had an authenticated Chronicle session, so the folder grid, image mutations, background modal, and destination-copy success path were not exercised live during this review.

The synchronized Supabase Schema Reference was inspected as the documented backend boundary. Repository migrations and generated client types were used to understand why current code has its present shapes, but they are not proof that a migration, policy, bucket setting, grant, or function body is deployed unchanged. A current source dependency absent from the synchronized reference—most importantly the folder-summary RPC—remains an unverified live fact; this manual does not present repository history as deployment proof.

## Route, Entry, and Shell Ownership

Chronicle mounts My Images inside the main `/` application rendered by `src/pages/Index.tsx`. It is not a separate React Router page. The shell's internal tab key is `image_library`.

`src/components/app-shell/AppSidebar.tsx` owns the delivered **Image Library** navigation label. `Index.tsx` wraps the selection with the shared `requireAuth` callback. A signed-in selection runs the shared navigate-away path before setting `tab = "image_library"`; a signed-out selection opens authentication instead. `src/hooks/use-index-shell-bootstrap.ts` separately restricts signed-out shell state to Gallery or the unauthenticated builder tabs, so a private library tab does not remain active after authentication disappears.

`src/hooks/use-index-scenario-persistence.ts` owns the navigate-away transition. If an active story exists, it first attempts to write the current story data, cover presentation, content classifications, and timestamp to `draft_<storyId>` in browser local storage. It then clears the active story, selected character, and playing conversation before changing the shell tab. My Images does not receive or own that draft; the transition only prevents the library from sharing active builder state.

`src/components/app-shell/AppShellTopBar.tsx` owns the **Image Library** title, folder **Back**, folder search, **+ Upload Images**, settings gear, and **Change Background** entry. `Index.tsx` connects those controls to refs and state held by the page and `ImageLibraryTab`. `ImageLibraryTab` is lazy-loaded and owns the main folder/image content. The settings menu opens the shared `BackgroundPickerModal` with the My Images-specific title and selection flag.

## Ordered Runtime and Data Flows

### 1. Authentication bootstrap and page appearance

After authentication, `src/hooks/use-index-authenticated-data.ts` starts a shared account bootstrap. Among other account data, it requests `fetchUserBackgrounds(userId)` and `getImageLibraryBackground(userId)` with fifteen-second fallbacks. The hook places returned background rows and the My Images selected-background identifier into `use-index-background-workspace.ts` state.

`Index.tsx` derives the selected background URL from that shared collection. When the My Images tab renders, it applies the URL to the page container. The reusable library folder/image request is separate and begins when `ImageLibraryTab` mounts.

If the background requests time out, the bootstrap uses an empty list and `null`; it does not surface a My Images-specific bootstrap error. The application can therefore render the library with default appearance even when page-background hydration was not confirmed.

### 2. Initial folder load

`ImageLibraryTab` receives `user?.id` from `Index.tsx`. On its first eligible effect, `loadFolders()` calls the no-argument `get_folders_with_details` RPC. The component maps each result to `ImageFolder`, including folder identity, owner, name, description, selected thumbnail, thumbnail URL/path, count, and timestamps.

The repository migration defining the current RPC selects the chosen `thumbnail_image_id` when present and otherwise falls back to the folder's oldest image. The component gathers returned nonempty `thumbnail_path` values and asks `getSignedMediaUrls("image_library", paths)` for temporary display URLs. Folder cards prefer the signed private path and retain a legacy thumbnail URL fallback. The returned RPC order becomes the initial folder order. Successful completion marks the component's fetch guard as loaded. Failure keeps the guard open for **Retry**, stores an inline message, writes a console diagnostic, and raises a toast. The synchronized reference does not list this RPC, so its deployed fallback, shape, and order remain unverified.

The RPC is authoritative for cross-session folder membership, counts, thumbnail relationship, and its returned ordering. Local card updates are presentation conveniences until a reload replaces them with backend results.

### 3. Create and edit a folder

**New Folder** calls `handleCreateFolder()`. The component inserts an `image_folders` row with the authenticated `user_id`, name **New Folder**, and an empty description. It selects the returned row, constructs local timestamps, prepends the new card, and opens `FolderEditModal`.

`FolderEditModal` maintains temporary name and description fields. **Save** trims both and substitutes **Untitled Folder** when the submitted name is empty. `handleUpdateFolder()` updates the row by folder ID, then updates both the folder collection and selected folder if it is open. The modal invokes the callback and closes independently of the returned promise. Folder create and update diagnostics use console errors and toasts.

### 4. Open a folder and load images

Opening a folder sets `selectedFolder`, starts `loadFolderImages(folder.id)`, and informs `Index.tsx` that the shared top bar is in folder mode. The component queries `library_images`, filters by `folder_id`, and orders by `created_at` descending. It maps the row fields used by the UI: identity, owner, folder, legacy URL, private path, filename, title, thumbnail flag, tags, and creation time.

All private image paths are batch-signed for display. `folderImages` is the complete loaded collection; `signedUrls` is presentation-only lookup state. The search query is held by `Index.tsx` because the shared header owns the field. `ImageLibraryTab` derives `filteredImages` from the current loaded collection by comparing lowercase query text with tags, title/fallback display name, and original filename.

The **Back** callback clears the selected folder and loaded images, reloads folder summaries, tells the shell to return to folder mode, and clears search in `Index.tsx`. No database mutation occurs.

### 5. Measure and present aspect ratio

After folder images or their signed URLs change, `ImageLibraryTab` creates browser `Image` objects to measure each source. `getClosestRatio()` in `AspectRatioUtils.tsx` chooses the nearest configured ratio and derives portrait, landscape, or square orientation. When every image reports a successful load, the component commits the collected map and the card footer renders the label and small orientation icon.

Aspect ratio is derived presentation state. It is not written to `library_images`, does not affect storage conversion, and does not determine whether a source can be copied.

### 6. Upload source images

The shared top bar invokes a file-input ref exposed by `ImageLibraryTab`. The hidden input accepts multiple images. For each chosen file, the component reads a data URL, calls `resizeImage(dataUrl, 1920, 1080, 0.85)`, fetches the encoded data URL back to a blob, and creates a unique `.jpg` path under `<userId>/<folderId>/`.

`resizeImage()` preserves aspect ratio, but it does not calculate a true two-dimensional bounding box. With the library's `1920, 1080` arguments, it caps a landscape source only when width exceeds 1920 and caps a portrait or square source only when height exceeds 1080. A landscape image that is 1800 by 1700 passes through at those dimensions even though its height exceeds 1080. The canvas output is JPEG.

The component uploads the blob to private `image_library`, creates a `storage://image_library/<path>` sentinel for the legacy non-null URL column, and inserts a `library_images` row with owner, folder, sentinel, private path, and original filename. It then signs the path, prepends the mapped row to local folder images, and increments the local folder count. Files are processed sequentially inside one busy interval.

The storage object is created before the database row. These operations are not transactional. Current failure consequences are listed under Current Implementation Limitations.

### 7. Edit title and tags

Clicking a preview assigns `lightboxImage` and initializes `editTitle` from the existing title or filename. Title **Save** directly updates `library_images.title` by image ID. After success, the component maps the new title into `folderImages`.

Tags use `handleUpdateImageTags(imageId, newTags)`. Pressing Enter trims and lowercases a candidate, rejects duplicates and additions beyond ten, and submits the new array. A chip removal submits the filtered array. After success, the component updates both `folderImages` and the open lightbox copy.

Title and tags do not share one save unit. **Cancel** prevents an unsaved title submission, but a tag addition or removal that already succeeded is durable regardless of how the lightbox later closes.

### 8. Set a folder thumbnail

The star action updates `image_folders.thumbnail_image_id` to the chosen image ID. On success, the component updates the folder's thumbnail ID, legacy URL, and private path in both collection and selected-folder state. The image remains in the same folder; no copy occurs. The RPC later derives the same thumbnail metadata for folder-card and picker display.

Although `LibraryImage` maps an `is_thumbnail` field, this flow does not write that image field. The folder's `thumbnail_image_id` is the effective authority used by the page.

### 9. Delete an image

The card trash action stores an image deletion target and opens `DeleteConfirmDialog`. Confirmation resolves the storage path from `image_path`, or attempts a legacy public-URL extraction. If a path is available, it calls storage removal, then deletes the `library_images` row by ID. On success it removes the card and decrements the local folder count without going below zero.

Database and storage operations are separate. The destination copies created by other capabilities have different paths and rows, so this source deletion does not address them.

### 10. Delete a folder

Folder delete confirmation invokes `executeDeleteFolder(id)`. The component queries images in the folder, queries their path/URL fields again, derives all storage paths, requests storage removal, and then deletes the `image_folders` row by ID. The repository migration defines the folder-to-image relationship with `ON DELETE CASCADE`, so the intended database result removes child image rows. On success the local folder card disappears.

The folder row deletion and object removal are not one transaction. Deployed foreign key and RLS behavior were not exercised live in this review.

### 11. Resolve private media for display

`src/services/persistence/signed-media.ts` centralizes private rendering. `getSignedMediaUrl()` asks Supabase Storage for a one-hour signed URL, caches it in memory by bucket/path, and treats it as stale five minutes before expiry. Concurrent requests for the same item share an in-flight promise. `getSignedMediaUrls()` deduplicates a batch and omits failed entries.

The cache is presentation state only. `storage://` sentinels and raw paths remain the persistent contract. A signing failure returns an empty string after a console warning rather than throwing to the folder or image loader.

### 12. Open and update the My Images page background

**Change Background** opens `BackgroundPickerModal` with `selectedImageLibraryBackgroundId`, the shared `hubBackgrounds` collection, and handlers from `use-index-background-workspace.ts`.

Selecting Default or a stored background calls `setImageLibraryBackground(userId, id)`. That service first clears `image_library_selected` across the account's `user_backgrounds` rows, then sets it on the chosen owner-filtered row. The hook updates the selected ID after persistence.

**From Device** reads one JPEG, PNG, or WebP; applies the same orientation-dependent `resizeImage(..., 1920, 1080, 0.8)` rule; writes a JPEG to `user_backgrounds_private`; creates a `user_backgrounds` row; and prepends the hydrated background. It does not automatically select the new row.

**From Library** opens `ImageLibraryPickerModal` with destination `user_backgrounds_private`. After the picker returns the copied sentinel, `Index.tsx` creates the `user_backgrounds` row, sets `image_library_selected`, stores the selected ID, and thereby adopts the destination copy as the My Images background.

Overlay changes optimistically update the shared local background row and then update its `overlay_color` and `overlay_opacity` with owner filtering. Background deletion looks up the durable path, removes private or legacy storage, deletes the owner-filtered row, removes it from the shared local collection, and clears only the My Stories selected ID when that ID matches.

### 13. Browse and copy a source for a consumer

`ImageLibraryPickerModal` resets its local folder, image, selection, and signed-URL state each time it opens. It uses the same no-argument folder RPC and `library_images` folder query as the main page, with separate spinners, inline error panels, Retry actions, and empty states.

An image with no `image_path` is disabled as **Migration pending**. For an eligible source, the user selects a tile and confirms. The picker resolves a signed source URL, builds a `LibraryPickerSelection`, and calls `copyLibraryImageTo(selection, destBucket, user.id)`.

`src/services/persistence/library-copy.ts` signs the source path, fetches the private bytes, derives a filename extension, creates a unique destination path under the current user, and uploads without overwrite. For current private destinations it returns both the destination path and a `storage://<destination>/<path>` sentinel, plus a signed preview. The picker returns the persistent sentinel through `onSelect`; if a caller supplies `onSelectWithPath`, it also returns the explicit path object.

The picker prevents a second confirmation while `isCopying`, remains open on thrown copy failure, and reports a toast. It closes after copy success. The destination object now exists before the requesting capability adopts it.

### 14. Destination adoption and handoff ownership

Current source-backed consumers are:

- `StoryCardSection.tsx` uses `CoverImageActionButtons` with destination `story_covers_private`. `use-story-builder-media.ts` parses the returned sentinel, signs the path for immediate preview, resets cover position, and places URL/path into Story Builder editor state. Story Builder persistence owns the later story row.
- `SceneGallerySection.tsx` uses `SceneGalleryActionButtons` with destination `scenes`. The media hook creates a new local `Scene` with its own UUID, destination path, signed preview, and empty tags, then opens the scene editor. Story Builder owns later scenario persistence.
- `CharacterBuilderScreen.tsx` and `CharacterEditorModalScreen.tsx` use `AvatarActionButtons` with destination `character_avatars_private`. They parse the sentinel, sign the destination path, reset focal position, and place the avatar into reusable-library or story-character editor state. The owning character save flow controls later adoption.
- `BackgroundPickerModal` uses destination `user_backgrounds_private`. `Index.tsx` creates and selects the My Stories or My Images page-background row after the copy.
- `SidebarThemeModal` uses destination `sidebar_backgrounds_private`. `ChatInterfaceTab.tsx` creates the sidebar-background record after the copy, and Chat Interface owns later selection and organization.
- `PublicProfileTab.tsx` also renders `AvatarActionButtons`. Its delivered integration is described under Current Implementation Limitations because its follow-up upload path does not consume the returned private sentinel correctly.

These are explicit copies. The source `library_images` row never becomes the destination parent record, and no consumer is expected to keep reading a My Images signed URL.

## State Authority and Conflict Precedence

### Durable library state

Supabase tables and private storage are the intended durable authority. `image_folders` owns folder metadata and the selected thumbnail relationship. `library_images` owns image membership, original filename, title, tags, legacy URL/sentinel, and private path. The private `image_library` object owns the bytes. A successful row without readable bytes and readable bytes without a row are inconsistent partial states, not alternate authorities.

The folder-summary RPC is the authoritative refresh view for folder count and thumbnail metadata. Local `folders` updates make successful mutations visible immediately. A later RPC response supersedes local count, ordering, and thumbnail presentation.

### Local workspace state

`selectedFolder`, `folderImages`, search, signed URL maps, aspect-ratio maps, lightbox state, edit fields, deletion target, and busy/error flags are browser presentation state. They do not grant access or establish persistence. Search filters only the already-loaded folder images. A signed URL map can be discarded and recreated from durable paths.

The current open folder is local navigation state. Refreshing or remounting returns through the folder list; the folder ID is not encoded in the route.

### Background state

`user_backgrounds` rows are durable background objects. `is_selected` is the My Stories page preference; `image_library_selected` is the My Images page preference. The hook's selected IDs and hydrated URLs mirror those fields. A completed backend refresh should supersede optimistic local overlay or selection state.

The same row collection is visible in both page-background pickers. Deleting a row is a shared object deletion; selecting it is page-specific.

### Destination state

After `copyLibraryImageTo()` succeeds, the destination storage object is real even before the consumer's parent state or row adopts it. The consumer's editor state is then the immediate authority for the pending cover, avatar, or scene. The consumer's own save becomes the durable parent authority. My Images cannot infer or certify that later save.

## Responsibility and Ownership Map

`Index.tsx` owns shell composition, tab selection, top-bar wiring, page background presentation, and creation/selection of From Library page-background rows. `ImageLibraryTab.tsx` owns the folder and image workspace, local view state, source mutations, and visible source feedback. `ImageLibraryPickerModal.tsx` owns private source browsing and the copy confirmation state.

`library-copy.ts` owns source-to-destination byte transfer and the returned persistent destination reference. `signed-media.ts` owns temporary private preview credentials. `media-settings.ts` and `use-index-background-workspace.ts` own shared account background persistence and local selection/overlay state.

The requesting capability owns adoption after copy. Story Builder owns covers, scenes, and later publication. Character Library or Story Builder owns a character avatar according to character scope. Public Profile owns its profile avatar. Chat Interface owns sidebar themes. Page-background workspaces own background rows and page selection. Community Gallery owns public presentation only after a publishing workflow supplies public media.

Supabase RLS and storage policies, not these React components, own final authorization. The live hosted project is controlled through Lovable, while the synchronized schema reference is Codex-accessible documentation of the last recorded boundary. The Chronicle Work Manual governs any task that depends on comparing or changing the live state.

## Persistence, Security, and Supabase Boundary

The synchronized reference describes `image_folders` and `library_images` as owner-only tables and `image_library` as private Owner/Admin read with owner write/delete. It describes `user_backgrounds` as owner-only and documents the `image_library_selected` and overlay fields. It also documents private story-cover, character-avatar, user-background, sidebar-background, and scene destinations.

The reference documents the current source-used `library_images` fields, including filename, thumbnail flag, creation time, tags, title, and private image path. It does not list the `get_folders_with_details` RPC that both the main page and consumer picker call. Repository migrations and generated types contain a no-argument function shape, but they are not a substitute for a synchronized live function reference.

The deployed folder-summary query, fallback behavior, function body, RPC grant, and private-media enforcement remain unverified here. The relevant table fields and table or bucket access summaries are documented, but they are not a live comparison. The Chronicle Work Manual governs any later task whose conclusion depends on resolving that boundary.

Most direct image/folder updates and deletes constrain by row ID or folder ID without repeating `user_id` in the browser query. The account ID is present on creates and storage paths. Correct isolation therefore depends on deployed RLS, storage policies, and the auth-bound RPC. Client state, UUID obscurity, and folder filtering are not security mechanisms.

## Diagnostics Versus Enforcement

Inline folder/image error panels, Retry controls, spinners, toast messages, disabled picker migration tiles, and `Copying…` are user-facing diagnostics. Console errors and warnings are developer diagnostics. Neither category proves rollback, row ownership, storage cleanup, or successful destination adoption.

The file input's `accept` value is chooser guidance, not content security. Browser-side resizing and JPEG conversion normalize successfully decoded uploads but do not replace server-side limits, storage authorization, or content validation. The ten-tag maximum is enforced by the current UI; the reviewed synchronized reference does not document a corresponding database constraint.

Final enforcement belongs to authentication, table RLS, storage object policies, foreign keys, RPC execution permissions, and any deployed bucket/file restrictions. None was exercised with a live authenticated mutation in this review.

## Current Implementation Limitations

These are delivered departures or unproven boundaries. They do not redefine the stable behavior in Overview or the control expectations in UI Elements and Functions.

### Folder and image refresh limitations

- `hasLoadedRef` is not reset when `userId` changes while the same `ImageLibraryTab` instance remains mounted. An in-place account change can therefore retain the previous loaded guard instead of automatically requesting the new account's folders.
- Folder summaries initially use the RPC order, while local create prepends a row and local folder/thumbnail edits do not reorder by updated time. Ordering can differ until the next RPC refresh.
- On a first-load failure with no prior data, the main folder page renders its inline folder error and the **Image Library / Create folders to organize your images** empty conclusion together. The open-folder page likewise renders **Image load failed** and **No images yet** together when `folderImages` is empty. The consumer picker has the same overlap for **No folders yet** and **No images in this folder**. Current failure and empty states are therefore not mutually exclusive even though the stable UI contract requires them to be.
- A private signing failure normally returns an empty string and is omitted from the signed map. The folder or image loader therefore completes without an inline signing error, leaving a blank image source or folder placeholder without per-media retry guidance.
- Aspect-ratio collection commits only when successful image loads equal the entire folder-image count. An image error increments the counter but never triggers the completion check, so one failed preview can prevent every ratio in that folder from appearing.
- The search placeholder says **Search by tags...**, but the implementation also matches title and filename. When a nonempty folder has zero filtered matches, the grid is blank because the empty-state check uses unfiltered `folderImages.length`; there is no no-results message or clear-search action.

### Mutation ordering and recovery limitations

- **New Folder** persists a row named **New Folder** before the editor opens. Cancelling the editor leaves that created folder. The create and edit actions have no pending/duplicate guard.
- `FolderEditModal` calls the asynchronous update callback and closes immediately. A failed update is toast-only and the entered fields are no longer available in the modal for retry.
- Upload creates the private object before inserting the `library_images` row. If row insertion or later signing fails, the source object can remain orphaned. The batch stops at the first thrown failure; completed earlier files remain, later files are not attempted, and one general toast does not identify the partial result.
- Although `ImageLibraryTab` sets `isUploading`, that state is not passed to or rendered by the shared top bar. **+ Upload Images** keeps its ordinary label and remains enabled throughout the batch, so the visible trigger provides no progress or duplicate-submission guard.
- The shared resize helper does not enforce a true 1920-by-1080 bounding box. It caps only width for landscape inputs and only height for portrait/square inputs, so the uncapped secondary dimension can remain above the other supplied maximum.
- Folder and image storage removal results are not inspected for errors. The code can proceed to delete database rows after an unsuccessful object-removal request, leaving orphaned private objects.
- Folder delete performs two image queries and then relies on a repository-defined cascade for child rows. Storage removal, folder deletion, and child cleanup are not one atomic operation.
- Title **Save** closes the lightbox after the attempt even when the database update fails, so the unsaved field is lost from view. Tag additions/removals persist immediately and **Cancel** does not roll them back. Title, tag, thumbnail, and delete actions have no per-action busy or duplicate-submission guard. Deletion confirmation closes before asynchronous deletion completes.

### Accessibility limitations

- Folder **Edit**, **Open**, and delete actions and image thumbnail/delete actions are revealed by `group-hover`; keyboard focus on the outer folder card does not apply the same group-hover presentation. The nested actions can be difficult or impossible to discover through keyboard-only use.
- Image previews are clickable `<img>` elements rather than focusable named buttons. The custom **Image Details** overlay is not built as a semantic dialog, does not trap focus, and does not explicitly return focus to the card.
- The My Images settings gear has no accessible name. Main-page and consumer-picker loading spinners have no announced status. The background opacity slider has adjacent visible text but no programmatic label.
- Background color buttons, stored-background tiles, and background delete buttons do not expose meaningful accessible names. Visual selection and image content do not provide equivalent spoken identification.

### Page-background limitations

- Device upload, background selection, deletion, and overlay persistence failures are logged to the console without user-facing recovery. Overlay state changes optimistically and has no rollback.
- Device upload writes the private background object before creating its `user_backgrounds` row. A row-creation failure can leave an orphaned object. Background deletion awaits Storage `remove()` but does not inspect the returned error before deleting the row, so a storage failure can also leave orphaned media.
- Deleting a shared background clears `selectedHubBackgroundId` only when the My Stories selection matches. It does not clear `selectedImageLibraryBackgroundId`; the current My Images selection can remain as a stale ID after its row leaves the local collection.
- The background tile's trash action calls deletion immediately without a confirmation or consequence message, even though the same shared background object can be available in both the My Images and My Stories pickers.
- `Index.tsx` renders a fixed black ten-percent overlay whenever a My Images background URL exists. It does not apply the selected row's stored black/white color and opacity, so the modal's overlay settings are persisted/displayed but do not control the actual My Images page overlay.
- A From Library page-background copy is written before `createUserBackground` and selection. A failure in either later step is console-only and can leave an unreferenced object in `user_backgrounds_private`.

### Consumer-copy and handoff limitations

- Every picker copy uploads the destination object before the consumer adopts it. There is no shared rollback contract if the consumer callback, editor transition, or later parent save fails. Covers, scenes, avatars, page backgrounds, and sidebar themes can therefore leave orphaned destination objects.
- The picker hardcodes `contentType: "image/jpeg"`, while `copyPrivateStorageImageTo()` gives the stored original filename's extension precedence over the fetched blob type. My Images re-encodes every current upload as JPEG but preserves an original `.png` or `.webp` filename in the row, so a destination path can keep that original suffix even though the copied bytes and upload MIME type are JPEG.
- A path-bearing image whose signed thumbnail resolves to an empty string remains an enabled blank tile. The user can select it and encounter failure only during copy.
- `ImageLibraryPickerModal` invokes both `onSelect` and optional `onSelectWithPath` when both are provided. Current reviewed consumers use the single callback, but the component does not enforce one exclusive adoption contract.
- Public Profile renders `AvatarActionButtons` with the picker's `character_avatars_private` destination. The picker returns a private `storage://character_avatars_private/...` sentinel, then `PublicProfileTab.uploadAvatarFromUrl()` passes that sentinel to `compressAndUpload()`, which calls `fetch(imageUrl)` as if it were an ordinary URL. The current My Images-to-Public-Profile path is therefore not a working adopted copy, and its already-created private destination object can be orphaned. Public Profile would need to consume the signed private result correctly or request the appropriate profile destination before this handoff can be claimed live.

### Backend evidence limitations

- The synchronized Supabase reference documents the current `library_images` path/title/tag fields but omits the `get_folders_with_details` RPC. Repository migrations show an intended function and grants, but the live function body, execution grant, storage privacy, and RLS result were not exercised and remain unverified here.
- The main component renders compatible legacy `image_url` rows, while the consumer picker disables rows without `image_path`. Whether all live rows were successfully migrated is not proven by repository source.
- There are no focused runtime tests for `ImageLibraryTab`, `ImageLibraryPickerModal`, `library-copy.ts`, or My Images background behavior. Existing shell, media-settings, and scene-portability tests cover adjacent contracts only. Authenticated grid behavior, multi-file partial failure, storage cleanup, keyboard/focus order, responsive layout, and every mutation branch remain unexercised by the reviewed tests.

## Curated Source and Test Map

### Main UI and shell

- `src/pages/Index.tsx` mounts the internal tab, wires authentication and navigation, connects header callbacks, renders the selected background, and adopts copied page backgrounds.
- `src/components/app-shell/AppSidebar.tsx` owns the delivered **Image Library** navigation entry.
- `src/components/app-shell/AppShellTopBar.tsx` owns Back, title, search, upload, settings, and Change Background.
- `src/components/chronicle/ImageLibraryTab.tsx` owns the folder/image workspace and source mutations.
- `src/components/chronicle/FolderEditModal.tsx`, `DeleteConfirmDialog.tsx`, `AspectRatioUtils.tsx`, and `image-library-types.ts` own supporting UI, consequence text, presentation derivation, and local shapes.

### Picker and destination handoffs

- `src/components/chronicle/ImageLibraryPickerModal.tsx` owns source discovery, migration-disabled rows, selection, copy progress, and failure feedback.
- `src/services/persistence/library-copy.ts` owns private-byte transfer and destination sentinel/path creation.
- `src/components/chronicle/CoverImageActionButtons.tsx`, `SceneGalleryActionButtons.tsx`, and `AvatarActionButtons.tsx` name the destination bucket at current consumer entry points.
- `src/features/story-builder/hooks/use-story-builder-media.ts` adopts cover and scene copies into Story Builder state.
- `src/features/character-builder/CharacterBuilderScreen.tsx` and `src/features/character-editor-modal/CharacterEditorModalScreen.tsx` adopt avatar copies into reusable- and story-character editor state.
- `src/components/account/PublicProfileTab.tsx` contains the current incompatible profile-avatar adoption path.
- `src/components/chronicle/BackgroundPickerModal.tsx`, `SidebarThemeModal.tsx`, and `ChatInterfaceTab.tsx` own page-background and sidebar-theme copy handoffs.

### State, persistence, and backend boundary

- `src/hooks/use-index-authenticated-data.ts`, `use-index-background-workspace.ts`, `use-index-scenario-persistence.ts`, and `use-index-shell-bootstrap.ts` own account bootstrap, background state, leave-builder behavior, and private-tab gating.
- `src/services/persistence/signed-media.ts` owns temporary signed rendering.
- `src/services/persistence/media-settings.ts` and `src/services/supabase-data.ts` expose account-background and related persistence operations.
- `src/integrations/supabase/client.ts` and `types.ts` provide the repository client and generated shapes.
- `src/data/supabase-schema-reference.ts` and its style-guide renderer are the synchronized Codex-accessible reference.
- The listed migrations explain repository intent for folder/image tables, tags, title, page selection, the auth-bound folder RPC, path migration, grants, and private storage. They are reviewed history, not live verification.

### Tests and gaps

- `src/components/app-shell/AppShellTopBar.test.tsx` tests other shared-header branches; it does not currently assert the My Images header controls.
- `src/hooks/use-index-shell-bootstrap.test.ts` verifies query-target behavior but does not exercise the signed-out private-tab effect.
- `src/services/persistence/media-settings.test.ts` verifies story UI-settings persistence, not My Images background selection or overlay.
- `src/services/persistence/scene-media-portability.test.ts` verifies separate scene portability logic and mocks the copy layer; it does not test the picker or source-to-destination copy.
- The capability-specific Knowledge tests verify manifest parsing, raw headings, substantive stable sections, exact seven-tab rendering, application-map content, shared Supabase directions, source-path existence/composite, capability-local Issue isolation, an explicit empty Current Work state, and three positively mapped historical Changelog records. **MI-ISSUE-001** tracks misleading load/search/media states; **MI-ISSUE-002** tracks mutation, storage, background, and consumer-copy durability. No active Current Work or modern accepted closeout is currently registered for My Images. The mapped Image Library history remains historical rather than modern product acceptance. These checks do not substitute for product runtime tests.

## Reproducible Inspected-Source Composite

### Exact ordered source paths

The architecture review inspected these **47 existing paths** in this exact order:

```text
src/pages/Index.tsx
src/components/app-shell/AppSidebar.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/chronicle/ImageLibraryTab.tsx
src/components/chronicle/ImageLibraryPickerModal.tsx
src/components/chronicle/image-library-types.ts
src/components/chronicle/AspectRatioUtils.tsx
src/components/chronicle/FolderEditModal.tsx
src/components/chronicle/DeleteConfirmDialog.tsx
src/components/chronicle/BackgroundPickerModal.tsx
src/components/chronicle/SidebarThemeModal.tsx
src/components/chronicle/ChatInterfaceTab.tsx
src/components/chronicle/CoverImageActionButtons.tsx
src/components/chronicle/AvatarActionButtons.tsx
src/components/chronicle/SceneGalleryActionButtons.tsx
src/components/account/PublicProfileTab.tsx
src/features/character-builder/CharacterBuilderScreen.tsx
src/features/character-editor-modal/CharacterEditorModalScreen.tsx
src/features/story-builder/components/StoryCardSection.tsx
src/features/story-builder/components/SceneGallerySection.tsx
src/features/story-builder/hooks/use-story-builder-media.ts
src/hooks/use-index-background-workspace.ts
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-scenario-persistence.ts
src/hooks/use-index-shell-bootstrap.ts
src/services/persistence/library-copy.ts
src/services/persistence/signed-media.ts
src/services/persistence/media-settings.ts
src/services/supabase-data.ts
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts
src/types.ts
src/utils.ts
src/data/supabase-schema-reference.ts
src/pages/style-guide/supabase-schema-reference.tsx
src/components/app-shell/AppShellTopBar.test.tsx
src/hooks/use-index-shell-bootstrap.test.ts
src/services/persistence/media-settings.test.ts
src/services/persistence/scene-media-portability.test.ts
supabase/migrations/20260129061559_3948ce7f-b8a5-4dfc-ba48-56532095fddc.sql
supabase/migrations/20260130062817_ebd86fbe-b9bf-459f-8ee4-9230846ec25c.sql
supabase/migrations/20260222103645_953330a9-6de4-4561-9f0b-b0b45e36924e.sql
supabase/migrations/20260222104504_81e975a3-b584-4285-bb63-8469556d8c1c.sql
supabase/migrations/20260319101104_4acf529e-0767-4378-9a4c-0eedb0272076.sql
supabase/migrations/20260319194000_9b1b2e0d-3a08-47e4-bedd-0f96f3d8a1cb.sql
supabase/migrations/20260614100327_b44457a0-db46-4327-b4cd-f89faf0a2d59.sql
supabase/migrations/20260614101828_f8eaf601-dbab-46e4-9c6e-bac43faad060.sql
```

### Composite algorithm and value

For each path in order, calculate the lowercase SHA-256 digest of its raw file bytes and append one line in this exact form, including the two spaces and trailing newline:

```text
<file-sha256>  <relative-path>\n
```

Concatenate the 47 lines without sorting them again, then calculate the SHA-256 digest of that UTF-8 listing.

Inspected-source composite SHA-256: `3e6495239a496e6dd1b6b27082ace9604fa81156c55eae08d6bcdae22e3a6bfa`.

This composite proves which repository bytes were reviewed. It does not prove the deployed Supabase state, a successful mutation, responsive presentation, or authenticated live behavior.

## Evidence Limits and Next Verification

Source review confirms the current React branches, local state changes, query construction, persistence order, destination names, and error propagation described above. Signed-out inspection confirms the runtime label and authentication boundary. The synchronized reference confirms its documented table fields and storage access summaries while exposing the absence of the current folder-summary RPC.

Still unverified are the authenticated My Images layout and focus order; responsive grids; live folder/image/background rows; deployed RLS, storage policies, buckets, and RPC grants; successful upload/copy/delete mutations; legacy migration completeness; storage cleanup on partial failure; and consumer adoption after destination copy. The Chronicle Work Manual governs the scope and evidence for any later task that resolves these unknowns; this capability manual does not prescribe that future procedure.
