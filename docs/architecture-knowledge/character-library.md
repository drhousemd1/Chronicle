# Overview

## Character Library at a Glance

### The reusable character workspace for one account

Character Library is Chronicle's private workspace for character profiles that are meant to be reused across stories. A library character belongs to the signed-in account rather than to one story. The workspace lets the user find an existing profile, create a new one, revise its identity and roleplay details, manage its avatar, use AI-assisted authoring, and remove a profile that is no longer wanted.

The page is delivered inside Chronicle's main application shell at `/`. It is an internal application tab rather than a standalone browser route. The sidebar exposes **Character Library**, but the collection is private: selecting that destination while signed out opens Chronicle's authentication interface instead of loading library records. Once the user is authenticated, the Character Library header and character grid share the application shell with My Stories, My Images, Story Builder, Chat History, and Chat Interface.

Character Library is not a story cast and it is not a live-play roster. It stores reusable source profiles. Character Builder owns the shared profile-editing interface used inside this workspace. Story Builder owns the cast copied into a particular story. Chat Interface consumes the story's characters and its own playthrough state after a story begins. A library character therefore becomes part of a story only through an explicit copy handoff; opening or updating the library does not silently change an existing story or conversation.

### What a successful visit accomplishes

A successful Character Library visit lets the user understand which reusable profiles belong to the account, locate a profile by meaningful authored details, inspect its card, edit the profile through organized character sections, and deliberately persist or discard the work. The user can also create a blank profile, add or replace an avatar, choose an existing image from My Images, generate an avatar, use AI to fill empty profile fields, enhance individual fields, add custom content, and permanently delete a library profile after confirmation.

Those actions have different consequences. Opening a card begins an edit session but does not itself write to Supabase. Typing in the editor changes the current in-memory profile. **Update Character** is the explicit library save action. **Cancel** discards the current edit session, including removing a new profile that has never been saved. Deleting a library profile removes that reusable source; it must not delete independent copies already owned by stories. Choosing a My Images item for an avatar copies the media into the character-avatar destination rather than making the library profile depend on an expiring My Images presentation URL.

## Ownership, Reuse, and Lifecycle

### Library profiles and story characters have different owners

A library profile is represented by a `characters` record marked `is_library = true`, owned by the authenticated `user_id`, and not assigned to a story. A story character is represented by a separate character record assigned to that story. Both use the same Character data shape and the same shared Character Builder interface, but their parentage and persistence operations are different.

The practical rule is copy independence. Importing a library profile into Story Builder should create a story-owned character with a separate identity. Later Story Builder edits should affect only that story character. Saving a story character into Character Library should create a separate reusable profile; later library edits should not rewrite the story. Repeating an update to a story character's already-created library copy may update that known library copy, but it must not change the story character's ownership or parent story.

Character Library is therefore an upstream source of reusable profile material, not a shared live object synchronized into every consumer. This prevents one change to clothing, goals, secrets, relationships, avatar, or control assignment from unexpectedly rewriting multiple stories or saved playthroughs.

### Creation starts locally and becomes durable only after update

Selecting **New Character** creates a default profile named `New Character`, gives it a new identifier, places it at the front of the current in-memory library, and opens the editor. The name field is presented as empty so the user can replace the default label. The new profile is not durable merely because the editor is visible.

While the profile remains unsaved, **Cancel** removes it from the current library and returns to the grid. **Update Character** persists the profile as an account-owned library record and keeps the editor open. After a successful update, the profile is no longer treated as an unsaved new item. Reloading or returning to the collection should show only the last successfully persisted version.

### Existing profiles use an explicit edit boundary

Selecting an existing card opens that profile in the shared Character Builder. Chronicle retains a snapshot of the profile at the beginning of the edit session. Field changes update the in-memory library profile so the editor and its completion indicators can respond immediately. **Update Character** writes the current profile to the library record. **Cancel** restores the opening snapshot and returns to the grid.

The header also provides a **Back** control for returning to the grid. Back is navigation, not proof of persistence. The user must not be led to believe that leaving the editor has saved changes unless **Update Character** has completed successfully. Unsaved working state must either be preserved as explicitly unsaved or deliberately discarded through a clear recovery action.

### Deletion removes the reusable source, not its independent consumers

The delete action on a library card opens a destructive confirmation explaining that the character will be permanently removed from the Global Library. Cancel leaves the record unchanged. Confirm requests deletion of the library record and, after success, removes the card from the current collection.

Deleting a library profile must not delete a story-owned copy or a conversation's independent state. A story or playthrough that already received a proper copy continues under the ownership of Story Builder, Chat Interface, and Chat History. Media cleanup and other implementation details are architecture responsibilities; the visible contract is that the selected reusable source is removed only after confirmed success and a failed request is not presented as a successful deletion.

## Finding and Understanding a Profile

### Search narrows the loaded account collection

When no profile is selected, the Character Library header contains **Search characters...**. Search is case-insensitive and works against the already-loaded library. It can match name, nicknames, role description, comma-separated tags, physical appearance, current outfit, preferred clothing, and the titles, labels, or values of custom sections.

Search does not issue a new server request and does not change ownership or saved data. Clearing the query restores the loaded collection. A query with no matches still keeps **New Character** available so the user can create a profile without first clearing search. The result view should make a confirmed no-match state distinct from a library that has not finished loading or failed to load.

### Cards summarize identity and role without replacing the editor

Each profile appears as a tall card. The card shows the avatar with its stored focal position when available, or the first character of the name as a fallback. It can show up to two stored tags, a **Main Character** or **Side Character** badge, the profile name, and either the role description, the first custom section's first item value when present, or **No description available.**

Selecting the card body opens the profile editor. The card's delete action is separate and must not open the editor before the confirmation. Cards are summaries; the editor remains the authority for the full profile. Stored tags can participate in the card summary and search without changing the meaning of the other profile fields.

## Authoring a Reusable Character

### Basics establishes identity, control, role, and avatar

The **Basics** section covers the profile's avatar, name, nicknames, age, sex or identity, sexual orientation, control assignment, main-or-side role, location, and role description. **Controlled By** distinguishes a character the AI runs from one the user runs. **Character Role** distinguishes a main cast member from a side cast member. Those settings are part of the reusable profile, but a story and later playthrough may establish their own copied or session-scoped state.

The avatar can be absent, uploaded from the current device, copied from My Images, or generated through the avatar-generation flow. When an avatar exists, the user can reposition its focal point or request its removal. Avatar selection and positioning update the current edit session; the profile update remains the durable save boundary.

### Built-in sections organize roleplay-relevant details

The sidebar presents the built-in sections in a stable order:

1. **Basics**
2. **Physical Appearance**
3. **Currently Wearing**
4. **Preferred Clothing**
5. **Personality**
6. **Tone**
7. **Background**
8. **Key Life Events**
9. **Relationships**
10. **Secrets**
11. **Fears**
12. **Character Goals**

Physical Appearance covers hair color, eye color, build, body hair, height, breasts, genitalia, skin tone, makeup, body markings, temporary conditions, and optional extra rows. Currently Wearing covers the current top, bottoms, undergarments, miscellaneous items, and extras. Preferred Clothing covers casual, work, sleep, undergarment, miscellaneous preferences, and extras.

Background has named fields for occupation, education, residence, hobbies, financial status, and motivation. Tone, Key Life Events, Relationships, Secrets, and Fears use extensible label-and-description rows. Each section can be collapsed into a readable summary. The sidebar's progress indicators summarize whether the section's expected fields contain meaningful content; they are authoring aids, not validation gates and not proof that a profile is ready for every story.

### Personality and goals provide structured behavior guidance

Personality can use **Standard** mode for one list of traits or **Split** mode for separate outward and inward traits. Each trait has a label, a description, and a flexibility value of **Rigid**, **Normal**, or **Flexible**. Changing between modes carries meaningful existing traits forward so the user does not have to reconstruct them solely because the presentation changed.

Character Goals stores one or more goals with a name, desired outcome, guidance strength, progress, and ordered steps. Completing a step updates the displayed progress. The first displayed goal is protected from deletion while additional goals can be removed. Goals and steps are profile data for downstream roleplay guidance; checking a step in Character Library is an authored profile change and does not claim that a live conversation independently reached that outcome.

### Custom Content extends the profile without changing the built-in contract

**Custom Content** opens a choice between **Structured** and **Freeform**. A structured section contains editable label-and-description rows. A freeform section contains open text fields. In either form, the user can rename the section, collapse it, remove it, add content rows where supported, and use the same explicit profile update boundary as the built-in sections.

Custom sections travel with a correctly copied character because they are part of the Character profile. They do not create a new application capability, database table, or cross-character synchronization rule.

## AI and Media Workflows

### AI Fill works on the current profile edit session

**AI Fill** opens a dialog that accepts an optional character description and a checked-by-default option to use all details already present in the character card. Its stated purpose is to fill currently empty character fields while respecting the supplied guidance and existing profile. During processing, the header action and dialog submit action show a busy state and prevent a duplicate submission.

AI output updates the current in-memory profile. It does not bypass **Update Character**. Cancel closes the prompt without changing the character, and a failed or empty AI result should leave authored values intact, explain that no update completed, and allow a safe retry.

