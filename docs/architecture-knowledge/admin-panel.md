# Overview

## Admin Panel at a Glance

Admin Panel is Chronicle’s restricted operations workspace. It gives an authorized administrator a hub for maintenance, documentation, quality, finance, image-generation configuration, model status, and protected research tools that do not belong in the ordinary player navigation. The panel is a collection of distinct tools, not one shared data authority.

The current hub includes Image Generation, AI Status, App Dashboard, Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, Validation Evidence Ledger, Finance Dashboard, and Research & Development. Opening a card either renders its tool inside the Admin workspace or navigates to a dedicated protected route.

## Access Boundary

The Admin destination appears in the main sidebar only when Chronicle’s resolved administrator state is true. Dedicated routes such as the Chronicle Knowledge Base, Quality Hub, Validation Evidence Ledger, and Supabase Schema Reference are also wrapped in `AdminOnlyRoute`. That guard waits for authentication, checks administrator authority for the active user, and redirects signed-out or non-admin visitors away.

Visible Admin controls are not the security authority by themselves. Hiding a sidebar item prevents ordinary navigation but does not protect a route or database operation. Each dedicated route and any privileged service call must retain its own verified authorization boundary.

## Tool Hub and Navigation

The hub presents one card per registered tool. A card can show a thumbnail, title, and short description. **Open** enters the selected tool; **Edit** opens the tool-metadata editor. Chronicle Knowledge Base, Supabase Schema Reference, Quality Hub, and Validation Evidence Ledger use dedicated application routes. Other registered tools render under the current Admin tab through lazy-loaded components.

The top bar displays **Admin Panel** at the hub and uses the active tool name for Finance Dashboard or Research & Development. A **Back** control returns an internal tool to the Admin hub. The App Dashboard, App Guide, and R&D tools can register tool-specific **Save**, **Sync**, **Download**, **Edit**, or **Add New Mock-up** actions with the shared top bar.

## Tool Metadata

Default tool titles, descriptions, and optional thumbnails are defined in the Admin page. The editor can persist overrides into the `app_settings` row identified by `admin_tool_meta`. On load, those overrides are merged with the defaults. A legacy App Dashboard description is deliberately discarded so obsolete tool claims do not survive merely because an old override remains.

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
- [App Dashboard](/style-guide/chronicle-knowledge-base?section=app-dashboard&tab=overview#app-dashboard) explains the retained style example, edit register, and App Guide document workflow.

AI Status remains part of this Admin Panel manual because it is a smaller configuration-and-health surface, not a separate generation workflow.

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
- **App Dashboard** opens the style-guide hub, with an internal App Guide handoff.
- **Chronicle Knowledge Base** navigates to the protected Knowledge Base route.
- **Supabase Schema Reference** navigates to the protected schema-reference route.
- **Quality Hub** navigates to the protected quality route.
- **Validation Evidence Ledger** navigates to the protected evidence route.
- **Finance Dashboard** opens the Admin finance workspace.
- **Research & Development** opens the protected mock-up workspace.

These labels describe the current visible tools. Each destination’s own manual or source remains authoritative for what that tool can actually do.

## Shared Top-Bar Actions

- **Back** returns an open Admin tool to the hub.
- App Guide can register **Theme**, **Save**, and **Sync All** actions.
- App Dashboard can register **Edits** and **Download** actions.
- Research & Development can register **Add New Mock-up** and **Save** actions; the buttons remain disabled when no handler is available or a save is pending.
- Finance Dashboard and Research & Development replace the generic top-bar title with the active tool name.

## AI Status Controls

- **Active Models** displays fixed text and image model labels; there is no selection control.
- **Run Health Check** requests `check-shared-keys`, displays **Checking…**, and disables another check while the request is pending.
- **API Key Configured**, **Provider Reachable**, and **Shared with Users** are separate status rows. They are not receipts for successful generation.
- **Share API key with all users** is available to an administrator and is disabled while its save is pending or the key is not reported as configured. The displayed sharing state changes only when the update service returns success.
- A failed save leaves the previous sharing state. Current error handling logs failures rather than presenting a detailed recovery message in this panel.

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

`src/App.tsx` defines `AdminOnlyRoute`. The guard consumes `useAuth`, waits for the authentication load, calls `checkIsAdmin` for the active user ID, caches the resolved state for the shell, and redirects when access is not allowed. The Knowledge Base, Quality Hub, evidence ledger, and schema reference are all mounted through this route boundary.

The in-shell Admin tab and the dedicated routes are complementary checks. Neither should be removed merely because the other exists.

## Tool Registry and Lazy Loading

`DEFAULT_TOOLS` is the current presentation registry. `AdminPage` directly routes the four protected standalone destinations and lazy-loads the internal Image Generation, App/App Guide, Finance, and R&D modules. AI Status uses `ModelSettingsTab` inside the Admin content area.

This registry is not a plugin system. Adding a metadata row does not make an unimplemented component available. A new Admin tool requires a real ID, render or route owner, access decision, and focused validation.

## Metadata Persistence

The `admin_tool_meta` value in `app_settings` stores title, description, and thumbnail overrides. AdminPage first tries an update and inserts the named setting when no row exists. A failed write rolls the local hub presentation back. The deployed data layer remains responsible for allowing only authorized administrators to write that setting.

## AI Status Request and Setting Paths

`ModelSettingsTab` checks the active user’s administrator role, requests `checkSharedKeyStatus` on mount or refresh, and renders the returned booleans. `checkSharedKeyStatus` invokes the `check-shared-keys` Edge Function; that function checks backend key presence and calls the provider’s model-list endpoint for reachability. The client service maps invocation failures to false values.

`handleToggleShare` calls `updateSharedKeySetting`, which updates `app_settings` where `setting_key` is `shared_keys`. This path is separate from the hub’s `admin_tool_meta` overrides. Neither the status panel nor its hardcoded model labels owns the actual roleplay request assembly or image-generation prompts.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/pages/Admin.tsx
src/components/admin/AdminToolEditModal.tsx
src/components/chronicle/ModelSettingsTab.tsx
src/components/admin/styleguide/StyleGuideTool.tsx
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
