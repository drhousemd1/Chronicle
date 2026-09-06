# Overview

## App Dashboard at a Glance

### The administration workspace for visual references and editable guides

App Dashboard contains two different reference tools: **App Style Guide**, which presents interface examples and retains a register of requested styling edits, and **App Guide**, which stores editable long-form documents. It is an administrative workspace, not a player dashboard, a runtime monitor, or the place where Chronicle’s stories and conversations are managed.

The distinction between the two tools matters when deciding what an action changes. Reading a component example changes nothing in the application. Editing a saved styling note changes that note, not the CSS it describes. Editing an App Guide document can change a shared database record and then synchronize a Markdown file to GitHub. These are different consequences even though the controls sit inside the same dashboard.

The current Style Guide has been reset. Its main content is a retained, embedded **Style Guide Component Example**, not a complete inventory of every live Chronicle component. App Guide remains a database-backed document reader and editor. This section describes those implemented surfaces as they exist; it does not imply that the earlier, larger dashboard has been rebuilt or that every reference inside it is current.

### How App Dashboard relates to the Knowledge Base

The Chronicle Knowledge Base supplies the maintained capability manuals, UI descriptions, architecture explanations, and operational-record views. The Chronicle Work Manual owns how an agent classifies work, chooses checks, records continuity, and stops. App Dashboard does not replace either authority.

Use a Style Guide example to understand an interface treatment, then confirm the actual component or shared style source before changing it. Use an App Guide document as its maintained reference, paying attention to its stated source and review date. When a guide disagrees with current implementation or a canonical Knowledge Base manual, the disagreement needs source inspection; a newer timestamp or an editable document does not automatically give it authority over the product.

## Working with the Style Guide

### The current example is a reference, not an application-wide editor

Opening the App Dashboard tile selects App Style Guide. Its sidebar offers **How to Use**, identifies the current Style Guide view, and opens **App Guide**. The example itself is an HTML document embedded inside the page. It illustrates component specification layouts, including a Physical Appearance section and character-creation examples.

The surrounding code still contains the older component-card and Keep/Edit machinery, but the active content no longer renders that catalog. A reader should not expect a pencil overlay on every item in the embedded example or assume that selecting an example will change a live Chronicle component. The distinction prevents an illustrative specimen from being mistaken for an editable registry of the application.

### Styling edit notes are requests, not completed changes

The application header’s **Edits** button opens the existing Style Guide Edits register and shows its entry count. Saved entries carry a component name and type, captured details, a comment, and a saved timestamp. Swatch-related entries can also carry the requested replacement and whether the note describes a page-specific or application-wide change.

Editing or deleting one of these entries changes the shared note register. It does not implement the requested change, run validation, create an Issue, or record accepted Changelog history. A note that says an element should change is evidence of a requested styling decision, not evidence that the product now uses that design.

The retained Keep As-Is mechanism stores component names separately from edit requests. Those markers are manual selections, not automated verification. Because the current example is embedded rather than rendered through the old card wrappers, the current surface should not be described as a complete interactive Keep/Edit review of every component.

### Downloads are snapshots with a current coverage limitation

**Download** offers HTML, Markdown, and JSON. These operations create files in the browser; they do not write to the Chronicle repository or change the application. They were built around the older Style Guide’s direct section and card markup.

The current embedded example introduces an important limitation. The HTML export copies the containing markup, including the iframe reference, rather than packaging the example’s document into a self-contained export. The Markdown and JSON exporters inspect matching section/card elements in the parent document and do not traverse the iframe. Their format labels therefore must not be treated as a guarantee that the current example, much less the whole application style system, is completely captured. When the example itself is the required reference, its checked-in HTML source is the direct owner.

## Reading and Maintaining App Guide Documents

### Documents are shared administrative records

App Guide loads its document list from `guide_documents`, ordered by each record’s sort order. Selecting a document loads its title, Markdown body, and freshness metadata. **New Document** creates a real database row immediately, with an untitled name, initial guidance text, and default review metadata. It is not merely opening a temporary blank editor.

The sidebar lists documents and their freshness labels. The main reader displays Markdown headings, paragraphs, lists, tables, links, and highlighted code. A leading legacy instruction block is retained in the Markdown but hidden in the ordinary reading view. Switching to Edit exposes the full stored text, including that block.

