# Overview

## What the Evidence Ledger Is For

Validation Evidence Ledger gives an administrator a place to inspect the receipts behind a defined set of roleplay checks. A receipt records what executed, its result, its source identity, and its raw report; the ledger places that evidence beside the gate it was meant to address. A **gate** here is a named validation definition, not proof that an entire product requirement has been satisfied.

The tool is implemented but deliberately narrow. Its current scope is `roleplay-restart-v1`, defined in repository source around issue-numbered Roleplay Pipeline work. It is not a registry of every test in Chronicle, and an ordinary test run does not automatically appear here. Only execution paths connected to this ledger’s writers create its receipts. Its issue numbers identify that roleplay validation catalogue; they are not a new canonical Knowledge Base Issue store.

## How Evidence Reaches the Page

Repository definitions identify fixture, command, and manual gates. A fixture is a controlled example with assertions; a command gate runs a predefined command; a manual gate expects a separately recorded human review. Connected runners append automated execution receipts and raw reports to local files. Manual-review tooling appends a different record type instead of turning human judgment into an automated pass.

Opening the ledger through Admin requests a newly derived local snapshot. The snapshot joins each definition to its execution and review history, derives a status from the latest relevant evidence, and separately evaluates freshness. **View** opens the complete gate data and retrieves the latest automated execution’s raw report when one exists.

The browser page does not run a test, approve a manual gate, edit a receipt, or repair a failed feature. It is a reading surface. A displayed gate or button does not authorize additional tests.

## Local-Development and Data Boundaries

The page route is administrator-protected, but its evidence transport exists only in the local Vite development server and accepts loopback requests. Production mode shows an unavailable message instead of fetching local evidence. The current ledger lives under the ignored `.validation-evidence/roleplay-pipeline` directory; its raw receipts are not imported into the production page bundle or stored in Supabase.

Execution receipts and raw reports are separate append-only files. “Append-only” means the writer creates a new file exclusively and refuses to overwrite an existing ID. The current-ledger file is a replaceable projection derived from those inputs, not the editable authority for a result. This local storage model is not a shared service, tamper-proof audit system, or backup guarantee.

## Reading Results Without Overstating Them

Status and freshness answer different questions. A gate can display **Passing** because its latest execution passed while its freshness is stale or unknown. **Expected red demonstrated** means the expected failure was observed; the underlying execution remains a failure. **Not Run** means no usable execution is joined to that definition, not that the feature passed or that someone necessarily never attempted it elsewhere.

A receipt proves only the assertions or command result it actually captured. Several phase definitions can reuse the same command, so multiple rows are not necessarily independent pieces of coverage. The ledger does not inspect the prose of every requirement and establish that the associated checks prove all of it. Manual approval likewise records a reviewer’s decision and references; it does not manufacture live provider or deployed-database evidence.

## Present Limitations and Recovery

The page loads once when mounted; it has no refresh button, polling, search, or filter controls. Reloading or reopening it requests the latest local projection. It shows a load failure for unsuccessful requests or invalid JSON, and an explicit unavailable state outside development. Neither state is represented as a pass.

Missing or malformed execution files can be omitted by the file reader, leaving their gates without usable evidence. Raw-report retrieval is a separate request: the gate can remain visible even if its report is absent or unreadable. The preview does not currently show a distinct loading indicator, and an unsuccessful HTTP report response leaves `rawReport` as `null`; a thrown fetch or parsing error supplies an error object. These are current interface limits, not completed report-recovery features.

Source inspection establishes this delivered local path and its storage/derivation rules. It does not establish the quality of every defined assertion, completeness of the roleplay validation programme, current receipt results, or acceptance of the actual narrative experience.

# UI Elements and Functions

## Entry and Scope Summary

The Admin Panel’s **Validation Evidence Ledger** card opens `/style-guide/validation-evidence-ledger`. **Back to Admin** returns to `/?tab=admin`.

The first panel is titled **Local Roleplay Validation Scope**. When data loads, it shows the scope ID and source identity. A clean checkout can show an exact revision; dirty or unknown state is labeled without an exact revision claim.

Summary cards display active gates, passing green, expected red, unexpected failures, errors, not run, manual pending, freshness unknown, and legacy orphans. They are category counts, not a single completion percentage. Some derived details, such as manual-approved totals and separate current/stale freshness totals, exist in the snapshot without dedicated top-level cards.

## Validation Gates Table

The table shows the issue number/title, validation phase, evidence kind, derived status, freshness, latest execution result and exit code, automated/manual history counts, and **View**. When no automated execution exists, the latest manual outcome or “No execution” appears instead.

