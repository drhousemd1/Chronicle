# Overview

## What Quality Hub Is For

Quality Hub is an administrator’s workspace for examining recorded quality findings, scan coverage, and run attribution. It brings together the question “What has someone inspected?” with the supporting finding, affected files, proposed correction, and recorded result. It is not a player-facing feature, and opening it does not scan Chronicle or establish that the application is healthy.

The current tool combines two different kinds of data. Its editable workspace contains scan modules, findings, run summaries, review units, and handoff notes, initially supplied by the repository’s registry seed and subsequently loaded for the signed-in owner. Its Changelog instead reads canonical Markdown history from the repository. Editing or importing workspace data does not edit that repository history, and changing a workspace finding is not an update to a canonical Knowledge Base Issue record.

## The Current Working Flow

The Admin Panel opens Quality Hub at `/style-guide/ui-audit`. After the protected route admits the administrator, Quality Hub loads that owner’s saved registry. Overview presents recorded scan categories and dates; Issue Registry lets the administrator search and inspect findings; Scan Runs shows attribution and recorded run summaries; Changelog opens the repository’s change history.

The workspace still supports manual changes despite the tool’s reduced role. An administrator can import a compatible JSON package, change a finding’s status or verification label, add a comment, and log a snapshot of the existing findings. Those actions first create a recoverable local copy, update the page, and then attempt a guarded owner-database save. Export Workspace downloads a transfer package without saving it or changing history.

The scan names and checklists in this tool describe available mechanics and previously recorded work; they do not impose a new testing schedule. In particular, **Log Snapshot does not run a scan**. It records the current workspace summary under the selected agent attribution.

## Data Ownership and Evidence Limits

The authenticated workspace belongs to the signed-in user, not to every administrator collectively. The page reads `quality_hub_registries` using that user’s ID. A browser-storage snapshot is not adopted as another owner’s database state. The visible repository Changelog is shared source content, not part of this owner’s editable registry.

Counts and status labels describe the loaded records. A completed scan module, manually selected “verified” label, or logged run is not fresh evidence that its subject passed a new check. The tool does not automatically collect every terminal command, test report, provider response, deployment result, or Validation Evidence Ledger receipt. Its normal browser handlers do not call an LLM.

## Loading and Recovery

Workspace changes are disabled while authentication or owner loading is unresolved, when the owner row cannot be read or validated, and when an unsaved recovery copy conflicts with the database. A failed save does not silently replace newer owner data. The page preserves the pending owner-specific copy and exposes a recovery warning.

**Download Unsaved Recovery** saves the exact preserved copy without unlocking writes. **Discard Recovery and Use Database Version** asks for confirmation, removes that pending local copy, and reloads the owner’s database state before enabling changes. Discarding means abandoning the unsaved workspace changes; it does not delete the database registry. When a pending copy still matches the database revision it was based on, reloading can safely restore it and retry the guarded save instead.

These are implemented source paths, not a claim that the current deployment, database policies, or every recovery interaction has been exercised. The internal migration-capture route is a separate restricted mode that intentionally locks ordinary workspace writes while collecting historical evidence.

# UI Elements and Functions

## Header and Workspace Actions

The back arrow returns to the Admin Panel. **How to Use** opens an explanatory modal and closes through its **Close** button.

**Import Workspace** accepts either a registry object or a transfer package containing `registry`. Compatible data is merged into the current workspace rather than replacing the entire registry blindly. A package that changes the protected legacy `changeLog` is rejected. Parse errors, invalid registry structure, owner changes during file reading, and save-state restrictions produce feedback rather than a successful import claim.

**Export Workspace** downloads `chronicle-quality-hub-<timestamp>.json`, containing package identity, export time, and the registry snapshot. Export itself does not persist changes. The header currently disables this ordinary export alongside write controls when owner loading, recovery, or migration state blocks the workspace; a locked recovery copy has its own download button.

**Log Snapshot**, also available as **Log Run Snapshot** under Scan Runs, creates a “Manual Snapshot” run with the current time, agent, existing finding summary, standard profile, and `src` scope. It does not execute the module checklists or gather new evidence.

## Overview and Navigation

The four navigation choices are **Overview**, **Issue Registry**, **Scan Runs**, and **Changelog**. They use the URL’s `view` query parameter, so browser navigation can return to a selected view. Changelog can also carry a validated `capability` filter.

