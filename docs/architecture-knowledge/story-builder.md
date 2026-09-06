# Overview

## Story Builder at a Glance

### The authoring workspace that turns an idea into a playable Chronicle story

Story Builder is Chronicle's story-level authoring workspace. It owns the editable source that defines a story's name, summary, cover, world premise, locations, custom world material, story goals, opening message and clock, scene media, art-style preference, AI rules, content classification, and cast. It also owns story-file import and export, draft and final persistence, publication-readiness validation, and the deliberate publication handoff from an authored source to Community Gallery. A saved source can later be handed to Chat Interface by the Play workflow that My Stories or Community Gallery owns.

The builder is delivered inside the main application at `/` as the internal **Story Builder** tab. It is not a separate browser route. Selecting Story Builder from the sidebar reopens the current in-memory story when one is active; otherwise it creates a new working source with a new UUID and Chronicle's default story structure. My Stories opens the same workspace when the user chooses New Story or Edit. Community Gallery can expose that a publication permits reuse and let a user save it; My Stories owns the later confirmation and clone-to-edit handoff that creates an independent account-owned copy before opening it here.

Authentication is a precondition for every durable or account-owned operation: saving a draft, finalizing, uploading or generating private media, browsing private Character Library or My Images sources, and publishing. The durable product contract is account-scoped. When a signed-out person reaches an account-required action, Chronicle must explain that authentication is required while preserving the working material long enough to continue after sign-in.

Story Builder is not My Stories, Character Library, My Images, Community Gallery, or Chat Interface. My Stories owns the account collection and the decision to create, edit, delete, or play. Character Library owns reusable character sources. My Images owns reusable media sources. Story Builder creates story-owned copies and authors the story source. Community Gallery owns the public publication and engagement experience. Chat Interface owns a conversation after Play creates a session.

### The user promise

A person should be able to assemble a complete story in one workspace, understand which information will shape the roleplay, leave safely as a draft, return through My Stories, and deliberately decide when the story is ready to be treated as final or published. The builder must never imply that a local edit, an uploaded object, a successful AI response, a passing client-side checklist, or a downloaded backup is already a durable saved story. Each boundary must identify what changed, who owns it, and what the next action will do.

The story source remains private and editable until the owner publishes it. Finalizing is not publication: it saves the source as a non-draft and returns to My Stories. Publishing creates or updates a separate publication record and can expose an approved public representation through Community Gallery and Public Profile. Playing creates a conversation from the current durable source; the conversation then has its own identity and lifecycle.

## Ownership and Story Lifecycle

### One story source owns its world, cast, and opening state

Within the builder, the story source owns the world core, codex-style additional entries, story goals, opening dialog and starting clock, selected art style, story-owned characters, scene records, cover state, and content-theme state. These are presented as one authoring experience and must be saved with the same story identity.

A Character Library profile is not edited in place when it enters a story. **Import from Library** is an ownership handoff: the builder must create a separate story-owned character identity, after which Character Builder edits the story copy. Later library edits must not rewrite the cast member, and later story edits must not rewrite the reusable source.

A My Images item is likewise a reusable source, not a cover or scene record. Choosing **From Library** copies the private source bytes into the story cover or scene destination. Once that copy succeeds, Story Builder owns adoption, crop or tagging, story persistence, later replacement, and cleanup. Deleting the My Images source must not break a successfully adopted destination copy.

### Draft, final, published, and playable are different states

**Save Draft** writes the current owner-scoped story with draft state while leaving the author in the builder. The durable draft becomes available under My Stories → Drafts and remains editable. Draft saving should preserve all authored fields, story-owned cast, classification, cover and scene references, and enough recovery information to distinguish verified backend state from an unsaved browser snapshot.

**Finalize and Close** checks that the story has the minimum complete setup, saves it as a non-draft, and returns to My Stories. The minimum current readiness set is a title, brief description, cover, story premise, opening dialog, at least one complete location, at least one story goal with a name and desired outcome, at least one AI-controlled character, at least one user-controlled character, at least five classification tags, and either SFW or NSFW. Every character needs a real name; an NSFW story must not accept a numeric character age below eighteen. Finalization does not create a public publication and does not start play.

**Publish to Gallery** runs the same readiness review before opening the publication controls. Publishing creates or updates the separate publication state and lets the owner decide whether other people may make their own editable copies. It does not transfer source ownership or give another user permission to overwrite the owner's source.

**Play** is not a Story Builder control. After a story has been saved, My Stories or Community Gallery owns the Play choice. That handoff loads the current source, creates a new conversation and opening message, and transfers control to Chat Interface. Chat History owns returning to a specific saved conversation later.

### A downloaded story file is a backup or transfer artifact, not a saved account record

Story Builder owns import and export. Export can produce Markdown, JSON, or a Word-readable RTF file. JSON is the full-fidelity interchange choice. Markdown and Word provide human-readable structure plus embedded machine restore data. Normal exports exclude conversations so a story-authoring transfer does not silently become a chat-history export.

Import begins with a deliberate **Merge** or **Rewrite** choice. Merge retains existing material where possible and adds or combines incoming values. Rewrite prefers the imported story where the same field already has content. Both modes can create or update story fields, characters, custom sections, scenes, editor cover state, and content themes. Import changes the current working state first; the user must still save or finalize to make the result durable. Warnings must identify partial parsing or media that could not be made portable rather than treating a partially mapped file as a perfect restore.

## Complete Authoring Workflows

### Start a new story

1. The user selects **Story Builder** in the sidebar or **New Story** in My Stories.
2. Chronicle creates a new story identity and default working structure, clears prior selected character and conversation state, and opens **Story Setup**.
3. The user adds a name, brief description, cover, premise, locations, goals, opening state, cast, scenes, art style, custom rules, and content themes in any useful order.
4. The user can save an incomplete account-owned draft at any time once authenticated. Finalize and publication remain subject to readiness checks.
5. My Stories becomes the collection owner after a successful save-and-close. No conversation exists until Play is chosen later.

The builder must make the unsaved state visible. Leaving an unsaved new story should offer to save, keep a recoverable draft, or explicitly discard it. Merely navigating away must not silently turn an in-memory UUID into a durable story or make an unreachable browser snapshot look like a My Stories record.

### Edit an owned story or draft

My Stories supplies the owned story identity. Chronicle loads the story master row and the child cast, additional entries, and scenes; resolves private media for display; loads its content themes; and places those values into the builder working state. The owner edits the same source identity. Save Draft keeps or sets draft state; Finalize and Close makes it non-draft.

If a safety snapshot and backend record disagree, the user should not have to guess which version opened. Chronicle must apply a documented precedence rule, preserve recoverable work, and disclose any restoration or conflict. A failed load is not a blank new story: the builder should retain the requested identity, explain what could not be loaded, and offer retry or a safe return to My Stories.

### Reuse another creator's permitted publication

Community Gallery exposes the publisher's reuse permission and can create the saved relationship that appears in My Stories. My Stories owns the confirmation and clone-to-edit action. That reuse flow creates a separate story ID, separate child IDs, and story-owner media copies before Story Builder opens. The original publication remains unchanged. Story Builder receives the new owned working source and treats every later change, draft, final save, and publication as belonging to the new owner.

If cloning any required source data or private media fails, the copy must not be presented as a complete editable story. Chronicle should either roll back the partial copy or clearly identify what was omitted and keep the original publication untouched.

### Build the cast

The Character Roster divides story-owned profiles into Main Characters and Side Characters. Adding a character opens **Character Creation**. **+ New Character** creates a story-owned profile and transfers editing to Character Builder. **Import from Library** opens the private reusable collection, loads the selected full profile, creates a separate story-owned copy, and returns it to the roster.

Selecting a roster pencil opens that story-owned character in Character Builder. Saving there returns to Story Builder and schedules a draft save. Character Builder owns the character field interface; Story Builder owns membership in this story and persistence of the story copy. At least one AI-controlled and one User-controlled character are required for finalization or publication.

### Author world structure, goals, and opening state

The story premise gives the broad situation and stakes. Primary Locations provide named places with descriptions. Custom world content adds either structured label-and-description rows or longer labeled text fields. Additional Entries provide larger title-and-body reference notes. These are authored story data, not global library records.

Story Goals describe a desired direction, a desired outcome, guidance strength, and optional steps. Guidance strength tells the downstream roleplay system how strongly the story should steer toward that goal; checking steps changes the authored progress shown in the builder. The opening dialog supplies the first assistant message for each new session, the starting day and time of day, and manual or automatic time progression settings.

### Add cover and scene media

A cover can come from the device, My Images, or AI generation. After adoption, the user can reposition the cover within its portrait frame or remove it with confirmation. A story needs a cover before it can be finalized or published.

Scenes can also come from the device, My Images, or AI generation. Each scene can be opened to set a title and up to ten tags. One scene can be marked as the starting scene. Scene tags are available to downstream dynamic-background behavior; deleting a scene removes the story's scene reference after confirmation. Media work must expose busy, success, and failure state and must not confuse a created storage object with a successfully saved parent story.

### Use AI-assisted authoring

Sparkle controls on supported text fields open **Enhancement Style**. **Precise** requests short semicolon-separated attributes; **Detailed** requests a short fuller description. AI enhancement uses the current story premise, classifications, cast, locations, goals, opening state, and additional entries as context. The selected model comes from shared model settings.

