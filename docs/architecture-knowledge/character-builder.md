# Overview

## Character Builder at a Glance

### Chronicle's character-profile authoring surface

Character Builder is the editor Chronicle uses when a person needs to define or revise one character profile. It brings identity, control assignment, story role, appearance, clothing, personality, voice, history, relationships, private facts, goals, custom material, and avatar media into one organized workspace. It is deliberately an authoring capability rather than a collection, story, or playthrough owner: the capability that opened Character Builder decides which character is being edited and where a successful result belongs.

Chronicle opens the same main Character Builder surface in two durable ownership contexts. **Character Library** opens it for a reusable account-owned profile that is not attached to one story. **Story Builder** opens it for a character copy that belongs to one story's cast. Both contexts offer the same broad profile categories, but they do not share a live character. A library profile remains reusable source material; a story character remains part of one authored story.

### The user promise

A successful Character Builder session lets the user understand which character and ownership context they are editing, move through all meaningful profile categories, make changes without silently overwriting another owner, use optional AI or media assistance, and deliberately choose whether to persist, copy, or discard the working result.

The durable promise is:

1. Editing starts from a known character snapshot or a clearly new profile.
2. Field changes remain working state until the context's explicit save action succeeds.
3. **Cancel** restores an existing character or removes a never-saved new character.
4. Saving a reusable profile changes only Character Library's source.
5. Saving a story character changes only that story's cast copy.
6. Copying between library and story contexts creates or updates an independently owned destination; it does not establish hidden two-way synchronization.
7. Avatar source, avatar destination, signed presentation URL, and character-row persistence remain distinguishable operations.
8. AI assistance proposes or generates working material; it never becomes persistence or permission authority.

## Entry, Preconditions, and Editing Contexts

### Account and story prerequisites

Authentication is required for durable character work. Library rows, story rows, private My Images sources, private avatar objects, AI requests, and account-scoped settings all depend on a signed-in identity. If authentication is missing or expires, Chronicle must explain the requirement, avoid implying that a save or upload completed, and preserve recoverable working text whenever doing so is safe.

Library editing also requires the Character Library collection to have loaded or a new reusable profile to have been started. Story editing requires an active Story Builder source and either an existing cast member, a new story character, or an eligible reusable profile selected for import. AI-assisted actions additionally require an available model or image-generation path. Avatar selection from My Images requires an eligible private source image with a durable source path.

### Reusable-library context

Character Library owns selection, search, collection membership, reusable-profile creation, reusable-profile deletion, and the decision to open Character Builder. Once a library card is selected, Character Builder owns the visible profile fields and working edits. The header identifies the Character Library context and uses **Update Character** as the explicit durable save action.

A new library profile begins as local working state. It becomes a durable reusable source only after **Update Character** completes successfully. Editing an existing profile captures the opening state for cancellation. **Cancel** discards the current edit session, while navigation away must never be presented as proof that unsaved work was persisted.

### Story-owned context

Story Builder owns cast membership, story context, and story persistence. It can open Character Builder from an existing roster card's edit action or create a new character and transfer directly into the editor. The Character Builder header identifies the story context, offers the story-character **Save** action, and returns the result to Story Builder.

A story-owned character is part of the current story working source. Saving the character returns the edited profile to Story Builder and requests persistence through the story's save boundary. The editor can also expose **+ Character Library** when the user wants a reusable copy or **Update Character** when the current session already knows which reusable copy to update. That action affects the reusable destination, not the story character's ownership.

### Library-to-story and story-to-library copy semantics

Importing a library profile into Story Builder must create an independent story character identity. The copy may begin with the source's authored details and avatar reference, but the story copy receives its own parentage and lifecycle. Later library edits must not rewrite the story character, and later story edits must not rewrite the library source.

Copying a story character to Character Library follows the same ownership rule in the other direction. Character Library becomes the owner of the reusable destination. Repeating an explicit update to a known reusable destination may revise that destination, but no copy relationship implies continuing synchronization. A fresh agent should treat the two rows as independent after the handoff.

## Character Identity and Authoring Model

### Basics establishes who the character is

The **Basics** area establishes the profile's name, nicknames, age, sex or identity, sexual orientation, current location, role description, control assignment, main-or-side role, and avatar. **Controlled By** distinguishes an AI-run character from a user-run character. **Character Role** distinguishes a main cast member from a side cast member. Those settings are authored source data; a later Chat Interface conversation can layer playthrough-specific state without rewriting the original source automatically.

Character identity is broader than the visible name. The durable character ID and parent ownership decide which source is being changed. Renaming a profile must not be mistaken for creating a new independent character, and copying a profile must not reuse identity merely because the visible content began the same.

### Built-in sections organize roleplay-relevant detail

Character Builder supplies a stable set of built-in authoring categories:

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

Physical Appearance, Currently Wearing, Preferred Clothing, and Background combine fixed fields with user-added label-and-description rows. Tone, Key Life Events, Relationships, Secrets, and Fears are extensible row collections. Personality can be a standard list or separate outward and inward traits. Character Goals combines named goals, desired outcomes, guidance strength, steps, and calculated progress.

Sidebar completion rings summarize filled authored fields. They help the user navigate an incomplete profile, but they are not permission checks, save confirmations, publication validators, or guarantees that the character is suitable for a particular story.

### Custom Content extends one profile

**Custom Content** lets the user add a **Structured** or **Freeform** profile section. Structured content uses editable label-and-description rows. Freeform content uses open text fields. A custom section can be renamed, collapsed, expanded, populated, and removed within the current editing context.

Custom content belongs to the same character as the built-in fields. It follows the same save, cancellation, copy, privacy, and downstream-consumption rules. Adding a custom field does not modify Chronicle's global Character Builder schema for other profiles.

## Complete Character Workflows

### Create a new reusable profile

1. The signed-in user opens Character Library.
2. **New Character** creates a blank account-scoped working profile and opens Character Builder.
3. The user fills Basics, chooses control and role, adds detail sections, and optionally adds an avatar, AI suggestions, goals, or custom content.
4. The editor keeps those changes in the current library working set.
5. **Update Character** writes the reusable profile through the Character Library persistence path.
6. A successful update keeps the profile available to Character Library and future explicit import choices.
7. **Cancel** before the first successful update removes the never-saved profile from working state.

### Edit an existing reusable profile

1. Character Library supplies the selected profile and captures its opening state.
2. Character Builder displays that profile's current authored values and private avatar presentation.
3. Changes update working state immediately so section summaries, completion rings, avatar preview, and AI context reflect the current draft.
4. **Update Character** deliberately replaces the durable reusable row after the request succeeds.
5. **Cancel** restores the captured opening state.
6. Later story copies remain independent of the reusable source.

### Create or edit a story character

1. Story Builder opens Character Creation, starts a new character, or selects an existing roster character.
2. Character Builder receives the story-owned target and the active story context.
3. The user authors the profile with the same visible sections available to a reusable character.
4. **Save** returns to Story Builder with the edited cast member and requests the story's draft persistence path.
5. **Cancel** removes a never-saved new character or restores an existing story character's opening state, then returns to Story Builder.
6. Story Builder remains responsible for cast membership, story validation, final save, publication readiness, and the later Play handoff.

### Import a reusable profile into a story

1. Story Builder opens **Global Character Library**.
2. The user searches the available reusable sources and requests **Import** on one profile.
3. Chronicle loads the full source profile rather than relying on the lightweight picker summary.
4. The handoff creates an independently identified story copy and closes the picker.
5. Story Builder displays the copy in its roster; Character Builder owns subsequent field edits to that story-owned copy.
6. Saving the story persists the child under the story owner without altering the reusable source.

### Copy a story character to Character Library

1. A story character is open in Character Builder.
2. The user selects **+ Character Library**.
3. Chronicle creates an independently identified reusable destination owned by the signed-in account.
4. The working story character stays in the story.
5. If the current session has an explicit known mapping to that reusable destination, the action becomes **Update Character** and revises that destination only.
6. The library destination can later be imported into other stories as a new independent copy.

### Add, replace, reposition, or remove an avatar

An avatar can begin with no image, a device image, a My Images source, or an AI-generated result. **From Device** prepares and uploads a new private avatar object. **From Library** copies eligible My Images bytes into the character-avatar destination. **AI Generate** creates a private destination object through the avatar-generation service. All successful source branches return a durable destination path plus temporary signed presentation data to the working character.

After adoption, the editor recentres the image and enters reposition mode. The user can drag the focal point and choose **Done**. An existing avatar menu offers **Reposition image** and **Delete image**. Changing the working avatar does not by itself prove that the character row saved. Cancel, failure, replacement, and deletion must leave the last durable character state understandable and must not make expiring signed URLs the stored ownership boundary.

### Use AI Fill or enhance one field

**AI Fill** accepts optional guidance and a choice about whether to strongly use current profile details. It is intended to fill only eligible empty fields in the working profile. Existing authored values remain authoritative unless the user directly edits them or selects a field-specific enhancement.

Eligible sparkle controls open **Enhancement Style**. **Precise** requests short semicolon-separated attributes. **Detailed** requests a brief vivid description. A successful field request replaces only the selected value or, for an intentionally blank extensible row, supplies the requested label-and-description pair. Failure preserves the previous field and supports retry.