| Displayed state | Meaning in the current derivation |
| --- | --- |
| Passing / Failing | The latest automated result matched a pass-expected gate or failed it. |
| Execution error | The runner recorded an execution problem rather than a normal pass/fail outcome. |
| Not Run | No usable automated execution is joined to this gate. |
| Expected red demonstrated / Unexpected pass | A fail-expected definition received a failure or an unexpected pass. |
| Manual review pending / approved / rejected | A manual definition has no review yet or uses its latest recorded review outcome. |
| Blocked / Superseded | The definition’s lifecycle prevents ordinary result interpretation. |

The derivation supports these states; it does not imply the current catalogue necessarily contains a gate in each state.

## Evidence Preview

**View** opens a JSON preview containing the selected gate, its definition, full automated and manual histories, and the latest execution’s report. A gate without an automated execution can still be opened to inspect its definition and manual history. The close button, labeled **Close report preview**, dismisses the modal.

The preview is read-only. There are no in-page controls to alter status, submit approval, run a command, delete an execution, or download all reports. Historical execution records expose their recorded report references, but the page fetches only the latest automated execution’s report for this preview.

## Legacy Reconciliation and Empty States

When a reconciliation summary is present, **Legacy Reconciliation** shows matched rows, orphaned/malformed rows, missing reports, and orphan reports. An orphan is evidence that could not be safely matched to a supported definition or report relationship. The panel exposes those gaps instead of assigning them to a convenient gate.

While loading, the table region shows **Loading local validation evidence...**. Production mode states that evidence is available only in local development. A failed ledger request states that local evidence could not be loaded. These are page-state messages; the gate-level **Not Run** state is produced only after a snapshot has been derived.

# App Architecture

## Protected Page and Development Transport

`src/App.tsx` mounts `ValidationEvidenceLedgerPage` behind `AdminOnlyRoute`. The page checks `import.meta.env.DEV` before fetching `/__validation-evidence/roleplay-pipeline-ledger.json` with `cache: no-store`. It stores the response in local React state and uses a cancellation flag to avoid applying a completed load after unmounting.

`vite.config.ts` installs `validationEvidenceDevPlugin`. The middleware is serve-only, accepts only GET, and requires a loopback socket address. These server checks are separate from the application’s administrator route guard; the local endpoint itself does not perform the browser’s Supabase administrator check. Non-GET requests return 405 and non-loopback requests return 403.

A ledger request reads the current Git source identity, calls `buildValidationEvidenceLedgerSnapshot`, and returns JSON with no-store headers. That call also replaces the generated current-ledger file. Thus viewing is read-only with respect to evidence receipts, but deriving the view does refresh its disposable local projection.

## Definitions and Receipt Producers

`roleplay-gates.ts` owns the current scope and definitions, including gate IDs, issue/phase labels, evidence kind, expected result, lifecycle, and runner configuration. `getRoleplayValidationGate` resolves exact IDs. Definitions exist independently of executions, allowing the page to show missing evidence rather than displaying only successful runs.

`scripts/run-validation-gate.ts` accepts one predefined gate ID. Fixture gates route to the appropriate batch with that selection; command gates route to `runPredefinedCommandGate`; manual gates are rejected by this automated entry point. The package’s validation-gate command currently passes through the Knowledge certification wrapper. Those are execution mechanics, not a reason to run a gate during unrelated work.

The batch entry scripts call `runRoleplayBatch0Validation` or `runRoleplayBatch1Validation`. Their shared `roleplay-regression-fixture.ts` checks that selected fixture metadata matches its definition, evaluates assertions against the created artifact, and calls `recordFixtureExecution`. A fixture-creation error is recorded as an error before being rethrown. The in-memory collector in `test-recorder.ts` supports tests of this machinery without writing the real local ledger; it is not persistent evidence.

The command runner uses predefined argument arrays, the current Node executable, a repository working directory, an environment allowlist, and `shell: false`. It captures bounded output, classifies zero exit as pass and nonzero exit as fail, and records runner/timeout problems as errors. Timeout sends termination and then a forced kill after a grace interval. Report output has ANSI formatting and a narrow secret-assignment pattern removed; that is not comprehensive sanitization of arbitrary sensitive text.

Both automated writers record a unique execution ID, gate ID, result, command or fixture reference, timing, source identity, failure cause, raw-report path, and artifact-identity evidence. `scripts/record-validation-manual-review.ts` instead accepts a defined manual gate, approval/rejection, reviewer, notes, and evidence references, then appends a manual-review record and rebuilds the projection. The browser does not submit these records.

## Local Files and Derived Status