Cover and scene generation use the chosen prompt and art-style identifier. Backend-only style prompts remain server-owned; the browser receives safe style presentation fields. Cover generation accepts an optional negative prompt and targets a portrait composition. Scene generation targets a landscape composition. AI results join working state only after the generation and private-storage step succeeds.

AI assistance is optional. A user must be able to author and save without it. A failed call keeps the original field or media state unchanged, explains what failed, and permits retry. Usage and validation diagnostics are evidence about attempted requests; they are not proof that a story was saved or that output met the user's intent.

### Classify and publish

Content Themes describe character types, SFW or NSFW story type, genre, origin, trigger warnings, and custom tags. SFW and NSFW are mutually exclusive. Other categories can hold multiple selections and, where offered, custom values. At least five selections across character type, genre, origin, trigger warnings, and custom tags are required for finalization or publication; story type is required separately and does not count toward five.

**Publish to Gallery** validates the complete story. When validation fails, the builder presents one consolidated list, marks the relevant regions, scrolls to the first error, and keeps rechecking as the user corrects the story. When readiness passes, **Share Your Story** shows the story title, current publication status, **Allow Edits**, an explanation of viewer permissions, and Publish, Update Publication, or Unpublish actions as appropriate.

Allow Edits grants permission to create an independent copy; it never grants write access to the source. Publication visibility belongs to the publication record. Removing a publication preserves the owned source.

## Invariants and Permission Rules

### Story identity and child identity are durable ownership boundaries

Every durable story, story-owned character, additional entry, scene, conversation, and message uses a backend-compatible UUID. A save must not reparent another user's or a reusable library row by reusing its identity. Copy workflows mint new IDs and then preserve those IDs across later edits.

The authenticated account owns mutations to its story source and children. Admin access is a privileged exception governed outside Story Builder. Public or other-user access must come through a visible publication and curated read path; it does not authorize source mutation. A synchronized reference or client-side owner check does not by itself prove deployed RLS.

### Private media paths, not signed URLs, are durable identity

In-progress covers use `story_covers_private`; character avatars use `character_avatars_private`; scenes use the private `scenes` bucket. Durable rows store an owner-namespaced path and, where legacy code requires a URL field, a storage sentinel. Signed URLs are temporary presentation values and must never be treated as the lasting media reference in a save or export.

My Images selection must copy source bytes to the named destination before adoption. Generated media is written once by the server-side generator and returned with its destination path. Device upload writes to the user's destination namespace. Parent save and object cleanup remain separate transactions and therefore need explicit recovery rules.

### Classification and adult-content rules are first-class data

NSFW is an explicit story type, not a reason to suppress fields or rewrite the story. Publication readiness enforces adult-age rules for numeric ages below eighteen. Trigger warnings and other classifications travel with the story source and public presentation. The builder must preserve explicit adult material as authored product data while applying the same ownership, persistence, validation, and evidence standards used for any other story.

## Loading, Empty, Failure, and Recovery Expectations

### Loading must preserve identity and context

Opening an existing story should display a story-level loading state until the requested source, cast, entries, scenes, cover presentation, and content themes are ready. Loading Character Library, My Images, art styles, publication status, AI output, media uploads, imports, and saves each needs a control-local busy state so the user knows which operation is pending. Existing working content should remain visible when a background refresh is safe.

### Empty is an authoring state, not an error

A new story legitimately begins with blank story fields, no cover, no scenes, and only default authoring rows. The roster add tiles, **No Cover**, and **No scenes uploaded** states explain how to proceed. An empty Character Library or My Images picker must be distinguished from signed-out access and from a failed request. A story with no additional entries or no optional custom sections is valid; those regions should not manufacture data merely because they rendered.

### Failure must identify what did not change

An import failure keeps the pre-import working state. A save failure keeps the working state and a recoverable safety copy. A media failure does not attach a broken reference. A publication failure leaves the source and previous publication state unchanged. A Character Library or My Images copy failure leaves the source and story unchanged. An AI failure preserves the field or media it was meant to enhance.

Visible feedback should name the action, show whether retry is safe, and prevent duplicate submission while the request is active. Console logs, diagnostics, or a button briefly saying Saving are supporting evidence, not a substitute for telling the author whether durable state changed.

### Recovery must not overstate the backend

A browser safety snapshot is an emergency recovery aid. It must remain until backend save and child verification succeed, then be removed deliberately. If verification finds a mismatch, the product should keep the snapshot, identify that the save is unverified, and provide a reconciliation path. If local and backend data conflict, neither should be silently destroyed without a deterministic rule and a visible explanation.

## Handoffs to the Rest of Chronicle

### My Stories receives the durable source and lifecycle state

After Save Draft or Finalize and Close, My Stories owns collection presentation, Drafts/Published filtering, and the next Edit, Delete, Play, or publication-management choice. It does not author the source. Story Builder remains the owner of future changes when Edit reopens the source.

### Character Library and My Images supply reusable sources

Character Library supplies a reusable profile only until the builder creates the story-owned copy. My Images supplies a reusable image only until a destination copy succeeds. In both cases, Story Builder becomes the immediate owner of adoption and story persistence. The upstream source remains independent.

### Community Gallery receives a publication, not the private workspace

Publication sends the visible story representation, classification, public cover, publisher identity, and reuse permission to Community Gallery. Gallery owns discovery and engagement. Public Profile may list the creator's publications. Neither surface receives authority over private drafts, private pickers, or the owner's in-progress working state.

### Chat Interface receives a saved source and creates conversation state

Play loads the current durable story, creates a new conversation with the opening message and starting clock, and transfers control to Chat Interface. The builder does not continuously synchronize open conversations. Chat History later resumes a conversation against its source story and owns conversation listing and deletion.

# UI Elements and Functions

## Workspace Frame and Header Actions

### Sidebar Story Builder destination and active-story subtitle

The main sidebar contains **Story Builder**. When no story is active, selecting it starts a new working story. When a story is active, the entry returns to that builder and shows the current saved metadata title when available or **Unsaved Draft** otherwise. The sidebar destination is highlighted while either Story Builder or Character Builder is active because both edit the same story workspace.

The shared top bar begins with **Back** and the **Story Builder** title. The scrollable workspace begins with **Story Setup** and the subtitle **Configure the foundation of your interactive narrative.** Back returns an author to My Stories only after unsaved work has been durably saved, intentionally kept as recoverable work, or explicitly discarded. It must not imply that navigating away performed a save.

### Import, Export, Finalize and Close, and Save Draft

**Import** opens **Import Mode**. **Merge** says it preserves existing content and blends in imported values. **Rewrite** says it prefers imported values when a field already has content. Choosing a mode opens the operating-system file picker for TXT, Markdown, JSON, Chronicle, DOC, DOCX, RTF, HTML, or HTM input. A completed import shows a summary of updated story fields, updated and created characters, and added custom sections. When mapping or media portability is partial, **View import warning details** expands the numbered warning list. A rejected file or parsing failure shows an error without replacing the current working story.

**Export** opens **Export Story**. **Markdown** is a readable `.chronicle.md` export with embedded restore data. **JSON** is a full-fidelity `.chronicle.json` backup. **Word Document** downloads a Word-readable `.chronicle.rtf` file with embedded restore data. A success notice identifies the selected format; an export failure leaves the builder unchanged and offers retry.

**Finalize and Close** runs the complete readiness review. When it passes, the label becomes **Saving...**, duplicate actions are disabled, the source is saved as non-draft, and My Stories becomes the visible owner. When readiness fails, the builder stays open, displays the consolidated validation list, and moves to the first incomplete region. A persistence failure must leave the builder and working state open with a clear unsaved status.

**Save Draft** writes an incomplete story as an account-owned draft. During the request it becomes **Saving...** and cannot be submitted twice. Success should identify that the draft is durable; failure should say that it is still unsaved and retain recovery state. A signed-out author should receive an authentication prompt rather than a silent no-op.

An administrator also sees a settings gear labeled **Story Builder settings**. Its **Track API Usage** toggle shows Off, Updating, an error, tracking this story, or tracking another story. This is diagnostic capture for API review; it neither changes story content nor validates persistence.

## Character Roster and Character Creation

### Main Characters and Side Characters groups

The left **Character Roster** pane has collapsible **Main Characters** and **Side Characters** groups. Each group header reports expanded state and reveals its story-owned cards plus an add tile. The responsive layout places the roster above the story content on smaller screens and beside it on larger screens; both panes remain independently scrollable where the viewport allows.

A character card shows the avatar or the first letter of the name, the character name, and an **AI** or **User** ownership badge. Selecting the image expands or collapses an available avatar. The pencil action opens that story-owned character in Character Builder. Readiness errors appear below the affected card. The Main Characters add tile also carries missing-AI and missing-user errors because both control types are required before finalization or publication.

### Character Creation and Global Character Library

The **Main Character** and **Side Character** add tiles currently open the same **Character Creation** chooser. **Import from Library** says it browses and imports an existing character. **+ New Character** says it creates a new profile from scratch. Either branch transfers the user to a deliberate source or editor; choosing the tile's current group does not silently override the imported or newly authored profile's own Main/Side setting.