Summary cards show open findings, critical open findings, findings whose status is verified, logged runs, and completed modules. Overview groups the catalogue into global systems, application pages, and selected Admin tools. Expanding a scan row reveals its linked checks, backing modules, and stored logging destinations. No execution button is attached to those rows. Last Scan comes from the linked module’s run, not a live inspection performed when the page opens.

The repository-change preview shows the five newest canonical records. **Open Changelog** opens the complete history view; individual records link to their complete narrative and supported archive history.

## Finding Search and Detail

Issue Registry offers text search, severity/domain/status/agent filters, and grouping by severity, domain, status, page, component, or agent. Search covers titles, problem/current-state text, page, component, route, files, and tags. The filtered count reflects the current selection; the dominant-domain indicator is calculated from the entire loaded workspace.

Finding rows expand to show their summary, problem, impact, file and evidence references, recommendation, expected versus actual behavior, reproduction steps, and attribution. A tagged finding can display **Lovable Supabase Change Required**; that badge classifies the recorded work and does not perform the backend change.

Fixed and verified findings are collapsed behind **Show fixed**. Other statuses remain in the expanded group, including deferred and rejected entries; the top-level open count specifically counts only open and in-progress findings. Those displays therefore do not all use the same meaning of “open.”

The status selector changes the workspace finding status. The verification selector changes its verification label and, when set to verified, records the current agent and run attribution. **Add Comment** opens a text prompt and appends a nonblank note. These controls record an administrator’s decision; they do not independently verify the claim.

## Scan Runs and Repository History

Agent Name, Model, and Platform supply attribution for subsequent workspace actions. Editing them changes the current page’s draft attribution; it does not launch or authenticate that model. Known Agents is derived from recorded runs and findings plus the default agent. Scan Run History shows each run’s name, agent, profile, finding summary, and finished time.

Changelog has no history-editing controls. It can show all canonical Chronicle records or a supported capability scope, with links back to the broader view. A load or validation failure is distinct from a valid empty result. Historical Quality Hub entries retain their historical meaning rather than being automatically relabeled as newly accepted work.

# App Architecture

## Entry, Seed, and Owner Loading

`src/pages/Admin.tsx` navigates to the route registered in `src/App.tsx`. `AdminOnlyRoute` waits for authentication and administrator resolution before rendering `UiAuditPage`; signed-out and non-admin visitors are redirected. The page then obtains the current user from `useAuth` and loads `registry, updated_at` for that user from `quality_hub_registries`.

`src/data/ui-audit-findings.ts` supplies the registry seed and default agent. `cloneInitialRegistry` deliberately starts with an empty embedded legacy Changelog. During authenticated loading, the page does not display the unscoped browser cache as that owner’s data. If the owner has no database row, it starts from the seed instead of importing a previous owner’s browser snapshot.

`upgradeRegistry` compares registry versions and merges newer seed definitions into older persisted workspaces while preserving the exact legacy history. `normalizeActiveQualityHubRegistry` removes retired App Architecture/API Inspector integrity modules and the retired API Inspector review unit, and normalizes obsolete unconditional logging destinations. A seed upgrade is not a new scan.

## Registry Shape and Workspace Merging

`ui-audit-schema.ts` defines the registry’s metadata, modules, runs, findings, review units, embedded legacy history, and handoff notes. Its import predicate checks the outer object and required arrays; it is not an exhaustive validator of every nested finding field.

`ui-audit-utils.ts` owns sorting, counts, summaries, and merging. Findings are joined by ID. The newer `updatedAt` supplies the main finding values, while files, evidence, tags, relationships, comments, and contributors are combined. Runs, modules, and review units are also joined by ID. `quality-hub-read-only.ts` wraps this merge so an import cannot change the protected legacy Changelog, even though the generic merge helper supports history data.

The normal page provides no general finding-creation form. Its findings arrive through the seed, owner load, or workspace import. Status, verification, and comment handlers modify existing findings through the same guarded update path.

## Recoverable Local Change to Confirmed Database Save

`updateRegistry` rejects changes during migration capture, owner loading, or a recovery lock. It prepares the proposed registry against the protected history and passes it to `persistUserRegistry`. For an authenticated owner, that function must first save a versioned recovery envelope under `chronicle-quality-hub-pending-v1:<owner-id>`. The envelope retains the owner, local revision, database base revision and snapshot, and proposed registry. If browser storage cannot hold this recovery copy, the change is not accepted locally.