### Field enhancement offers concise or detailed help

Eligible profile fields include a sparkle action. Selecting it opens **Enhancement Style** with **Precise** and **Detailed** choices. Precise requests short, semicolon-separated attributes; Detailed requests a brief vivid description. The selected field shows processing feedback while the request is active. A successful response replaces only that field or completes the requested label-and-description pair. A failed response produces visible error feedback and must not erase the existing field.

### Avatar generation is a separate media request

**AI Generate** in the avatar area opens **Generate Avatar**. The dialog accepts a required appearance prompt, can build a suggested prompt from available character identity, appearance, and current-clothing data, offers an optional negative prompt, and lets the user choose an art style. Generate remains unavailable until the prompt contains text. A successful request returns an avatar preview and durable private media path to the current edit session, resets the crop position, enters reposition mode, and closes the dialog. The character record itself still requires **Update Character**.

Generation failure remains in the dialog with an error message so the user can correct the prompt, change style, or retry. Diagnostic and usage records associated with the AI request are observability evidence; they are not the mechanism that saves the character or enforces access.

### Device upload and My Images have different source paths

**Upload Image** opens a menu with **From Device** and **From Library**. From Device accepts an image, resizes it for the avatar workflow, uploads it into the account's private character-avatar destination, and opens reposition mode after a successful preview update.

From Library opens the My Images picker. The user chooses a folder, chooses an eligible image, and confirms **Select Image**. Chronicle copies the selected private My Images object into the character-avatar destination before returning it to the character editor. The source library item remains owned by My Images; the copied avatar media and profile reference belong to the character workflow. A missing legacy image path is not selectable and explains that the image must be re-uploaded.

## Access, Privacy, and Permission Boundaries

### Authentication supplies the account boundary

Character Library requires an authenticated Chronicle user. The library read is scoped to the current account and to records marked as library profiles. Save and insert payloads carry the current account identifier, use no story parent, and set the library flag. Delete is limited to a library row and relies on the backend owner boundary as final enforcement.

The client filters and flags are useful request constraints, not security by themselves. The synchronized Supabase reference describes the documented `characters` table and private media boundaries; it is not live-deployment proof. App Architecture identifies the exact repository requests and reference limits. Live enforcement beyond those sources remains unverified here, and the Chronicle Work Manual governs whether a later task requires a live comparison.

### Private adult material remains first-class profile data

A character profile can contain names, sexual identity, sexual orientation, physical and genital detail, clothing, relationships, secrets, fears, goals, and other adult or NSFW roleplay material. Character Library must treat that information as private account-owned content unless the user deliberately copies the profile into a story that later has its own visibility lifecycle.

The `characters` table also stores story-bound characters that may be readable through a visible publication. That broader table capability does not turn a scenario-less library row into public content. The user-facing library contract is owner-private. The private `character_avatars_private` destination uses signed presentation URLs while the durable profile stores a media path or storage sentinel. A signed URL is temporary display data and must never become the ownership boundary.

### Shared configuration does not grant shared edit rights

Character Library uses shared model selection, art-style presentation, Character Builder section definitions, and application navigation assets. Those dependencies can affect what controls or choices appear, but they do not grant another user access to the profile. Administrative configuration and AI diagnostics remain separate from ordinary character ownership.

## Loading, Empty, Failure, and Recovery Expectations

### Unknown, empty, and filtered-empty are different states

The authenticated application loads the Character Library alongside other account data. While the library request is unresolved, the workspace should communicate that results are loading rather than showing a confirmed empty collection. Only a successful response with no library records is an empty library. In that state, **New Character** remains available and the page should explain that no reusable profiles exist yet.

A search with no matches is a filtered-empty state, not an empty account. It should preserve the query, keep New Character available, and let the user clear or revise search. A failed or timed-out library request must not be silently presented as either empty state. It should keep the account and query context, explain that the collection could not be loaded, and provide a retry that repeats the owner-scoped request.

### Local edits must not be mistaken for durable state

Opening a profile and editing fields produces local working state. **Update Character** should show progress, prevent duplicate writes, and report success only after the library row has been saved. If the write fails, the editor should retain the unsaved values, identify that they are still unsaved, and allow retry or deliberate cancellation. Cancel should restore the opening snapshot; leaving the page should not manufacture a success state.

Avatar upload, My Images copy, avatar generation, AI Fill, and field enhancement each have their own request boundary. Failure in one request must not overwrite the last confirmed profile. Where a media object was created before the character save, the UI must make the unsaved relationship clear and the architecture must define eventual cleanup.

### Destructive actions complete only after confirmation and success

Delete requires a confirmation that names the library consequence. The confirming action should remain busy or otherwise guarded while deletion is active. The card should disappear only after the backend confirms removal. Failure should preserve the card, explain that the character remains in the library, and allow retry without reopening the profile.

These are stable recovery expectations. Current places where the delivered page falls short are consolidated under **App Architecture → Current Implementation Limitations** so agents do not mistake defects for approved product behavior.

## Handoffs to the Rest of Chronicle

### Character Builder owns profile authoring

Character Library owns the account collection, search, selection, library lifecycle, and the decision to reuse a profile. Character Builder owns the visible fields, section navigation, completion indicators, custom content, avatar editing, goal editing, personality editing, and AI-assisted field work. The same builder can be embedded in a story, but the caller decides whether edits target the library array or a story cast.

### Story Builder receives and produces independent copies

Inside Story Builder's character area, **Import from Library** opens a Character Library picker. The picker lists owner-scoped profile summaries and loads the selected full profile. The handoff must create a story-owned character with its own identity before the story is persisted. From that point, Story Builder owns later edits and story save behavior.

The reverse handoff begins from a story character. **+ Character Library** creates a new reusable profile with a new library identifier. If that specific story character already has a known library copy, the action can update that copy. In both directions, later changes remain independent.

### My Images supplies reusable media before an explicit copy

My Images owns private folders and reusable source images. Character Library can browse those sources for an avatar, but selecting one copies the media into the character-avatar destination. My Images does not become responsible for the character's crop, profile save, or later avatar replacement.

### Chat Interface and Chat History do not read the library as live state

Chat Interface receives characters from the selected story and can create conversation-scoped character state. Chat History returns to a saved conversation and its story source. Neither capability should continuously read the reusable Character Library and apply later library edits to an existing playthrough. A user who wants a revised library profile in a story must make a deliberate Story Builder change under that story's ownership.

### Community Gallery and My Stories remain story-level capabilities

Community Gallery publishes and presents stories, not standalone library profiles. My Stories organizes owned, draft, published, and saved stories, not reusable characters. A library profile can influence those capabilities only after it has been copied into a story. Public Profile likewise presents creator identity and published works rather than exposing the private Character Library.

# UI Elements and Functions

## Workspace Entry and Page Header

### Character Library in the application shell

**Character Library** appears in Chronicle's left navigation with a library icon. Selecting it while authenticated opens the account's reusable character collection in the main content area. Selecting it while signed out invokes Chronicle's sign-in interface; the private collection is not shown behind a guest shell.

The page uses two visible header states. The collection state shows the **Character Library** title and a **Search characters...** field. The editor state adds a left-facing **Back** control, keeps the Character Library title, removes the collection search field, and places character-editing actions on the right. Character Library does not expose story import, story export, or a separate grid-level save action in this header.

### Search characters

**Search characters...** narrows the character cards already loaded for the signed-in account. It matches without regard to letter case. Searchable material includes the character name, nicknames, role description, stored comma-separated tags, physical-appearance values, current-clothing values, preferred-clothing values, and custom-section titles, labels, and values.

Typing does not save a profile or issue a new character query. Clearing the field restores the loaded set. When the query matches no profile, the result area is a filtered-empty view: the query remains available for revision and the **New Character** tile remains usable.

### Editor header actions

When a profile is open, the right side of the header contains these controls:

- **AI Fill** opens the bulk character-assistance dialog. While the request is active, its label becomes **Filling...** and a duplicate request is unavailable.
- **Cancel** abandons the current edit session, restores the profile's opening snapshot when editing an existing record, or removes a newly created unsaved profile, then returns to the collection.
- **Update Character** is the library's explicit durable-save action. While the request is active, its label becomes **Saving...** and a duplicate update is unavailable. A completed update keeps the profile open.

**Back** returns to the collection, but it is a navigation control rather than a save confirmation. The page must keep the difference between unsaved working state and a completed **Update Character** clear. Unlike the Story Builder embedding of the same editor, Character Library does not show the ordinary story **Save** action or **+ Character Library** copy action.

## Collection Grid and Character Cards

### Responsive card grid

The collection is displayed as a responsive grid that grows from one column on narrow screens to as many as five columns on large screens. Every loaded library profile receives one tall portrait card, followed by a dashed **New Character** tile. The new-character tile stays present even when search has no matches, so creation is not dependent on the filter state.

Selecting **New Character** creates a new in-memory profile and opens its editor. The editor initially treats the internal `New Character` label as an empty **Name** field so the user can provide the intended identity. The profile does not become durable until **Update Character** succeeds.

### Card image and fallback