AI Fill and field enhancement may use active story context in story mode. Library mode does not invent a story owner. In both modes, AI output remains working state until the correct library or story persistence boundary succeeds.

### Define personality, goals, and custom sections

Personality can stay in **Standard** mode or split into **Outward Personality** and **Inward Personality**. Each trait has a label, description, and **Rigid**, **Normal**, or **Flexible** setting. Switching modes must preserve meaningful authored traits rather than silently discarding them.

Goals carry a name, desired outcome, guidance strength, ordered steps, completion state, and progress. Progress is derived from step completion when steps exist. Guidance strength explains how strongly Chat Interface's AI should steer toward the goal; it does not force a save or prove that downstream runtime accepted the goal.

Custom sections supplement those built-in structures. Removing a row or section changes the current profile draft and must remain reversible through the edit-session recovery boundary until a save succeeds.

## Invariants, Privacy, and Permissions

### Ownership must remain visible and independent

Character Builder must never blur these three layers:

- the reusable Character Library source;
- the story-owned cast member;
- the session-scoped character state used by an active Chat Interface conversation.

The visible editor can share controls across layers, but the caller and durable parent decide what a save means. A library update does not rewrite a story. A story save does not rewrite the reusable source. A Chat Interface session update does not automatically rewrite either source. Any explicit copy creates a new ownership boundary before the destination is treated as durable.

### Character data is private unless a story lifecycle exposes it

A character can contain names, sexual identity, sexual orientation, genital detail, clothing, relationships, secrets, fears, goals, and other adult or NSFW roleplay material. A reusable library row is private account data. A story-owned character can later participate in a publication, at which point the story's visibility rules—not Character Builder alone—decide what a permitted viewer may read.

Reusable and story-attached characters share persistence infrastructure, so documentation about visible published-story characters must never be misread as making private reusable profiles public. Interface filters communicate intent; authenticated row, media, and server authorization remain the final security boundaries.

### Private avatar media has a separate boundary

Character avatars use a private character-avatar destination. Durable character state stores a private media reference; signed URLs are temporary display credentials. My Images remains the source owner until a copy creates a character-owned destination object. A generated image likewise belongs to the avatar destination before the parent character adopts it. Database, media, and server policies—not the visible picker or preview—must enforce access.

### Administrative presentation controls are not profile ownership

An authorized administrator can configure imagery used behind Character Builder's section-navigation buttons. That is shared application presentation, not character data. Ordinary users can consume the configured presentation without gaining permission to modify global settings. Administrative media and settings writes must remain gated independently from profile editing.

## Loading, Empty, Failure, and Recovery Expectations

### Loading and empty are different conclusions

Character Builder depends on the capability that opens it. Character Library must finish or fail its account collection load before a no-profile result is called empty. Story Builder must finish or fail the requested story and cast load before a missing character is called absent. Global Character Library and My Images pickers have their own loading boundaries. Art-style, AI, upload, copy, save, and delete requests need control-local busy state rather than turning the whole profile into an unexplained blank page.

A new character legitimately begins with empty fields, **No Avatar**, incomplete progress rings, no custom sections, and no authored optional rows. That state is an invitation to author, not an error. A loaded library with no reusable profiles, a story with no cast, a filtered no-match result, an ineligible legacy media row, a missing selected record, and a failed request are different conditions and must be explained separately.

### Working state and durable state must remain distinct

Typing, choosing a mode, adding a row, selecting an avatar, repositioning media, or applying AI output updates the current draft. None of those actions proves a library upsert or story save. The header must communicate when a save is pending, successful, failed, or still needed. Leaving the editor must not be described as saving unless the persistence operation actually completed.

For an existing profile, **Cancel** restores the opening snapshot. For a new profile, **Cancel** removes the never-saved object. If a background save fails, the edited character must remain recoverable and visibly unsaved. If the source record changed outside the current session, Chronicle should prefer an explicit conflict decision over silently overwriting newer durable data.

### Request failures preserve the last confirmed state

AI Fill, field enhancement, avatar generation, device upload, My Images copy, library update, story save, import, and deletion are separate request boundaries. A failure in one must not be converted into success by a console message, progress ring, closed dialog, local array update, validation snapshot, or usage event.

Failure should preserve the prior authored field or avatar, explain which operation did not complete, and offer a safe retry or deliberate cancellation. A copy failure leaves the upstream source unchanged. A save failure keeps the edited draft recoverable. A delete failure keeps the character visible. A generated or uploaded media object that exists without a successful parent save requires explicit unsaved status and an eventual cleanup rule.

### Accessibility is part of recovery

Every meaningful icon-only action needs an accessible name and keyboard route. Section controls, avatar options, AI sparkle actions, row and goal removal, custom-section controls, picker navigation, destructive confirmation, busy state, success, and failure must be understandable without relying only on hover, color, pointer dragging, or console output. Focus should remain inside dialogs and return to the initiating control when they close.

These are durable product expectations. Delivered deviations are kept together under **App Architecture → Current Implementation Limitations** so a fresh agent can distinguish the intended Character Builder contract from known current behavior.

## Handoffs to the Rest of Chronicle

### Character Library supplies and receives reusable sources

Character Library opens Character Builder for reusable profiles, owns the account collection, and persists scenario-less library rows. It can supply a source to Story Builder only through an explicit independent-copy handoff. It can also receive an independent reusable copy from a story character. Character Builder owns fields and working edits; Character Library owns reusable lifecycle and selection.

### Story Builder owns story cast and durable story save

Story Builder supplies the active story context and one story-owned character. Character Builder returns working edits, while Story Builder owns cast membership, draft/final persistence, readiness validation, publication, and later story-level navigation. A story character's control assignment, role, goals, avatar, and profile details become inputs to Chat Interface only after the story source is saved and played.

### My Images supplies media source bytes

My Images owns folders and reusable private images. Character Builder can browse them through the shared picker, but a chosen source is copied into the private character-avatar destination before adoption. The character workflow then owns crop, character-row reference, replacement, and cleanup. My Images does not own the profile save.

### Model and media services supply proposals and generated media

Character text assistance uses Chronicle's model transport. Avatar generation uses an authenticated server function, safe style presentation data, provider calls, private storage, and usage diagnostics. These services supply output; Character Builder decides whether it changes working state, and the caller decides whether that state becomes durable.

### Chat Interface receives a story copy, not the live editor

Play is not a Character Builder action. My Stories or Community Gallery loads a saved story source and hands its cast to Chat Interface. Chat Interface can establish conversation-scoped overrides and side-character state through its own editor modal and persistence. Those playthrough changes do not automatically flow back into Character Builder's library or story source. Chat History later resumes that conversation and its session state rather than reopening a live Character Builder draft.

### Community Gallery and My Stories operate at story level

Community Gallery publishes and presents stories, not standalone reusable profiles. My Stories organizes owned, draft, published, and saved stories. They consume character material only through a story source. Neither capability owns the Character Builder edit session or the private Character Library collection.

# UI Elements and Functions

## Entry Surfaces and Context-Aware Actions

### Story Builder cast entry

Story Builder's **Main Character** and **Side Character** add tiles open **Character Creation**, a short chooser with **Import from Library**, **+ New Character**, and a close control. Import continues to the reusable-character picker; new character creates a blank story-owned cast member and opens the editor.

After Story Builder has entered its Character Builder destination with no character selected, the top bar provides **Cancel**, **Import from Library**, and **+ New Character**. In this location **+ New Character** creates the blank story-owned cast member directly; it does not reopen Character Creation. **Import from Library** opens the reusable picker directly, and **Cancel** returns to Story Builder.

On an existing roster card, choosing the avatar or card body expands or collapses its image presentation. The pencil action labeled **Edit <character name>** opens the same editor for that story-owned character. While a story character is selected, the top bar shows **AI Fill**, **Save**, **Cancel**, and either **+ Character Library** or **Update Character** when the session already has a known reusable destination. **Save** returns the edited profile to the story roster and requests the story's durable save boundary. **Cancel** discards the session. The library action creates or explicitly updates an independent reusable copy; it does not change which row owns the story character.

### Character Library collection entry

Character Library's collection grid is the reusable-profile entry surface. Its **New Character** tile starts a blank reusable profile. An existing character card opens that profile in Character Builder. In the selected-profile state, the top bar provides **AI Fill**, **Cancel**, and **Update Character**. **Update Character** is the explicit reusable-profile save. The shell's **Back** action returns toward the collection and must warn or preserve the session when working changes have not been resolved.

### Global Character Library picker

The Story Builder import path opens a **Global Character Library** dialog over the current story. The dialog includes a close control, a **Search by name or tags...** field, and reusable character cards. Search matches the summary name and tags. Choosing a card expands its image presentation while retaining the visible name and tags; **Import** loads the full source and creates the story-owned destination. While that source is being fetched, the card reports **Loading** and prevents a duplicate import.

The picker distinguishes loading, no reusable profiles, no search matches, and load failure. Failure includes a clear explanation and a retry action rather than presenting a failed request as an empty library. Closing the picker leaves the story unchanged.

## Collection Grid and Editor Frame

### Reusable character cards

