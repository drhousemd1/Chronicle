# Overview

## Image Generation at a Glance

### The administrator's art-style prompt workspace

Image Generation is Chronicle's administrator workspace for developing the art-style instructions used by image-generation workflows. It is the place to tune a style's name, example thumbnail, default injection prompt, and optional masculine and androgynous prompt variants. An **injection prompt** here means style instructions that Chronicle adds to an image request; it does not mean changing the player's dialogue or replacing the requested subject.

The tool supports the owner's ongoing experimentation with how a style should look. Its current implementation is a shared preset editor, however, not a separate test environment. Saving a change updates the same `art_styles` records that Chronicle's image-generation functions read. An experimental prompt can therefore become the instruction used by a later real cover, scene, or avatar request. The distinction between trying wording in a field and saving it to shared configuration is the most important operating boundary on this page.

The current tool does not generate an image itself. There is no subject-prompt field, Generate button, comparison gallery, test-run history, or isolated draft-versus-production selector in this component. It prepares the shared style configuration; the ordinary generation workflows elsewhere in Chronicle supply a subject and request an image. A thumbnail is an uploaded visual reference for the style, not proof that the current injection prompt produced that image.

### What a useful session accomplishes

A useful session leaves one known style with deliberate wording and an understandable presentation. The administrator should know which preset was changed, whether the change is still a browser draft, whether Save completed, and which downstream workflows may use it. The goal is not merely to fill every field: an empty optional variant has a defined fallback, while a strong-looking thumbnail says nothing about whether a prompt is effective.

The tool belongs under Admin because these presets are shared application configuration. It is not My Images, which owns an account's reusable uploaded images; it is not the Character Builder avatar editor; and it is not Story Builder's cover or scene editor. Those capabilities own the subject, destination image, and parent character or story save. Image Generation owns the reusable style instructions and their presentation.

## Presets, Drafts, Thumbnails, and Generated Images

### One preset identity connects the editor to its consumers

Each style has a stable text ID. Its visible name may change without changing that ID. Ordinary image pickers select the ID, and the server uses it to find the matching saved instructions. Renaming a card does not create a new style, and replacing its thumbnail does not change its identity.

The page loads existing styles in saved sort order. It does not expose creation, deletion, duplication, reordering, or ID editing. Removing a thumbnail clears that style's thumbnail field in the current draft; it is not deletion of the style or of an already generated image.

### Working text is different from saved configuration

Typing changes the current browser draft and marks its card dirty. The card then offers **Save Changes**. Until that save succeeds, the edited wording has not been written to the shared style row. There is no automatic prompt save or separate review-and-publish action.

Save is per card, but the successful-save path reloads all style cards from the database. This matters when several cards have unsaved changes: saving one card can replace unsaved drafts in the other cards with their saved versions. The editor also does not provide a Cancel or Undo control, a retained revision history, or a before-leave warning. Work on a card must not be mistaken for a recoverable saved revision merely because it remains visible.

### Thumbnail upload has its own persistence boundary

Upload opens the device file chooser. After a file is chosen, Chronicle uploads it into the public `avatars` storage bucket and places the returned public URL into the card's draft. The storage object exists before **Save Changes** attaches its URL to the style row.

Conversely, Remove only clears the draft URL. Saving that cleared field removes the preset's thumbnail reference, but the current handler does not delete the underlying storage object. Replacing a thumbnail also does not clean up the previous object. Thumbnail objects, thumbnail references, style prompts, and destination images are therefore separate pieces of state.

The public-thumbnail destination is not appropriate for private prompt text or confidential reference material. Backend injection prompts remain in the restricted style record; thumbnails are presentation assets that ordinary style pickers can display.

## Default Instructions and Presentation Variants

### The default prompt supplies the base style

**Injection Prompt (Default)** stores the primary style wording. A cover-generation request reads this default field and adds it to the subject prompt. Saving a masculine or androgynous variant does not change the cover path's selection rule.

The **Gender Variants** disclosure holds separate Masculine and Androgynous text areas. Their placeholder explains that leaving them empty uses the default prompt. The editor saves empty variant strings as database null values. It does not provide a separate feminine field; the default is the fallback when no applicable populated variant is selected.

### A saved variant is used only when the consumer selects it