A card with an avatar fills the portrait area with that image and applies the profile's saved horizontal and vertical focal position. A card without an avatar shows the first character of its name, or a question mark when no usable first character exists. The image alt text uses the character name.

The card body is the profile-opening control. It can be activated by pointer, **Enter**, or **Space**, and its accessible name identifies the character being opened. Opening the card selects that profile for editing; it does not write the profile or invoke Story Builder.

### Card identity summary

The lower card overlay can show up to two comma-separated stored tags. It also displays either **Main Character** or **Side Character** according to the reusable profile's role setting. Below the badges, the card shows the character name, falling back to **Unnamed** when needed.

The descriptive line uses the role description when one is present. If it is absent, the card can use the first custom section's first item value. If neither source supplies text, it shows **No description available.** The card is a quick collection summary; all authored fields remain available only after the user opens the full editor.

### Card delete action and confirmation

The trash action belongs to the card but is separate from the card-opening action. Selecting it must open the destructive confirmation without also opening the editor. The dialog asks whether the user is sure and states: **This will permanently delete the character from your Global Library.**

**Cancel** closes the confirmation and preserves the profile. **Delete** requests removal of the selected account-owned library record. The confirmation action should expose in-progress state or otherwise block duplicates until the request resolves. The card disappears only after a successful deletion. Failure must leave the character visible, explain that it was not deleted, and permit a safe retry.

## Character Editor Frame and Section Navigation

### Profile summary rail

Opening a profile replaces the grid with Character Builder's editor. On large screens it uses a left navigation rail and a right scrolling content pane; on narrower screens the rail sits above the content pane and has its own bounded scrolling area.

At the top of the rail, a portrait tile repeats the current avatar or initial fallback. It shows the current name, using **Unnamed Character** when necessary, and an **AI** or **User** badge for the current control assignment. These values react to the in-memory edit session and do not by themselves prove that the library record has been updated.

### Ordered section buttons and completion rings

The navigation rail presents these authoring sections in order: **Basics**, **Physical Appearance**, **Currently Wearing**, **Preferred Clothing**, **Personality**, **Tone**, **Background**, **Key Life Events**, **Relationships**, **Secrets**, **Fears**, and **Character Goals**. Existing custom sections follow the built-in entries, and **Custom Content** begins the flow for adding another one.

Each section button includes an icon, label, and circular completion indicator calculated from the profile's currently populated values. A zero-completion ring shows an empty centre; a partially complete ring shows a percentage; a complete ring uses a check mark. The ring is an authoring summary, not a required-field validator and not a durable-save indicator.

Selecting a section changes the right pane to that one section. The section can also be collapsed to a read-only summary and expanded again for editing. Navigation between sections preserves the current in-memory edits. It does not independently save, cancel, or submit the character.

## Basics and Avatar Controls

### Identity and role fields

**Basics** contains these visible profile controls:

- **Name** and **Nicknames** describe the reusable identity.
- **Age**, **Sex / Identity**, and **Sexual Orientation** accept authored text rather than enforcing a predefined list.
- **Controlled By** is a two-option control for **AI** or **User**.
- **Character Role** is a two-option control for **Main** or **Side**.
- **Location** stores the character's current or customary authored location.
- **Role Description** supplies the card's preferred description and concise role guidance.

Typing changes the current profile immediately in the editor. The fields do not persist independently. The sparkle beside **Role Description** opens the same field-enhancement choice used throughout the builder.

### Empty-avatar actions

When no avatar preview is available, the avatar area offers **Upload Image** and **AI Generate**. **Upload Image** opens a source menu with **From Device** and **From Library**.

**From Device** opens the operating system's image chooser. After the user chooses an image, Chronicle preserves its aspect ratio while fitting it within a 512-by-512 boundary, encodes it as JPEG, uploads it to the private character-avatar destination, updates the editor preview, resets the focal position to centre, and enters reposition mode. The character row still requires **Update Character**. During upload, the upload control shows **Uploading...** and should prevent another selection from starting on the same profile.

**From Library** opens the My Images picker described below. It copies an eligible private source image into the character-avatar destination before the character editor adopts it. Closing the source menu or its picker without a successful selection leaves the current avatar state unchanged.

### Existing-avatar actions and repositioning

When an avatar exists, a pencil action opens a menu with **Reposition image** and **Delete image**. Repositioning lets the user drag the image within the circular crop so the desired focal point is visible. **Done** exits reposition mode while preserving that focal position in the current edit session.

**Delete image** requests removal of the avatar reference from the current profile edit. It does not delete the whole character. The empty-avatar actions return so the user can upload, copy, or generate a replacement. The durable character change remains subject to **Update Character**; architecture owns the separate question of unused media-object cleanup.

### My Images picker

The **From Library** picker first shows private My Images folders as cards. A folder card can include a cover image, image-count badge, name, and description. Folder loading has a spinner, an explicit load-error message with **Retry**, and an empty-folders state. Selecting a folder moves to its image grid and provides a way back to the folder list.

The image view has its own loading spinner, explicit **Image load failed:** message with **Retry**, and **No images in this folder** state. Eligible images can be selected and show a check indicator. A legacy record without a usable storage path is disabled, shows **Migration pending**, and explains through its title that re-upload is required.

The picker footer contains **Cancel** and **Select Image**. Select remains disabled until an eligible image is chosen. During the copy, it reads **Copying…** and both exit and duplicate-selection actions are guarded. Success closes the picker, displays the copied avatar in reposition mode, and leaves the profile itself unsaved until **Update Character**. A copy failure keeps the picker open, supplies visible error feedback, and preserves the last confirmed avatar.

## Built-in Detail Sections

### Fixed labels, editable values, and extra rows

Most built-in detail sections use fixed Chronicle labels. A lock icon identifies those labels as part of the shared Character schema while the text values remain editable. Eligible rows include a sparkle action for AI enhancement. **Add Row** appends an extra row whose label and value are both editable; its remove action deletes only that extra row from the current edit session.

Each built-in section has an expand-or-collapse control. Expanded mode shows editable rows. Collapsed mode summarizes populated values and uses **Untitled** for an extra row whose label is empty. A collapsed summary is a compact reading view, not a submitted or read-only profile state.

### Physical Appearance

**Physical Appearance** provides fixed rows for **Hair Color**, **Eye Color**, **Build**, **Body Hair**, **Height**, **Breasts**, **Genitalia**, **Skin Tone**, **Makeup**, **Body Markings**, and **Temporary Conditions**. **Add Row** supports additional physical traits that do not fit those labels.

These values are reusable authored description. They can guide avatar prompt construction and downstream roleplay after a correct story copy, but they do not directly modify an already generated avatar or an existing story character.

### Currently Wearing and Preferred Clothing

**Currently Wearing** provides **Shirt/Top**, **Pants/Bottoms**, **Undergarments**, and **Miscellaneous**, plus extra rows. It describes the profile's authored present outfit.

**Preferred Clothing** provides **Casual**, **Work**, **Sleep**, **Undergarments**, and **Miscellaneous**, plus extra rows. It describes broader wardrobe preferences rather than the currently worn outfit. The two sections remain separate so Story Builder and roleplay can distinguish a current state from a preference.

### Background and extensible narrative sections

**Background** provides fixed rows for **Job / Occupation**, **Education Level**, **Residence**, **Hobbies**, **Financial Status**, and **Motivation**, plus extra rows.

**Tone**, **Key Life Events**, **Relationships**, **Secrets**, and **Fears** use extensible label-and-value rows rather than their own fixed field lists. Their section name supplies the category; the user names each entry and describes it. Rows can be added, enhanced, and removed within the current edit session.

## Personality and Character Goals

### Personality mode and traits

**Personality** has an expand-or-collapse control and a two-mode presentation. **Standard** manages one trait collection. **Split** distinguishes outward traits from inward traits. Switching modes carries meaningful existing trait content into the newly selected representation rather than clearing the section.

Each trait contains an editable label, editable description, and a flexibility choice of **Rigid**, **Normal**, or **Flexible**. **Add Trait** appends a new trait in the active group, and the row's delete action removes that trait from the current edit session. Sparkle actions can enhance the trait content. Collapsed mode summarizes the authored traits without changing them.

### Goal cards and progress

**Character Goals** displays one or more goal cards. A goal includes **Goal Name**, **Desired Outcome**, a **Guidance Strength** slider, a progress ring, and an ordered step list. The guidance setting expresses how strongly the goal should influence downstream behavior. It is authoring guidance, not a live completion engine.

Each step has a completion checkbox, a description, and controls to enhance or remove it. **Add Step** appends a step to that goal. Marking a step complete recalculates the displayed goal progress in the current profile. **Add New Goal** creates an additional goal. The first goal is protected from deletion; later goals expose a delete action. Collapsing the section summarizes goal names, desired outcomes, and progress.

Goal editing does not assert that a conversation reached the goal. The library stores reusable profile guidance. Chat Interface owns conversation-scoped progress after the character has been copied into a story and play has begun.

## Custom Content

### Choosing a section type

**Custom Content** opens a chooser for **Structured** or **Freeform** content. Choosing either option creates a new custom section, selects it in the navigation rail, and opens it for editing. Closing the chooser without a selection creates nothing.