**Import from Library** opens **Global Character Library**. It explains that the user is selecting a character to import into the scenario. A search field filters by name or tags. Cards show avatar, name, and tags; clicking a card expands its image, while **Import** loads the full profile and becomes **Loading** during the request. **No matching characters found in library.** is a real search/empty result only after loading succeeds. Load and full-profile failures must remain distinguishable and retryable.

Import creates an independent story-owned identity. A library UUID must not be reused as the child's durable story UUID. Once the copy is in the roster, the roster pencil and Character Builder own story-scoped edits. The Character Library source remains unchanged.

## Story Card

### Cover frame and media source actions

The **Story Card** begins with a portrait cover frame. With no image it shows **No Cover**. **Upload Image** opens **From Device** and **From Library**. From Device accepts one image and should normalize it for a portrait cover before uploading it to private story-cover storage. From Library opens **Select from Image Library**, lets the owner browse folders and private images, copies the chosen source to the story-cover destination, and then adopts that destination path.

### Shared My Images source picker

The cover and scene **From Library** actions use the same **Select from Image Library** picker. Its folder view shows each folder's available cover or fallback, image count, name, and optional description. Loading is distinct from **No folders yet** / **Create folders in the Image Library first**; folder-load failure identifies the error and offers **Retry**. Selecting a folder changes the title to that folder's name and exposes **Back to folder list**.

Inside a folder, the picker shows an image-loading state, **No images in this folder** only after a successful empty result, and an image-load error with **Retry**. Images whose durable path still needs migration are disabled and labelled **Migration pending — re-upload required**. Selecting an eligible image adds a visible check. The footer provides **Cancel** and **Select Image**; selection is disabled until an eligible image is chosen and becomes **Copying…** while the private destination copy is active. Copy failure keeps the source available, reports that it could not be used, and permits retry.

**AI Generate** opens **Generate Cover Image**. The modal contains **Prompt**, an optional collapsible **Negative Prompt**, safe art-style cards, a 2:3 portrait tip, **Cancel**, and **Generate Cover**. Generate remains disabled without a prompt and becomes **Generating...** while active. A validation or provider/storage failure appears inside the modal and keeps the prompt available.

After a cover is adopted, **Cover image options** contains **Reposition image** and **Delete image**. Reposition enables pointer or touch dragging within the portrait frame and shows **Done**. Delete opens **Remove cover image?**, explains that the cover will be removed from the scenario, and offers Cancel or the shared confirming action. Removing the cover changes working state; durable row and object consequences must be confirmed by the later save and cleanup workflow.

### Story Name and Brief Description

**Story Name** is the durable title used by My Stories and public presentation. **Brief Description** is the short story-card summary. Each field has an **Enhance with AI** sparkle that first opens **Enhancement Style**. Precise generates compact semicolon-separated points; Detailed generates a short vivid description. While one enhancement is active, other enhancement triggers are disabled. Failure keeps the original value and shows a retryable error.

Save Draft may preserve an incomplete story, including a missing Story Name. Story Name and Brief Description are both required for finalization and publication. Missing values receive field-local text and a marked region when readiness validation runs.

## World Core and Custom World Content

### Story Premise and Primary Locations

**Story Premise** is the central situation, conflict, and stakes supplied to downstream AI context. Its sparkle offers Precise or Detailed enhancement. The field is required for finalization and publication.

**Primary Locations** starts with authoring rows for a location name and description. **Add Location** appends another row. Each row's trash action removes that row from working state. At least one row with both a name and description is required before finalization or publication; blank helper rows do not satisfy that rule.

### Structured and Freeform custom content

**Add Custom Content** opens **Content Type**. **Structured** creates an organized section of label-and-description rows. **Freeform** creates a section of longer labeled text fields. Both have an editable Section Title and a section remove action.

Structured sections provide **LABEL**, **Description...**, an AI sparkle beside the label, row removal, and **Add Row**. When a label exists, AI enhances its description in the current story context. When the label is blank, AI may return both a label and description. Freeform sections provide **LABEL**, **Write your content here...**, row removal, and **Add Text Field**. Removing the last freeform row leaves one intentional blank authoring row rather than deleting the section.

Custom sections are optional. Empty UI scaffolding is not meaningful story data and must not be added merely because the section rendered. Explicit user edits, adds, removes, imports, and AI acceptance are the actions that should change working state.

## Story Goals

The **Story Goals** section displays one or more goal cards sorted by calculated progress. Each card has **Goal Name**, a progress ring, **Desired Outcome**, **Guidance Strength**, and **Steps**. The first goal carries a lock in place of delete; later goals have a remove action. **Add New Story Goal** appends another card.

Goal progress is calculated from completed steps. A step has a checkbox, editable description, AI enhancement, and remove action. **Add Step** appends a blank step. Checking a step strikes through its description and updates the fraction and percentage. The three guidance choices are **Rigid**, **Normal**, and **Flexible**, each with an explanatory paragraph describing how strongly roleplay should steer toward the goal.

At least one goal with both Goal Name and Desired Outcome is required for finalization or publication. Steps are optional. The section should never convert a merely displayed default blank goal into authored data without the user's add or edit action.

## Opening Dialog and Starting Clock

**Opening Dialog** is the first assistant text of every new session. Its guidance explains the character-name prefix and the locked dialogue, action, and thought formatting conventions. The text is required for finalization and publication.

**Starting Day & Time** contains a Day counter that cannot go below one and four time-of-day icon buttons: **Sunrise**, **Day**, **Sunset**, and **Night**. The selected icon is visually active and must also expose its accessible selected meaning.

**Mode** offers **Manual** and **Automatic**. Manual leaves time advancement to the playthrough controls. Automatic enables **Time Interval** with 5, 10, 15, 30, or 60 minutes. These values seed each new conversation, and Chat Interface may later allow conversation-level adjustment without rewriting the source opening settings.

## Scene Gallery

### Adding and viewing scenes

**Scene Gallery Photos** includes an information tooltip explaining that scene images can carry tags and support tag-driven dynamic backgrounds, with a recommended landscape format. **Upload Image** again offers **From Device** and **From Library**. Device input should normalize a landscape scene and upload it to the private scenes namespace. From Library copies a private reusable source into that namespace before adoption. **AI Generate** opens **Generate Scene Image** with **Scene Description**, art-style cards, a 4:3 landscape tip, Cancel, and **Generate Scene**.

The upload and generation actions show **Uploading...** or **Generating...** and block duplicate submission. Failure preserves the previous scene list and provides visible retry. With no scenes, the gallery says **No scenes uploaded** and **Upload images to enable dynamic backgrounds in chat.** That empty presentation must not appear as the only conclusion when loading or a request has failed.

### Scene card controls and Scene Details

Each scene card shows its image, title or **Untitled scene**, and a calculated aspect-ratio label while available. The star control marks or clears the one **Start** scene; setting one scene as starting clears the flag from all others. The trash control opens **Remove scene image?**, explains that the image will be removed from the gallery, and requires confirmation.

Selecting the card opens **Scene Details** with a large preview, **Title**, and **Tags**. Tags are added by pressing Enter, displayed as removable chips, and limited to ten. **Cancel** closes without committing the local modal edits. **Save** applies title and tags to working story state and closes the modal.

## Art Style Preference and AI Rules

### Art Style Preference

**Art Style Selection** displays safe presentation cards such as Cinematic 2.5D, Comic Book, Hyper-Realism, Modern Anime, and Photo Realism, or the current server-supplied safe set. One selection is active. Its tooltip explains that this preference shapes AI-generated character avatars or images during play. If the sanitized style source cannot load, Chronicle can use the bundled prompt-free fallback set and must not expose backend style prompts to the browser.

### Dialog Formatting, Custom Rules, and Additional Entries

**Custom AI Rules** begins with locked **Dialog Formatting** rules: spoken dialogue uses quotation marks, physical actions or descriptions use asterisks, and internal thoughts use parentheses. Those fixed instructions are visible but not editable.

**Custom Rules (Optional)** is editable and supports Precise or Detailed enhancement. It adds story-specific behavioral constraints without replacing the locked format. When world entries exist, **Additional Entries** shows cards with **Entry Title...**, **Detail the specifics...**, and a hover-revealed remove action. The Story Builder surface has no Add Entry control: it can edit or remove entries supplied by an existing source or import, but cannot create a new one here. These title-and-body records become story-owned reference entries on save.

## Content Themes

**Character Types** offers Female, Male, Non-binary, Transgender, Intersex, Futanari, Mythical, and Monster plus custom values. **Story Type** is a mutually exclusive SFW/NSFW choice. **Genre** offers Fictional, Fantasy, Romance, Dark Romance, Why Choose, Reverse Harem, Gothic Romance, Paranormal Romance, Enemies To Lovers, Hentai, Anime, Royalty, Action, Adventure, Religious, Historical, Sci-Fi, Horror, FanFiction, Philosophy, Political, Detective, and Manga plus custom values. **Origin** offers Original, Game, Movie, and Novel plus custom values. **Trigger Warnings** offers Cheating, Cuckold, CNC, NTR, Chastity, Hypno, BDSM, Voyeurism, Bondage, Impregnation, Sissification, Breeding, Femdom, Gore, Bloodplay, Forced Orgasm, Humiliation, Drug Use, Coercion / Manipulation, Blackmail, Somnophilia, Captivity, Physical Abuse, Domestic Violence, Murder, Stalking, Isolation Control, Medical Play, Age Gap, Incest, Pseudo-Incest, Degradation, Breath Play, Knife Play, Free Use, Self Harm, Eating Disorders, Mental Illness, and Dark Themes plus custom values. **Custom Tags** accepts arbitrary tags.

