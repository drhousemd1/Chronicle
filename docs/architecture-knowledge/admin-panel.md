# Overview

## Admin Panel at a Glance

Admin Panel is Chronicle’s restricted operations workspace. It gives an authorized administrator a hub for maintenance, documentation, quality, finance, image-generation configuration, model status, and protected research tools that do not belong in the ordinary player navigation. The panel is a collection of distinct tools, not one shared data authority.

The current hub includes Image Generation, AI Status, Chronicle UI Guide, Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, Validation Evidence Ledger, Finance Dashboard, Research & Development, and Roadmap. Opening a card either renders its tool inside the Admin workspace or navigates to a dedicated protected route.

## Access Boundary

The Admin destination appears in the main sidebar only when Chronicle’s resolved administrator state is true. Dedicated routes such as the Chronicle UI Guide, Chronicle Knowledge Base, Quality Hub, Validation Evidence Ledger, and Supabase Schema Reference are also wrapped in `AdminOnlyRoute`. That guard waits for authentication, checks administrator authority for the active user, and redirects signed-out or non-admin visitors away.

Visible Admin controls are not the security authority by themselves. Hiding a sidebar item prevents ordinary navigation but does not protect a route or database operation. Each dedicated route and any privileged service call must retain its own verified authorization boundary.

## Tool Hub and Navigation

The hub presents one card per registered tool. A card can show a thumbnail, title, and short description. **Open** enters the selected tool; **Edit** opens the tool-metadata editor. Chronicle UI Guide, Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, Validation Evidence Ledger, and Roadmap use dedicated application routes. Other registered tools render under the current Admin tab through lazy-loaded components.

The top bar displays **Admin Panel** at the hub and uses the active tool name for Finance Dashboard or Research & Development. A **Back** control returns an internal tool to the Admin hub. R&D registers **Save** and **Add New Mock-up** actions with the shared top bar. Every Admin tool’s page-level Back control returns to the main Admin tile view, including archived-work and changelog detail pages.

## Tool Metadata

Default tool titles, descriptions, and optional thumbnails are defined in the Admin page. The editor can persist overrides into the `app_settings` row identified by `admin_tool_meta`. On load, those overrides are merged with the defaults. Only currently registered tools are displayed; obsolete metadata cannot restore a removed tile.

The metadata editor changes how a tool is presented in the hub. It does not rename routes, grant access, change the tool’s underlying behavior, or create a new tool implementation.

## Administration and Maintenance Manuals

The substantial tools now have dedicated sections below the product manuals. Their overviews explain the current purpose and limitations; their control and architecture tabs explain actual operations and data flow. An unfinished tool is documented as it exists, not presented as a completed future system.