`ledger-file.ts` owns `.validation-evidence/roleplay-pipeline`, with separate `executions`, `manual-reviews`, `reports`, `reconciliation`, and `generated` directories. New execution, review, report, and historical reconciliation files use exclusive creation. Generated snapshots use a temporary file and rename. Record IDs are restricted, and resolved evidence paths must remain inside the allowed evidence root.

The reader normalizes usable execution/review JSON and joins records by `gateId`. `deriveValidationGate` sorts each history by its recorded date and ID, selects the latest entry, applies blocked/superseded lifecycle first, and then derives the manual or automated status. The stored current-ledger JSON is not read as the primary execution history. Missing directories return no records; malformed JSON and unsupported record shapes are omitted from the current view rather than synthesized into passing results.

Status does not incorporate freshness into its pass/fail decision. `summarizeDerivedValidationGates` counts those dimensions separately. An expected failure remains `result: fail` while being labeled expected red, and an unexpected pass contributes to the unexpected-failure summary.

## Source and Artifact Freshness

`source-identity.ts` uses Git status, including untracked files, and HEAD. A dirty checkout intentionally returns no exact tested revision. `deriveExecutionFreshness` needs a clean current source revision, matching execution revision, and a current artifact-identity report before labeling evidence current. A known revision or artifact mismatch is stale; insufficient identity is unknown.

`roleplay-artifact-identity-node.ts` compares generated frontend/Edge manifests with their listed source-file hashes, migration marker, contract versions, and any observed runtime identities. Missing runtime identities can leave freshness unknown even when a command passed. These comparisons bind evidence to the artifacts actually identified; they do not establish that every deployment or provider path was exercised. Manual review records do not carry this same automated source-binding structure, so approval should not be read as an independent current-source certification.

## Raw Reports and Historical Reconciliation

The report endpoint takes a restricted `executionId`, resolves its execution record, and follows the report reference only inside the evidence root. The report filename must match the immutable execution ID. Invalid IDs return 400, missing report references return 404, and uncaught file/derivation failures return 500. The client does not convert these failures into new execution outcomes.

`reconciliation.ts` handles the older `public/validation-evidence` ledger/report format separately. The reconciliation script falls back to the preserved `legacy-source-public` directory under the local evidence root when the public ledger is absent. It matches supported fixture IDs and exact issue/phase metadata, retains duplicate or unmatched rows as orphans, and tracks malformed rows and missing/orphan reports. Imported executions receive deterministic legacy IDs and unknown timestamps/source revisions where the old evidence cannot establish them. It does not infer manual approval from the old row’s prose. Reconciliation appends preserved evidence and its summary; the page merely reads that summary.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Admin.tsx
src/pages/style-guide/validation-evidence-ledger.tsx
src/features/validation-evidence/ledger.ts
src/features/validation-evidence/ledger-file.ts
src/features/validation-evidence/roleplay-gates.ts
src/features/validation-evidence/runner.ts
src/features/validation-evidence/source-identity.ts
src/features/validation-evidence/roleplay-artifact-identity.ts
src/features/validation-evidence/roleplay-artifact-identity-node.ts
src/features/validation-evidence/dev-middleware.ts
src/features/validation-evidence/reconciliation.ts
src/features/validation-evidence/test-recorder.ts
src/features/chat-runtime/roleplay-regression-fixture.ts
src/features/chat-runtime/roleplay-batch0-validation.ts
src/features/chat-runtime/roleplay-batch1-validation.ts
scripts/run-validation-gate.ts
scripts/record-validation-manual-review.ts
scripts/write-roleplay-batch0-validation-ledger.ts
scripts/write-roleplay-batch1-validation-ledger.ts
scripts/reconcile-validation-evidence.ts
vite.config.ts
package.json
.gitignore
```

# Supabase Tables

## No Ledger-Specific Database Storage

The inspected Evidence Ledger page, development middleware, and evidence writers do not read or write a Supabase table, RPC, Edge Function, or storage bucket. The application’s existing authentication/administrator guard controls entry to the page; that does not make the evidence itself database-backed.

The actual persistence owners are local JSON files under `.validation-evidence/roleplay-pipeline`. The legacy public directory is reconciliation input, not the current ledger service. No dedicated database schema or cross-device synchronization for this tool is implemented in this path.

Roleplay checks may concern features whose data is stored in Supabase, but the ledger does not thereby verify those deployed objects. The [Supabase Schema Reference](/style-guide/supabase-schema-reference) remains the separate reference for application tables and policies, while the [Roleplay Pipeline](/style-guide/chronicle-knowledge-base?section=roleplay-pipeline) describes the runtime whose evidence is being inspected.