Selecting a predefined chip toggles it. Story Type clears the opposite choice. **Custom** reveals a text input; Enter or the plus action adds a unique value, Escape cancels, and each custom chip has a remove action. Readiness errors appear above the affected category. The product must make selection persistence visible and must not claim a chip is durable until the story's classification save succeeds.

## Share Your Story and Publication Controls

**Publish to Gallery** runs the readiness checklist. Failure shows **Please fix the following before publishing:** followed by every applicable story, cast, location, goal, cover, description, classification, and age error. Affected fields and sections are marked, the first error scrolls into view, and the list updates as corrections are made.

When readiness passes, **Share Your Story** first loads existing publication state. While loading, the modal shows progress rather than Publish or Unpublish controls. It identifies the story under **Publishing**. **Allow Edits** explains that other people may clone and edit their own copy. **What others can do** lists view/play, Like/save, and—when enabled—clone and edit their own version.

An unpublished story offers **Publish to Gallery**. A published story offers **Update Publication** and **Unpublish**, plus current Like, save, and play totals. The active action shows a spinner and blocks duplicate requests. A failure must keep the modal and previous publication state, say whether nothing changed, and allow retry. Unpublish removes public availability but preserves the owner source.

## Accessibility, Keyboard, and Feedback Contract

Every icon-only delete, remove, collapse, star, sparkle, information, and time-of-day control needs an accessible name and keyboard access. Dialogs need programmatic titles and descriptions. Selected chips, styles, story type, starting scene, time of day, and mode must expose state beyond color. Busy media, AI, import, save, and publication work should announce status. Destructive actions must describe the affected story reference and whether storage cleanup is separate.

Tab navigation should follow the complete interactive order. A helper may make long-form text entry efficient, but it must not skip actionable buttons between fields or remove them from normal keyboard navigation. Focus should return to the triggering control when a modal closes and move to the first invalid field only after the user requests validation.

# App Architecture

## Delivery Boundary and Runtime Entry

Story Builder is an internal stateful workspace mounted under the root SPA route. `src/App.tsx` registers `/`, installs authentication-adjacent providers, safe art styles, model settings, routing, and notifications, and renders `Index`. `src/pages/Index.tsx` owns the `world` internal tab, the active story identity and working `ScenarioData`, adjacent cover and content-theme state, modal state, and cross-capability callbacks. The shell supplies the sidebar and top bar; `StoryBuilderScreen.tsx` owns the story-level authoring surface.

The primary entry paths are:

1. Sidebar Story Builder with no active source calls `handleCreateNewScenario()`, creates defaults and a UUID, and opens `world`.
2. Sidebar Story Builder with `activeData` reopens the current working source.
3. My Stories New Story uses the same new-source path.
4. My Stories Edit calls `handleEditScenario(id)`, loads a source and children, resolves media, loads content themes, and opens `world`.
5. A permitted remix/copy path creates a separately owned story and opens that new identity.
6. Character Builder returns to `world` after saving or cancelling a story-owned character edit.

The router does not encode a story ID or builder mode in the URL. Refresh recovery depends on account bootstrap, My Stories selection, and browser safety snapshots rather than a deep-link route.

## Ordered Runtime and Data Flows

### Flow 1: create and edit working state

`createDefaultScenarioData()` supplies the default `ScenarioData`. `handleCreateNewScenario()` adds a UUID and resets cover, crop, classification, selected character, and conversation state. `StoryBuilderScreen` receives values plus immutable-style update callbacks. Story fields, cast, scenes, model/art settings, and opening state live under `activeData`; cover URL/path/crop and active content themes live in adjacent Index state. Builder-local state owns open dialogs, collapsed roster groups, selected scene editor, enhancement target, upload/generation busy flags, and current publish errors.

Existing-story edit calls `fetchScenarioById()`. It issues parallel reads for `stories`, `characters`, `codex_entries`, `scenes`, and `conversations`; messages are loaded separately for those conversations. It canonicalizes world core and UI settings, hydrates avatar, cover, and scene signed URLs from durable paths, and reconstructs `ScenarioData`. `handleEditScenario()` then loads `content_themes` separately. Backend source load is asynchronous, but the current screen has no dedicated builder-level requested-story loading or error model.

### Flow 2: character handoff

New character creates a UUID-backed story profile in `activeData.characters` and opens the `characters` tab. Character Builder edits that same in-memory object. Save clears its edit snapshot, returns to `world`, and invokes `saveDraftInBackground()`.

Import from Library refreshes private library summaries, fetches the selected full `characters` row, deep-clones it, and prepends it to the story cast. The intended ownership rule requires a new story character UUID. Current code retains the source UUID; the atomic save's ownership guard then correctly blocks reparenting the library row. This delivered mismatch is recorded below and does not weaken the product contract.

### Flow 3: text enhancement

A sparkle stores a field or row target and opens `EnhanceModeModal`. The selected mode plus current value, story context, cast, content themes, locations, goals, opening state, and entries are passed to `aiEnhanceWorldField()`. That service builds a bounded prompt, emits optional validation/usage diagnostics, and invokes the authenticated `chat` edge function with the selected model and non-streaming chat-completions transport. The edge validates auth, request size and shape, rate limit, and allowed model. A successful response is parsed and written to the current field; failure leaves working state and displays a toast.

Client API-validation snapshots run only when the local test session is enabled. Usage tracking is best-effort. Neither call prevents the authoring request or proves its semantic quality.

### Flow 4: cover upload, copy, generation, crop, and removal

Device upload reads one image, encodes it to JPEG with the shared resize helper, uploads to `story_covers_private/<user>/...`, and returns signed presentation plus durable path. My Images selection reads a private source path, signs and fetches the bytes, copies them to `story_covers_private`, and returns a sentinel/path. AI generation invokes `generate-cover-image`; the authenticated edge resolves the backend style prompt, calls the provider, records server usage, uploads exactly once to private cover storage, signs the result, and returns `imageUrl` plus `imagePath`.

All three branches set cover state, reset crop to 50/50, and enter reposition mode. Pointer/touch movement updates the crop percentage. Delete confirmation clears working cover state. None of the working-state removal paths currently deletes the private object.

### Flow 5: scene upload, copy, generation, tagging, and starting scene

Device scene upload encodes JPEG, writes the user-prefixed object to `scenes`, signs it, creates a UUID-backed `Scene`, prepends it, and opens Scene Details. My Images selection copies to the scenes destination and creates the same working record. Scene generation uses `generate-cover-image` with `destinationBucket: "scenes"`, a landscape prompt wrapper, and an art-style ID; the edge uploads once and returns the durable path.

Scene Details applies title and tags to working state only when Save is selected. `toggleStartingScene()` ensures at most one scene has `isStartingScene: true`. Remove confirmation deletes the working record. Before parent save, `ensureSceneImagesOwnedByUser()` verifies path ownership and copies cross-owner private media into the current user's namespace or throws. Import uses its clear-and-warn mode; normal save uses throw-on-failure.

### Flow 6: content themes

Content theme chip changes update `activeContentThemes` immediately. When the story has an authenticated user and active ID, `Index` also calls `saveContentThemes()` against the separate `content_themes` table. Story export receives the adjacent active themes explicitly. General scenario save writes `stories`, cast, entries, and scenes through `save_scenario_atomic`; it does not include content themes.

For an existing saved story, immediate theme upsert can persist after the owner mutation succeeds. For a brand-new story, the referenced `stories` row does not yet exist when the first chips change, so repository foreign-key/RLS rules can reject the early upsert. The later atomic story save does not retry themes. This is a current persistence gap described below.

### Flow 7: Save Draft and Finalize and Close

Finalize uses `handleSaveWithData()`, which requires an active story, data, user, and nonblank story name. It migrates any legacy non-UUID story/child IDs, derives story-card metadata, writes a browser `draft_<scenarioId>` safety snapshot, then calls `saveScenarioWithVerification()`.

`saveScenario()` normalizes cover identity, makes base64 cover and avatar media private, enforces scene ownership, builds story/character/entry/scene payloads, and invokes `save_scenario_atomic`. The repository function verifies `auth.uid()`, refuses another user's story, upserts the master row, deletes child rows absent from the payload, and inserts or updates only children attached to this story and owner. `saveScenarioWithVerification()` then counts characters, entries, and scenes; if any count is below the working-state expectation, it retries once and reports whether the second count matched.

The header Save Draft takes a separate `saveDraftInBackground()` path. It accepts incomplete content, uses **Untitled** when the Story Name is blank, writes the same browser snapshot, and calls the verified save with `isDraft: true` without leaving the builder. Finalize first runs `validateForPublish()`, dispatches field errors when needed, then calls `handleSave(true)` with default `isDraft: false`; a successful call clears active state and returns to My Stories. The finalize path removes the safety snapshot after the database call even when child verification returned false, while the log says it is retained. The draft path keeps the snapshot when verification is false. Those boundaries and their current gaps are recorded below.