- [Chronicle Knowledge Base](/style-guide/chronicle-knowledge-base?section=knowledge-base-system&tab=overview#knowledge-base-system) explains the repository-backed manuals, architecture maps, and separate record sources.
- [Supabase Schema Reference](/style-guide/chronicle-knowledge-base?section=schema-reference&tab=overview#schema-reference) explains the maintained object catalog, field meanings, and access descriptions.
- [Quality Hub](/style-guide/chronicle-knowledge-base?section=quality-hub&tab=overview#quality-hub) explains workspace findings, recorded scans, recovery, and read-only canonical history.
- [Validation Evidence Ledger](/style-guide/chronicle-knowledge-base?section=validation-evidence-ledger&tab=overview#validation-evidence-ledger) explains local roleplay validation definitions, receipts, freshness, and raw reports.
- [Finance Dashboard](/style-guide/chronicle-knowledge-base?section=finance-dashboard&tab=overview#finance-dashboard) explains usage, costs, projections, configuration, and unfinished controls.
- [Research & Development](/style-guide/chronicle-knowledge-base?section=research-development&tab=overview#research-development) explains mock-up editing, local recovery, explicit repository saves, and prototype preservation.
- [Image Generation](/style-guide/chronicle-knowledge-base?section=image-generation&tab=overview#image-generation) explains the current art-style configuration editor and its real production consumers.

AI Status remains part of this Admin Panel manual because it is a smaller configuration-and-health surface, not a separate generation workflow.

## Chronicle UI Guide

**Chronicle UI Guide** opens the protected `/style-guide/chronicle-ui-guide` page. All published regional references appear one after another on this single page, like the Knowledge Base, without a region selector. Each retains the accepted seven sections: Overview, Color Palette, Typography & Spacing, Buttons & Menus, Fields & Controls, Panels & Layout, and Composition Examples. Each reference's tabs operate independently. The page uses Chronicle's shared application header and a back chevron to `/?tab=admin`, followed by the accepted manual presentation. It has no in-document jump navigation.

The purpose is to help a coding agent choose and combine existing styling for a new interface. Recipes distinguish shared-component behavior, caller-supplied appearance, state treatments, source-backed examples, and proposed teaching compositions. Width and arrangement remain adaptable where the guide says so.

`docs/ui-guide/catalog.json` registers each region's canonical Markdown, section labels, image manifest, and revision dates. The page and `scripts/read-chronicle-ui-guide.mjs` read that same source. From the repository, `npm run -s ui-guide:read -- --list` lists available regions. For example, `npm run -s ui-guide:read -- story-builder --section fields,panels,mockups --images --json` returns plain Markdown with that region's foundations and absolute paths to its relevant original images. Agents load those files through an image tool; no frontend navigation or running server is required. Complete supporting implementations are available with `--full-source`. Maintenance and image handling are documented in `docs/ui-guide/README.md`.

The guide is maintained in the repository, not through a browser editor or Supabase. Older region-specific URLs still show the complete page and restore the requested region's tab; unknown regions or tab values fall back to the complete guide with Overview selected. The command rejects unknown IDs and missing or changed image assets. The catalog defines published coverage, while the README describes regional coverage and illustration limits. A reference's source review date does not prove that later product changes have been incorporated.

## Roadmap

**Roadmap** opens the protected `/admin/roadmap` page. It collects issues, tasks, improvements, and ideas in three full-width sections: **Critical** for work required before real use and deployment, **Important** for desirable non-blocking work, and **Non-critical** for future ideas and minor refinements. Each item has a heading, description, optional screenshots, and one of three statuses: **Not yet started**, **In progress**, or **Complete**. Completed items stay visible in their section until explicitly deleted.

The shared list is saved to Supabase, not to browser-only storage. **Markdown** downloads a dated snapshot for sharing with another LLM or deliberately adding to a repository. GitHub access alone does not grant access to the live Supabase list, and exports do not automatically synchronize back. The roadmap is an intake list, not a replacement for protected Knowledge Base records.

For agents, open this page in an authorized administrator session and read the saved items and any relevant screenshots. On an explicit assignment to work through selected items, take them sequentially: set the current item to **In progress**, perform and verify the assigned work, then mark that item **Complete** before continuing. If blocked or unverified, leave it unfinished and report the blocker. Do not automatically delete completed items. The page reloads the shared list automatically while idle and when it regains focus. A conflict means another editor saved first; closing the dialog loads the latest list before retrying. Agents without authenticated browser or approved database access can read a supplied Markdown snapshot but cannot update the live list or fetch private screenshots from GitHub alone.

## AI Status: Configuration and Health, Not a Generation Test

The **AI Status** card opens a panel titled **AI Configuration**. It displays text and image model labels, whether the backend xAI key is configured, whether the provider is reachable, and whether shared access is enabled. It runs its health request on mount and provides **Run Health Check** to request another reading.

The model names are hardcoded display text, not a model selector or a live inventory of every request path. The text label currently says **Grok 4.1 Fast (Reasoning)**; it should not be used to determine the model a particular generation function actually sends. That fact belongs to the request owner. The health endpoint checks key configuration and provider reachability, not a complete roleplay turn or image result.

This tool is not entirely read-only: an authorized administrator can toggle **Share API key with all users**, which writes the shared-key setting in `app_settings`. That is a real shared configuration change, not a private test preference. The toggle does not expose the secret API key in the browser. A failed health invocation currently falls back to false status values, so a negative display alone cannot distinguish a missing key from a failed status request.

## Research and Development Preservation

Research & Development is a protected prototype workspace. Its mock-ups may coexist with adopted production features and are not disposable merely because a production implementation exists. The Admin shell supplies **Add New Mock-up** and **Save** actions only when the R&D tool registers those operations. Leaving the tool can invoke its registered before-leave handling.

Removing or retiring an R&D prototype requires direct user authorization naming that outcome. Production code must not import prototype code, but isolation is not permission to delete the reference implementation.

## Loading, Failure, and Evidence Limits

Lazy-loaded tools use a neutral full-size fallback while their module loads. Tool metadata begins from checked-in defaults; a failed override read keeps those defaults. A failed metadata write restores the prior local tool list and reports the error to the caller. Individual Admin tools own their own loading and failure states.

Source inspection confirms the present hub, registered tools, routing, metadata storage, and application-level access checks. It does not prove deployed database permissions, administrator RPC behavior, or successful operation of every tool.

# UI Elements and Functions

## Admin Hub Cards

- Each tool card displays its title, optional thumbnail, and a short description.
- **Open** enters the selected internal tool or its dedicated route.
- **Edit** opens the tool-metadata editor without opening the tool.
- A missing thumbnail uses the standard placeholder surface and icon.
- Card hover presentation exposes the two actions but must not change tool identity.

## Current Tool Destinations

- **Image Generation** opens the image-generation configuration tool.
- **AI Status** opens the model-settings and backend-health presentation.
- **Chronicle UI Guide** opens the page-specific visual references for Chronicle’s main regions.
- **Chronicle Knowledge Base** navigates to the protected Knowledge Base route.
- **Supabase Schema Reference** navigates to the protected schema-reference route.
- **Quality Hub** navigates to the protected quality route.
- **Validation Evidence Ledger** navigates to the protected evidence route.
- **Finance Dashboard** opens the Admin finance workspace.
- **Research & Development** opens the protected mock-up workspace.
- **Roadmap** opens the full-width priority list at `/admin/roadmap`.

These labels describe the current visible tools. Each destination’s own manual or source remains authoritative for what that tool can actually do.

## Shared Top-Bar Actions

- **Back** returns an open Admin tool to the hub.
- Research & Development can register **Add New Mock-up** and **Save** actions; the buttons remain disabled when no handler is available or a save is pending.
- Finance Dashboard and Research & Development replace the generic top-bar title with the active tool name.

## AI Status Controls

- **Active Models** displays fixed text and image model labels; there is no selection control.
- **Run Health Check** requests `check-shared-keys`, displays **Checking…**, and disables another check while the request is pending.
- **API Key Configured**, **Provider Reachable**, and **Shared with Users** are separate status rows. They are not receipts for successful generation.
- **Share API key with all users** is available to an administrator and is disabled while its save is pending or the key is not reported as configured. The displayed sharing state changes only when the update service returns success.
- A failed save leaves the previous sharing state. Current error handling logs failures rather than presenting a detailed recovery message in this panel.

## Roadmap Controls

- **Add item** opens an editor in the chosen section. A heading is required; a multiline description is optional.
- The pencil edits the heading, description, section, and status. **Save** persists the change; **Cancel** leaves the saved item unchanged.
- **Attach files** accepts PNG, JPEG, WebP, PDF, Word (`.docx`), Markdown, plain text, and HTML. Each item can hold five files, up to 8 MB each. Selected files upload when the item is saved. Images remain thumbnails; documents appear as filename links that download the original file. The editor can remove attachments.
- **Status:** appears immediately under each heading. Changing its dropdown saves the selected status and keeps the item in its section.
- The trash icon opens a confirmation before deleting that item. Cancellation preserves it.
- The list checks for changes every 20 seconds while visible and idle, and when the window regains focus. It does not replace an open edit or deletion dialog. **Markdown** exports every saved item, including completed items and attachment references, in section order; it does not bundle the attached files.
- Loading or failed reads are not treated as an empty list. Failed saves remain visible as errors, and an open draft is retained. Conflicting edits require closing the dialog so the latest list can load before another save. A successful save produces a brief confirmation, not permanent header text.

## Tool Metadata Editor

- **Edit** opens the selected card’s metadata rather than changing it immediately.
- Saving updates the card presentation optimistically and persists the complete set of overrides under `admin_tool_meta`.
- If persistence fails, the Admin page restores the prior card list and surfaces the rejected promise to the editor boundary.
- Metadata changes do not alter protected routes or administrator access.

## Access and Failure States

- Signed-out access to a protected Admin route redirects to the main page with the authentication prompt.
- An authenticated non-admin visitor is redirected to the main page.
- The route renders nothing while the administrator check is unresolved, avoiding a flash of privileged content.
- A metadata-read failure retains the checked-in defaults.
- Each lazy tool initially renders a neutral loading region; the loaded tool owns any later empty or failure state.

# App Architecture

## Main Application Entry

`src/pages/Index.tsx` owns the `admin` application tab and `adminActiveTool`. `AppSidebar` receives `isAdminState` and renders the Admin navigation item only when it is true. Selecting it resets the active tool to `hub` before opening the Admin tab. `AdminPage` then either renders the hub or the selected internal tool.

`AppShellTopBar` receives the active Admin tool and registered tool actions from Index. It keeps global layout and navigation outside the individual tool modules while allowing a tool to provide its bounded Save, Sync, Edit, Download, or Add behavior.

## Protected Dedicated Routes

`src/App.tsx` defines `AdminOnlyRoute`. The guard consumes `useAuth`, waits for the authentication load, calls `checkIsAdmin` for the active user ID, caches the resolved state for the shell, and redirects when access is not allowed. The UI Guide, Knowledge Base, Quality Hub, evidence ledger, schema reference, and Roadmap are all mounted through this route boundary.

The in-shell Admin tab and the dedicated routes are complementary checks. Neither should be removed merely because the other exists.

## Tool Registry and Lazy Loading

`DEFAULT_TOOLS` is the current presentation registry. `AdminPage` directly routes the protected standalone destinations and lazy-loads the internal Image Generation, Finance, and R&D modules. AI Status uses `ModelSettingsTab` inside the Admin content area.

This registry is not a plugin system. Adding a metadata row does not make an unimplemented component available. A new Admin tool requires a real ID, render or route owner, access decision, and focused validation.

## Metadata Persistence

The `admin_tool_meta` value in `app_settings` stores title, description, and thumbnail overrides. AdminPage first tries an update and inserts the named setting when no row exists. A failed write rolls the local hub presentation back. The deployed data layer remains responsible for allowing only authorized administrators to write that setting.

All tile editors share `src/components/admin/AdminToolEditModal.tsx`. Thumbnail uploads go to the public `guide_images` bucket under `{userId}/admin-tools/...`, using its existing administrator-only write policies. The uploaded image appears in the editor preview; **Save Tile** stores its public URL in the tile override. The `avatars` bucket is reserved for profile-avatar filenames and must not be used for Admin tile artwork. A failed upload leaves the prior thumbnail unchanged.

## Roadmap Persistence

`src/pages/admin/roadmap.tsx` owns the page, editor, confirmation, and save feedback. `src/services/chronicle-roadmap.ts` reads and writes the single `public.app_settings` row whose `setting_key` is `chronicle_roadmap_v1`. Its `setting_value` contains `version`, `revision`, and `items`; each item has a stable `id`, `title`, `description`, `priority`, `status`, `createdAt`, `updatedAt`, and optional `attachments`. There is no separate local list or new database table.

Existing rows are updated only when their stored revision still matches the revision read by the editor. The unique setting key protects first insertion. A stale revision, competing insertion, rejected write, malformed value, or mismatched returned document is not reported as a successful save. Deleting an item updates this document; it does not delete the settings row. The service preserves unrelated settings.

Approved database-connected agents should use this same versioned contract and conditional update instead of blindly overwriting the JSON. The existing Supabase policies remain the database access authority. The roadmap key is outside the public-read keys named by repository migrations; that source fact alone does not certify deployed policies.

Attachments use the existing private admin storage bucket `finance_documents`, isolated under `chronicle-roadmap/<item-id>/`. No finance document records are created. Item metadata stores each attachment's ID, original filename, storage path, content type, and byte size; expiring signed URLs are resolved when the item is displayed and renewed while the page stays open. Files remain in their original format. Document links request a download, so uploaded HTML is not executed inside Chronicle. Removal first saves the item change and confirms that the latest list no longer references the file before deleting it. Failed cleanup is reported without undoing the saved item or deleting a still-referenced attachment.

For a Roadmap assignment, open `/admin/roadmap` in the authenticated Chronicle browser, locate the named item, read its description, and retrieve its attached documents through their filename links, just as screenshots are opened from the same item. Read the downloaded originals before investigating the issue. Reopening the page obtains fresh links; do not treat an expired link copied from an earlier task as a missing file. The saved item ID and attachment storage paths remain the durable references. This does not require the user to export the Roadmap or attach those documents to the conversation again.

## AI Status Request and Setting Paths

`ModelSettingsTab` checks the active user’s administrator role, requests `checkSharedKeyStatus` on mount or refresh, and renders the returned booleans. `checkSharedKeyStatus` invokes the `check-shared-keys` Edge Function; that function checks backend key presence and calls the provider’s model-list endpoint for reachability. The client service maps invocation failures to false values.

`handleToggleShare` calls `updateSharedKeySetting`, which updates `app_settings` where `setting_key` is `shared_keys`. This path is separate from the hub’s `admin_tool_meta` overrides. Neither the status panel nor its hardcoded model labels owns the actual roleplay request assembly or image-generation prompts.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/pages/Admin.tsx
src/pages/admin/roadmap.tsx
src/services/chronicle-roadmap.ts
src/pages/style-guide/chronicle-ui-guide.tsx
src/data/chronicle-ui-guide/document.ts
src/data/chronicle-ui-guide/index.ts
src/components/admin/AdminToolEditModal.tsx
src/components/chronicle/ModelSettingsTab.tsx
src/components/admin/finance/FinanceDashboardTool.tsx
src/components/admin/research-development/ResearchDevelopmentTool.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppSidebar.tsx
src/hooks/use-auth.ts
src/services/app-settings.ts
supabase/functions/check-shared-keys/index.ts
src/integrations/supabase/client.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 5, 2026. It establishes the visible Admin hub, current tool registry, internal and dedicated navigation, metadata and AI Status setting paths, R&D preservation boundary, and application-level admin guard. It does not prove deployed administrator authorization, database policies, provider health, or successful behavior inside every Admin tool.

The Chronicle UI Guide addition was checked on September 7, 2026 against its registered Admin tile, protected application route, shared Markdown reader, original image manifests, and focused interaction tests. Local browser checks cover the Admin-to-guide and return path. This addition does not re-certify the unrelated tools described above.

The Roadmap addition was checked on September 10, 2026 against its protected route, item editor, shared settings service, and screenshot storage helpers. Local signed-in browser checks confirmed creating an item, saving edits and statuses, reloading saved data, deleting a temporary text-only item, and uploading and reloading a rendered screenshot. The test image was not accessible through the unauthenticated public-object URL. Focused tests cover stale writes, rejected saves, screenshot cleanup, background-read races, and native export handling. These checks do not certify every deployed database policy; live policy metadata inspection was unavailable. Completing a native Markdown Save As dialog and confirming the resulting local file remain a manual browser check.

The retired App Dashboard and App Guide have no active UI or synchronization caller. Historical database migrations, schema snapshots and existing saved records remain; removing the local tool does not purge remote records or undeploy an already deployed Edge Function.