When Character Builder is embedded in Character Library and no profile is selected, its top bar provides **Search characters...** and it shows the reusable collection as a responsive card grid. Search can match name, nicknames, role description, tags, selected appearance and clothing fields, and custom-section titles or values. The **New Character** tile starts a profile. Each existing card presents the avatar or a fallback initial, up to two tag badges, a **Main Character** or **Side Character** badge, the name, and the role description or available fallback description. Selecting the card opens that profile.

Each existing reusable card also has a delete action. Deletion is destructive and therefore requires an explicit confirmation that identifies the profile, explains that the reusable source will be removed, and makes clear that independently copied story characters are not the same row. The confirmation distinguishes cancel, pending deletion, success, and failure, and prevents duplicate submission.

The grid distinguishes initial loading, an account with no reusable profiles, an active filter with no matches, and failure to load. A retryable request failure is never labeled as a true empty collection.

### Split editor layout

With a character selected, the workspace has three durable regions:

1. The application top bar identifies the current ownership context and carries session-level actions such as Back, AI Fill, Save or Update Character, Cancel, and the explicit cross-context copy action.
2. A left rail presents the character summary tile and section navigation.
3. The main panel presents fields and actions for the selected section.

The summary tile shows the current avatar or initial fallback, current name, and an **AI** or **User** control badge. The main-or-side role remains editable in Basics but is not repeated on this selected-profile tile. The tile updates from working state so the user can recognize the profile they are editing without confusing that preview with durable persistence.

### Section navigation and completion indicators

The left rail lists **Basics**, **Physical Appearance**, **Currently Wearing**, **Preferred Clothing**, **Personality**, **Tone**, **Background**, **Key Life Events**, **Relationships**, **Secrets**, **Fears**, **Character Goals**, and **Custom Content**. Each built-in destination has an icon, a label, and a completion ring. The selected destination is visibly distinct, and choosing another destination changes the main panel without saving or discarding the session.

Completion rings are authoring guidance. They summarize whether meaningful values are present in that section; they are not permission checks, save results, or publication readiness on their own. Each ring has an accessible name that identifies the section and progress value.

The **Custom Content** area also exposes **Custom Content**. Selecting it opens a type chooser rather than silently creating content. Custom sections then appear in the navigation with editable titles and section-level controls.

### Admin navigation-image editor

In the story editing context, an authorized administrator can see **Edit Buttons (Admin)**. This opens a global navigation-image editor. The administrator selects a built-in section, previews its current imagery, drags the image to set its focal position, and uses pointer or slider scale controls. **Upload Image** selects a replacement. **Save** applies the current selection and placement through the global application setting, **Cancel** closes without accepting the draft, and **Reset** clears the current custom-image draft before an explicit save.

This is a privileged global appearance control, not ordinary character content. Non-admin users do not see it, and its success or failure must be reported separately from a character save.

## Basics and Avatar Controls

### Avatar preview and source menu

The Basics panel begins with the character avatar. A profile without an image shows a fallback initial. The avatar action area provides **Upload Image** and **AI Generate**. **Upload Image** opens a small source menu with **From Device** and **From Library**.

**From Device** accepts an image file, normalizes it for the private avatar destination while preserving its visible proportions, uploads it under the signed-in account, and adopts the resulting private path and preview only after the upload succeeds. The action reports busy, success, validation failure, and upload failure without representing a local data URL as durable media.

When an avatar already exists, its edit menu provides **Reposition image** and **Delete image**. Reposition mode lets the user drag the preview to choose the focal position, then **Done** accepts that working position. Delete requires a clear destructive consequence and removes the character's durable media reference only through an explicit save. Canceling the broader edit session restores the opening avatar state.

### My Images picker

**From Library** opens the shared My Images picker. The first view presents folder cards with name, description when present, image count, and an available cover or automatic preview. A folder without a usable preview uses the folder placeholder. Folder loading, **No folders yet**, request failure, and **Retry** remain distinct states. **Cancel** closes the picker without changing the avatar.

Selecting a folder opens its image grid. **Back to folder list** returns to folders. The grid distinguishes loading, **No images in this folder**, request failure, and **Retry**. Each eligible image can be selected and displays a selected check. A row whose source is still migration-pending remains visibly disabled and explains why it cannot be copied. **Select Image** is disabled until one eligible image is selected, changes to **Copying...** while the private byte copy is running, and adopts the avatar only after the character-avatar destination succeeds.

The picker copies the source into Character Builder's private avatar storage; it does not make the character depend on the My Images row or folder remaining in place. A failed copy leaves the previous avatar intact and keeps enough context to retry or cancel.

### Generate Avatar dialog

**AI Generate** opens **Generate Avatar**. The dialog contains a required **Prompt**, a conditional **Use Character Data** shortcut when useful profile details exist, a collapsible **Negative Prompt (optional)** field, a prompt-writing tip, style cards loaded from the approved public style presentation source, **Cancel**, and **Generate Avatar**. **Use Character Data** constructs a suggested appearance prompt from the current profile without starting generation. A selected style is visually and programmatically identifiable. Generate remains unavailable while required input or service prerequisites are missing.

During generation, the dialog prevents duplicate requests and communicates progress. On success, the generated private path and signed preview become working avatar state; the user still controls the surrounding profile save. On validation, provider, storage, authentication, or rate-limit failure, the dialog preserves useful input, explains the failure, and offers a safe retry or cancel path.

### Basic identity fields

The rest of Basics presents **Name**, **Nicknames**, **Age**, **Sex / Identity**, **Sexual Orientation**, **Controlled By**, **Character Role**, **Location**, and **Role Description**. **Controlled By** offers **AI** and **User**. **Character Role** offers **Main** and **Side**. Those values define the authored source; downstream conversation state does not silently rewrite them.

The segmented choices expose their selected state to keyboard and assistive technology. Required identity validation is presented next to the relevant field and again in any save summary; moving between sections does not erase values.

## Appearance and Clothing Sections

### Physical Appearance

**Physical Appearance** organizes the delivered appearance rows: **Hair Color**, **Eye Color**, **Build**, **Body Hair**, **Height**, **Breasts**, **Genitalia**, **Skin Tone**, **Makeup**, **Body Markings**, and **Temporary Conditions**. Each row has a label and an editable value. **Add Row** appends another user-defined label/value pair for appearance details that do not fit the built-in set.

User-defined rows expose edit and remove actions without making the built-in labels ambiguous. Removing a working custom row affects only the current edit session until save. Empty values remain visibly empty rather than being inferred from another profile or generated result.

### Currently Wearing

**Currently Wearing** describes the source's present outfit through **Shirt/Top**, **Pants/Bottoms**, **Undergarments**, and **Miscellaneous**. **Add Row** adds another working label/value pair. These values describe authored source material; a later conversation can maintain separate playthrough clothing state without silently rewriting this source.

### Preferred Clothing

**Preferred Clothing** records habitual choices through **Casual**, **Work**, **Sleep**, **Undergarments**, and **Miscellaneous**, plus **Add Row** for additional categories. Preferred clothing and current clothing are separate sections and must not overwrite one another merely because a label is similar.

## Personality, Voice, and Background

### Personality modes and trait guidance

**Personality** provides **Standard** and **Split** modes. Standard mode presents one trait list. Split mode separates outward and hidden personality material while preserving meaningful values during an intentional mode change. Each trait row has a label, an editable description, and a guidance-strength choice: **Rigid**, **Normal**, or **Flexible**. **Add Trait** creates another trait row.

Guidance strength communicates how firmly downstream generation should apply that authored trait. It does not grant permission, save the profile, or guarantee a particular model response. Mode changes and removals that could discard meaningful text require a clear consequence or a reversible working-state path.

### Tone

**Tone** contains repeatable label/value rows for voice and delivery guidance. **Add Row** adds a distinct instruction. An empty Tone section is shown as genuinely empty or as a deliberate blank-entry starting point, not as completed content. Row removal and section navigation operate on working state until save.

### Background

**Background** provides **Job / Occupation**, **Education Level**, **Residence**, **Hobbies**, **Financial Status**, and **Motivation**, plus **Add Row** for another background fact. These fields define source material for the character. They remain distinct from story-wide world information and from conversation-only changes.

### Key Life Events, Relationships, Secrets, and Fears

**Key Life Events**, **Relationships**, **Secrets**, and **Fears** each present repeatable label/value rows and **Add Row**. Life events capture important history; relationships describe connections; secrets store facts that can require careful downstream knowledge boundaries; fears store character-specific anxieties. The UI keeps the categories separate even if the same person or event appears in more than one.

Private narrative content is still account-owned data, not a separate access-control tier merely because it appears under **Secrets**. Publication and play consumers must apply their own source and character-knowledge rules rather than treating a visible editor label as database enforcement.

## Character Goals

### Goal cards

**Character Goals** presents one or more goal cards. A card includes **Goal Name**, a visible progress value, **Desired Outcome**, guidance strength, and a step list. **Add Step** appends another step. Step controls let the author revise or remove user-created steps. Additional goal cards have their own remove action, while the workspace always provides a clear starting place for the first goal.

**Add New Goal** creates another goal card. Goal names, desired outcomes, progress, strength, and steps are working source fields; the save owner decides when they become durable. The editor does not represent manual field completion as proof that a later conversation has accomplished the goal.