After the local update, the persistence effect refreshes the general `chronicle-quality-hub-v1` browser copy and starts the serialized database-save queue. `saveToDb` rechecks the owner, protected legacy history, current database contents, and the base `updated_at`. An update is conditional on the previously read timestamp; a missing owner row uses insertion instead. This is **optimistic concurrency control**: the write proceeds only if the saved version has not changed underneath the page.

The returned row must match the proposed registry and protected history before the page treats it as confirmed. A matching recovery envelope can then be cleared; a newer local change keeps its recovery data and receives the newly confirmed base. Owner changes invalidate stale loading responses and queued ownership assumptions. Database/read-back errors or conflicts lock further changes rather than overwriting either the preserved recovery copy or newer owner data.

The component also contains a signed-out local-storage path, but the delivered route is administrator-protected. That fallback is not an alternative public entry to the tool.

## Catalogue Summaries and Canonical History

Overview combines static catalogue rows with the loaded registry. Finding membership uses module tags or domain hints, with page/route/component matching for page-specific groups. Dates resolve through module `lastRunId` references. A finding can contribute to more than one catalogue row, while section totals deduplicate finding IDs. This is a presentation of registry relationships, not runtime coverage measurement.

The Changelog path bypasses the editable workspace: `ChangelogRecordList` calls `loadChronicleChangelogRegistry`, which imports and validates Markdown from `docs/architecture-knowledge/changelog/entries/`. Capability selection and archive routing are handled by the canonical record components. No workspace status update, snapshot, or import creates an accepted repository change.

## Separate Execution and Capture Paths

`scripts/run-quality-hub-scan.mjs` is a separate command-line runner, not a handler behind an Overview row. Its current command path checks the Knowledge certification context, then executes lint, type checking, tests, build preparation/build, and a dependency audit sequentially, stopping at the first failure. It prints a result summary; it does not write a Quality Hub registry row or a Validation Evidence Ledger receipt. This describes its current mechanics, not when that broad command is appropriate.

The internal `/style-guide/ui-audit/changelog-migration-capture` route mounts the same page with `migrationCaptureMode`. Ordinary import/export/snapshot and registry writes are locked. `QualityHubChangelogMigrationCapture` reads the authenticated owner snapshot and captured browser history, then rechecks them for a stable export. It is historical capture, not a second editable Changelog.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Admin.tsx
src/pages/style-guide/ui-audit.tsx
src/data/ui-audit-findings.ts
src/lib/ui-audit-schema.ts
src/lib/ui-audit-utils.ts
src/lib/quality-hub-read-only.ts
src/features/quality-hub/quality-hub-changelog-migration-capture.tsx
src/components/admin/knowledge-base/ChangelogRecordList.tsx
src/data/chronicle-knowledge-base/changelog-record-sources.ts
src/data/supabase-schema-reference.ts
src/data/database-schema-inventory.ts
scripts/run-quality-hub-scan.mjs
```

# Supabase Tables

## Owner Workspace Storage

The direct data owner is `quality_hub_registries`. The page reads and writes the whole registry as JSON rather than storing each finding or run in its own table.

| Referenced field | Role in this tool |
| --- | --- |
| `id` | Database row identifier. The inventory documents a UUID primary key. |
| `user_id` | Selects the signed-in owner’s workspace for reads, inserts, and updates. |
| `registry` | JSONB payload containing workspace modules, runs, findings, review units, metadata, and preserved legacy history. |
| `updated_at` | Saved revision marker used in hydration, pre-write comparison, conditional update, and read-back verification. |

The [Supabase Schema Reference](/style-guide/supabase-schema-reference) describes owner-only access; its repository source is `src/data/supabase-schema-reference.ts`. `src/data/database-schema-inventory.ts` records the corresponding owner predicates using `auth.uid() = user_id`. These references describe the checked-in schema, not a new live-policy verification. The page expects a single matching owner row; the documented primary key alone does not establish uniqueness of `user_id` in the deployed database.

The page performs select, insert, and update operations, but its recovery-discard action deletes only browser recovery data. Canonical Changelog Markdown is not saved through this table. No tool-specific storage bucket, RPC, or Edge Function is called by the inspected normal workspace handlers.