### Flow 8: import

The import-mode chooser stores Merge or Rewrite and clicks a hidden file input. `readStoryImportFileText()` enforces 2 MB plain-text, 8 MB DOCX, 4 MB document-XML, 5,000-paragraph, and 500,000-character safety limits. DOCX extraction reads `word/document.xml`; unsupported or failed conversion can fall back with warnings unless a safety limit was exceeded.

`importScenarioFromAny()` recognizes Chronicle package v2, legacy payloads, raw `ScenarioData`, JSON, Markdown/plain text, HTML/DOC-like content, RTF, and heuristic headings. Merge combines text, unique categories, matching entries, scenes, characters, goals, and sections. Rewrite returns the imported package as the preferred working story. Conversations remain excluded from normal exports, but imports of a full package or raw scenario can carry conversation arrays into working data.

Imported scene paths pass through owner-portability handling. Media that cannot be copied is cleared with a warning. The result replaces current working data and updates adjacent cover/crop/theme state according to mode. Import is not durable until save succeeds.

### Flow 9: export

Export clones the working story, sanitizes UI settings, converts path-backed scenes to storage sentinels, injects adjacent cover/crop/themes, and excludes conversations by default. JSON serializes Chronicle package v2. Markdown renders readable chapters and appends a machine JSON block. Word builds RTF and appends hidden machine restore data. The browser creates an object URL, triggers download, removes the anchor, and revokes the URL.

The export artifact has no account or server mutation. It is only as durable as the downloaded file. Current cover export stores the presentation URL and crop but not a durable cover path; that media portability limitation is recorded below.

### Flow 10: publication

Both Finalize and Publish call the client readiness validator. Publish leaves the user in the builder and, after readiness, opens `ShareScenarioModal`. The modal calls `getPublishedScenario()` to load owner publication state. Publish or update upserts `published_scenarios` with source ID, publisher ID, reuse permission, empty publication tags, and active status. It then invokes `publish-cover` best-effort to mirror the private cover into the public `covers` bucket. Unpublish marks the publication inactive and asks the edge function to remove the public mirror.

Publication does not save the current working story first. The source must already exist durably and reflect the intended content before its publication record is updated. Current UI does not enforce or prove that prerequisite, and publication failures are console-only.

### Flow 11: handoff to play

Story Builder has no Play action. After a successful save, My Stories calls `fetchScenarioForPlay()` for the selected source. It loads story, cast, entries, scenes, cover and current themes; creates a conversation with the opening text, starting day/time, and time-progression settings; starts conversation persistence; and opens Chat Interface. That flow consumes durable source state, not unsaved builder memory, but the current handoff does not await conversation persistence before the chat becomes active.

## State Authority and Conflict Precedence

### Working state is authoritative only inside the open editor

`activeData` is the immediate authority for story text, world structure, cast, scenes, opening state, saved art/model fields, and UI settings during the current session. `activeCoverImage`, `activeCoverImagePath`, `activeCoverPosition`, and `activeContentThemes` override or supplement the corresponding display/editor state. Modal-local buffers such as scene title/tags are subordinate until their Save action commits them. Text enhancement reads the model from `ModelSettingsContext`, not from `activeData.selectedModel`; the shared setting therefore controls the request even when the story's saved model field differs.

The durable `stories` row and its child rows are authoritative after a verified owner save. A signed URL never outranks a stored path. A publication record never outranks the owned source. A conversation never becomes the authoring source. A transfer file does not outrank current working state until the user chooses Merge or Rewrite and the import parser returns successfully.

### Edit-load precedence is conditional and narrow

On edit, backend data normally wins. A browser `draft_<id>` snapshot is restored only when backend character count is zero and local snapshot character count is nonzero; Chronicle then attempts a background repair save. If backend characters exist, the local snapshot is deleted as stale without comparing other story fields or timestamps. Legacy snapshots have a similarly character-count-based branch. This delivered heuristic is not a general conflict-resolution contract.

### Verification is count-based

Post-save verification checks only that durable character, codex-entry, and scene counts are at least the expected counts. It does not compare field values, exact identity sets, cover, content themes, opening state, story draft flag, or media bytes. A true return therefore means those three counts were present after the RPC, not that the entire working source was byte-for-byte verified.

## Responsibility and Ownership Map

| Concern | Runtime owner | Durable owner or boundary | Visible result |
|---|---|---|---|
| Internal route and active story | `Index.tsx` | Browser session plus selected story ID | Story Builder or Character Builder workspace |
| Story authoring UI | `StoryBuilderScreen.tsx` and child components | Working `ScenarioData` | Story Setup sections and readiness feedback |
| Story cast editing | Character Builder workspace | Story-owned `characters` rows | Roster cards and downstream character behavior |
| Reusable character source | Character Library | Scenario-less owner `characters` row | Independent copy before story adoption |
| Reusable media source | My Images picker | `image_library` source object/row | Independent destination copy |
| Cover and scenes | Story Builder media hook | Private destination paths plus story/scene rows | Cover frame and Scene Gallery |
| Content themes | Index active theme state and `content-themes.ts` | `content_themes` row | Chips, My Stories/Gallery classification |
| Import/export | Scenario persistence hook and `story-transfer.ts` | Working state or downloaded file | Import summary/warnings or browser download |
| Story save | Scenario persistence service and atomic RPC | Owner `stories`, `characters`, `codex_entries`, `scenes` | Draft/final source in My Stories |
| Publication | Share modal and gallery service | `published_scenarios` plus public cover mirror | Community Gallery/Public Profile visibility |
| Play | My Stories/Gallery lifecycle | `conversations` and `messages` | Chat Interface session |
| AI text | `world-ai.ts` plus `chat` edge | Provider response; working field only until save | Enhanced field or visible error |
| AI media | cover/scene modals plus generator edge | Private storage object; parent reference only after save | Adopted cover/scene preview |
| Diagnostics | API validation and usage services | Optional diagnostic/usage records | Admin-only test status or engineering evidence |

## Persistence, Security, and External Dependencies

### Repository-defined database boundary

The current repository save path depends on `stories`, `characters`, `codex_entries`, `scenes`, and the `save_scenario_atomic` RPC. Content classification depends separately on `content_themes`. Publication depends on `published_scenarios`. Character Library and My Images add owner-scoped source reads. Art-style presentation depends on `get_public_art_styles`, while image and text AI depend on authenticated edge functions and provider credentials.

Repository migrations define owner checks in the atomic function and RLS that allows owners to mutate their source rows. The synchronized Supabase reference describes stories, story-attached characters, entries, scenes, and themes as available to visible published-story flows at the table-purpose level, but several field rows still say Owner/Admin. It does not enumerate every RPC used here, including `save_scenario_atomic` and `get_public_art_styles`.

These are repository/reference-defined expectations, not proof of live deployment. Publication metadata visibility is documented; complete public authorization for every child read and private signed-media path was not exercised live. The deployed grants, policies, functions, buckets, and provider-secret configuration therefore remain unverified here; the Chronicle Work Manual governs any later live comparison.

### Private storage boundary

`story_covers_private`, `character_avatars_private`, `image_library`, and `scenes` are documented as private owner/admin media stores. Owners mutate user-prefixed paths. The `scenes` and private-cover descriptions also refer to curated visible-public read helpers for published, non-hidden stories. Runtime resolves durable paths into time-limited signed URLs and caches them in memory until shortly before expiry.

The public `covers` bucket is a publication mirror, written by the privileged publication edge flow rather than ordinary Story Builder clients. The inspected `promote_story_cover_to_public` repository function requires an authenticated story owner or administrator before it returns the source/destination paths used by the edge. A public cover mirror does not make the private authoring bucket broadly writable or turn its URL into source identity. The repository definition does not by itself prove the function or its grants match the deployed project.

### AI services and backend-only prompts

The browser sends a safe model or art-style ID. The `chat` edge function authenticates, rate-limits, validates request bounds, and restricts the selected model. `generate-cover-image` authenticates, rate-limits, resolves backend art-style prompts through service-role access, calls the image provider, writes the returned bytes to the requested private destination, and returns a signed display URL plus durable path.

Provider success is an external dependency, and usage recording is evidence rather than a credit or save transaction in the Story Builder UI. The current source was inspected, but no paid AI call was executed for this review.

## Diagnostics Versus Enforcement

### Diagnostic signals

Toasts currently cover world-field AI failure, My Images picker failures, and some model-selection problems. Cover generation maintains modal-local error text. Import/export post a top-bar notice and import warnings. Console output records loads, uploads, scene generation, save verification, publication, theme persistence, and character-copy failures. API validation snapshots and usage events can record covered calls when enabled.

These signals describe what code attempted. They do not prove database mutation, storage cleanup, publication visibility, complete transfer fidelity, or deployed authorization.

### Enforcement points

Supabase Auth, deployed RLS, storage policies, authenticated edge functions, the atomic function's owner guards, request-size/rate limits, and the publication service's owner policy are enforcement. Client readiness validation enforces only whether the current UI proceeds to its next client action. Disabled buttons, local UUID checks, signed URLs, console logs, browser snapshots, count verification, and API test toggles are not security or durable-data enforcement.