These records are not the Markdown sources used to render the Knowledge Base. Editing an App Guide entry does not directly update the matching Knowledge Base section, and saving a Knowledge Base manual does not automatically rewrite the database document. Their relationship must be kept explicit when a guide refers to a capability that now has a canonical manual.

### Editing, saving, and synchronizing are separate steps

The editor’s **Edit** control copies the current Markdown into an editing buffer. The **Save** button inside that editor accepts the buffer into the open App Guide document state and returns to reading mode. That inner Save does **not** perform the database write.

The **Save** button in Chronicle’s application header is the durable action for the open document. It writes the current Markdown and content metadata to `guide_documents`. After that database update succeeds, the client dispatches a separate synchronization request to the `sync-guide-to-github` Edge Function. The expected repository output is a title-derived Markdown filename under `docs/guides/`.

A normal editing sequence is therefore: open the correct document, enter Edit, make the text change, use the editor’s Save to accept it, and use the application-header Save to persist it. If the buffer is still open, the header Save uses the parent document state, not the unaccepted text in the editor. Changing documents or leaving the editor is not a substitute for completing these save steps.

**Sync All** reads the currently saved database documents and requests GitHub synchronization for each one. It does not first capture an open edit buffer, and it does not pull GitHub changes into the database. It is a database-to-repository export operation, not a two-way merge.

### Review labels explain the document’s claimed evidence

App Guide distinguishes **Code-verified**, **Mixed**, and **Inferred** source labels. Selecting one records the administrator’s assessment; the selector does not inspect code or establish the truth of the document. **Mark Reviewed** records a new review time and reviewer marker without independently checking the document’s contents.

Freshness is calculated from the recorded review timestamp, falling back to the document update timestamp when no review time is available. The default stale interval is 21 days. A document becomes Aging as it approaches that interval and Stale after it exceeds the interval. These age labels help identify references to revisit, but a fresh label cannot prove that a recent code change was reflected in the prose.

## Renaming, Deletion, and Failure Boundaries

### Titles affect the repository destination

Renaming a document updates its database title. The GitHub function derives its output filename from the title by lowercasing it and replacing non-alphanumeric runs with hyphens. The current rename action does not rename or delete the old GitHub file. A subsequent Save can therefore write a new title-derived path while leaving the earlier file behind.

Likewise, different titles that normalize to the same filename can target the same GitHub document. The stable database ID and the title-derived repository path are not the same identity system. Preserve that distinction when maintaining or locating an existing guide; do not assume that a rename has synchronized every copy.

### Deleting a guide has a remote consequence

The sidebar’s trash action deletes the selected database document, then dispatches deletion of its title-derived GitHub file. The current control has no intermediate confirmation dialog or App Guide undo archive. This is not the harmless removal of a sidebar shortcut.

The database operation and GitHub operation are not one transaction. A database save or deletion can succeed while GitHub synchronization fails. Sync errors and several document-operation failures are logged to the browser console rather than presented as a durable in-page receipt. An updated reader or a completed button action is therefore not, by itself, proof that the repository copy was changed.

### What remains incomplete

The current Style Guide content and export machinery do not form a complete live style inventory. App Guide’s **On This Page** list extracts headings, but its parent click callback is currently a no-op, so the list must not be relied on as working jump navigation. Search currently counts matches without highlighting or scrolling to them. The document editor also does not provide a comprehensive unsaved-change or cross-document conflict workflow.

These limitations are reasons to use the tools with their actual boundaries in mind, not reasons to discard their stored references. The useful outcome is a readable, source-aware document or visual reference whose persistence and evidence are understood. Tool restoration, synchronization improvements, and document reconciliation remain separate implementation work.

# UI Elements and Functions

## App Dashboard Navigation

### App Dashboard tile and App Guide entry

The Admin tile opens the embedded `style_guide` view. The **App Guide** sidebar button switches to the `app_guide` view within the same application shell. The shell changes its header controls to match the selected tool: Edits and Download for Style Guide; theme, Save, and Sync All for App Guide. Returning to the Admin hub changes the selected tool, not the underlying guide records.

### How to Use

This opens a modal containing the canonical Work Manual pointer and tool/scan mechanics. **Close** dismisses it. Reading the modal does not initiate a scan or authorize broader work. Its links between the Style Guide, App Guide, Knowledge Base, and Quality Hub describe their responsibilities rather than creating an additional workflow authority.

## Style Guide Controls

### Embedded component example