Both section types have an editable title, an expand-or-collapse control, and a delete action for removing the entire custom section from the current profile. Their navigation entries participate in the same completion display and section-selection behavior as the built-in categories.

### Structured sections

A structured section contains label-and-value rows. Both parts are editable. A sparkle action can enhance the row, the row delete action removes it, and **Add Row** appends another structured item. Collapsed mode presents each populated label and value as a readable summary.

### Freeform sections

A freeform section contains open text fields for longer unstructured material. **Add Text Field** appends another field, and a field remove action deletes it from the current edit session. Collapsed mode displays the authored text without turning it into structured labels.

Custom Content is stored inside the character profile and follows a correct independent copy into Story Builder. It does not establish a new shared object or a link that synchronizes later edits between library and story copies.

## AI Assistance Dialogs and Feedback

### AI Fill Character

Selecting **AI Fill** opens **AI Fill Character**. The dialog contains **Character Description (Optional)** for additional direction and **Use all details currently in character card**, which is checked by default. Its explanatory copy says that the checked mode heavily considers existing character information for consistency, while the unchecked mode focuses primarily on the supplied prompt.

The footer contains **Cancel** and **Fill Empty Fields**. Cancel closes the dialog without applying a result. Submitting changes the action to **Processing...** and guards the dialog until the request finishes. A successful response fills eligible empty fields in the current in-memory profile while preserving deliberately authored values. It does not save the character. A failed or empty response must identify that no update completed, preserve the current profile, and permit retry.

### Enhancement Style

Selecting an eligible field's sparkle action opens **Enhancement Style**. **Precise** requests a concise attribute-oriented result. **Detailed** requests a short vivid description. Choosing a mode starts the request for the field that opened the dialog; closing the dialog makes no change.

The active field exposes processing feedback until the request resolves. Success updates only that target field or row. Failure uses visible error feedback and preserves the existing content. Enhancement does not trigger **Update Character** or modify another library profile.

### Generate Avatar

Selecting **AI Generate** opens **Generate Avatar**. The required **Prompt** field asks for the desired appearance and is accompanied by a tip to include details such as physical features, clothing, and expression. When the current profile has usable appearance data, **Use Character Data** assembles those details into the prompt for further editing.

**Negative Prompt (optional)** expands a field for details to avoid. **Style** displays selectable art-style cards with thumbnail, name, and a selection indicator. The footer contains **Cancel** and **Generate Avatar**. Generate is disabled while the prompt is empty. During the request it reads **Generating...**, and Cancel is unavailable.

A request error appears inside the dialog so the user can revise the prompt, negative prompt, or style and retry. Success adopts the generated preview and private media path, recentres the avatar, enters reposition mode, clears the completed prompt controls, and closes the dialog. The character profile still requires **Update Character**.

## Loading, Empty, Error, and Accessibility States

### Collection-level states

Character Library needs three visibly distinct collection outcomes. **Loading** means the owner-scoped request has not resolved. **Empty library** means that request succeeded and returned no reusable profiles. **No search matches** means a loaded collection was filtered by the current query. Empty and no-match views keep **New Character** available, but only the no-match view retains a query to clear.

A failed or timed-out collection request is neither empty outcome. The page must identify the load failure and offer a retry that repeats the authenticated library request. Retry should retain the user's destination and must not manufacture records from stale story or guest data.

### Action-level progress and recovery

Update, delete, device upload, My Images copy, avatar generation, AI Fill, and field enhancement are separate asynchronous actions. Each must identify its active state, prevent a duplicate action that could create conflicting writes or media copies, and report failure close to the affected control. Failed profile updates preserve unsaved authored values. Failed delete preserves the card. Failed media or AI actions preserve the last confirmed profile state.

Visible success must correspond to the action that actually completed. A generated avatar preview proves a media result, not a saved character. A completed character update proves the profile row was written, not that the profile was copied into a story. A section completion ring proves only that expected fields contain text.

### Keyboard and assistive-technology expectations

The card-opening surface, New Character tile, section buttons, text inputs, segmented choices, expand-or-collapse controls, avatar menus, dialog actions, sparkle actions, row removals, and destructive delete action are meaningful controls. Each must have a keyboard-reachable activation path, a name that explains its consequence, and a visible focus state. Icon-only buttons need an accessible name rather than relying on shape, hover state, or a mouse-only title.

Dialogs must announce their title, contain focus while open, return focus to the initiating control when closed, and keep busy or disabled state perceivable. Progress rings and image-selection indicators require equivalent text or accessible labels. Avatar previews and art-style thumbnails use meaningful alternative text; decorative gradients, locks, and icons remain hidden from assistive technology when their adjacent label already supplies the meaning.

## Consequences and Capability Boundaries

### What the page changes

Character Library can change the current account's reusable character rows, private character-avatar references, and unsaved in-memory edit state. It can request AI-generated text or media and can copy a selected My Images object into the character-avatar destination. It does not publish a character, export a story, begin a chat, edit an existing story cast, or expose the private collection on Public Profile.

### What happens next

The immediate downstream handoff occurs in Story Builder through **Import from Library**, not through a control on the Character Library grid. That flow must create an independent story-owned character before the story is persisted. The reverse **+ Character Library** action appears in Story Builder's character editor and creates or updates the appropriate independent library copy; it is not a Character Library header action.

My Images owns source folders and images until an explicit avatar copy succeeds. Character Builder owns the editor controls described above. Story Builder owns the copied cast. Chat Interface and Chat History own playthrough state after a story begins. Community Gallery and My Stories own story visibility and lifecycle, not library-profile visibility.

# App Architecture

## Coverage and Delivery Boundary

### What this architecture chapter covers

This chapter traces the current Character Library implementation from Chronicle's single browser route through the internal library tab, shared Character Builder, account-scoped character services, private avatar storage, AI helpers, and Story Builder copy handoffs. It separates three things that are easy to conflate: the stable user contract described in Overview and UI Elements and Functions; the current repository mechanisms that attempt to deliver it; and verified implementation limitations that must not be promoted into product behavior.

Character Library exposes capability-isolated Issues, Current Work, and Changelog tabs. **CL-ISSUE-001** tracks misleading collection/edit-session state, and **CL-ISSUE-002** tracks copy identity and avatar ownership. No active Current Work or modern accepted closeout is currently registered for Character Library. Its Changelog tab includes one positively mapped historical Quality Hub record for the character-role badge change; unrelated capability history must remain excluded.

### Evidence standard and review metadata

- **Reviewed:** 08/22/2026
- **Source updated:** 08/22/2026
- **Inspected repository revision:** `cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7`
- **Working-tree condition:** the inspected checkout contained concurrent Phase 4/5 and product-source changes. The source composite below identifies the exact on-disk files reviewed for this manual; the revision alone does not describe those uncommitted bytes.
- **Direct UI evidence:** Chronicle's local shell at `http://localhost:8080/` was inspected signed out. Selecting **Character Library** opened the current authentication interface. No authenticated local session was available, so the authenticated Character Library grid, editor, persistence mutations, AI requests, and failure branches were not exercised live during this review.
- **Backend evidence:** the synchronized Supabase reference and repository migrations were inspected as documented/repository-defined boundaries. Neither is proof of the currently deployed Supabase project. Live RLS, RPC, function, and storage behavior remains unverified here; the Chronicle Work Manual governs whether a later task requires a live comparison.

The Overview and UI chapter are therefore source-backed product documentation with a directly observed authentication entry gate. Architecture statements about repository flows are confirmed by current code. Statements about deployed Supabase enforcement are deliberately qualified.

## Route, Entry, and Composition

### One browser route, one internal destination

`src/App.tsx` registers the main application at `/`; it does not register a `/characters`, `/library`, or `/character-library` browser route. `src/pages/Index.tsx` owns the internal `tab` state and extends Chronicle's ordinary `TabKey` with the legacy string `library`. `AppSidebar.tsx` emits the Character Library selection, and `Index.tsx` wraps that selection in `requireAuth` before calling the shared navigation handler.

The shell bootstrap can normalize a `?tab=library` query into the same internal destination, but its guest guard allows only gallery, world, and characters while authentication is absent. An unresolved or signed-out library target is consequently returned to Gallery. The sidebar path has the stronger visible behavior: it opens the authentication interface immediately and does not invoke the library navigation callback.

### Lazy editor composition

`Index.tsx` lazy-loads `CharacterBuilderScreen.tsx` for both Story Builder's character editor and Character Library. In library mode it constructs a default scenario-shaped wrapper whose `characters` array is `filteredLibrary`. It passes the selected ID and shared update, delete, add-section, and create callbacks, but it does not pass a story `scenarioId` or the `isAdmin` flag.

That composition has two consequences. First, Character Builder remains the owner of profile fields, section navigation, avatar controls, custom content, goals, personality, and per-field AI. Character Library's hook remains the owner of which collection is mutated and how a library row is saved. Second, the story-only administrative **Edit Buttons (Admin)** action cannot render in Character Library because the library embedding supplies neither a story parent nor an administrative flag.