## Current Implementation Limitations

### Entry, navigation, save feedback, and recovery

- Story Builder is directly enterable while signed out, but Save Draft simply returns when there is no user and displays no authentication prompt or failure. Device cover upload also returns silently; scene upload and scene generation log sign-in errors only. A readiness-complete signed-out Publish sets local modal state, but the Share modal is mounted only when `user` exists, so no publication or auth UI appears.
- The Character Library and My Images pickers do not have a distinct signed-out presentation in this builder flow. Current signed-out inspection reached an empty Image Library result, so lack of authentication can be mistaken for a genuinely empty reusable collection.
- The header Back action clears the active story and returns to My Stories without an unsaved-change confirmation, safety snapshot, or save. Sidebar navigation through `handleNavigateAway()` does write a local snapshot, but a brand-new unsaved story has no My Stories registry record through which to recover it.
- Save Draft delegates to `saveDraftInBackground()`, which catches failures internally. The header therefore cannot distinguish success from failure and clears its Saving state after a fixed delay. It shows no durable-success notice or unsaved-after-failure state.
- Save Draft omits `activeCoverImagePath` from its save metadata. An existing or newly adopted cover that is displayed through a signed URL can therefore be rewritten as that expiring URL with a null durable path, even though Finalize threads the private cover path correctly.
- Finalize and Close ignores the boolean returned by `handleSave(true)`. After a persistence failure it remains in the builder but shows no visible save failure. A twelve-second safety timer changes only the busy flag.
- `handleSaveWithData()` removes the browser safety snapshot after the database request even when child count verification returns false, contradicting the log that says the snapshot was retained. The edit-recovery heuristic compares only character presence, discards snapshots whenever backend characters exist, and does not compare timestamps or other story fields.
- Existing-source master-row load failure is console-only. The requested source can fail to open with no builder-level error or retry. `fetchScenarioById()` does not inspect the returned errors from its character, codex-entry, scene, or conversation queries, and its follow-up message read consumes only `data`; those failures can open a partial story with empty child arrays instead of a failed-load state. A later atomic save treats the client child arrays as the complete owned set and deletes rows omitted from the payload, so saving after a partial edit load can delete durable children that were merely unreadable. `fetchScenarioForPlay()` repeats the unchecked character, codex-entry, scene, and conversation reads, so Play can also open an incomplete source without a source-load failure. The edit loader additionally fetches conversation/message history that Story Builder does not display. Content-theme load failure logs and substitutes defaults. Art-style loading silently falls back, which is safe for prompts but does not tell the author the presentation set may be stale.

### Content-theme persistence

- Content themes are outside `save_scenario_atomic`. A chip change immediately upserts `content_themes`, but a new story's parent row does not exist yet. Repository foreign-key and owner policies can reject that upsert; the failure is console-only. The later Save Draft or Finalize does not retry the themes, and the successful save clears the local safety snapshot that contained them. A new story can therefore reopen with default classifications despite having displayed selected chips before save.
- Import updates `activeContentThemes` and `ScenarioData.contentThemes`, but the ordinary story save still does not persist the row. Rewrite cover/theme editor state can appear adopted without a durable classification save.
- Classification chip interactions have no per-change busy, rollback, or unsaved indicator. Rapid changes can race separate upserts, and a rejected later write is not visibly distinguished from the selected local state.

### Character copy identity

- Character Library import deep-clones the reusable profile without assigning a new UUID. `save_scenario_atomic` correctly refuses to update the scenario-less library row under a story parent. The profile can appear in the roster but cannot persist through the normal save. The intended contract remains a separately identified story-owned copy.
- The Main Character and Side Character add tiles invoke the same chooser and do not pass the selected group into new-character creation. New characters default to Main and AI until Character Builder changes them.
- Saving a story-owned character returns to Story Builder and calls `saveDraftInBackground()` with `isDraft: true`. Editing a previously finalized story character can therefore turn the entire source back into a draft without a separate story-level decision or visible explanation.
- The Global Character Library picker treats refresh failure as an empty or no-match result and full-row fetch failure as console-only. Its custom dialog content has no programmatic DialogTitle or Description, and its close button has no accessible name.

### Reuse and play handoffs

- The saved-story remix path generates new structural child IDs and makes supported scene media portable, but it does not load or persist the source `content_themes`; Story Builder opens the copy with default classifications. It also passes the hydrated cover presentation without the source durable cover path and retains source-owner character avatar paths rather than copying those media objects. The current copy can therefore be structurally independent without being classification- or media-independent.
- `getScenarioOwner()` converts an owner-read error to null. `handleEditScenario()` treats that null as non-ownership when a user is present, so an owned story can be diverted to the remix confirmation after a separate authorization-read failure.
- The My Stories Play handoff starts `saveConversation()` without awaiting it, then opens Chat Interface. Conversation-save failure is console-only, so a playthrough can appear active before its conversation row and opening message are proven durable.

### Media lifecycle and portability

- Device upload, My Images copy, and AI generation create a private object before the parent story saves. Replacing or deleting a cover, deleting a scene, abandoning the story, import rewrite, or later save failure does not delete the old object. Cover and scene removal therefore clear working references but can orphan storage.
- Scene Details saves `scene.title` into working `ScenarioData`, and transfer files can carry it, but the atomic scene payload and current `scenes` table mapping contain no title field. A title entered in the modal is therefore lost after a database save and reload even when the scene image, tags, and starting flag persist.
- The shared `resizeImage()` helper is orientation-dependent rather than a strict bounding box. A landscape image caps width but can still exceed the requested height; a portrait image caps height but can still exceed requested width. Current cover and scene device uploads therefore do not always meet the intended 1024×1536 or 1024×768 bounds.
- Image Library copy prefers the source filename extension over the fetched blob type. Current My Images uploads store JPEG bytes but can retain an original `.png` or `.webp` filename, so a Story Builder destination can receive JPEG content under a non-JPEG extension.
- Normal export includes the current cover presentation URL and crop but no durable `coverImagePath`. A signed private URL can expire and a different account cannot reliably restore or copy the cover. Path-backed scenes export as storage sentinels; cross-owner import tries to copy them, but a recipient without source read permission receives a warning and the scene image is cleared.
- Import updates the adjacent cover presentation and crop but never updates or clears `activeCoverImagePath`. When Rewrite or Merge changes the cover of an existing story that already has a durable path, the stale path can outrank the imported presentation during the next save and persist the prior cover instead.
- Imported base64 covers are privatized on save. A plain remote or signed cover URL is left as a legacy transition value when no path exists, which can persist an expiring or externally controlled URL.
- Cover selected from My Images awaits signing without a visible copy/adoption busy state after the picker closes. If signing fails, a storage sentinel can become the `<img>` source. Scene selection can create a record with an empty preview when signing fails. Device scene upload falls back to `getPublicUrl()` for the private `scenes` bucket when signing fails, a URL the repository helper itself identifies as anonymously unreachable.

### AI and publication feedback

- Scene generation catches provider/storage or signed-out failure and logs it but renders no modal error. Because the modal awaits a parent handler that catches and does not rethrow the failure, it then clears the user's scene prompt while leaving the modal open. Device cover/scene upload failures are console-only. The cover generator does show error text, so the two generation dialogs do not share one failure contract.
- Share modal publication-status load failure is console-only and then presents the story as unpublished. Publish, Update Publication, and Unpublish failures are console-only. The user receives no assertion that prior publication state was preserved.
- Publish does not save current working state first and does not require that the story exists in `stories`. Publishing a new unsaved story can fail the publication foreign-key/owner path; publishing an already saved story can publish stale backend content while newer working edits remain unsaved.
- The public cover mirror is explicitly best-effort. Publication can report a locally published state even if the mirror invoke fails, leaving public media presentation incomplete until another reconciliation.
- The modal constructs an optimistic `existingPublication` with zero or preserved counts after publish rather than refetching authoritative publication state. My Stories publication badges are not refreshed by this builder action in the same flow.

### Stable-state and accessibility gaps

- `StoryGoalsSection` seeds one blank goal by effect when none exists, so merely opening a goal-less story mutates working state. Freeform custom world content can call `updateCore()` during render to migrate or create a blank row. Optional scaffolding is therefore not consistently separated from authored data.
- Additional Entries can arrive through an existing source or import and can be edited or removed, but Story Builder exposes no control for creating a new entry.
- Story Builder's text enhancement uses the profile-backed shared model setting, while scenario persistence writes `activeData.selectedModel`. The builder provides no visible reconciliation when those values differ, so the model that generated an enhancement need not match the model field stored with the story.
- The guidance-strength track and labels are clickable non-semantic `div`/`span` elements with no keyboard slider or radiogroup behavior. Several location, custom-section, goal, step, scene, tag, and entry remove controls lack accessible names; some are removed from Tab order with `tabIndex={-1}` or revealed only on hover.
- Sunrise/Day/Sunset/Night controls have titles but no selected-state semantics. Scene starting-star and delete actions are hover-dependent, and the delete scene button has no accessible name. Many custom theme chip remove/add icons also lack accessible names.
- `ChooserModal` renders a visible `<h3>` but no Radix `DialogTitle` or `DialogDescription`; current live inspection emitted corresponding accessibility warnings for Import, Export, Character Creation, Content Type, and Enhancement Style. `TabFieldNavigator` intercepts Tab between text inputs and can skip intervening buttons in the natural focus order.
- Save, publication, upload, and generation progress is largely visual and is not consistently announced as status. Some labels are visually adjacent rather than programmatically associated with their inputs.