### Goal guidance strength

The goal guidance control uses **Rigid**, **Normal**, and **Flexible**. It describes how strongly downstream story generation should pursue the goal. The current selection is readable without relying only on thumb position or color, and keyboard users can choose each state directly.

## Custom Content

### Custom Content chooser

The navigation's **Custom Content** action opens **Content Type** with two choices: **Structured** and **Freeform**. Structured content is appropriate for named label/value details. Freeform content is appropriate for longer prose. The dialog includes a close path and does not add a section until a type is deliberately chosen.

### Structured sections

A structured custom section has an editable title, collapse or expand control, and remove control. Each row contains a label and description. **Add Row** appends another row. A row's sparkle **Enhance** action can request a rewrite of that row's working value through the standard enhancement flow.

Removing a section or nonempty row requires a clear consequence and remains reversible through session cancellation until save. Collapsing a section changes presentation only; it does not delete its values or change completion authority.

### Freeform sections

A freeform custom section also has an editable title, collapse or expand control, and remove control. It contains one or more open text fields, and **Add Text Field** adds another. Each value remains part of that section's working data. Empty fields do not count as completed material.

Custom sections can travel with a character through a deliberate copy or story save, but their presence does not change which capability owns the row. Titles and values must remain distinguishable so import, persistence, and downstream prompt assembly can reconstruct the authored structure.

## AI-Assisted Text Actions

### AI Fill

**AI Fill** opens a dialog with an optional **Character Description**, a **Use all details currently in character card** checkbox, **Cancel**, and **Fill Empty Fields**. The action is fill-only: existing meaningful user text remains authoritative, and accepted output is placed into eligible empty working fields for review. The checkbox decides whether current card details may be used as context; it does not authorize persistence or make model output trusted data.

The dialog communicates request progress and prevents duplicate submission. Validation, authentication, transport, or provider failure leaves existing working fields untouched, preserves useful prompt input, and offers retry or cancel. Success identifies that working fields changed and still require the context's explicit save.

### Field enhancement

Eligible sparkle actions open **Enhancement Style**. **Precise** asks for a concise polished version, while **Detailed** asks for a richer expansion. Choosing a mode starts the request for that exact field. The action displays a busy state at the initiating control, prevents a second request, and replaces only that working value after a successful response.

Failure preserves the original field and reports the reason without requiring console access. Enhancement does not navigate, save, change ownership, or rewrite neighboring fields.

## Confirmations, Feedback, and Accessible Operation

### Destructive and ownership-changing actions

Deleting a reusable profile, deleting an avatar reference, removing meaningful goals or custom content, replacing an existing reusable destination, and leaving with unsaved changes all require consequences appropriate to their risk. A dialog names the target, distinguishes **Cancel** from the committing action, remains open while the action is pending, prevents duplicates, and reports failure without pretending the change succeeded.

Copy actions identify both source and destination ownership. **Import** means create an independent story character. **+ Character Library** means create an independent reusable profile. **Update Character** means update the already identified reusable destination, not every related copy.

### Loading, empty, success, and failure states

Initial collection load, picker load, style load, upload, generation, AI Fill, field enhancement, import, save, copy, and delete each expose their own status. A spinner has an announced status label. A disabled control explains the prerequisite it is waiting for. Success feedback names the operation that completed; failure preserves recoverable inputs and exposes retry where the operation is safe to repeat.

The UI never uses an empty collection, blank style list, missing avatar, or cleared field as the only evidence that a request failed. Background saves remain visibly pending until the durable owner reports success or a recoverable failure.

### Keyboard and assistive-technology contract

All section destinations, cards, avatar menus, segmented choices, sliders, sparkle actions, add/remove actions, custom-section controls, dialog actions, and admin-only controls have programmatic names and keyboard routes. Hover reveals can supplement but not replace focus-visible actions. Tab advances through ordinary controls in a predictable order; dialogs trap focus and return it to their opener.

Completion, selection, busy state, validation, and destructive consequences are communicated in text or accessibility state rather than by color, position, or animation alone. These requirements apply in both reusable and story editing contexts even when the surrounding shell uses different top-bar actions.

# App Architecture

## Coverage, Route, and Composition

### Evidence basis

This chapter describes the Character Builder implementation inspected on **08/22/2026** at repository revision `cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7` plus the current shared working tree. The review followed both visible ownership contexts from the application shell through working state, row and storage persistence, AI and media services, and downstream story/chat consumers. The synchronized Supabase reference was treated as Chronicle's documented backend boundary, not as proof of the deployed project.

The local UI at `http://localhost:8080/` was inspected signed out. Story Builder was opened, a new story character was created, every built-in section was visited, structured and freeform custom sections were created in working state, and AI Fill, Enhancement Style, device/library avatar source, My Images picker, and Generate Avatar dialogs were inspected. No authenticated mutation, provider request, credit-spending action, or Supabase write was performed. Source therefore establishes authenticated and failure branches that the signed-out playthrough could not exercise.

### Route and entry ownership

Chronicle registers the main application at `/`. `Index.tsx` owns the internal application tab rather than delegating Character Builder to a dedicated browser route. The `characters` tab is the Story Builder cast editor; `library` is the legacy/current internal Character Library destination. Both lazy-load `CharacterBuilderScreen.tsx`, but supply different collections, callbacks, selection state, and top-bar actions.

`AppShellTopBar.tsx` renders the context-aware session actions. `AppSidebar.tsx` exposes authenticated library navigation. `CharacterCreationModal.tsx` and `CharacterPicker.tsx` own the Story Builder entry branches. The main screen owns the editor frame and local dialog wiring; `use-index-character-workspace.ts` owns selection, snapshots, row mutation, copy handoffs, and context-specific save/cancel decisions.

The similarly named editor used inside Chat Interface is a different component, `CharacterEditorModalScreen.tsx`. It owns conversation-scoped state and is a downstream consumer, not another entry mode into the main Character Builder described here.

## Ordered Runtime and Data Flows

### 1. Account bootstrap and context selection

1. `App.tsx` mounts the `/` application, authentication provider, and Index shell.
2. `use-auth.ts` supplies the current session and user.
3. After authentication, `use-index-authenticated-data.ts` loads account-owned story and reusable-character data. Library load is an owner-filtered `characters` query whose rows have `scenario_id IS NULL` and `is_library = true`.
4. `use-index-shell-bootstrap.ts` and the shell choose the internal tab. The sidebar guards the ordinary private-library destination; Story Builder can also reach character editing from its own tab.
5. Index passes either the reusable library or `activeData.characters` into `use-index-character-workspace.ts` and `CharacterBuilderScreen.tsx`.

The selected internal tab and current editor selection are browser working state. Supabase Auth remains the account boundary; seeing a tab value is not authorization to read or write rows.

### 2. Selection, new-profile creation, and edit snapshots

1. Selecting an existing card calls the workspace selection handler with that character ID and context scope.
2. The workspace deep-clones the opening character into a snapshot keyed by `<scope>:<character-id>` before editing begins.
3. Starting a new character creates a client UUID and the default `Character` shape: **New Character**, AI-controlled, Main role, blank built-in sections, no durable parent, and no durable row yet.
4. A library new profile enters the reusable collection working array. A story new profile enters the active story's `characters` array.
5. `CharacterBuilderScreen.tsx` resolves the selected ID, holds section/dialog/presentation state, and emits every character-field change back through the workspace hook.

The opening deep snapshot is cancellation authority for a normal edit session. It is not a database transaction and does not survive a reload.

### 3. Field editing, navigation, and completion

1. Built-in rows, goals, traits, and custom sections emit a new `Character` value rather than writing Supabase directly.
2. The workspace replaces the matching character inside either the full reusable array or `activeData.characters`.
3. Section navigation changes editor presentation only. `section-keys.ts` gives the built-in/custom destinations stable keys, while `section-progress.ts` calculates completion guidance from working values.
4. `TabFieldNavigator.tsx` supplies the editor's current custom Tab traversal behavior. Row and section components own auto-resizing, add/remove controls, collapse state, and enhancement triggers.
5. No field edit is durable until the surrounding library or story save flow completes.

Working state has immediate visual precedence. A signed media preview can change before a row save, but the durable `avatar_path` remains persistence authority after reload.

### 4. Reusable save, cancel, back, and delete

1. **Update Character** calls the library save branch in `use-index-character-workspace.ts`.
2. `saveCharacterToLibrary()` maps the full `Character` to a scenario-less `characters` row with `is_library = true`, assigns the authenticated owner, and normalizes any private avatar path to the persistence sentinel.
3. The in-memory library already contains the working values. On success the workspace removes the unsaved-new marker and leaves the editor selected. It does not refresh the opening snapshot; that divergence is listed under limitations.
4. **Cancel** restores the snapshot for an existing profile or removes a never-saved new profile, then clears selection.
5. The top-bar **Back** path clears selection through shell wiring; its current divergence from Cancel is listed under limitations.
6. Reusable delete asks Index for confirmation, then `deleteCharacterFromLibrary()` removes the scenario-less row through the client. Independently copied story rows are different children and are not cascaded by that row deletion.

The client query shapes the request, while authenticated RLS is the database enforcement boundary. A returned row, not an optimistic preview, is the strongest client-visible evidence of save success.