`AppShellTopBar.tsx` independently switches its header contract according to the same internal tab and selected character ID. It renders search only in the collection state. In the editor state it renders AI Fill, Cancel, and the shared save-to-library action, whose label becomes **Update Character** because library mode marks the selected profile as already in the library. The ordinary story **Save** action is excluded.

## Ordered Runtime and Data Flows

### 1. Authentication and initial library load

1. `use-auth.ts` supplies authentication state and the current user identity to the application shell.
2. After authentication, `use-index-authenticated-data.ts` starts the account bootstrap. It loads the character library in the same `Promise.all` as stories, conversations, backgrounds, saved stories, publication data, and the user profile.
3. The library request is wrapped in a 15-second timeout whose fallback value is an empty array.
4. `fetchCharacterLibrary()` in `persistence/characters.ts` asks Supabase Auth for the current user, then selects all `characters` rows where `is_library = true` and `user_id` equals that user. Results are ordered by `updated_at` descending.
5. Each database row is converted to Chronicle's `Character` shape. Rows with an `avatar_path` or a recognized private-storage sentinel are hydrated with a signed `character_avatars_private` URL for display.
6. The resulting array becomes the `library` state owned by `Index.tsx`. `filteredLibrary` is derived from that array and the local search query; it is not another persistence layer.

The bootstrap's application-level `isLoading` state is not passed into the Character Library component. The timeout fallback is also indistinguishable from a successful empty response by the time the grid renders. That delivered mismatch is recorded under Current Implementation Limitations.

### 2. Entering or re-entering the workspace

1. An authenticated sidebar selection calls `handleNavigateAway("library")` in `use-index-scenario-persistence.ts`.
2. If a Story Builder scenario is active, the handler first attempts to stash its current data, cover, position, and themes in local storage.
3. It clears the active scenario, selected character, and playing conversation, then changes the internal tab to `library`.
4. It starts `refreshCharacterLibrary()`, which repeats the owner-scoped library request and replaces the complete in-memory library array when it resolves.

This refresh makes persisted server state authoritative on entry. It can also overwrite any library-only local edits left in the array from an earlier visit. The navigation path logs refresh failure to the console but supplies no library-specific error state to the page.

### 3. Search, selection, and edit snapshots

1. The top-bar search query remains local state.
2. `useIndexCharacterWorkspace` builds `filteredLibrary` by matching the query against selected profile fields and nested authored content.
3. `Index.tsx` passes only that filtered array into Character Builder's scenario-shaped wrapper.
4. Selecting a card stores its ID in `selectedCharacterId`.
5. The workspace hook identifies `library` as the edit scope and captures a deep JSON snapshot of the selected profile in a ref-backed map if that scoped ID has no snapshot yet.
6. Character Builder finds the selected object inside its received array and renders the editor. Every field callback merges a patch into the matching object in the full `library` array.

The snapshot is rollback authority only for **Cancel**. It is not a second durable copy and it is not sent to Supabase. Search remains a derived view, but because the selected object is looked up inside the filtered array, changing a searchable field can remove the selected object from Character Builder's current input. That is a delivered selection defect described below.

### 4. Creating, updating, cancelling, and leaving an edit

**Create:** `handleCreateCharacter()` creates a new UUID and a default `Character` object, prepends it to `library`, selects it, and records its ID in `unsavedNewCharacterIds`. No database request occurs.

**Edit:** `handleUpdateCharacter()` maps over `library` and merges a shallow patch into the selected object. Nested editor helpers construct their own replacement nested objects before calling it. The currently rendered array is therefore the working copy.

**Update Character:** `handleSaveToLibrary()` locates the selected profile, sets `isSavingToLibrary`, and calls `saveCharacterToLibrary()`. The service converts the profile to a row with the authenticated `user_id`, `scenario_id = null`, and `is_library = true`, then performs an upsert. On success the hook clears the new-profile marker and keeps the editor open. It does not refresh or re-sort the array.

**Cancel:** `handleCancelCharacterEdit()` removes an unsaved-new library profile. For an existing profile it replaces the current array object with the deep opening snapshot. It clears snapshot/new-profile tracking and returns to the collection.

**Back:** the top bar currently calls `setSelectedCharacterId(null)` directly. That skips the workspace cancellation handler and its snapshot/new-profile cleanup. Overview and UI preserve Back's intended navigation boundary; the delivered difference is a limitation.

### 5. Deleting a library profile

1. The card trash callback records the selected ID and `character` deletion type in shared confirmation state.
2. `DeleteConfirmDialog.tsx` renders the common destructive dialog. `Index.tsx` supplies the Global Library consequence when the active tab is `library`.
3. Confirm calls `executeDeleteCharacter(id)` and immediately clears the confirmation state.
4. In library mode the workspace hook awaits `deleteCharacterFromLibrary(id)`.
5. The service deletes from `characters` where `id` matches and `is_library = true`. It does not add a client-side `user_id` filter; deployed RLS is the final owner boundary.
6. On success the hook removes the item from the local array, clears edit tracking, and clears selection if necessary. On failure it logs to the console and preserves the item.

The dialog is closed before the promise resolves, carries no delete-in-progress guard, and displays no failure message. No storage-object cleanup follows a character-row deletion.

### 6. Device avatar upload and signed display

1. The hidden file input accepts an image selected from the device.
2. Character Builder reads it into the browser, preserves its aspect ratio while fitting it within a maximum 512-by-512 boundary, encodes it as JPEG at quality `0.7`, and converts it to a Blob.
3. `uploadAvatar()` stores the Blob in `character_avatars_private` at a user-prefixed path. It returns the durable path, a `storage://character_avatars_private/...` sentinel, and a one-hour signed display URL.
4. Character Builder places the signed URL and durable path in the current profile, resets focal position to `{ x: 50, y: 50 }`, and enters reposition mode.
5. `characterToDb()` gives the durable path precedence. When the path exists, it reconstructs the storage sentinel for `avatar_url` rather than persisting the signed URL.
6. A later fetch signs the stored path again. `signed-media.ts` caches the URL in browser memory and refreshes it five minutes before the default one-hour expiry.

The media upload completes before the character upsert. The new object can therefore exist even if the character update is cancelled or fails. Current code does not provide an orphan cleanup transaction.

### 7. Copying an avatar from My Images

1. `ImageLibraryPickerModal.tsx` calls `get_folders_with_details` to load the current account's folder summaries and directly queries `library_images` for a selected folder.
2. Private `image_library` paths are converted to signed thumbnails for display. Rows without `image_path` remain disabled.
3. Confirm builds a source selection and calls `copyLibraryImageTo()` with destination `character_avatars_private`.
4. `library-copy.ts` obtains or reuses a signed source URL, fetches the private bytes, creates a new user-prefixed destination path, and uploads without overwrite.
5. For the private destination it returns a storage sentinel, durable destination path, and signed preview.
6. Character Builder parses the sentinel, signs the destination path for immediate display, updates the current profile, centres it, and enters reposition mode.

My Images remains the source owner; the newly copied object belongs to the character-avatar workflow. The profile upsert is still a later operation, so the same orphan-media boundary applies.

### 8. Avatar generation

1. `AvatarGenerationModal.tsx` reads safe art-style presentation choices from `ArtStylesContext.tsx`. The context attempts `get_public_art_styles` and retains built-in `AVATAR_STYLES` when that request fails or returns no rows.
2. The modal can construct an editable prompt from the selected character's physical appearance, current clothing, sex/identity, and age.
3. Generate invokes the `generate-side-character-avatar` edge function with the prompt, optional negative prompt, selected style ID, model ID, and character name.
4. Before invoking the edge function, the client modal records its required-input validation snapshot. The edge function then authenticates the request, resolves server-side style configuration, calls the configured generation provider, writes the output to `character_avatars_private`, and records server-side usage on covered branches.
5. A successful response supplies a signed image URL and durable image path. The client records its success usage event, then Character Builder stores both values in the current profile, recentres the crop, enters reposition mode, and closes the modal.
6. The later character upsert persists the path/sentinel boundary; failure stays in the generation dialog.

The synchronized reference lists `art_styles` as Admin-readable while the runtime depends on a public-safe RPC, and the reference does not define that RPC. The current deployed art-style read boundary therefore remains unverified here; the Chronicle Work Manual governs any later reconciliation.

### 9. AI Fill and per-field enhancement

**AI Fill:** the top bar opens `AIPromptModal.tsx`. The workspace calls `aiFillCharacter()` with the selected profile, the global model ID, optional prompt, and the existing-detail choice. In library mode there is no active story, so the hook supplies `createDefaultScenarioData()` as world context. A non-empty returned patch is merged into the current library object and stamped with a new in-memory `updatedAt`; no profile upsert follows automatically.

**Per-field enhancement:** Character Builder records the exact target getter/setter, opens `EnhanceModeModal.tsx`, and calls `aiEnhanceCharacterField()` after the user chooses Precise or Detailed. It passes the `appData` wrapper that Character Builder received. In library mode that wrapper contains `filteredLibrary`, so other-character context is restricted by the current search result. Success updates the target field only. Failure produces a toast.

`character-ai.ts` builds self-context from the selected profile and broader context from the supplied scenario-shaped object. `api-usage-validation.ts` and `usage-tracking.ts` record diagnostics for covered AI operations. Those records can show what a request attempted; they neither authorize the request nor persist the character.