The main view renders `/style-guide-component-example.html` in an iframe titled **Style Guide Component Example**. Scrolling through it reads the current authored specification specimen. Its visible controls and examples belong to that document; they are not automatically connected to the parent’s saved edit-register operations.

### Edits and entry actions

**Edits** opens the register, showing Loading while the entries are fetched and **No edits flagged yet** when the returned collection is empty. Each saved entry shows its component identity, comment preview, and date. The pencil opens its detail editor; **Save Edit** updates the entry and closes the editor. The trash button removes the entry from the register and refreshes the count. These controls operate on shared settings records, not live component code.

### Download format choices

Selecting HTML, Markdown, or JSON creates a date-named `chronicle-style-guide` download and closes the modal. Closing the modal without selecting a format creates no file. The current iframe/export coverage limitation is described in Overview; a successfully downloaded file is not proof of a complete export.

## App Guide Controls

### Document selection and New Document

Selecting a document row loads that database record. **New Document** inserts an untitled document after the highest current sort order and selects it. A database failure does not create a successful local substitute. The empty reader asks the administrator to select or create a document.

### Title, Edit, View, and the two Save buttons

Selecting the displayed title opens a text input. Leaving the input or pressing Enter commits a changed title directly to the database. **Edit** opens a line-numbered Markdown textarea. The editor’s **Save** copies that buffer into the parent’s open-document state. **View** returns to reading without accepting the current buffer. Neither action replaces the application-header Save that persists Markdown and requests repository synchronization.

### Search

Command-F or Control-F opens the guide’s search field. Search counts case-insensitive matches in the open document’s accepted Markdown, including text hidden from reading mode. It does not search unaccepted edits in the textarea. The previous/next controls and Enter change the displayed match index; Shift-Enter moves that index backward. The current implementation does not highlight a match, select its text, or scroll to it. Escape or Close dismisses the search. It is not a library-wide source search.

### On This Page

The sidebar extracts Markdown headings at levels one through three. An empty heading list displays **No headings yet**. Although entries are rendered as buttons, the current App Guide parent does not implement their scroll callback. Their presence identifies document structure, not functioning navigation.

### Freshness, source labels, and Mark Reviewed

The document shows a freshness badge, age explanation, reference time, and source label. Changing Code-verified, Mixed, or Inferred writes metadata to the current database record. **Mark Reviewed** writes the current review timestamp. Neither operation modifies the Markdown body or runs an evidence check.

### Theme, header Save, and Sync All

The theme control changes App Guide’s light/dark presentation. The header **Save** persists the selected document’s accepted Markdown and metadata, then dispatches its GitHub upsert. **Sync All** fetches saved documents and processes their GitHub upserts sequentially. It does not save an unaccepted buffer, resolve conflicting versions, or certify synchronization success for every document in a visible ledger.

### Delete document

The trash action removes the database row and then requests deletion of the title-derived GitHub file. If the selected document is deleted, the editor clears. Current failures are logged; there is no built-in confirmation or restoration workflow in this control.

# App Architecture

## Shell and Tool Ownership

`Index.tsx` owns the active Admin tool and holds callbacks registered by the mounted tool. `Admin.tsx` lazy-loads `StyleGuideTool` or `AppGuideTool`; `AppShellTopBar.tsx` invokes their registered actions. This keeps header controls attached to the mounted tool without making the header the owner of document persistence.

`StyleGuideTool.tsx` owns its navigation, How to Use modal, retained edit context, and iframe content. `StyleGuideEditsModal.tsx` owns the shared edit/keep record helpers and dialogs. `StyleGuideDownloadModal.tsx` turns selected parent-document markup into browser downloads. The current example’s authored content lives in `public/style-guide-component-example.html`.

## App Guide Read and Edit Path

`AppGuideTool.tsx` fetches document metadata, hydrates freshness, selects a record, and holds its accepted Markdown and content object. `GuideSidebar.tsx` renders document selection, creation, deletion, and heading entries. `GuideEditor.tsx` owns the temporary edit buffer, title input, Markdown rendering, search, and source/review controls.

The editor’s buffer is intentionally a different state variable from `AppGuideTool`’s accepted Markdown. Its inner Save invokes `onMarkdownChange`; the header callback later writes that accepted value to the database. The title, review, and truth-label handlers perform their own database updates. Markdown-body save and metadata changes therefore do not all pass through one uniform editing transaction.