Avatar and scene-generation functions can choose a variant, but they obtain the selection context differently. The avatar function looks at the request's `gender` value and uses a populated matching variant; otherwise it uses the default. The inspected ordinary Avatar Generation modal sends the selected style ID without a gender field, so merely filling the variants does not mean that modal will choose one.

Scene generation derives the primary gender presentation from its structured scene analysis, then selects a populated matching variant or the default. This is consumer behavior, not a toggle on the administrator's style card. The same preset can therefore contribute different wording to different generation workflows.

These are instructions supplied to an image model, not a guaranteed visual transformation. An image still depends on its subject, other request instructions, provider behavior, and the specific generation path. The manual explains where style wording enters the request; it does not certify the quality or fidelity of the resulting art.

## The Complete Editing and Consumption Workflow

### Open and revise an existing style

An authorized administrator opens **Admin → Image Generation**. Chronicle loads the full style records for the editor and presents a horizontally arranged card for each result. The administrator identifies the preset, changes its name or prompt wording, opens variants if needed, and optionally uploads or removes a thumbnail.

Each edit changes browser working state. **Save Changes** writes the selected card's presentation and prompt fields to the existing style ID. While saving, that card's button says **Saving...** and is disabled. After the request returns without an error, Chronicle reloads the card collection and presents the saved state.

No generation request occurs during this save. It changes the configuration that future generation can read, rather than generating a preview or regenerating existing images. Existing story covers, scene images, and character avatars remain their already-created media until their owning capability explicitly replaces them.

### Understand the next generation handoff

Ordinary style pickers obtain safe presentation data: IDs, names, thumbnails, and sort order. They do not need the backend prompt fields to show a choice. Cover and avatar dialogs pass the selected ID to their server function; the scene dialog passes the ID and description to its owning generation handler.

The server reads the applicable saved prompt from `art_styles` when building the generation request. This is why saving an experiment can affect actual application output. It is also why an already-open picker can have an older name or thumbnail while a new request reads newer backend instructions: the shared presentation context has a load/refresh lifecycle, and this editor's Save only reloads its own drafts. It does not explicitly refresh every open consumer.

The generation destination then owns the resulting image, preview, storage reference, and parent save. A successful art-style save is not a successful image generation, and a successful image generation is not automatically a saved story or character.

## Loading, Failure, and Recovery Limits

### A blank workspace is not a confirmed empty style catalog

The editor begins with an empty draft array. It does not render a dedicated loading indicator, empty-catalog explanation, or inline load-error panel. A failed initial style query is logged and can leave the same empty-looking workspace as a successful query with no rows. The administrator cannot infer which occurred from blank cards alone.

Save and upload failures are also logged rather than shown through a dedicated message on the card. A failed save clears the saving flag and generally leaves the edited draft dirty. A failed upload does not replace the draft thumbnail. Neither console-only failure path is a promise that the user will receive clear recovery guidance.

### Current saves are not revision-controlled publishing

The update targets the style ID but does not use a revision comparison, return an affected-row count, or protect against another editor's newer values. A request returning no error is the component's success condition. Reloading all cards after a save can discard other local work, and the editable fields are not locked while their save is pending. These limitations are part of the current source account, not recommended authoring behavior.

The safe interpretation is narrow: the tool is an implemented shared-style editor with limited feedback and no isolated experiment-promotion mechanism. The [App Architecture](?section=image-generation&tab=app-architecture) tab identifies the exact owners and handoffs. Live access policies, provider success, and human approval of style results remain separate evidence.

# UI Elements and Functions

## Entry and Card Layout

**Image Generation** is an internal Admin tool, not a standalone player destination. Its workspace is black, scrollable in both directions, and contains a horizontal row of fixed-width style cards. Additional cards remain accessible by scrolling; the current editor does not paginate or provide a style search.

Each card contains a square thumbnail or **No thumbnail** fallback, a Style Name input, the default prompt text area, the Gender Variants disclosure, and one save button. The card's identity comes from its saved style ID, which is not directly editable.

## Thumbnail Controls

- Hovering the thumbnail reveals **Upload** and, when a URL exists, **Remove**.
- Upload accepts a device image through an `image/*` file chooser. It uploads the selected file and changes the draft URL only after upload succeeds.
- Remove immediately clears the draft thumbnail reference and marks the card dirty. It has no confirmation and does not remove the stored file.
- There is no crop, reposition, generated-thumbnail, download, or private-library picker in this tool.