### 10. Story Builder importing from Character Library

1. Story Builder's character collection header exposes **Import from Library** and opens `CharacterPickerWithRefresh`.
2. The wrapper refreshes the full owner-scoped library and derives lightweight name, tag, avatar, and focal-position summaries for the picker. While it has no summaries and the refresh is pending, it shows **Loading library...**.
3. The picker searches summary name and tags. Selecting **Import** calls `fetchCharacterById(id)` for the full row. That direct request has no client owner predicate and relies on RLS as final authorization.
4. `handleImportCharacter()` checks whether the active story already contains that ID, deep-clones the returned object, prepends it to `activeData.characters`, and closes the picker.
5. Story Builder later sends its complete character array through `saveScenario()`, `characterToDb(..., scenarioId, false)`, and the `save_scenario_atomic` RPC.

The intended handoff requires a new identity. The current clone preserves the library UUID, so the atomic RPC reaches an existing library row whose `scenario_id` is null. Its conflict update is allowed only when both the row owner and `scenario_id` match the target story. The RPC raises `Unauthorized: characters row ... blocked by ownership guard`. The current repository therefore cannot persist this imported copy through its normal atomic story save. This is a confirmed implementation limitation, not an independent-copy rule change.

### 11. Story Builder copying a character into the library

1. In Story Builder's selected-character header, **+ Character Library** calls the same `handleSaveToLibrary()` under story scope.
2. If the session has no mapping for that story character, the hook creates a new UUID and calls `saveCharacterCopyToLibrary()`.
3. The service serializes the story character, replaces its ID, clears `scenario_id`, marks it as a library record, and inserts it.
4. The new independent object is prepended to the local `library` array, and `characterInLibrary[storyCharacterId]` records the new library ID.
5. During the same application session, repeating the action for that story character uses the mapped library ID and updates that library copy.

The mapping is in-memory session state. It is not stored with the story or reconstructed by comparing persisted rows after reload. A later session can therefore create another library copy rather than discovering the earlier relationship. The rows remain independent, but the intended “update this known copy” behavior is not durable across sessions.

## State Authority and Conflict Precedence

### Authority layers

| State or decision | Current owner | Authority and precedence |
|---|---|---|
| Signed-in identity | `use-auth.ts` and Supabase Auth | Required before the private destination can be entered; backend session identity is final for RLS. |
| Persisted reusable profile | `characters` row with `is_library = true`, `scenario_id = null`, and owner `user_id` | Durable source after a successful write. A later owner-scoped fetch replaces the browser collection. |
| Loaded collection | `library` state in `Index.tsx` | Browser working set used by cards and the editor; may be newer than the last fetch but is not durable until save. |
| Search results | `filteredLibrary` in `use-index-character-workspace.ts` | Derived presentation only; never overrides or deletes the full library. |
| Current editor target | `selectedCharacterId` | Chooses a profile inside the array passed to Character Builder; does not establish ownership or persistence. |
| Edit rollback | scoped snapshot map in `use-index-character-workspace.ts` | Opening-state authority for Cancel only. A completed save clears the snapshot; refresh replaces the working collection. |
| Unsaved-new status | `unsavedNewCharacterIds` | Determines whether Cancel removes the local profile. It is session-only and has no database representation. |
| Profile field values | selected object inside `library` | Render immediately and feed AI/media actions. They outrank the opening snapshot for display until Cancel or refresh. |
| Library-to-story copy | `activeData.characters` | Story Builder owns the copied object after import; a correct handoff must assign a new story-owned ID before save. |
| Story-to-library association | `characterInLibrary` | Session-only mapping for updating a known copy; lower authority than actual persisted rows and lost on reload. |
| Durable avatar reference | `avatar_path` plus storage sentinel in the character row | Long-lived reference. It outranks a signed URL when serializing. |
| Avatar presentation | signed URL in `avatarDataUrl` and signed-media cache | Temporary display data only; never an ownership or persistence boundary. |
| AI and usage diagnostics | validation/usage services and edge-function records | Observability only. They do not enforce RLS, confirm a character save, or prove the user saw a result. |

### Conflict rules

The browser uses local edited values until the user cancels, refreshes, or re-enters the capability. Supabase becomes authoritative only after a request succeeds or a fresh fetch replaces the collection. A signed URL may replace a sentinel for rendering, but `avatar_path` wins during serialization. A snapshot can undo current local values through Cancel, but it cannot roll back a completed server save or media upload. Search never has deletion authority.

The backend remains the final security and ownership authority. Client predicates such as `user_id`, `is_library`, `scenario_id`, and a session mapping narrow the request and express intent; they cannot substitute for deployed row-level security, function guards, or storage policies.

## Responsibility and Ownership Map

| Responsibility | Owning module or capability | What it owns |
|---|---|---|
| Browser route and app providers | `src/App.tsx` | `/` route, application providers, top-level Index entry. |
| Shell destination and orchestration | `src/pages/Index.tsx` | Tab state, library state, search/selection wiring, lazy Character Builder composition, shared dialogs. |
| Navigation and header contract | `AppSidebar.tsx`, `AppShellTopBar.tsx` | Entry label, authentication callback, collection/editor header controls and labels. |
| Account bootstrap | `use-index-authenticated-data.ts` | Initial library load and replacement of application state. |
| Navigation refresh and story save handoff | `use-index-scenario-persistence.ts` | Refresh-on-entry, clearing story state, atomic story persistence after import. |
| Library working state | `use-index-character-workspace.ts` | Search, selection snapshots, create/update/cancel/delete callbacks, AI Fill, library copy operations. |
| Profile authoring surface | `CharacterBuilderScreen.tsx` and feature rows/sections/sidebar helpers | Cards, fields, navigation, progress, custom sections, avatar editing, per-field AI. |
| Character serialization and queries | `persistence/characters.ts` | DB/App mapping, owner-scoped library fetches, full-row fetch, upsert/insert/delete, avatar hydration. |
| My Images selection | `ImageLibraryPickerModal.tsx` | Folder/image browsing, selection state, error/retry UI, copy initiation. |
| Cross-bucket media copy | `persistence/library-copy.ts` | Read private source bytes and create an independent consumer-owned storage object. |
| Avatar upload and display | `persistence/media-settings.ts`, `persistence/signed-media.ts` | Private upload, durable path/sentinel, short-lived signed URL and cache. |
| Avatar generation | `AvatarGenerationModal.tsx`, `ArtStylesContext.tsx`, `generate-side-character-avatar` | Safe style presentation, request UI, authenticated generation and private output. |
| Character text AI | `character-ai.ts` | Fill and field-enhancement context, response parsing, usage/validation hooks. |
| Story copy consumer | Story Builder and `CharacterPicker.tsx` | Library summary picker, full profile load, story working copy, later story persistence. |
| Database/storage enforcement | deployed Supabase | RLS, storage policies, Auth identity, RPC enforcement. Repository sources document intended/current code but do not prove live deployment. |

Character Library owns the reusable collection lifecycle. Character Builder owns profile editing mechanics. Story Builder owns copied cast members. My Images owns reusable source media until the copy service creates a destination object. Chat Interface and Chat History do not own or continuously synchronize library profiles.

## Persistence, Security, and External Dependencies

### Characters table contract

The synchronized reference describes `characters` as a shared table for user libraries, scenario casts, chat playback, and visible published-story experiences. Character Library distinguishes its rows through `is_library = true`, the authenticated `user_id`, and `scenario_id = null`. The runtime owner query repeats both `is_library` and `user_id`. Upsert/insert payloads repeat the account identifier and library/story-parent flags. Delete repeats `is_library` but leaves owner enforcement to RLS.

The repository migration `20260619074538...` defines authenticated reads for an owner, an admin, or characters attached through `scenario_id` to a visible published story. A scenario-less library row cannot satisfy that published-story join in this repository policy. The synchronized reference summarizes every `characters` field as Owner/Admin/Public because the table also serves visible publication data. That broad table summary must not be read as a claim that private library rows are public.

This is a repository/reference-defined boundary only. Live deployment was not queried, so the deployed `characters` policies, scenario join, owner mutation checks, and live privacy result remain unverified here.

### Avatar and My Images storage contract

The durable character row stores `avatar_path` and a private storage sentinel. `character_avatars_private` supplies signed display access. The synchronized storage reference describes Owner/Admin read and Owner mutation. Repository migration `20260619105616...` permits the owner or an admin to read a user-prefixed object, and only the owner to insert, update, or delete it. Live bucket configuration and policy installation remain unverified.

The My Images picker reads `image_folders` through a summary RPC and `library_images` through a direct owner-protected table query, then signs private `image_library` objects. The synchronized reference describes both tables as Owner-only. The picker does not persist an expiring My Images signed URL into the profile; `library-copy.ts` creates a new destination object and returns a durable path/sentinel.

No current Character Library path deletes superseded or abandoned avatar objects when the user replaces an avatar, cancels after upload/copy/generation, deletes a profile, or successfully saves a cleared avatar. Storage privacy and storage lifecycle are separate concerns.

### AI configuration and diagnostics

