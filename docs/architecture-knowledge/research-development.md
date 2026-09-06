# Overview

## Research & Development at a Glance

### A place to explore a concept without making it production behavior

Research & Development is Chronicle’s administrative prototype workspace. It brings a named experiment, its purpose, a coded preview when one exists, editable notes, and reference images together on one document-like page. Its purpose is to make a possible design visible and discussable before that design is adopted into the application.

The workspace itself is implemented Admin functionality. The experiments shown inside it are not automatically implemented Chronicle features. A story-opening scene can work in a preview without being part of the actual playthrough flow; a graph can demonstrate a useful visual approach without becoming the production Knowledge Base graph. The distinction is about where the code is used, not whether the experiment looks convincing.

R&D therefore preserves two kinds of information together without confusing their ownership. The user can edit the page’s title, purpose, notes, and reference images. A developer can attach a source-controlled interactive preview and its factual implementation details to the same stable mock-up ID. Renaming the page does not create another experiment or change that source identity.

### What a successful experiment produces

A useful R&D page lets the reader understand the question being explored, exercise the current preview, see the references and discussion behind it, and identify the source that implements the experiment. It can remain unfinished while still being valuable. A blank protected preview means no coded component has been attached yet; it does not mean the page’s notes or references failed to save.

When a concept is later selected for production, the experiment remains available for comparison. Adopting a design does not grant permission to delete its prototype, discard the discussion, or remove it from the R&D registry. Retirement or deletion requires the user’s direct instruction naming that outcome. Production and its reference experiment may coexist.

## From a Blank Page to a Coded Preview

### Create the page and record its question first

**Add New Mock-up** creates a new record with a stable ID, an untitled name, an empty purpose, and a blank text block. Chronicle saves that initial record to device-local browser storage, selects it, and focuses the title. The page immediately contains the same protected preview shell as a coded experiment, even though its central preview field is empty.

The title identifies the investigation in the sidebar. The purpose explains what the experiment is meant to help decide. Notes and dropped images remain below the preview, where the user can preserve comments, rough wording, and visual comparisons without editing the component implementation itself.

### Attach source to the existing page rather than replacing it

A coded preview is registered against the existing stable mock-up ID. The registry supplies its component, source path, source dates, factual details, and the Chronicle interface precedents it reuses. The host then renders that component inside the existing page’s protected shell. The original title, purpose, notes, and images retain their own editable storage.

One saved page can contain several related coded experiments. Each additional experiment gets the same shared shell, its own title/source details, and an independent render-error boundary. They share the page’s selected preview background and the surrounding editable discussion. The host does not need another sidebar record merely because the investigation compares several related variants.

### The preview shell is consistent; the experiment may be different

The shell has a thin title-and-source strip, one preview field, and a collapsed **Component Details** row. Four background swatches change the contrast behind the preview: white, light gray, medium gray, and charcoal. Changing that background does not recolor the prototype’s own interface or alter Chronicle’s production theme.

Component Details identifies the mock-up ID and, for registered previews, source creation/update dates, the source owner, UI precedents, and factual notes. Those facts are maintained in source. The editable purpose and notes are the place for discussion; they do not silently replace the registered implementation record.

## Notes and Reference Images

### The editable document is ordered text and images

Notes are stored as plain-text blocks, not saved HTML, executable JavaScript, or an embedded rich-text application. Enter splits the current text block so another block can follow; Shift-Enter retains a line break inside the same text block. This gives the user a flowing document while preserving the position of images between pieces of text.

Dropping a JPEG, PNG, or WebP file on a text block inserts the image beneath that block. Dropping into the document without a specific target places it near the end, before the trailing blank text area when one exists. An image can then be dragged to another block position. Its remove control deletes the reference from this R&D document; it is not a command to delete the original desktop file.

The host currently allows up to 20 reference images per mock-up, 10 MB per image, and a 50 MB device-local image allowance across the loaded workspace. Unsupported types and size/count violations produce an error instead of a partially accepted batch. These are storage constraints of this tool, not a classification of how complex an experiment is.

### Reference images and preview assets have different roles

A dropped reference image is user-supplied discussion material attached to the editable record. A coded preview may use separately authored assets from its source directory or private generated-artifact directory. Saving the notes does not generate or update those coded assets, and changing a preview’s implementation does not rewrite the attached references.

This separation keeps a supplied screenshot available even when the coded experiment is revised. A prototype can be compared with the reference instead of silently replacing the evidence used to judge it.

## Saving and Reopening the Workspace

### Autosave is a recovery copy on this browser