## Text and Variant Controls

**Style Name** changes the picker-facing display name. **Injection Prompt (Default)** changes the primary backend instructions. **Gender Variants** expands or collapses the Masculine and Androgynous text areas without saving or clearing them. Each optional field says **Leave empty to use default prompt**.

The inputs do not impose a nonblank name, required default prompt, visible length counter, or prompt-quality validation. Changing a field marks the card dirty even if the administrator later types its original value again; dirty state is an edit flag, not a comparison with the saved row.

## Save State

| Visible button | Meaning and action |
|---|---|
| Saved | The card is not marked dirty. The button is disabled. This includes freshly loaded cards. |
| Save Changes | The draft has been edited. Selecting it updates that existing style row. |
| Saving... | The selected card's request is pending and its button is disabled. Other fields and cards remain editable. |

A successful update reloads every card. There is no Save All control and no unsaved-change confirmation on navigation. Failure is logged; it does not open a card-local error panel or toast.

## Absence of a Generation Surface

The page has no image request controls. Names and thumbnail images are style presentation, while prompt fields are shared configuration. Image generation, request errors, generated previews, and adoption into stories or characters belong to the relevant cover, scene, or avatar workflow.

# App Architecture

## Scope and Source Ownership

`src/pages/Admin.tsx` registers `image_generation` with the visible title **Image Generation** and lazy-loads `ImageGenerationTool`. The Admin shell owns entry and navigation. The tool itself owns the style draft collection and directly calls the shared Supabase client for style reads, style updates, and thumbnail uploads.

This component contains no independent authentication or administrator lookup. It is intended to be mounted through Admin; actual database and storage authorization remains the backend boundary. The shared client is a transport dependency, not permission granted by the visible card.

## Full-Record Loading and Draft Creation

`loadDrafts` selects `id`, `display_name`, `thumbnail_url`, `backend_prompt`, `backend_prompt_masculine`, `backend_prompt_androgynous`, and `sort_order` from `art_styles`, ordered ascending with null sort positions last. It translates each returned row into a `StyleDraft`, replacing missing prompt strings with empty strings and setting `isDirty` and `isSaving` false.

The direct full-row read is deliberately different from `ArtStylesContext`. The Admin editor needs restricted backend fields to edit them. Ordinary pickers use `get_public_art_styles`, whose checked-in SQL returns only presentation columns. A comment saying the browser never sees prompts must be read as the ordinary-context boundary, not as a claim that this authenticated Admin editor lacks them.

## Per-Card Update and Collection Reload

`updateDraft` merges a patch into one ID and sets its dirty flag. `handleSave` sets the selected card's saving flag and updates its existing row with the visible name, thumbnail URL, default prompt, and nullable variant prompts. It does not insert missing styles or change IDs or order.

If the update reports an error, the catch path logs it and clears the saving flag. Otherwise the handler awaits `loadDrafts`, then clears flags for the selected card. Because the reload replaces the entire array, other dirty cards are not retained. Because load failure is handled internally, an update may complete while the follow-up collection read fails. The handler also does not verify an affected-row count or reconcile edits made during the in-flight request.

## Thumbnail Storage

`handleThumbnailUpload` creates a device input, preserves the filename extension or uses `png`, and uploads to `avatars` under `admin/styles/<style-id>-<timestamp>.<extension>` with upsert enabled. It obtains a public URL and passes that URL through `updateDraft`. It does not resize, crop, generate, or attach the URL durably to the style row until the later card save.

`handleDeleteThumbnail` only clears the draft reference. No storage removal is issued on removal, replacement, canceled navigation, or a failed subsequent style save. Storage-object existence and style-row adoption are separate operations.

## Shared Presentation and Generation Consumers

`ArtStylesProvider` initializes from checked-in `AVATAR_STYLES`, loads the sanitized presentation RPC, and exposes styles, a default ID, lookup by ID, loading state, and an explicit refresh function. Failed or empty public loads can retain the checked-in fallback catalog. The Admin save path does not call this provider's refresh function or establish realtime synchronization.

`CoverImageGenerationModal` and `AvatarGenerationModal` resolve a selected presentation object and send its safe ID to their respective functions. `SceneImageGenerationModal` passes its selected ID to the caller's `onGenerate` handoff. These interfaces own subject text and request state, not shared preset editing.