Character text requests use Chronicle's selected/global model configuration. Avatar generation reads safe art-style presentation fields through `get_public_art_styles`; the edge function resolves the backend prompt rather than returning that prompt to the browser. `api-usage-validation.ts` and `usage-tracking.ts` provide diagnostics for covered API operations.

The synchronized reference describes `app_settings` as Admin-managed with narrow signed-in reads for approved keys. It describes direct `art_styles` reads as Admin-only. It does not list `get_public_art_styles`, while current code depends on that RPC and falls back to bundled art styles if the request fails. Live function existence, grants, returned fields, and service-role prompt lookup were not exercised and remain unverified here.

### Story persistence enforcement

Story Builder persists the cast through `saveScenario()` and the `save_scenario_atomic` RPC. The repository RPC validates `auth.uid()`, story ownership, character ownership, and target `scenario_id` during conflict updates. Those checks correctly block reparenting an existing library row into a story under the same UUID, which exposes the current import-copy defect rather than weakening the guard.

Import/export belongs to `use-index-scenario-persistence.ts` and the Story Builder story-transfer workflow. Character Library supplies reusable profiles; it does not own story file import or export.

## Diagnostics Versus Enforcement

### Diagnostic signals

Console errors currently record bootstrap failure, library refresh failure, library save/delete failure, avatar upload failure, AI Fill failure, and picker/full-row import failure. Toasts cover My Images folder/image/copy failures and per-field enhancement failures. The avatar-generation modal holds its own request error. AI usage and validation services, plus edge-function event paths, can record the attempted model call and response-shape checks.

These signals help an engineer reconstruct what the browser attempted. They do not prove that a library record was written, that a failed action was visible to the user, that a story copy became durable, or that deployed security allowed only the intended account.

### Enforcement points

Authentication gating in the shell prevents the ordinary signed-out entry path. Supabase Auth and deployed RLS are the final row-level boundary. Storage policies are the final media-object boundary. The avatar generator's authenticated edge function is the server-side boundary for media generation. `save_scenario_atomic` enforces story and child-row ownership for the downstream story handoff.

Client filtering, `is_library` flags, disabled buttons, in-memory snapshots, progress rings, confirmation dialogs, console logs, and API validation snapshots are not enforcement. They are navigation, request shaping, local recovery, or diagnostics.

## Current Implementation Limitations

### Collection state and user feedback

- Initial library loading is not rendered in the Character Library workspace. `fetchCharacterLibrary()` is wrapped with an empty-array timeout fallback, so a timeout or request failure can look like a successfully empty library. The page shows only the New Character tile and supplies no collection-level loading, error, or retry state.
- Refresh-on-entry logs failure and leaves the current array in place without explaining whether it is stale. The user cannot distinguish last-known data from a successful current refresh.
- Library update failure, library delete failure, device avatar upload failure, and bulk AI Fill failure are console-only. Update has a header busy state, but no visible success or unsaved-after-failure status. Delete confirmation closes before the asynchronous request resolves and has no delete busy/duplicate guard.
- The library array is initially ordered by database `updated_at`, but a successful in-session update neither refreshes nor re-sorts the collection. The card can stay in its old position until another fetch.

### Edit-session correctness

- The editor's **Back** callback clears only `selectedCharacterId`. It bypasses snapshot restoration and unsaved-new removal. Unsaved changes remain in the library array and an unsaved new profile remains on the grid until Cancel or a later refresh resolves the state.
- Character Builder receives `filteredLibrary`, then looks up the selected profile inside that filtered array. If the current search matches a field that the user edits so it no longer matches, the selected profile disappears from the component input. The header can still show editor actions while Character Builder falls back to the grid.
- `handleDeleteAvatar()` clears `avatarDataUrl` but not `avatarPath`. `characterToDb()` gives the still-present path precedence and reconstructs the private sentinel, so **Delete image** cannot durably clear an existing path-backed avatar on update.
- Opening Character Goals when the profile has no goals seeds a default blank goal through an effect. Selecting an empty Tone, Key Life Events, Relationships, Secrets, or Fears section similarly calls its add-row handler during render and seeds a blank extra row. Merely visiting any of these empty sections therefore mutates in-memory profile data without an explicit add action.
- New freeform custom sections store their text in item values, but `section-progress.ts` calculates freeform completion from `freeformValue`. The section's progress ring can report empty even when the visible freeform field contains text.
- Cards can display and search stored tags, but the current Character Library editor exposes no field for adding or changing them.

### Copy and ownership handoffs

- Library-to-story import deep-clones the profile without assigning a new UUID. The repository's atomic story save correctly refuses to update the existing scenario-less library row under a story `scenario_id`. The imported character can appear in Story Builder working state but cannot persist through the normal atomic save. The intended contract remains an independent story-owned copy with a new identity.
- Story-to-library copy does assign a new UUID, but the mapping from story character to its library copy exists only in `characterInLibrary` browser state. After reload, repeating **+ Character Library** can create another copy instead of updating the previously created one.
- The Story Builder picker exposes explicit loading only while it has zero summaries. A refresh failure falls through to **No matching characters found in library.** Full-row import failure is console-only. These are consumer-side feedback gaps in the Character Library handoff.

### Media lifecycle, AI context, and accessibility

- Device upload, My Images copy, and avatar generation create private media before the character row is updated. Current code has no cleanup transaction for an abandoned, superseded, or failed-save avatar object and does not delete avatar media when a profile is deleted.
- In library mode bulk AI receives a default empty scenario as world context. Per-field enhancement receives the scenario-shaped wrapper containing only the currently filtered library, so a search query changes which other library profiles are supplied as “other characters” context. Neither behavior is communicated in the UI.
- The synchronized reference says direct `art_styles` reads are Admin-only, while runtime presentation depends on `get_public_art_styles`, which is absent from that reference. Deployed RPC grants and returned fields are not proven.
- The card trash action is revealed on hover, has `tabIndex={-1}`, and has no accessible name. Several icon-only pencil, sparkle, row-remove, and collapse controls rely on a title, adjacent context, or pointer interaction rather than a complete keyboard-and-name contract. `TabFieldNavigator.tsx` also intercepts Tab while an eligible text input has focus and moves directly to the next eligible text input, skipping intervening buttons in the editor's natural focus order. Current source therefore does not meet every accessibility expectation documented in UI Elements and Functions.

### Test coverage gaps

`use-index-character-workspace.test.ts` proves Cancel restoration and unsaved-new removal only for Story Builder scope. It does not exercise library create, update, Cancel, Back, delete, search-selection, avatar-clear, copy identity, or persistence failure behavior. `use-index-shell-bootstrap.test.ts` covers general query normalization but not the signed-out library reset. `AppShellTopBar.test.tsx` has no Character Library header case. `media-settings.test.ts` does not cover the avatar lifecycle described here.

The Knowledge tests added with this manual validate registration, substantive Markdown, heading ownership, source paths, and renderer output. They prove documentation integration; they do not repair or behavior-test the runtime gaps above.

## Curated Source and Test Map

### Route, shell, and orchestration

| Source | Role in Character Library |
|---|---|
| `src/App.tsx` | Registers `/`, providers, and the Index application entry. |
| `src/pages/Index.tsx` | Owns internal tab/library/search/selection state, composes Character Builder, and hosts shared dialogs. |
| `src/components/app-shell/AppSidebar.tsx` | Displays the Character Library destination. |
| `src/components/app-shell/AppShellTopBar.tsx` | Owns collection search and editor header actions. |
| `src/components/app-shell/AppShellTopBar.test.tsx` | Existing shared-header tests; currently no library-specific assertion. |
| `src/hooks/use-auth.ts` | Supplies authenticated user/session state. |
| `src/hooks/use-index-authenticated-data.ts` | Loads the initial owner-scoped library with the account bootstrap. |
| `src/hooks/use-index-scenario-persistence.ts` | Refreshes the library on entry and owns downstream Story Builder persistence/import/export boundaries. |
| `src/hooks/use-index-shell-bootstrap.ts` | Resolves query targets and returns signed-out private tabs to Gallery. |
| `src/hooks/use-index-shell-bootstrap.test.ts` | Existing query-target coverage; it does not directly cover library authentication. |

### Character state and editor UI