Changes to the editable record are saved to IndexedDB after a 500 ms quiet period. IndexedDB is this browser origin’s local database; it is not a Supabase table and is not synchronized to another device. Text, title, purpose, preview background, and reference images can therefore survive reopening the same browser origin without already being stored in the repository.

The host also tries to finish a local save before switching mock-ups, creating another page, or following supported navigation away from R&D. A failed local save blocks those guarded transitions so the current draft remains available. A browser unload warning is installed while local changes are dirty. These mechanisms protect the recovery copy; they are not a promise that the repository has been updated.

### The header Save is the durable repository action

**Save** in the application header writes the selected mock-up record and its original reference-image bytes through Chronicle’s local development server. The result is `docs/research-development/mockups/<stable-id>/mockup.json` plus the record’s referenced images. The button can show **Saving...** during the write, then returns to Save. Only a failure remains visible in the document.

Repository saving is available only through the local development server’s loopback-only R&D middleware. A hosted browser session can still have device-local records, but it does not gain a repository-write service merely by showing the R&D page. Saving to the local checkout is also not a Git commit, push, or deployment.

The local autosave and repository Save are separate operations. A successful recovery save does not mean the header Save was performed. If the user continues editing while a repository write is running, the in-flight write contains the captured version; later edits are not retroactively added to that request and need another Save.

### Reopening combines saved records without duplicating the page

On load, the host reads the browser recovery workspace and the repository workspace. It matches records by stable ID and chooses the record with the newer `contentUpdatedAt`; the repository copy wins a tie. It then resolves the chosen record’s referenced image assets and displays pages in creation order. This is whole-record selection, not a paragraph-by-paragraph merge of divergent edits.

If a registered coded preview has no corresponding loaded record, the host supplies a record for its existing ID and attempts to save that seed to the local browser. That allows a known source-backed experiment to remain discoverable without turning the registry’s default wording into a replacement for newer saved notes.

The last-selected ID is only a local preference. Changing the local server port changes the browser origin, so its recovery database and last selection can differ. Repository-saved pages can be loaded across those local server origins; recovery-only work cannot be assumed to follow. This is an important distinction when an experiment appears missing after switching previews or reopening a different localhost address.

## Failure, Privacy, and Preservation

### A failed preview should not erase the investigation

Each coded preview has an error boundary. If its React rendering throws, the shell shows that the preview could not render while the surrounding notes and factual record remain available. A working host does not guarantee every prototype works, and a broken prototype does not authorize deleting its page.

Browser storage and repository loading fail independently. The host can continue with whichever workspace loaded successfully and report the other error. Missing or invalid repository image metadata can prevent the repository workspace from loading; an empty-looking view must not automatically be interpreted as deliberate deletion. Storage exhaustion, an unavailable local save endpoint, and a preview rendering error are different failures with different owners.

### Local does not mean disposable or automatically backed up

Reference images are private local material in the inspected host path: recovery blobs in IndexedDB and explicit repository files after Save. They are not uploaded to Chronicle’s image library or Supabase Storage by these host operations. Clearing browser site data can remove the only copy of recovery-only edits, so important work should be repository-saved before changing browser storage or assuming it can be recovered elsewhere.

The repository save mechanism replaces the previous saved directory through a staged write and temporary backup. It is designed to restore the previous directory if the replacement step fails, but it removes the temporary backup after success. That is a failure-recovery mechanism, not an end-user version-history browser or permanent archive of every Save.

### Production adoption is a separate decision and implementation

The R&D README requires prototypes to remain isolated from production. Production code must not import a prototype or its private generated artifacts as an implementation shortcut. The prototype can reuse an existing production component or an established presentation contract, but production must not depend on the experiment.

Source UI precedents keep ordinary controls aligned with Chronicle’s existing language while allowing the experiment’s specific composition to differ. A preview’s presence, its registered source path, or a generated graph is not proof that the corresponding application feature is complete. The Knowledge Base and accepted production implementation remain the places to establish that fact.

# UI Elements and Functions

## Header and Workspace Navigation

### Add New Mock-up

The shared application header places **Add New Mock-up** immediately before Save. It first preserves the current local draft, creates a blank record in browser storage, selects it, and focuses Title. Loading or an active save can temporarily disable creation. If the current draft cannot be saved locally, the tool stays on that page instead of silently abandoning it.

### Save

Header **Save** sends the selected record and reference assets to the local repository service. It is not an autosave toggle and does not save every page at once. **Saving...** indicates the request is active. A failure is displayed near the selected page’s metadata; a return to the ordinary label should be interpreted alongside that error state. This control does not commit, push, or deploy the written files.

### App Style Guide and mock-up list