`guide-freshness.ts` normalizes malformed or missing metadata, preserves other content keys, computes age, and labels freshness. It has no source-code reader or live-document comparator. Its output is a presentation of timestamps and the saved assessment.

## Database-to-GitHub Handoff

After a successful header save, `syncToGitHub` invokes `sync-guide-to-github` with an upsert action, title, and Markdown. Delete invokes the same function with a delete action and title. Sync All awaits each request in sequence, while ordinary save/delete synchronization is dispatched without being awaited by the database action.

The checked-in Edge Function verifies an authenticated user and an administrator role through `has_role`. It reads the server-held `GITHUB_PAT`, checks repository access, derives a path under `docs/guides/`, obtains the existing GitHub file SHA when present, and uses the GitHub Contents API to create, update, or delete that file. It does not write the canonical `docs/architecture-knowledge/` manuals.

A GitHub access/configuration error does not roll back the preceding database operation. The helper logs errors or unsuccessful response bodies and returns; Sync All can continue to later documents after such a response. The current implementation has no stable database-ID-to-GitHub-path mapping, rename reconciliation, or two-way merge. These are concrete limits of the handoff, not evidence of the current deployed function’s configuration.

## Saved Styling Notes and Export Boundaries

Style edit and keep helpers read and update two `app_settings` keys. An edit upsert reads the current array, changes one item, and writes the array back. The helper uses update, not insert, so it depends on the setting row already existing. It also does not propagate ordinary Supabase error results from its write into a reliable visible failure state. An empty register can mean an empty stored array or a read fallback; it is not an audit result.

The download path reads rendered DOM, not repository source. Markdown/JSON select direct `sg-` sections and old card shapes; HTML clones the parent content. The iframe document is a separate DOM boundary, explaining why a visual example can be visible while absent from a text/JSON export.

### Inspected Source Paths

```text
src/pages/Admin.tsx
src/pages/Index.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/admin/styleguide/StyleGuideTool.tsx
src/components/admin/styleguide/StyleGuideEditsModal.tsx
src/components/admin/styleguide/StyleGuideDownloadModal.tsx
src/components/admin/guide/AppGuideTool.tsx
src/components/admin/guide/GuideEditor.tsx
src/components/admin/guide/GuideSidebar.tsx
src/components/admin/guide/guide-freshness.ts
public/style-guide-component-example.html
supabase/functions/sync-guide-to-github/index.ts
supabase/migrations/20260222041015_a346410c-5300-48f3-82b5-454327fd7545.sql
```

# Supabase Tables

## App Dashboard Data Boundaries

App Guide uses Supabase for durable guide records. The Style Guide uses shared settings for its saved edit and keep registers, while its current visual example is a checked-in static HTML file. Browser downloads are local output files. The GitHub copy is a separate remote artifact, not a Supabase table or a substitute for the database document.

### `guide_documents`

This table holds `id`, `title`, `markdown`, `content`, `sort_order`, `created_at`, and `updated_at`. The rendered body comes from `markdown`. The current client uses `content.freshness` for `lastReviewedAt`, `staleAfterDays`, `truthLevel`, and `reviewedBy`, preserving unrelated content keys when patching this metadata. `sort_order` controls the sidebar ordering; the title supplies the visible name and, separately, the GitHub filename input.

The checked-in creation migration enables row-level security and defines administrator-only select, insert, update, and delete policies using `has_role(auth.uid(), 'admin')`. It also attaches the shared update-timestamp trigger. These source definitions explain intended access; this manual does not claim a fresh inspection of the live database’s deployed policies or stored guide contents.

### `app_settings`

The `styleguide_edits` key stores the array of edit entries. Each entry contains its ID, card identity, captured details, comment, and timestamp, with optional swatch-change fields. The `styleguide_keeps` key stores component names marked Keep As-Is. Helpers select these values by `setting_key` and write `setting_value` with a new `updated_at`.

The Admin hub also uses `admin_tool_meta` for its configurable tile title, description, and thumbnail. That is shared Admin navigation metadata; changing a dashboard document does not change this tile record. The displayed Style Guide example is not stored in any of these settings.

### Authentication, function, and repository dependencies

App Guide’s browser operations use the authenticated Supabase client and depend on database policies. The `sync-guide-to-github` Edge Function independently checks authentication and the `has_role` RPC before using its server-held GitHub credential. No credential belongs in a guide document. A successful table update does not establish that the function is deployed, configured, or able to update GitHub; that remains a separate handoff result.