| Source | Role in Character Library |
|---|---|
| `src/hooks/use-index-character-workspace.ts` | Owns library search, working-state edits, snapshots, create/cancel/delete, AI Fill, and copy handoffs. |
| `src/hooks/use-index-character-workspace.test.ts` | Existing story-scope Cancel coverage and evidence of missing library-scope tests. |
| `src/features/character-builder/CharacterBuilderScreen.tsx` | Full collection grid and shared profile editor, including avatar, custom content, and enhancement wiring. |
| `src/features/character-builder/rows/AutoResizeTextareaField.tsx` | Shared editable text-area behavior. |
| `src/features/character-builder/rows/ExtraRow.tsx` | Editable/removable extensible row and enhancement trigger. |
| `src/features/character-builder/rows/HardcodedRow.tsx` | Locked built-in label, editable value, and enhancement trigger. |
| `src/features/character-builder/sections/HardcodedSection.tsx` | Expand/collapse frame for built-in sections. |
| `src/features/character-builder/sidebar/TraitNavButton.tsx` | Section selection control and completion presentation. |
| `src/features/character-builder/sidebar/TraitProgressRing.tsx` | Completion percentage/check-ring rendering and text alternative. |
| `src/features/character-builder/types/character-builder.types.ts` | Shared builder component contracts. |
| `src/features/character-builder/utils/section-keys.ts` | Canonical section-key mapping and matching. |
| `src/features/character-builder/utils/section-progress.ts` | Completion calculations, including the current freeform mismatch. |
| `src/features/shared-builder/utils/image-position.ts` | Translates the avatar editor preview's stored focal position into the non-square character header tile. |
| `src/components/chronicle/PersonalitySection.tsx` | Standard/Split trait editor. |
| `src/components/chronicle/TabFieldNavigator.tsx` | Intercepts Tab navigation between eligible editor text inputs. |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Goal, step, guidance, and progress editor, including default-goal seeding. |
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Goal guidance-strength control. |
| `src/components/chronicle/CustomContentTypeModal.tsx` | Structured/Freeform chooser. |
| `src/components/chronicle/ChooserModal.tsx` | Shared option-card dialog used by content type and enhancement mode. |
| `src/components/chronicle/DeleteConfirmDialog.tsx` | Shared destructive confirmation UI. |

### AI and media

| Source | Role in Character Library |
|---|---|
| `src/components/chronicle/AIPromptModal.tsx` | AI Fill prompt, existing-detail choice, and processing controls. |
| `src/components/chronicle/EnhanceModeModal.tsx` | Precise/Detailed field-enhancement choice. |
| `src/services/character-ai.ts` | AI Fill/generate/enhance prompts, context construction, and response parsing. |
| `src/services/api-usage-validation.ts` | Required-input and response-shape diagnostics for covered AI requests. |
| `src/services/usage-tracking.ts` | AI usage event recording. |
| `src/components/chronicle/AvatarActionButtons.tsx` | Device/My Images source menu and AI Generate action. |
| `src/components/chronicle/AvatarGenerationModal.tsx` | Avatar prompt, styles, request state, and result callback. |
| `src/constants/avatar-styles.ts` | Bundled safe style-presentation fallback. |
| `src/contexts/ArtStylesContext.tsx` | Safe presentation RPC and built-in style fallback. |
| `supabase/functions/generate-side-character-avatar/index.ts` | Authenticated avatar-generation and private-media output path. |
| `src/components/chronicle/ImageLibraryPickerModal.tsx` | My Images folder/image selection, signing, retry, and destination copy. |
| `src/services/persistence/library-copy.ts` | Private-source byte copy to the character-avatar destination. |
| `src/services/persistence/media-settings.ts` | Device avatar upload into private storage. |
| `src/services/persistence/media-settings.test.ts` | Existing media-settings coverage; not a Character Library lifecycle test. |
| `src/services/persistence/signed-media.ts` | Sentinel parsing, one-hour signed URLs, cache, and pre-expiry refresh. |

### Persistence, schema, and downstream handoff

| Source | Role in Character Library |
|---|---|
| `src/services/persistence/characters.ts` | Character mapping, owner library queries, full-row fetch, upsert/copy/delete, and avatar hydration. |
| `src/services/persistence/scenarios.ts` | Downstream story serialization and atomic persistence. |
| `src/services/persistence/shared.ts` | Shared Supabase client and nested Character database conversions. |
| `src/services/supabase-data.ts` | Compatibility export surface consumed by Index hooks and editor code. |
| `src/components/chronicle/CharacterPicker.tsx` | Story Builder's library-summary and full-profile import UI. |
| `src/integrations/supabase/types.ts` | Generated client-side database typing used by persistence code. |
| `src/data/supabase-schema-reference.ts` | Synchronized documented table/storage boundary displayed in the Admin reference. |
| `src/types.ts` | `Character`, goals, traits, sections, and `ScenarioData` shapes. |
| `src/utils.ts` | UUID, timestamp, and default scenario helpers used by library creation/AI context. |
| `supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql` | Repository policy for owner/admin/visible-public character reads and shared configuration. |
| `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql` | Private avatar path, bucket, and owner/admin read / owner mutation policies. |
| `supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql` | Atomic story-save ownership and scenario-parent conflict guards. |

### Knowledge integration tests

| Source | Role in Character Library |
|---|---|
| `src/data/chronicle-knowledge-base/character-library-manifest.test.ts` | Verifies the exact stable-tab contract, substantive section ownership, source-path existence, and reproducible source composite. |
| `src/pages/style-guide/chronicle-knowledge-base.character-library.test.tsx` | Proves the real Knowledge renderer resolves all seven Character Library tabs, isolates its Issues, preserves the explicit empty Current Work state, and renders only its positively mapped historical Changelog record. |

## Inspected Source Set and Reproducible Composite

### Exact ordered source paths

The architecture review inspected these 59 existing paths in this exact order:

```text
src/App.tsx
src/pages/Index.tsx
src/components/app-shell/AppSidebar.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppShellTopBar.test.tsx
src/components/chronicle/AIPromptModal.tsx
src/components/chronicle/AvatarActionButtons.tsx
src/components/chronicle/AvatarGenerationModal.tsx
src/components/chronicle/CharacterGoalsSection.tsx
src/components/chronicle/CharacterPicker.tsx
src/components/chronicle/ChooserModal.tsx
src/components/chronicle/CustomContentTypeModal.tsx
src/components/chronicle/DeleteConfirmDialog.tsx
src/components/chronicle/EnhanceModeModal.tsx
src/components/chronicle/GuidanceStrengthSlider.tsx
src/components/chronicle/ImageLibraryPickerModal.tsx
src/components/chronicle/PersonalitySection.tsx
src/components/chronicle/TabFieldNavigator.tsx
src/constants/avatar-styles.ts
src/contexts/ArtStylesContext.tsx
src/features/character-builder/CharacterBuilderScreen.tsx
src/features/character-builder/rows/AutoResizeTextareaField.tsx
src/features/character-builder/rows/ExtraRow.tsx
src/features/character-builder/rows/HardcodedRow.tsx
src/features/character-builder/sections/HardcodedSection.tsx
src/features/character-builder/sidebar/TraitNavButton.tsx
src/features/character-builder/sidebar/TraitProgressRing.tsx
src/features/character-builder/types/character-builder.types.ts
src/features/character-builder/utils/section-keys.ts
src/features/character-builder/utils/section-progress.ts
src/features/shared-builder/utils/image-position.ts
src/hooks/use-auth.ts
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-character-workspace.ts
src/hooks/use-index-character-workspace.test.ts
src/hooks/use-index-scenario-persistence.ts
src/hooks/use-index-shell-bootstrap.ts
src/hooks/use-index-shell-bootstrap.test.ts
src/services/api-usage-validation.ts
src/services/character-ai.ts
src/services/persistence/characters.ts
src/services/persistence/library-copy.ts
src/services/persistence/media-settings.ts
src/services/persistence/media-settings.test.ts
src/services/persistence/scenarios.ts
src/services/persistence/shared.ts
src/services/persistence/signed-media.ts
src/services/supabase-data.ts
src/services/usage-tracking.ts
src/integrations/supabase/types.ts
src/data/supabase-schema-reference.ts
src/types.ts
src/utils.ts
src/data/chronicle-knowledge-base/character-library-manifest.test.ts
src/pages/style-guide/chronicle-knowledge-base.character-library.test.tsx
supabase/functions/generate-side-character-avatar/index.ts
supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql
supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql
supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql
```

### Composite algorithm and value

For each path above, read its raw bytes and compute lowercase SHA-256. Build one ordered text listing with exactly one line per source in the form `<file-sha256><two spaces><path><newline>`. SHA-256 that complete UTF-8 listing. For the on-disk files reviewed on 08/22/2026, the resulting composite is:

`e20c1f20e18f16fc510ae2498e8dea5ed4f599551e30afb7eeafc0c817e794e1`

This value is a reproducible review fingerprint, not a release signature. It changes if any inspected source changes, including concurrent working-tree edits. The focused Character Library Knowledge test recomputes it and fails when the manual's source evidence becomes stale.

## Verification and Evidence Limits

The source review confirmed the route composition, visible labels and branches, local-state lifecycle, account query predicates, serialization flags, signed-media pattern, My Images copy boundary, AI call ownership, atomic story guard, and current test coverage. Static inspection also confirmed every path in the curated map exists.

The signed-out local observation confirmed the application shell and authentication precondition only. It did not prove authenticated layout, responsive behavior, browser focus order, successful Supabase mutations, deployed RLS, storage grants, RPC availability, edge-function output, AI provider behavior, or user-visible failure recovery. No Character Library row or media object was created, updated, or deleted during documentation work.

The shared **Supabase Tables** tab supplies the synchronized table and storage reference. It is a coordination artifact, not deployed-state proof, and this review does not establish the live state of `characters`, `character_avatars_private`, `image_folders`, `library_images`, `app_settings`, `art_styles`, `get_folders_with_details`, `get_public_art_styles`, or `save_scenario_atomic`. The Chronicle Work Manual governs any later live comparison.