**App Style Guide** preserves the local draft before opening the guide. Selecting a mock-up row similarly preserves the current local draft before switching. The selected row is highlighted. A lock icon identifies a registered coded preview, not an uneditable notes page or a global work lock. The title shown in the list follows the editable record, while its ID remains stable.

## Editable Page Fields

### Title, Purpose, and dates

Title and Purpose update the local draft and participate in recovery autosave. Date created belongs to the record; Last edited reflects its content timestamp. Neither is the source-file update date shown in Component Details. Renaming Title changes the sidebar/display label, not the registry’s source identity or the durable directory name.

### Text blocks

The text area expands as the user types. Enter splits at the current selection into a following text block and moves focus there. Shift-Enter remains inside the existing block. Text is plain content: writing HTML or component code in a note does not execute it or register a preview.

### Dropped reference images, repositioning, and removal

Drop supported image files into the document. Dropping on a block inserts after it; dragging an existing image moves its block to the new position. The image’s remove button removes its block and associated reference from the editable page. The change then participates in local autosave and must also be repository-saved to change the durable record. The original supplied filesystem file is not deleted by this control.

## Protected Preview Controls

### Background swatches

White, light gray, medium gray, and charcoal change the preview field’s background. The selected swatch is visibly marked and keyboard-operable. Every additional preview on the same saved page shares this choice. Its scope is contrast behind the experiment, not application themes, generated image styling, or the experiment’s own colors.

### Component Details

This collapsed row opens the stable mock-up ID, registered source owner and dates, UI precedents, and factual implementation notes. A page without registered source shows its ID and the absence of additional details. Source details are not edited by typing into the notes below them.

### Preview interactions and errors

Interactive controls inside a coded preview belong to that experiment and are separate from the host’s save controls. Their state may be temporary unless that preview explicitly implements persistence. The shell isolates rendering failures and leaves its details and the editable document available. This manual documents the host rather than claiming that every experimental control has the same behavior.

## Empty and Unavailable States

During load, the main area displays **Loading document...**. With no selected record, **Create a blank document** starts a page. A blank protected preview on an existing page is a valid not-yet-coded state. Browser-storage errors, repository-load/save errors, and preview errors are displayed by their respective owners rather than being treated as one universal failure.

# App Architecture

## Host, Record, and Registry Ownership

`Admin.tsx` lazy-loads `ResearchDevelopmentTool.tsx`. The host owns record loading, selection, editable draft fields, image ordering, recovery autosave, repository Save, and callback registration with the shared application header. `Index.tsx` invokes the registered before-leave handler for supported navigation, while `AppShellTopBar.tsx` exposes the registered Add and Save actions.

`rnd-types.ts` defines the stable mock-up record, ordered text/image blocks, reference-image blobs, and source-controlled prototype definitions. `rnd-registry.tsx` binds a stable record ID to its coded preview and factual details. `RndPrototypeShell.tsx` owns the consistent visual boundary, background selection, collapsible record, and render-error isolation. Prototype-specific components do not recreate this host shell.

The current retired-ID collection in `rnd-retired.ts` is empty. The loaders and writers nevertheless consult it. Adding an ID there would affect whether a page loads or can be saved; it is a lifecycle action, not routine housekeeping, and must follow the README’s direct-user-authorization rule.

## Loading and Resolving the Current Record

The host requests `loadRndWorkspace` and `loadRndRepositoryWorkspace` concurrently with independent success/failure handling. `rnd-storage.ts` parses browser records and translates older notes/image arrays into ordered blocks when needed. `rnd-repository-client.ts` validates the repository response, fetches its listed images, and checks each image’s byte size and MIME type against its descriptor.

`mergeRndWorkspaces` matches IDs, chooses the newer whole record, resolves its asset references, and orders the result by creation date. It can fall back to an asset from the other workspace when the chosen record references that ID. It does not reconcile conflicting sentences or compare semantic intent. The host adds only missing source-backed records from the registry, then restores a valid last selection or selects the first available page.

## Local Editing and Recovery Save

`ResearchDevelopmentTool.tsx` maintains a draft separately from the last locally saved record. Text edits also update projected notes and image-ID lists so the ordered document and compatibility fields agree. New image blobs are tracked as pending assets; removed references are tracked separately until the save completes.

After the quiet period, `persistDraft` captures the draft revision and writes the record, new blobs, and removals in one IndexedDB transaction. If typing continues during that write, the revision check avoids replacing the newer draft with the older saved snapshot. Failed local saves leave the draft available and expose the storage error. The guarded navigation path waits for an in-flight repository save, then attempts the local save; it does not create a repository Save automatically.

## Durable Repository Handoff