### 5. Story-character save, cancel, and story persistence

1. Story field changes replace the matching item in `activeData.characters` immediately.
2. **Save** clears the selected character, returns Story Builder to its roster, and starts `saveDraftInBackground()` through the story persistence owner.
3. `use-index-scenario-persistence.ts` normalizes the source and calls the current scenario persistence flow.
4. `saveScenario()` maps the story plus complete character, codex-entry, and scene child payloads into `save_scenario_atomic`. Content themes and conversations are not part of this Character Builder-triggered atomic payload.
5. The database function authenticates, checks story ownership, verifies child-row ownership/parent conflicts, upserts supplied children, and deletes owned child rows omitted from the complete client payload.
6. **Cancel** restores the story-scoped snapshot or removes the new unsaved character, then returns to the roster. The shell's Back branch currently differs and is documented below.

Story Builder owns durable cast persistence. Character Builder requests that boundary but neither owns the atomic function nor converts a story between draft and final by itself as a product contract.

### 6. Library-to-story import

1. Story Builder opens `CharacterPicker.tsx`.
2. The picker calls `fetchCharacterLibrarySummaries()` for account-owned reusable summaries and supports local name/tag filtering.
3. Choosing **Import** calls `fetchCharacterById()` to load the complete reusable record under the authenticated row policy.
4. The workspace deep-clones the loaded source into `activeData.characters` and closes the picker. It does not assign a new ID or parent field at insertion, and it leaves Character Builder with no selected character; the copy appears in the roster for a separate selection.
5. Story parentage is supplied only when the later story payload is serialized. The intended destination must receive an independent UUID before that atomic save. The current implementation fails the identity step; the exact consequence is recorded in Current Implementation Limitations.

After a correct copy, later library updates do not change the story row. The story save owner controls whether the imported working copy becomes durable.

### 7. Story-to-library copy and update

1. **+ Character Library** clones the selected story character with a new UUID and calls `saveCharacterCopyToLibrary()`.
2. The library copy is persisted as an account-owned, scenario-less, `is_library = true` row.
3. The workspace records the mapping from story character ID to reusable destination ID in `characterInLibrary` browser state.
4. While that mapping exists, the top bar changes the action to **Update Character** and the update branch writes the known reusable destination without changing the story row.
5. The mapping is not durable today; repeated-copy risk after reload is documented below.

This is an explicit cross-capability handoff. Character Builder supplies the authored payload, Character Library owns the destination lifecycle, and neither row gains live synchronization.

### 8. Device avatar upload and focal position

1. **From Device** reads the selected browser file.
2. `resizeImage()` preserves aspect ratio and fits the avatar within the supplied 512-by-512 maximum before JPEG encoding.
3. `uploadAvatar()` writes the bytes into `character_avatars_private` under an authenticated user-prefixed object path.
4. The service returns the durable object path plus a signed presentation URL.
5. Character Builder stores the path in working `avatarPath`, the signed URL in working `avatarDataUrl`, and subsequent drag positioning in `avatarPosition`.
6. `characterToDb()` persists the private path as a private-media sentinel; later reads parse that sentinel and hydrate a fresh signed URL.

The storage object is created before the character row is saved. The object path is durable identity; a signed URL is short-lived presentation state and must never become the row's ownership authority.

### 9. My Images source copy

1. `ImageLibraryPickerModal.tsx` loads folder details, signs private previews, then loads the selected folder's images.
2. A selected row must have an eligible durable private source path. Legacy or migration-pending URL-only rows remain ineligible.
3. `copyLibraryImageTo()` downloads the authenticated source bytes, validates size and image content, and uploads a new object into `character_avatars_private`.
4. The returned destination path and signed URL become working avatar state.
5. Character Builder later persists only the destination reference; deleting or moving the My Images source does not remove that independent copy.

The shared picker owns source selection and byte-copy feedback. Character Builder owns destination adoption and the subsequent profile save.

### 10. AI avatar generation

1. `ArtStylesContext.tsx` supplies safe style presentation data through `get_public_art_styles`, with bundled `avatar-styles.ts` as presentation fallback.
2. `AvatarGenerationModal.tsx` collects prompt, negative prompt, and a style selection and performs client validation.
3. `AvatarGenerationModal.tsx` invokes the authenticated `generate-side-character-avatar` edge function directly through the browser Supabase client.
4. The function authenticates, applies rate limiting, resolves the server-owned style prompt, calls the configured image provider, writes the result to `character_avatars_private`, records server usage, and returns an object path plus signed URL.
5. The browser adopts the returned media as working avatar state; the profile still requires the relevant library or story save.

The client style card is presentation input, not authority for the provider prompt. The edge function and storage policies are the generation/security boundary.

### 11. AI Fill and per-field enhancement

1. **AI Fill** collects optional description plus the include-current-details choice in `AIPromptModal.tsx`.
2. `aiFillCharacter()` assembles a character request through `character-ai.ts`; the workspace merges only returned values that correspond to eligible empty working fields.
3. Library context currently supplies a default empty scenario. Story context supplies the active story. That delivered context difference is recorded under limitations.
4. A field sparkle opens `EnhanceModeModal.tsx`; choosing Precise or Detailed calls `aiEnhanceCharacterField()` for that field.
5. Each field request goes through the shared `chat` function, validates its input/output shape, records usage diagnostics, and can retry up to the service's bounded attempt count.
6. Successful text replaces working state only. Persistence remains an explicit save.

`character-ai.ts` also implements a full **AI Generate Character** mode, and `AIPromptModal.tsx` has a corresponding branch, but no current Character Builder entry action selects it. That dormant path is a delivered limitation, not a visible control.

### 12. Administrator navigation imagery

1. The story embedding passes the authenticated admin flag into `CharacterBuilderScreen.tsx`; the library embedding does not.
2. An authorized administrator opens the editor, selects a built-in section, and changes image, position, or scale in local modal state.
3. The screen keeps a selected image as a local data URL, then **Save** converts it to a blob and uploads it directly through the browser Supabase client into the public `backgrounds` bucket.
4. The shared media-settings service updates `app_settings.nav_button_images`; readers use the global setting to render the section-navigation art.
5. RLS and the administrator write policy, not the hidden client control, enforce who can mutate the global setting.

This flow changes application-wide presentation, not character-row content. It has a distinct failure and cleanup boundary.

### 13. Story source to Chat Interface

1. Character Builder returns a saved story character to Story Builder.
2. My Stories or Community Gallery later owns the Play action and loads the current story source.
3. The Chat Interface creates or resumes a conversation and maps the story cast into session state.
4. Story-source character overrides are written through `character_session_states`; conversation-created side characters identified by their conversation origin use the conversation's `side_characters` persistence.
5. `CharacterEditorModalScreen.tsx` owns that conversation editor. It does not write live changes back into the story-owned or reusable source row.

This handoff explains why Character Builder can author source goals and personality while Chat maintains different current-session values. Chat History resumes the saved conversation state, not an unsaved Character Builder session.

## State Authority and Conflict Precedence

### Working state versus durable state

During an open edit session, the character value held by Index and the workspace hook is the visible field authority. The opening deep snapshot is Cancel authority. `CharacterBuilderScreen.tsx` owns only presentation state such as active section, modal visibility, crop/reposition mode, and admin image-editor draft.

After reload, the durable owner wins: a scenario-less owner library row for reusable context, or the character children returned with the current story for Story Builder context. A browser snapshot or signed preview cannot override a successfully reopened row.

### Avatar precedence

`avatarPath` is durable private-object identity. The persistence sentinel represents that path in character-row avatar data. `avatarDataUrl` can be a short-lived signed URL or an unsaved local preview. The path must win during serialization; a signed URL must be refreshed for presentation rather than saved as a permanent public address. `avatarPosition` is character data and takes effect only when the owning row is saved.

### Identity and copy precedence

The UUID plus parent ownership distinguishes a reusable source from a story child. Visible name, avatar, and copied profile text do not prove identity. A destination copy must receive a destination-owned UUID. Story parentage belongs to the story save; reusable rows remain scenario-less. When client copy bookkeeping conflicts with reopened durable rows, durable row identity wins and the client must re-establish an explicit mapping rather than infer it from matching content.

### AI, completion, and diagnostics precedence

Existing meaningful user text outranks AI Fill output. A per-field enhancement affects only the selected working value. Completion rings are advice derived from working content and never override save validation or ownership. Client validation, API usage rows, console logs, and response snapshots are diagnostics; authenticated RLS, storage policy, edge-function checks, and the atomic story function are enforcement.

## Responsibility and Ownership Map