### Test coverage gaps

`publish-validation.test.ts` covers readiness rules. `story-transfer.test.ts` covers transfer formats, merge/rewrite, warnings, and restore behavior. `docx-import.test.ts` covers extraction and safety limits. `scene-media-portability.test.ts` covers owner-path copy and clear/throw behavior. `api-usage-validation.test.ts` covers diagnostic shape construction.

There is no focused Story Builder component test that exercises the full top-bar-to-builder workflow, unsaved navigation, theme persistence, save feedback, publication, signed-out actions, media object cleanup, accessibility, or the imported-library UUID conflict. No existing test proves `save_scenario_atomic` is deployed or that a current story save preserves every field beyond the three child counts. **SB-ISSUE-001** tracks Builder-owned save, classification, character-copy, and publication divergence; **SB-ISSUE-002** tracks media portability and action-recovery gaps. My Stories owns saved-story reuse and Play, whose persistence limitations are tracked separately by **MS-ISSUE-002**. No active Current Work or modern accepted closeout is currently registered for Story Builder. Its Changelog tab includes eight positively mapped historical Quality Hub records for navigation, field contracts, Custom AI Rules, AI Enhance, and media ownership; those records remain historical rather than modern acceptance. The Knowledge tests prove seven-tab registration and isolation; they do not repair or behavior-test these runtime limitations.

## Curated Source and Test Map

### Route, shell, and workspace orchestration

| Source | Story Builder responsibility |
|---|---|
| `src/App.tsx` | Registers `/` and installs shared providers and routing. |
| `src/pages/Index.tsx` | Owns active story/editor state, internal tabs, header callbacks, theme persistence, and cross-capability dialogs. |
| `src/components/chronicle/GalleryHub.tsx` | Exposes publication Save and Play, including reuse permission presentation, before downstream ownership transfers. |
| `src/components/chronicle/StoryHub.tsx` | Exposes My Stories Edit, reuse confirmation entry, and Play actions that initiate the builder or conversation handoffs. |
| `src/components/app-shell/AppSidebar.tsx` | Exposes Story Builder and the active-story subtitle. |
| `src/components/app-shell/AppShellTopBar.tsx` | Owns Import, Export, Finalize and Close, Save Draft, diagnostic settings, and transfer notices. |
| `src/components/app-shell/AppShellWorkspace.tsx` | Mounts the selected lazy workspace beneath the shared shell. |
| `src/hooks/use-auth.ts` | Supplies the authenticated account boundary consumed by Index and Story Builder. |
| `src/hooks/use-index-authenticated-data.ts` | Bootstraps owner stories and reusable Character Library summaries used by builder entry and copy flows. |
| `src/hooks/use-index-dialog-state.ts` | Owns Import, Export, Character Library, authentication, and related cross-workspace dialog state. |
| `src/hooks/use-index-scenario-lifecycle.ts` | Creates, loads, clones, plays, and returns stories across My Stories, Story Builder, and Chat Interface. |
| `src/hooks/use-index-scenario-persistence.ts` | Owns safety snapshots, draft/final save, import/export, navigation stashing, registry refresh, and verification handoff. |
| `src/hooks/use-index-character-workspace.ts` | Owns new/story character editing and the current Character Library import-copy behavior. |

### Story Builder UI

| Source | Story Builder responsibility |
|---|---|
| `src/features/story-builder/StoryBuilderScreen.tsx` | Composes all story sections, working updates, AI enhancement, validation, roster, and publication entry. |
| `src/features/story-builder/components/StoryCardSection.tsx` | Cover frame, crop menu, Story Name, Brief Description, and cover source actions. |
| `src/features/story-builder/components/SceneGallerySection.tsx` | Scene grid, empty state, aspect metadata, starting-scene and deletion controls. |
| `src/features/story-builder/components/StoryBuilderMediaModals.tsx` | Scene edit/generation and cover/scene deletion modal composition. |
| `src/features/story-builder/components/StoryBuilderFieldLabel.tsx` | Text-field labels and sparkle/busy behavior. |
| `src/features/story-builder/hooks/use-story-builder-media.ts` | Upload, copy, generation, signing, crop, scene edit/delete, and working-state media transitions. |
| `src/features/story-builder/sidebar/StoryRosterSidebar.tsx` | Main/Side group composition and readiness errors. |
| `src/features/story-builder/sidebar/StoryRosterGroup.tsx` | Collapsible group and add tile. |
| `src/features/story-builder/sidebar/StoryRosterCharacterTile.tsx` | Avatar expansion, identity/control presentation, and Character Builder entry. |
| `src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx` | Main/Side add control. |
| `src/components/chronicle/AutoResizeTextarea.tsx` | Provides expanding text entry across story, goal, world, and opening fields. |
| `src/components/chronicle/StoryGoalsSection.tsx` | Goal, outcome, progress, step, and default-goal behavior. |
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Rigid/Normal/Flexible guidance UI. |
| `src/components/chronicle/CircularProgress.tsx` | Renders the reusable goal-progress indicator used by collapsed goal presentation. |
| `src/components/chronicle/ContentThemesSection.tsx` | Classification chips, custom values, and readiness feedback. |
| `src/components/chronicle/TabFieldNavigator.tsx` | Text-field Tab interception and current keyboard limitation. |

### Dialogs, source pickers, and media

| Source | Story Builder responsibility |
|---|---|
| `src/components/chronicle/StoryImportModeModal.tsx` | Merge/Rewrite chooser. |
| `src/components/chronicle/StoryExportFormatModal.tsx` | Markdown/JSON/Word chooser. |
| `src/components/chronicle/CharacterCreationModal.tsx` | Library/New character chooser. |
| `src/components/chronicle/CharacterPicker.tsx` | Private library search, full-profile load, and import action. |
| `src/components/chronicle/CustomContentTypeModal.tsx` | Structured/Freeform custom-world chooser. |
| `src/components/chronicle/EnhanceModeModal.tsx` | Precise/Detailed enhancement chooser. |
| `src/components/chronicle/ChooserModal.tsx` | Shared option-card dialog and current title/description gap. |
| `src/components/chronicle/CoverImageActionButtons.tsx` | Device/My Images cover menu and AI generation entry. |
| `src/components/chronicle/SceneGalleryActionButtons.tsx` | Device/My Images scene menu and generation entry. |
| `src/components/chronicle/CoverImageGenerationModal.tsx` | Cover prompt, negative prompt, styles, busy and error state. |
| `src/components/chronicle/SceneImageGenerationModal.tsx` | Scene prompt, styles, and generation busy state. |
| `src/components/chronicle/SceneTagEditorModal.tsx` | Scene preview, title, tags, Cancel, and Save. |
| `src/components/chronicle/AspectRatioUtils.tsx` | Computes the closest standard ratio and orientation displayed on scene cards. |
| `src/components/chronicle/ImageLibraryPickerModal.tsx` | My Images folder/image loading, source signing, destination copy, and retries. |
| `src/components/chronicle/ShareStoryModal.tsx` | Publication status, reuse permission, publish/update/unpublish, and metrics. |
| `src/components/chronicle/DeleteConfirmDialog.tsx` | Shared cover and scene destructive confirmation. |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Consumes the saved story, cast, goals, opening state, scenes, and tags after the Play handoff. |

### State formats, persistence, security, and services

| Source | Story Builder responsibility |
|---|---|
| `src/types.ts` | Scenario, world, opening, character, goal, scene, conversation, and classification shapes. |
| `src/utils.ts` | Default data, UUIDs, sanitization, timestamps, and image resize behavior. |
| `src/constants/content-themes.ts` | Predefined classification choices. |
| `src/constants/avatar-styles.ts` | Safe prompt-free art-style fallback. |
| `src/contexts/ArtStylesContext.tsx` | Safe art-style RPC, cache state, and fallback. |
| `src/contexts/ModelSettingsContext.tsx` | Shared selected-model ownership. |
| `src/lib/canonical-field-registry.ts` | Normalizes loaded world-core fields and decides whether repository data needs canonical backfill. |
| `src/lib/story-transfer.ts` | Package v2, readable exports, parser, Merge/Rewrite, summaries, warnings, and editor state. |
| `src/lib/docx-import.ts` | DOCX extraction and browser stability limits. |
| `src/services/world-ai.ts` | Story-context prompt construction, AI invocation, parsing, and diagnostics. |
| `src/services/llm.ts` | Builds the downstream roleplay prompt from the saved story, world, goals, cast, and rules. |
| `src/services/persistence/scenarios.ts` | Story load/play/save, media normalization, atomic payload, count verification, delete, and remix clone. |
| `src/services/persistence/characters.ts` | Character row mapping and private avatar hydration/library reads. |
| `src/services/persistence/conversations.ts` | Persists the conversation created by the downstream Play handoff. |
| `src/services/persistence/content-themes.ts` | Separate classification fetch/upsert path. |
| `src/services/persistence/media-settings.ts` | Uploads device covers and scenes into their private user-prefixed storage destinations. |
| `src/services/persistence/scene-media-portability.ts` | Cross-owner scene copy, clear, and throw policies. |
| `src/services/persistence/library-copy.ts` | My Images byte copy into cover and scene destinations. |
| `src/services/persistence/signed-media.ts` | Sentinels, signed URLs, one-hour cache, and refresh. |
| `src/services/persistence/shared.ts` | Supabase client and private base64-media conversion. |
| `src/services/supabase-data.ts` | Compatibility export surface used by Index and hooks. |
| `src/services/gallery-data.ts` | Publication and unpublication persistence plus cover mirror. |
| `src/services/api-usage-validation.ts` | Optional request-shape diagnostic snapshots. |
| `src/services/api-usage-test-session.ts` | Owns the administrator's per-story API diagnostic session toggle and status. |
| `src/services/usage-tracking.ts` | Best-effort client usage events. |
| `src/utils/publish-validation.ts` | Finalization/publication readiness rules. |
| `src/data/supabase-schema-reference.ts` | Synchronized documented tables and storage boundaries. |
| `src/integrations/supabase/types.ts` | Generated client-side Supabase types. |