The browser serializes the selected record and image blobs and posts them to `/__rnd-repository/save`. `rndRepositoryDevPlugin`, installed by `vite.config.ts` only for serving development, validates the payload and permits only loopback requests. It checks stable identifiers, supported image types, declared byte sizes, size/count limits, and agreement between image blocks, asset IDs, and supplied assets.

The middleware creates a staging directory, writes a manifest and the original decoded image bytes, temporarily moves an existing destination to a backup, and renames the completed staging directory into place. A failed replacement attempts to restore the previous directory; a successful replacement removes the temporary backup. Writes are serialized inside the server, and reads wait for the queued write, preventing the workspace reader from observing a half-replaced saved directory.

This serialization is not multi-user conflict resolution. Separate browser drafts can still represent divergent versions; the host’s reload policy remains timestamp-based whole-record selection. The destination is the local checkout’s `docs/research-development/mockups/<stable-id>/` directory, not Supabase, a remote GitHub commit, or a published application artifact.

## Generated Artifacts and Production Isolation

Large generated experiment files belong under `docs/research-development/generated/<prototype-name>/`. The local middleware serves bounded HTML, JavaScript, JSON, or Markdown paths under `/__rnd-repository/generated/`, checks that real paths remain inside the intended directory, and rejects unsafe path/file shapes. Generated HTML receives a restrictive content-security policy, including no network connections. Its reader must still report the generator, scope, freshness, and limitations in the experiment’s factual record.

Generated artifacts are separate from the editable mock-up manifest and are not regenerated by header Save. The host’s reference-image upload path also does not turn dropped files into executable prototype code. Production dependencies must remain outside the prototype directory and private generated-artifact store; a production implementation can coexist with its original R&D reference.

### Inspected Source Paths

```text
src/pages/Admin.tsx
src/pages/Index.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/admin/research-development/ResearchDevelopmentTool.tsx
src/components/admin/research-development/RndPrototypeShell.tsx
src/components/admin/research-development/rnd-types.ts
src/components/admin/research-development/rnd-storage.ts
src/components/admin/research-development/rnd-repository-client.ts
src/components/admin/research-development/rnd-repository-dev-middleware.ts
src/components/admin/research-development/rnd-registry.tsx
src/components/admin/research-development/rnd-retired.ts
src/components/admin/research-development/README.md
vite.config.ts
```

# Supabase Tables

## The R&D Host Does Not Store Mock-ups in Supabase

The inspected host has no Supabase table, RPC, Edge Function, or Storage-bucket write for its mock-up documents, dropped reference images, or background selection. Its storage boundaries are the browser’s IndexedDB recovery database, a local preference key, and files explicitly saved through the local development server. A prototype’s own separately authored behavior must be inspected independently; host documentation is not evidence that every possible experiment has identical dependencies.

### Browser recovery database

IndexedDB database `chronicle-rnd-workspace`, version 1, contains a `mockups` store keyed by record ID and an `assets` store keyed by asset ID, with a `mockupId` index. Mock-up records contain title, purpose, creation/update times, preview background, ordered document blocks, compatibility notes, and referenced asset IDs. Asset records contain their owning mock-up ID, filename, MIME type, size, creation time, and original Blob.

These records are scoped to the current browser origin, not a signed-in Supabase user ID. Another port or browser profile does not share the same recovery database. Clearing site data can remove recovery-only work. The host does not promise cloud backup or cross-device synchronization for these records.

### Last-selection preference

Local storage key `chronicle-rnd-last-selected-v1` remembers which mock-up to reopen. It contains a selection ID, not the notes, images, or coded implementation. Losing this preference should change selection only; the actual records come from IndexedDB and repository loading.

### Repository documents and image assets

Explicit Save writes `docs/research-development/mockups/<stable-id>/mockup.json` and the referenced files beneath its `assets/` directory. The manifest records a repository-format version, save timestamp, mock-up record, and asset descriptors. The server checks that image content matches the declared size and referenced ID set before replacing the destination.

The read routes are `/__rnd-repository/workspace` and `/__rnd-repository/asset/`; Save uses `/__rnd-repository/save`. These are local Vite middleware routes, not deployed Supabase endpoints. Generated preview artifacts have their own `/__rnd-repository/generated/` route and directory, outside the user-editable record’s save payload.

### Shared Admin access is not mock-up persistence

The surrounding Admin hub relies on Chronicle’s account/administrator access path and shared tile metadata. That does not turn R&D’s local records into account-owned cloud rows. The distinction matters when deciding what survives browser changes, what was written into the checkout, and what was actually deployed: none of those outcomes can be inferred solely from seeing a mock-up in the Admin page.