| Responsibility | Current owner | Boundary and consequence |
|---|---|---|
| Internal route, tab, selected ID, and shell dialogs | `Index.tsx` | Decides which ownership context and entry branch reaches the shared editor. |
| Context-aware top-bar controls | `AppShellTopBar.tsx` | Presents Save/Update/Cancel/copy actions but does not persist rows itself. |
| Character working arrays, snapshots, save/cancel, AI, and copy orchestration | `use-index-character-workspace.ts` | Central client authority for reusable versus story edit semantics. |
| Fields, section navigation, progress, custom content, crop, and local dialogs | `CharacterBuilderScreen.tsx` and child components | Emits working character changes; never serves as database authorization. |
| Reusable row mapping/query/upsert/delete | `persistence/characters.ts` | Owns scenario-less library persistence and private-avatar hydration. |
| Story cast persistence | `use-index-scenario-persistence.ts` and `persistence/scenarios.ts` | Saves the core story plus character, codex, and scene children through the atomic database function. |
| My Images selection and private byte copy | `ImageLibraryPickerModal.tsx` and `persistence/library-copy.ts` | Creates an independent avatar object before row adoption. |
| Device avatar upload and signed presentation | `media-settings.ts` and `signed-media.ts` | Owns private object creation and expiring presentation URLs. |
| AI text requests | `character-ai.ts`, shared `chat` edge function, validation and usage services | Supplies proposals; does not own persistence or user authorization. |
| AI avatar generation | `AvatarGenerationModal.tsx`, Art Styles context, `generate-side-character-avatar` | Authenticates, rate-limits, resolves style, calls provider, and stores private output. |
| Global navigation imagery | Character Builder admin modal, media settings, `app_settings` | A privileged application setting, separate from character data. |
| Conversation character overrides | Chat's `CharacterEditorModalScreen.tsx` and session persistence services | Downstream session owner; does not live-sync to source profiles. |
| Row/storage authorization | Supabase Auth, deployed RLS/storage policies, and atomic RPC | Final enforcement boundary; client state and hidden controls are not enforcement. |

## Persistence, Security, and External Dependencies

### Character rows and story aggregate

Reusable and story-owned profiles share the `characters` table shape but use different parent fields. Reusable profiles are scenario-less and flagged `is_library`; story characters carry the story's `scenario_id`. `persistence/characters.ts` owns the full conversion between database columns and Chronicle's nested `Character` shape, including traits, goals, custom sections, clothing, background, and avatar presentation.

Story save treats the client aggregate as complete. `save_scenario_atomic` upserts the supplied children and removes owned story children that the client omitted. That makes correct client loading and independent copy identity essential: an incomplete or wrongly identified cast is not a harmless display problem at the persistence boundary.

The synchronized reference documents owner/admin/public-visible read guidance for the shared `characters` table. Repository migrations additionally show story-publication joins and the current atomic ownership checks. The scenario-less reusable query is explicitly owner-filtered in client code, but live RLS and RPC behavior were not exercised in this review.

### Private avatar storage

`character_avatars_private` is the intended destination for device uploads, My Images copies, and generated avatars. The synchronized reference and repository migration define owner mutation and owner/admin read for user-prefixed objects. Character rows store a private sentinel/path; `signed-media.ts` converts it to an expiring signed URL for presentation.

Signed URLs are bearer presentation artifacts during their lifetime. They are not public ownership grants and must not replace the row or object path. Live bucket configuration, deployed policy text, and expiry behavior were not directly verified.

### AI and style dependencies

Text assistance depends on the authenticated shared `chat` edge path, model configuration, provider availability, input/output validation, and usage tracking. Avatar assistance depends on the authenticated `generate-side-character-avatar` function, provider credentials, rate limiting, storage, and server-side usage recording.

Style cards depend on `get_public_art_styles` plus a bundled safe fallback. The repository contains the RPC definition and generated typing, while the synchronized Supabase reference does not document that RPC. Repository source can explain the intended call; it cannot prove current deployed grants or returned rows.

### Global settings boundary

The admin navigation-image editor writes `app_settings.nav_button_images` and uploads imagery to the shared `backgrounds` bucket. The synchronized guidance defines administrator writes and approved-key reads for application settings. This is global configuration: a successful write affects every character editor that consumes those navigation assets, not only the currently selected profile.

### Shared Supabase reference

The **Supabase Tables** tab renders the shared synchronized reference for documented `characters`, `app_settings`, storage, and related fields. An older manual, generated client type, or migration alone is not evidence of live deployment. The Chronicle Work Manual governs any later task that needs to reconcile those sources or inspect the live boundary.

## Diagnostics Versus Enforcement

### Diagnostic signals

The current browser logs failures for bootstrap, library refresh/save/delete, story-background save, bulk AI, avatar upload, story/library copy, and global navigation-image persistence. Toasts are used for some picker, enhancement, and avatar-generation outcomes. API validation snapshots and usage services can record attempted model calls, and the avatar edge writes structured server diagnostics.

Those signals help an engineer reconstruct the attempted branch. They do not prove that the user saw a failure, that a row or object exists, that an async story save completed, or that deployed policy rejected every unauthorized request.

### Enforcement points

Supabase Auth establishes the user identity. Deployed row-level security controls row reads and mutations. Storage policies control private avatar objects. The avatar edge authenticates and rate-limits generation. `save_scenario_atomic` authenticates the caller and checks story/child ownership before changing the aggregate. Admin RLS controls the global setting write.

Sidebar visibility, hidden admin controls, filtered client arrays, `is_library` flags, snapshots, confirmation dialogs, disabled buttons, progress rings, console logs, usage rows, and response-shape validation are not enforcement. They are navigation, working-state recovery, request shaping, product feedback, or diagnostics.

## Current Implementation Limitations

### Entry, loading, and collection feedback

- Story Builder can currently open Character Builder while signed out. The editor and media/AI actions remain visible, but many workspace handlers return early when `userId` is missing and provide no visible authentication explanation. The ordinary Character Library sidebar path is authentication-gated, so the two entry surfaces do not enforce the stable precondition consistently.
- Story Builder's **Main Character** and **Side Character** add tiles both open the same unparameterized Character Creation dialog. Choosing **+ New Character** calls the shared creator, whose default role is Main, so entry through the Side Character tile does not seed a Side role.
- Initial reusable-library load is wrapped in a 15-second empty-array fallback and Character Builder receives no collection loading/error state. A timeout or request failure can therefore look like a successfully empty library. Refresh failure logs to the console and can leave stale data without a visible distinction.
- `CharacterPicker.tsx` renders an explicit loader only while it has no summaries. Refresh failure and full-row load failure do not have complete visible recovery; a failed or incomplete request can fall through to **No matching characters found in library.**
- Character Library passes the filtered array into the shared screen, and the screen resolves the selected ID inside that same filtered array. Editing a value so the selected profile no longer matches the active search can make the selected editor disappear while top-bar selection state remains set.

### Edit-session and persistence feedback

- Character Library's top-bar **Back** clears selection directly. Story Builder's Back clears selection and returns to the world screen. Both bypass the workspace Cancel branch, so unsaved edits remain in the in-memory owner array and a new unsaved profile can remain present until Cancel or reload reconciles it.
- A successful reusable **Update Character** leaves the editor open and clears the new-profile marker but does not replace or clear the opening cancellation snapshot. Pressing **Cancel** after that successful save can restore the pre-save values in the in-memory collection even though the database row already contains the saved values, producing a stale local card until refresh.
- Story-character **Save** clears selection, navigates away, and invokes `void saveDraftInBackground()` without awaiting or reporting the result. A failed durable save is not surfaced from the initiating action. The draft save also persists with draft status, so editing a character in a source that was final can return that story to draft.
- Reusable update failure, reusable delete failure, story-to-library copy failure, device avatar upload failure, and bulk AI Fill failure are console-only. Several confirmation paths close before their asynchronous consequence resolves and do not expose a per-action duplicate guard or durable unsaved-after-failure state.
- Reusable deletion uses a generic confirmation that says only that the character will be permanently removed from the Global Library. It does not identify the target profile or explain that already-copied story characters are independent rows, so the delivered warning does not meet the stable consequence wording in UI Elements.
- Current Character Builder source does not implement a consistent unsaved-change confirmation for Back, modal close, ownership-changing copy, or removal of meaningful goals/custom sections. The stable UI chapter describes the required consequence and recovery boundary, not current delivered confirmation coverage.
- **Save** and **Update Character** do not run a Character Builder-specific required-field validation or present an inline save summary. A blank/placeholder profile can be sent to library or draft persistence; story publication readiness may reject missing character requirements later, but that later Story Builder check is not Character Builder save validation.

### Working-state mutations and visible accuracy

- `handleDeleteAvatar()` clears `avatarDataUrl` and resets position but does not clear `avatarPath`. Serialization gives the still-present path precedence, so **Delete image** cannot durably clear a path-backed avatar on the next save.
- **Delete image** invokes that working-state mutation directly from the avatar menu with no confirmation or consequence text. Even for an unsaved/local avatar, the current control does not meet the destructive-action contract in UI Elements.
- Opening an empty Tone, Key Life Events, Relationships, Secrets, or Fears section calls the corresponding add-row handler during render and inserts a blank extra row. Opening Character Goals with no goals seeds a blank goal through an effect. Merely visiting these sections therefore mutates the working character without an explicit add action.
- New freeform custom sections store visible text in item values, while `section-progress.ts` calculates freeform completion from `freeformValue`. A section can contain visible text and still report empty completion.
- Reusable cards can display and search stored tags, but the main Character Builder exposes no visible tag field. Tags that arrive through persistence or transfer cannot be authored or revised here.
- `TabFieldNavigator.tsx` intercepts Tab from eligible text inputs and moves to the next eligible text input, skipping intervening controls in the natural DOM order. That behavior also makes the stable keyboard contract incomplete.