### Server and repository policy

| Source | Story Builder responsibility |
|---|---|
| `supabase/functions/chat/index.ts` | Authenticated, bounded, rate-limited text AI transport. |
| `supabase/functions/generate-cover-image/index.ts` | Authenticated cover/scene generation and single-owner private upload. |
| `supabase/functions/publish-cover/index.ts` | Private-to-public cover mirror promotion and cleanup. |
| `supabase/functions/_shared/rate-limit.ts` | In-function request rate decisions and headers. |
| `supabase/functions/_shared/server-usage.ts` | Server-side AI usage event recording. |
| `supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql` | Atomic story save with owner and child-parent conflict guards. |
| `supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql` | Repository visible-public and owner/admin policies for stories and children. |
| `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql` | Publication-cover promotion RPC and its owner-or-admin authorization check. |
| `supabase/migrations/20260204061347_41d8784d-39df-4552-8fbf-5c620d013255.sql` | Content-theme table, foreign key, and initial policies. |

### Existing runtime tests and Knowledge integration tests

| Source | Story Builder responsibility |
|---|---|
| `src/utils/publish-validation.test.ts` | Readiness rules and adult-age validation. |
| `src/lib/story-transfer.test.ts` | Package, import/export, Merge/Rewrite, warnings, and restoration. |
| `src/lib/docx-import.test.ts` | DOCX extraction and safety limits. |
| `src/services/persistence/scene-media-portability.test.ts` | Private scene ownership and failure policies. |
| `src/services/api-usage-validation.test.ts` | Diagnostic presence logic. |
| `src/hooks/use-index-character-workspace.test.ts` | Current character working-state behavior and evidence gaps. |
| `src/components/app-shell/AppShellTopBar.test.tsx` | Shared top-bar regression coverage. |
| `src/data/chronicle-knowledge-base/story-builder-manifest.test.ts` | Stable-tab, source, source-composite, shared Supabase, and application-map contract. |
| `src/pages/style-guide/chronicle-knowledge-base.story-builder.test.tsx` | Real Knowledge renderer coverage for every registered Story Builder tab. |

## Inspected Source Set and Reproducible Composite

### Exact ordered source paths

The architecture review inspected these **92 existing paths** in this exact order:

```text
src/App.tsx
src/pages/Index.tsx
src/components/chronicle/GalleryHub.tsx
src/components/chronicle/StoryHub.tsx
src/components/app-shell/AppSidebar.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppShellWorkspace.tsx
src/components/app-shell/AppShellTopBar.test.tsx
src/hooks/use-auth.ts
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-dialog-state.ts
src/hooks/use-index-scenario-lifecycle.ts
src/hooks/use-index-scenario-persistence.ts
src/hooks/use-index-character-workspace.ts
src/hooks/use-index-character-workspace.test.ts
src/features/story-builder/StoryBuilderScreen.tsx
src/features/story-builder/components/StoryCardSection.tsx
src/features/story-builder/components/SceneGallerySection.tsx
src/features/story-builder/components/StoryBuilderMediaModals.tsx
src/features/story-builder/components/StoryBuilderFieldLabel.tsx
src/features/story-builder/hooks/use-story-builder-media.ts
src/features/story-builder/sidebar/StoryRosterSidebar.tsx
src/features/story-builder/sidebar/StoryRosterGroup.tsx
src/features/story-builder/sidebar/StoryRosterCharacterTile.tsx
src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx
src/components/chronicle/AutoResizeTextarea.tsx
src/components/chronicle/StoryGoalsSection.tsx
src/components/chronicle/GuidanceStrengthSlider.tsx
src/components/chronicle/CircularProgress.tsx
src/components/chronicle/ContentThemesSection.tsx
src/components/chronicle/TabFieldNavigator.tsx
src/components/chronicle/StoryImportModeModal.tsx
src/components/chronicle/StoryExportFormatModal.tsx
src/components/chronicle/CharacterCreationModal.tsx
src/components/chronicle/CharacterPicker.tsx
src/components/chronicle/CustomContentTypeModal.tsx
src/components/chronicle/EnhanceModeModal.tsx
src/components/chronicle/ChooserModal.tsx
src/components/chronicle/CoverImageActionButtons.tsx
src/components/chronicle/SceneGalleryActionButtons.tsx
src/components/chronicle/CoverImageGenerationModal.tsx
src/components/chronicle/SceneImageGenerationModal.tsx
src/components/chronicle/SceneTagEditorModal.tsx
src/components/chronicle/AspectRatioUtils.tsx
src/components/chronicle/ImageLibraryPickerModal.tsx
src/components/chronicle/ShareStoryModal.tsx
src/components/chronicle/DeleteConfirmDialog.tsx
src/components/chronicle/ChatInterfaceTab.tsx
src/types.ts
src/utils.ts
src/constants/content-themes.ts
src/constants/avatar-styles.ts
src/contexts/ArtStylesContext.tsx
src/contexts/ModelSettingsContext.tsx
src/lib/canonical-field-registry.ts
src/lib/story-transfer.ts
src/lib/story-transfer.test.ts
src/lib/docx-import.ts
src/lib/docx-import.test.ts
src/services/world-ai.ts
src/services/llm.ts
src/services/persistence/scenarios.ts
src/services/persistence/characters.ts
src/services/persistence/conversations.ts
src/services/persistence/content-themes.ts
src/services/persistence/media-settings.ts
src/services/persistence/scene-media-portability.ts
src/services/persistence/scene-media-portability.test.ts
src/services/persistence/library-copy.ts
src/services/persistence/signed-media.ts
src/services/persistence/shared.ts
src/services/supabase-data.ts
src/services/gallery-data.ts
src/services/api-usage-validation.ts
src/services/api-usage-validation.test.ts
src/services/api-usage-test-session.ts
src/services/usage-tracking.ts
src/utils/publish-validation.ts
src/utils/publish-validation.test.ts
src/data/supabase-schema-reference.ts
src/integrations/supabase/types.ts
supabase/functions/chat/index.ts
supabase/functions/generate-cover-image/index.ts
supabase/functions/publish-cover/index.ts
supabase/functions/_shared/rate-limit.ts
supabase/functions/_shared/server-usage.ts
supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql
supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql
supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql
supabase/migrations/20260204061347_41d8784d-39df-4552-8fbf-5c620d013255.sql
src/data/chronicle-knowledge-base/story-builder-manifest.test.ts
src/pages/style-guide/chronicle-knowledge-base.story-builder.test.tsx
```

### Composite algorithm and value

For each path above, in order, compute the SHA-256 digest of the file's current bytes and append one line in the form `<digest><two spaces><path><newline>`. Compute SHA-256 over that complete UTF-8 listing. This detects a changed source file, changed test, changed order, added path, or removed path.

Inspected-source count: **92 paths**.

Inspected-source composite: `09a7b0ab8da2339d56d3ab8ed0a829bfb074a8a1ee0cbfd01119aeab8e575644`

## Review Metadata and Evidence Limits

Review date: **08/22/2026**.

Inspected repository revision: `cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7` plus the current shared working tree. The revision identifies the checked-out base; concurrent uncommitted Phase work was preserved and is not represented by the commit alone.

Direct UI evidence: the local application at `http://localhost:8080/` was inspected signed out. The review opened Story Builder, inspected the entire Story Setup surface, opened Import Mode, Export Story, Character Creation, the signed-out Image Library picker, cover and scene generation, Content Type, and Enhancement Style, and ran the empty-story publication-readiness branch. Source code was used to verify every behavior claim and to keep unauthenticated empty states from being mistaken for authenticated data.

Not live-verified: authenticated story load, Character Library or My Images records, file-system import, exported file bytes, successful draft/final save, any Supabase mutation, AI provider output, storage upload/copy, publication success, public cover mirroring, Play, deployed RLS/RPC/storage policy, and failure branches that would spend credits or mutate data. The synchronized Supabase reference is the last documented structure, not live-deployment proof. These limits are explicit so a fresh agent does not convert source inspection into a claim of deployed behavior or human acceptance.