| Generation owner | Saved style selection and use |
|---|---|
| `generate-cover-image` | Reads `backend_prompt` by style ID and adds the resolved style to the cover subject prompt. |
| `generate-side-character-avatar` | Reads all three prompt fields; a matching populated `gender` variant wins, otherwise the default is used. The inspected ordinary avatar modal does not supply `gender`. |
| `generate-scene-image` | Reads all three fields and selects using the first analyzed character's gender presentation, defaulting that presentation to androgynous when absent. It passes the resolved block into image-prompt assembly. |

These server consumers create a service-role client for the restricted style lookup. Their code retains legacy client-prompt fallbacks when no nonempty saved prompt was resolved. Scene generation also has a built-in style fallback. Consequently, clearing a prompt does not establish a universal no-style request. The actual selected branch belongs to the consumer named above.

Provider calls and generated-image persistence remain downstream. Editing these records does not regenerate existing media or modify conversation narrative, character profile text, or reusable story fields by itself.

## Current Implementation and Evidence Limits

The implemented workflow is shared-record editing, not an isolated experiment-to-publication lifecycle. The material limitations are collection-wide draft replacement after Save, no revision conflict guard, console-only failures, no dedicated initial empty/error distinction, no thumbnail cleanup, and no explicit refresh of other mounted style pickers. This account describes those paths without implementing repairs.

The listed repository source and synchronized schema reference establish request shapes, code-level selection, and documented access summaries. They do not prove that current deployment policies match, that a save or provider request succeeded, or that a style produces the desired art. No credentials or private prompt values are reproduced here.

### Inspected Source Paths

```text
src/pages/Admin.tsx
src/components/admin/ImageGenerationTool.tsx
src/contexts/ArtStylesContext.tsx
src/components/chronicle/AvatarGenerationModal.tsx
src/components/chronicle/CoverImageGenerationModal.tsx
src/components/chronicle/SceneImageGenerationModal.tsx
supabase/functions/generate-cover-image/index.ts
supabase/functions/generate-side-character-avatar/index.ts
supabase/functions/generate-scene-image/index.ts
supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql
src/data/supabase-schema-reference.ts
```

# Supabase Tables

## Reference Authority

The [Supabase Schema Reference](/style-guide/supabase-schema-reference), maintained in `src/data/supabase-schema-reference.ts`, is the last synchronized documented database and storage account. The descriptions below distinguish that reference from the requests in the current checkout. Neither is live-deployment proof.

## Style Configuration

`art_styles` is the shared preset table. The editor reads the text ID, display name, thumbnail URL, default prompt, masculine prompt, androgynous prompt, and integer sort order. Save updates the name, thumbnail, and three prompt fields; it does not update sort order or the reference's `updated_at` field explicitly.

The synchronized reference describes direct table read, insert, update, and delete as administrator-only. The inspected June 2026 migration restricts direct reads to administrators and defines `get_public_art_styles()` as a security-definer function returning `id`, `display_name`, `thumbnail_url`, and `sort_order`, with execution granted to anonymous, authenticated, and service-role callers. That curated read does not expose the backend prompt columns.

The server generation functions read the restricted prompt fields by style ID through their service-role client. Ordinary style-picker visibility therefore does not grant permission to edit shared presets or directly fetch their private instruction fields.

## Thumbnail Storage

The tool uploads thumbnail bytes into the `avatars` bucket and stores a public URL in `art_styles.thumbnail_url` after card Save. The synchronized storage reference identifies `avatars` as publicly readable media, with owner-scoped writes, updates, and deletes. It does not separately establish the deployed authorization behavior of this tool's `admin/styles/` prefix; that exact storage-policy compatibility remains outside this source-only account.

Removing the draft thumbnail or saving an empty URL does not issue a storage delete. This manual does not claim that unused files are automatically removed.

## Boundaries Beyond This Tool

Generated cover, scene, and avatar destination storage belongs to the corresponding generation and authoring capability. This tool does not write those destination rows merely by saving a style. Shared administrator access and Admin hub metadata remain owned by the [Admin Panel](/style-guide/chronicle-knowledge-base?section=admin&tab=overview#admin) manual. Live schema, policy, or storage changes are not performed from this manual.