### Copy identity and ownership tracking

- Library-to-story import deep-clones the reusable profile but preserves its UUID, closes the picker, and does not select the inserted roster copy for editing. The current atomic story function refuses to update that existing scenario-less row under a story `scenario_id` and raises an unauthorized-child conflict. The imported profile can look correct in Story Builder working state but cannot persist through the normal atomic save. The intended contract remains a distinct story-owned UUID followed by an explicit editor selection.
- Story-to-library copy correctly assigns a new UUID, but `characterInLibrary` stores the source-to-destination relationship only in Index session state. After reload, the UI cannot rediscover the prior reusable destination, so repeating **+ Character Library** can create another independent reusable row instead of offering the prior row for explicit update.
- Both copy directions clone the existing avatar reference instead of copying the private avatar object to a destination-specific path. The profile rows can diverge, but they can still point at the same storage object. Any future cleanup must account for shared references or perform a media copy; assuming one row owns one copied object's deletion would risk breaking the other profile.
- Reusable update and cross-context copy do not return a durable relationship record. Similar name, avatar, or profile fields cannot safely be used to infer a copy relationship after reload.

### Avatar and global-media lifecycle

- Device upload, My Images copy, and avatar generation create a private object before the character row is saved. There is no cleanup transaction for an abandoned, superseded, or failed-save object, and deleting a profile does not delete its stored avatar object. Orphaned private media can accumulate.
- The avatar delete mismatch leaves the old private path referenced; even after that path bug is resolved, object removal needs its own explicit lifecycle because clearing a row reference is not the same as deleting a Storage object.
- The admin navigation-image flow uploads a public background object before updating `app_settings` and has no rollback or superseded-object cleanup. If Storage upload fails, the catch logs the error but continues with the original data URL and can attempt to persist that data URL in the global setting. The UI has no visible upload failure even though the modal remains the only recovery surface for a later settings-write failure.
- Admin **Reset** changes modal draft state; it is not durable until **Save**. Pointer drag, wheel zoom, and the scale range do not collectively satisfy the full keyboard/accessibility contract described in UI Elements.

### AI context, reachability, and failure presentation

- Bulk AI Fill catches provider, transport, or parsing failure inside `aiFillCharacter()`, logs it, and returns an empty patch. The caller receives a normal resolution that changed nothing, while the prompt dialog was closed before the request. No visible retryable error distinguishes that failure from a valid no-op because there were no eligible empty fields.
- Library-mode AI Fill receives a default empty scenario as world context. Per-field enhancement receives a scenario-shaped wrapper containing the currently filtered reusable library, so the active search changes which other profiles are supplied as context. Neither context difference is explained in the UI.
- `character-ai.ts` and `AIPromptModal.tsx` implement full **AI Generate Character**, but the current top bar opens only Fill and no visible Character Builder control selects Generate mode. The implemented branch is dormant in this capability.
- The synchronized reference says direct `art_styles` reads are Admin-only, while current style presentation depends on `get_public_art_styles`, which is absent from that reference. Repository migrations and generated typing describe an intended RPC, but live grants and returned fields remain unverified.

### Accessibility and downstream editor drift

- The reusable-card trash control is hover-revealed, has `tabIndex={-1}`, and has no accessible name. Several avatar pencil, sparkle, row-remove, collapse, custom-section, and goal controls rely on a title, adjacent text, hover, or pointer interaction rather than a complete name and keyboard route. Some loading spinners do not announce status.
- Guidance-strength and image-position controls rely heavily on pointer/range presentation. Selection and value labels are not consistently exposed as a conventional keyboard-operable control group.
- The Chat Interface uses `CharacterEditorModalScreen.tsx`, a separate editor with conversation-specific actions and fields. It is correctly a different persistence owner, but duplicated field/presentation logic can drift from the main Character Builder. The main manual must not describe Chat's **AI Update** or session controls as Character Builder controls.

### Test coverage gaps

`use-index-character-workspace.test.ts` currently proves snapshot Cancel behavior only for Story Builder scope. It does not cover reusable create/update/Cancel/Back/delete, selected-search disappearance, avatar clearing, library-to-story identity, durable copy mapping, signed-out action feedback, or persistence failure. Shared top-bar tests do not exercise every Character Builder context. Media tests do not prove object cleanup, and no current runtime test exercises the editor's render-time blank-row seeding or custom freeform completion mismatch.

The Knowledge tests introduced with this manual prove registration, substantive Markdown, top-level heading ownership, source-path existence, source composite, and renderer output. They do not repair or behavior-test these delivered runtime limitations.

## Curated Source and Test Map

### Route, shell, and workspace orchestration

| Source | Role in Character Builder |
|---|---|
| `src/App.tsx` | Registers `/`, authentication providers, and the Index entry. |
| `src/pages/Index.tsx` | Owns internal tabs, selected character, active story/library arrays, dialogs, and component composition. |
| `src/components/app-shell/AppSidebar.tsx` | Exposes authenticated Character Library navigation. |
| `src/components/app-shell/AppShellTopBar.tsx` | Renders context-specific Back, AI Fill, Save/Update, Cancel, import/new, and library-copy actions. |
| `src/components/app-shell/AppShellTopBar.test.tsx` | Shared header coverage and evidence of Character Builder context gaps. |
| `src/features/story-builder/StoryBuilderScreen.tsx` | Owns Story Builder roster composition and the Character Creation dialog state. |
| `src/features/story-builder/sidebar/StoryRosterSidebar.tsx` | Separates Main and Side roster groups and supplies the shared add callback. |
| `src/features/story-builder/sidebar/StoryRosterGroup.tsx` | Wires existing roster tiles and each group-specific add placeholder. |
| `src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx` | Visible Main Character and Side Character add controls. |
| `src/features/story-builder/sidebar/StoryRosterCharacterTile.tsx` | Existing story-character selection, expansion, summary, and readiness messages. |
| `src/components/chronicle/CharacterCreationModal.tsx` | Story entry chooser for Import from Library versus New Character. |
| `src/components/chronicle/CharacterPicker.tsx` | Reusable-summary search, full-row load, and Story Builder import initiation. |
| `src/hooks/use-auth.ts` | Supplies authenticated account/session state. |
| `src/hooks/use-index-authenticated-data.ts` | Loads reusable profiles during account bootstrap and applies the timeout fallback. |
| `src/hooks/use-index-character-workspace.ts` | Owns working arrays, snapshots, create/update/cancel/delete, copy handoffs, AI, and avatar orchestration. |
| `src/hooks/use-index-character-workspace.test.ts` | Existing Story Builder Cancel coverage and evidence of untested reusable/copy/media branches. |
| `src/hooks/use-index-scenario-persistence.ts` | Owns the downstream story draft/final/import/export save boundary. |
| `src/hooks/use-index-shell-bootstrap.ts` | Resolves shell/query destinations and signed-out private-tab fallback. |
| `src/hooks/use-index-shell-bootstrap.test.ts` | Existing query-normalization coverage; not direct Story Builder signed-out editor coverage. |

### Main editor and field components

| Source | Role in Character Builder |
|---|---|
| `src/features/character-builder/CharacterBuilderScreen.tsx` | Collection cards, split editor, built-in/custom sections, avatar controls, AI wiring, and admin navigation imagery. |
| `src/features/character-builder/rows/AutoResizeTextareaField.tsx` | Shared growing text field used by builder rows. |
| `src/features/character-builder/rows/ExtraRow.tsx` | Editable/removable custom label-value row and enhancement action. |
| `src/features/character-builder/rows/HardcodedRow.tsx` | Built-in label/value row and enhancement action. |
| `src/features/character-builder/sections/HardcodedSection.tsx` | Built-in section frame and row composition. |
| `src/features/character-builder/sidebar/TraitNavButton.tsx` | Section selection and navigation-image presentation. |
| `src/features/character-builder/sidebar/TraitProgressRing.tsx` | Completion ring and accessible progress label. |
| `src/features/character-builder/types/character-builder.types.ts` | Shared component and section contracts. |
| `src/features/character-builder/utils/section-keys.ts` | Stable built-in/custom section key resolution. |
| `src/features/character-builder/utils/section-progress.ts` | Working completion calculations, including freeform mismatch. |
| `src/features/shared-builder/utils/image-position.ts` | Maps stored avatar focal position into the non-square summary/header tile. |
| `src/components/chronicle/TabFieldNavigator.tsx` | Custom Tab traversal between eligible editor text inputs. |
| `src/components/chronicle/PersonalitySection.tsx` | Standard/Split personality modes, traits, and strength controls. |
| `src/components/chronicle/CharacterGoalsSection.tsx` | Goal cards, steps, progress, strength, and initial-goal seeding. |
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Pointer-driven three-state goal-strength track and clickable value labels. |
| `src/components/chronicle/CustomContentTypeModal.tsx` | Structured/Freeform custom-section chooser. |
| `src/components/chronicle/ChooserModal.tsx` | Shared option-card dialog used by content/enhancement choices. |
| `src/components/chronicle/DeleteConfirmDialog.tsx` | Shared destructive-confirmation surface. |

### AI and avatar media

| Source | Role in Character Builder |
|---|---|
| `src/components/chronicle/AIPromptModal.tsx` | AI Fill input, include-details option, processing state, and dormant Generate mode. |
| `src/components/chronicle/EnhanceModeModal.tsx` | Precise/Detailed field enhancement choice. |
| `src/services/character-ai.ts` | Character fill/generate/enhance prompts, context construction, retries, and parsing. |
| `src/services/api-usage-validation.ts` | Input and response-shape diagnostics for covered model calls. |
| `src/services/usage-tracking.ts` | Client usage-event recording. |
| `src/components/chronicle/AvatarActionButtons.tsx` | Device/My Images source menu and AI Generate entry. |
| `src/components/chronicle/AvatarGenerationModal.tsx` | Avatar prompt, negative prompt, styles, busy state, and result adoption. |
| `src/constants/avatar-styles.ts` | Bundled safe style-presentation fallback. |
| `src/contexts/ArtStylesContext.tsx` | Safe public-style RPC consumption and fallback selection. |
| `src/components/chronicle/ImageLibraryPickerModal.tsx` | Folder/image browser, signed previews, eligibility, retry, and destination copy. |
| `src/services/persistence/library-copy.ts` | Authenticated private-source byte copy into the character-avatar bucket. |
| `src/services/persistence/media-settings.ts` | Device avatar upload plus global navigation-image settings load/update; the screen itself performs the admin image object upload. |
| `src/services/persistence/media-settings.test.ts` | Existing service coverage; it does not prove complete Character Builder object lifecycle. |
| `src/services/persistence/signed-media.ts` | Private sentinel parsing, signed-URL cache, and pre-expiry refresh. |
| `supabase/functions/chat/index.ts` | Authenticated text-model transport used by character assistance. |
| `supabase/functions/generate-side-character-avatar/index.ts` | Authenticated, rate-limited avatar provider call, private upload, and signed result. |
| `supabase/functions/_shared/rate-limit.ts` | Shared server rate-limit enforcement. |
| `supabase/functions/_shared/server-usage.ts` | Server-side provider usage recording. |

### Persistence, schema, and downstream ownership

| Source | Role in Character Builder |
|---|---|
| `src/services/persistence/characters.ts` | Full character database mapping, reusable queries/upsert/copy/delete, and avatar hydration. |
| `src/services/persistence/scenarios.ts` | Core story plus character, codex, and scene serialization for the atomic persistence call. |
| `src/services/persistence/conversations.ts` | Conversation and `character_session_states` persistence downstream of Play. |
| `src/services/persistence/side-characters.ts` | Conversation-owned side-character persistence. |
| `src/services/persistence/shared.ts` | Shared Supabase client and nested database conversions. |
| `src/services/supabase-data.ts` | Compatibility export surface consumed by Index workspace hooks. |
| `src/features/character-editor-modal/CharacterEditorModalScreen.tsx` | Separate Chat session character editor and drift boundary. |
| `src/components/chronicle/CharacterEditModal.tsx` | Compatibility wrapper that renders the Chat session editor. |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Downstream Play/session orchestration and session-character save wiring. |
| `src/types.ts` | Canonical Character, trait, goal, custom-section, and ScenarioData shapes. |
| `src/utils.ts` | UUID, timestamp, image resize, and default scenario helpers. |
| `src/data/supabase-schema-reference.ts` | Synchronized documented table/storage boundary displayed in Admin. |
| `src/integrations/supabase/types.ts` | Generated client typing for current tables and RPCs. |
| `src/integrations/supabase/client.ts` | Browser Supabase client used by direct storage/settings code. |
| `supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql` | Repository public-style RPC, application-setting reads, and visible-public character policy. |
| `supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql` | Private avatar path, bucket, and owner/admin storage policies. |
| `supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql` | Current atomic story-save ownership/parent conflict checks. |

### Knowledge integration tests

| Source | Role in Character Builder |
|---|---|
| `src/data/chronicle-knowledge-base/character-builder-manifest.test.ts` | Verifies the exact stable-tab contract, substantive section ownership, source paths, and reproducible source composite. |
| `src/pages/style-guide/chronicle-knowledge-base.character-builder.test.tsx` | Proves the real renderer resolves all seven Character Builder tabs, isolates **CB-ISSUE-001** and **CB-ISSUE-002**, preserves the explicit empty Current Work state, and renders four positively mapped historical Quality Hub records without adjacent-capability bleed. No active work or modern accepted closeout is currently registered for this capability. |

## Inspected Source Set and Reproducible Composite

### Exact ordered source paths

The architecture review inspected these source and focused-test paths in this exact order:

```text
src/App.tsx
src/pages/Index.tsx
src/components/app-shell/AppSidebar.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppShellTopBar.test.tsx
src/features/story-builder/StoryBuilderScreen.tsx
src/features/story-builder/sidebar/StoryRosterSidebar.tsx
src/features/story-builder/sidebar/StoryRosterGroup.tsx
src/features/story-builder/sidebar/AddCharacterPlaceholderCard.tsx
src/features/story-builder/sidebar/StoryRosterCharacterTile.tsx
src/components/chronicle/CharacterCreationModal.tsx
src/components/chronicle/CharacterPicker.tsx
src/hooks/use-auth.ts
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-character-workspace.ts
src/hooks/use-index-character-workspace.test.ts
src/hooks/use-index-scenario-persistence.ts
src/hooks/use-index-shell-bootstrap.ts
src/hooks/use-index-shell-bootstrap.test.ts
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
src/components/chronicle/TabFieldNavigator.tsx
src/components/chronicle/PersonalitySection.tsx
src/components/chronicle/CharacterGoalsSection.tsx
src/components/chronicle/GuidanceStrengthSlider.tsx
src/components/chronicle/CustomContentTypeModal.tsx
src/components/chronicle/ChooserModal.tsx
src/components/chronicle/DeleteConfirmDialog.tsx
src/components/chronicle/AIPromptModal.tsx
src/components/chronicle/EnhanceModeModal.tsx
src/services/character-ai.ts
src/services/api-usage-validation.ts
src/services/usage-tracking.ts
src/components/chronicle/AvatarActionButtons.tsx
src/components/chronicle/AvatarGenerationModal.tsx
src/constants/avatar-styles.ts
src/contexts/ArtStylesContext.tsx
src/components/chronicle/ImageLibraryPickerModal.tsx
src/services/persistence/library-copy.ts
src/services/persistence/media-settings.ts
src/services/persistence/media-settings.test.ts
src/services/persistence/signed-media.ts
src/services/persistence/characters.ts
src/services/persistence/scenarios.ts
src/services/persistence/conversations.ts
src/services/persistence/side-characters.ts
src/services/persistence/shared.ts
src/services/supabase-data.ts
src/features/character-editor-modal/CharacterEditorModalScreen.tsx
src/components/chronicle/CharacterEditModal.tsx
src/components/chronicle/ChatInterfaceTab.tsx
src/types.ts
src/utils.ts
src/data/supabase-schema-reference.ts
src/integrations/supabase/types.ts
src/integrations/supabase/client.ts
supabase/functions/chat/index.ts
supabase/functions/generate-side-character-avatar/index.ts
supabase/functions/_shared/rate-limit.ts
supabase/functions/_shared/server-usage.ts
supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql
supabase/migrations/20260619105616_26249211-83b9-43ce-b6b8-ead8b86f591b.sql
supabase/migrations/20260719001853_b7174d69-8075-443a-a464-6da9a10d50df.sql
src/data/chronicle-knowledge-base/character-builder-manifest.test.ts
src/pages/style-guide/chronicle-knowledge-base.character-builder.test.tsx
```

### Composite algorithm and value

For each path above, in order, compute the SHA-256 digest of the file's current bytes and append one line in the form `<digest><two spaces><path><newline>`. Compute SHA-256 over that complete UTF-8 listing. This detects a changed source file, changed focused test, changed order, added path, or removed path.

Inspected-source count: **74 paths**.

Inspected-source composite: `998ce65fe910e90a13eb4d32aecad4c26e9ab7ea899f48283b6cde33871b3e49`

## Review Metadata and Evidence Limits

Review date: **08/22/2026**.

Inspected repository revision: `cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7` plus the current shared working tree. The commit identifies the checked-out base; concurrent uncommitted Phase work was preserved and is not represented by the revision alone.

Direct UI evidence: the local application at `http://localhost:8080/` was inspected signed out. The review opened Story Builder, created a new story-owned character in working state, inspected every built-in Character Builder section, created structured and freeform custom sections, and inspected Character Creation, AI Fill, Enhancement Style, device/library avatar source, the signed-out My Images picker, and Generate Avatar. Source inspection was used to verify branches that authentication blocked and to keep signed-out presentation from being mistaken for durable success.

Not live-verified: authenticated Character Library load, an existing reusable or story character, successful reusable/story save, Cancel after persisted data, library-to-story or story-to-library copy, deletion, avatar upload/copy/generation/reposition persistence, AI provider output, global navigation-image mutation, deployed RLS/RPC/storage policies, signed-URL expiry, or downstream Chat persistence. No Supabase mutation, deployment, provider request, or credit-spending action was performed. The synchronized Supabase reference is documented repository evidence, not proof of current deployment or human acceptance.
