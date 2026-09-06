---
title: Chronicle Work Manual
manual_version: 0.2.3-provisional
status: active-provisional
authority_epoch: chronicle-work-manual-2026-08-29-01
activated_on: 2026-08-29
controlling_project: KS-WORK-001
canonical_path: docs/architecture-knowledge/chronicle-work-manual.md
reviewed_on: 2026-09-05
reviewed_repository_head: cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7
reviewed_route_policy: 0.2.0
reviewed_source_count: 49
reviewed_migration_rule_count: 806
reviewed_plan_sha256: 781c80671b6774a05fd23095a6343aa359ba9884ee450b945f476a810552b91e
reviewed_receipt_sha256: 4e0b20dfa7d73a6590b3ac3a356ab4c031da0c550ac39ce14d418640e45d566e
reviewed_rules_sha256: bf30c4eddc23b89be3b6aa3fd3e952f83e4238d99775bbd8bbeaec4908d0bf7b
phase_c_source_sha256: e8bfd449ac29fdfd492c03ec359b7abce05e80fe22dd7b6d88892b04ff2280dc
reviewed_chapters_sha256: 643eb0e69b3ced28d71b090550d8c0d88b1fc68ab391cb2ef00a38521defc4d8
---

# Chronicle Work Manual

> **Active provisional Chronicle workflow authority.** This is the one Chronicle-authored source for how work is classified, investigated, validated, recorded, delivered, and stopped. Parent instructions, repository instructions, and the installed Chronicle workflow skill may point here, but they must not duplicate these decisions.

It is written for a capable reader who may not be a programmer. Technical terms are defined when they first matter, and each rule explains its practical consequence. Version `0.2.3-provisional` is active for Chronicle work but is not accepted version 1. Final acceptance remains a separate user decision after the remaining genuine task pilots exist.

The manual does not define what Chronicle's product should do. Stable capability manuals own intended behavior. Current repository source owns what the checked-out implementation does. Tests, browser observations, live-system checks, and human review provide limited evidence. Issues, Current Work, Changelog records, and archives each own a different kind of operational history.

### Status and change process

Edit only this canonical Markdown source. Increase its version, record the reviewed repository state, map the change to the governing decision, and run the applicable manual and authority checks. Use the recoverable cutover process for any change that also alters active pointers or outside Chronicle-specific triggers. Never maintain an independently editable HTML, React, skill, or instruction copy.

---

## Overview

### What the Chronicle Work Manual Is

The Chronicle Work Manual explains how work on Chronicle is carried out, from understanding a request to checking the result and deciding when the task is finished. It is the shared workflow reference for Codex tasks working on the application. It connects planning, source investigation, implementation, testing, review, records, and delivery so that each assignment follows the procedure appropriate to its consequences.

The manual is organized around the work being performed. A wording adjustment, a feature that saves data, and a change spanning several systems need different kinds of investigation and proof. The work chapters explain those differences; the supporting sections supply the testing instructions, safeguards, and record requirements that apply when those subjects are involved.

### How the Manual Is Organized

**Start Here** contains Chapter 1, the entry point for an assignment. It explains which sources answer which questions, how to establish the requested outcome, how to classify the work, and how to select the instructions needed next.

**Work Types** contains the complete procedures for Routine Local Work, Connected Feature Work, and Multi-System Program Work. Each chapter explains when it applies, the order of work, the required proof, and the stopping conditions.

**Tests, Tools, and Audits** explains the available checks and commands, what authorizes them, and what their results prove. It also covers delivery checks, progress reporting, research, subagents, and independent review.

**Safeguards and Systems** explains when an assignment needs additional approval or protection. It covers risk boundaries such as ownership, saved data, security, and destructive operations, together with instructions for Chronicle-specific systems.

**Evidence, Records, and Stopping** explains how test results, browser observations, live-system inspection, and human acceptance differ. It also explains the separate purposes of Issues, Current Work, Changelog records, and archives, including when those records are created or updated.

### How It Connects to the Knowledge Base and Other Resources

The Knowledge Base's application sections explain what Chronicle does and how its parts work. This manual explains how to undertake work on those parts. The repository source shows the current implementation; supporting research, supplied documents, and plans in the Document Library provide context for particular assignments. Skills provide specialized working methods where the manual or the user calls for them. The Work Manual remains the Chronicle workflow authority across those resources.

### From Orientation to an Assignment

This Overview introduces the manual's purpose and organization. [Start Here](#1-start-here) supplies the working instructions: it leads from an assignment to the applicable work chapter and supporting sections. Those selected instructions govern the task's planning, investigation, implementation, checks, records, and delivery. The remaining chapters stay available as references when the work reaches the subjects they cover.

---

## 1. Start Here

### 1.1 Authority and the questions each source answers

**Authority** is the source allowed to answer a question. This active-provisional manual owns Chronicle workflow. The user owns the requested outcome; stable capability manuals own intended behavior; current source owns this checkout's implementation; verified live inspection owns only the deployed state it observed; Issues own unresolved verified gaps; Current Work owns continuity; Changelog and archives own accepted history. Tests and observations are evidence with stated limits. Historical audits, mockups, transcripts, dashboards, and old task messages are rationale or leads, not current authority. `[WM-START-003] [WM-START-008] [WM-START-009]`

A **source owner** is the file, component, service, record, or live system responsible for a fact or behavior. A **consumer** uses it. A **canonical record** is the one official editable record. **Continuity** lets unfinished work resume safely. A **cutover gate** is temporary protection for the exact authority files being switched. It must not stop read-only work, unrelated files, unrelated projects, or ordinary Chronicle work outside those declared targets.

System, developer, safety, direct-user, and mandatory platform instructions still apply. General and specialist skills explain mechanics only; they do not decide that Chronicle must invoke them.

### 1.2 The outcome is binding; the first proposed mechanism is not

Treat the intended result as binding. Use the approved mechanism when sound. If it is materially unsafe or cannot achieve that result, explain why before changing direction. Never silently substitute an easier adjacent result. `[WM-START-002]`

### 1.3 Existing-result preflight

Check the current owner and delivery surface before implementing. Use one bounded name-and-outcome search for a materially overlapping Issue, project, archive, Changelog entry, or objective. Routine work opens none of those records unless the search finds a plausible match. Reuse the real owner; do not create a duplicate. If the result already exists, verify it, report it, and stop. Do not manufacture edits, audits, records, or checks. `[WM-START-005]`

### 1.4 Choose the lowest base scope that covers the complete consequence

Choose by consequence, never by file, CSS, test, document, tool, agent, or hour count; unfamiliarity, a failed command, or a desire for confidence also cannot raise scope. `[WM-START-004]`

| Work type | Use it when | Normal proof | Not automatic | Stop |
|---|---|---|---|---|
| **Routine Local Work** | Presentation, static content, documentation, a bounded local interface branch, or shared presentation changes while meaning, accessibility behavior, privacy, consent, ownership, data, and external behavior stay unchanged. | Exact diff; focused lint or exact selected local test when meaningful; actual rendered or document inspection. | Full suite, build, Quality Scan, architecture refresh, Knowledge certification, audit, reviewer, subagent, operational record, Supabase, or repository-wide review. | Focused proof and the actual result agree. |
| **Connected Feature Work** | One complete result crosses a service, API, saved-data, retry/timing, shared-state, or established handoff boundary. | Exact positive, important negative/recovery, and boundary integration checks; visible or approved internal evidence. | Full suite, generic audit/review team, project, or unrelated certification. | Required path evidence agrees. |
| **Multi-System Program Work** | One approved outcome requires several user-meaningful results, capability contracts, or handoffs. | Per-result focused/integration proof, then applicable integrated and specialist evidence. | Repeated broad suites, generic all-system audits, automatic reviewer teams, or unrelated specialist packages. | Preserve one Resume Here point, or finish accepted closeout. |

Security, live data, destructive work, roleplay, Knowledge infrastructure, continuity, and delivery add only their triggered safeguards or layers. They change the base scope only when the actual consequence spans more owners or results.

### 1.5 Read only what this task needs

Start from the exact route, label, symbol, path, record, API, or field named by the user. Use bounded `rg` search, then follow direct imports, handlers, callers, services, and persistence only until the decision owner and materially different consumer patterns are known. Inspect representative patterns, not every identical instance. Read the complete changed path for Connected work and each affected authority for Multi-System work; do not load unrelated capabilities or historical dossiers. A screenshot, mock, generated map, type, or neighboring flow is a lead, not authority. `[WM-START-007]`

### 1.6 Make one declaration, then proceed

A clear reversible request proceeds after one declaration; do not ask again. `[WM-START-001] [WM-START-006]`

Routine uses one short statement:

> I am treating this as Routine Local Work because it changes [exact surface or document] owned by [owner] without changing [behavior or meaning]. I will run [focused check] and inspect [actual result]. I am omitting [broader checks or records]. I will expand only if source inspection shows [concrete trigger].

Connected or Multi-System names the outcome, unchanged behavior, owners/consumers, scope, safeguards/continuity/records, exact planned checks, omitted broad work, expansion trigger, and approval boundary.

Do not produce a per-search, per-read, per-edit, or per-tool-call compliance ledger. Trace only the selected scope, material expansion, safeguard, broad check, reviewer, approval, record, and final evidence.

### 1.6.1 Broad activity must be declared before it begins

Before an unfiltered test collection, build, ship check, Quality Scan, architecture refresh, Knowledge certification, roleplay batch, broad security scan, live operation, repository-wide audit, subagent team, independent review, or protected record mutation, state the exact operation and selection; the concrete trigger; why focused proof is insufficient; what it proves and cannot prove; and which broad work remains omitted. Do not run placeholders. A large-count report must name the command, trigger, active collection, pass/fail/skip meaning, and proof limits. Do not report every tool call.

### 1.7 When to continue and when to ask

Update the declaration and continue when the same outcome requires a direct consumer, negative branch, broader scope, safeguard, continuity, bounded worker/review, or justified broad check. Ask first for a different result, optional or unrelated work, unresolved product choice, unrequested delivery, paid/external action, live-data or permission mutation, destructive work, migration, or a material assumption caused by missing authority. A failed command alone never authorizes expansion.

### 1.8 Load the smallest complete reading path

Routine reads Chapter 2. Connected reads Chapter 3 plus applicable evidence/check subsections. Multi-System reads Chapter 4 plus applicable evidence, continuity, checks, systems, and closeout subsections. Add only triggered safeguard, record, specialist, reviewer, mechanics, or delivery sections. Never load other base scopes, migration receipts, historical reports, or generic audit packages.

Ceilings: onboarding 250 words; complete Routine 4,000; Connected 8,000; Multi-System 15,000; whole manual 25,000. Count active pointers, onboarding, Start Here, selected scope, and every loaded triggered subsection or mechanics source. Use `npm run knowledge:work-manual:check` with `--reading-path`, repeated `--manual-section="<exact heading>"`, and repeated `--loaded-instruction=<absolute-path>`. Remove non-triggered reading; if the required package still cannot fit, stop and revise the manual.

### 1.9 Use the repository map only when it answers a real source question

Chronicle's repository map is a private local reading aid. It shows relationships extracted from the allowlisted checkout and presents capability lenses bounded by the source paths in the canonical manuals. It never replaces those manuals, current source, tests, live-system evidence, Issues, Current Work, or accepted history. `[WM-START-010]`

Routine work normally omits the map. Use it only when bounded source inspection cannot identify a shared presentation owner or the materially different consumers that must be checked. Connected work may use it to orient one service, saved-data, retry, shared-state, or handoff path before inspecting the real owners. Multi-System work may use it to identify candidate authorities and handoffs for a declared result slice. Research may use it to form source-backed questions, not to claim that a prototype or structural cluster is implemented product behavior.

When the map is useful, follow this order: read the applicable manual; check map freshness; run one bounded query, path, or node explanation; open the actual source returned; and declare any resulting expansion before changing scope or checks. If the map is stale, unavailable, or contradicts a manual or current source, distrust the map and continue from the manual and source. Do not regenerate it merely to avoid reading source, and do not install Graphify's skill, hooks, memory, watcher, or MCP server. Exact commands and regeneration conditions are in [Sections 9.7](#97-private-repository-map-and-canonical-history) and [11.2](#112-repository-and-focused-checks).

### 1.10 Preserve complex supplied requirements before planning

Invoke the installed `requirements-fidelity-planning` skill when Chronicle work is requirement-heavy: the requested result depends on several supplied documents, screenshots, demonstrations, exclusions, protected surfaces, or later corrections whose loss could authorize the wrong plan or implementation. The skill owns the detailed source-register, trace, amendment, and raw-first critic mechanics. Keep the raw artifacts available and identify them stably; do not replace them with a summary before the requirements have been reconstructed. `[WM-START-011]`

This safeguard does not raise the base scope, create Current Work, authorize a reviewer, or add tests by itself. Do not invoke it for routine styling, ordinary bounded implementation, or a simple request merely because an artifact was attached.

---

## 2. Routine Local Work

Routine is the firm cheap path, not a preliminary phase. If focused proof and the actual result agree, stop. `[WM-ROUTINE-001] [WM-ROUTINE-002]`

### 2.1 Presentation, imagery, layout, and static wording

For CSS, layout, typography, imagery, static labels, or explanatory wording: locate the local or shared owner; state the visible result and unchanged meaning/behavior; declare the smallest meaningful existing check or exact-diff plus rendered inspection; make only the bounded change; run that proof; inspect the real state and width; report limits; stop. Do not create a meaningless test for a checkmark. Reclassify if meaning, accessibility behavior, privacy/consent, ownership, data handling, or action consequence changes.

### 2.2 Bounded local interaction

For one control and local screen state: trace handler and state to the result; identify default and changed branches plus the interface-owned empty/failure state; make the smallest complete change; run focused component/interaction tests when a meaningful harness exists; exercise the control; update stable UI documentation only if meaning changed; report limits; stop. Reclassify when the path reaches an API, service, saved data, permission, retry/timing, or handoff.

### 2.3 Shared presentation

A shared component, token, or stylesheet remains Routine when only presentation changes. Group real consumers by materially different rendering/state/layout; inspect the requested surface and one representative per pattern; run the focused shared-source check. Do not inspect every instance. Reclassify if behavior, action meaning, accessibility behavior, state, data, permissions, or another capability contract changes.

### 2.4 Documentation-only work

For documentation-only work, identify each statement's authority; verify current source or live fact; change only the requested document and its generated direct consumer; check headings, links, references, wording, and rendering; proofread; report verified and unknown claims; stop. Run only validators whose contract includes that document. Do not add unrelated product tests, broad checks, or user review of invisible facts.

### 2.5 Complete Routine operating package

This is the complete Routine package. Open one [Section 11.2](#112-repository-and-focused-checks) registry row only if its exact command has changed or is ambiguous.

| Required area | What the agent actually does |
|---|---|
| Planning | One short declaration. No phases, project packet, Current Work, or ledger. |
| Read/inspect | Bounded `rg`; owner/direct branch; exact diff; requested surface plus representative shared patterns. |
| Checks | Presentation/static text: exact diff plus rendered/document inspection when no meaningful automated assertion exists. Lint-covered source: `npx eslint <exact-paths>`. Local behavior: `npm run test:product -- <exact-test-files>`; use `npm test -- <exact-test-files>` only for Knowledge-importing tests. Use `npm run typecheck` only for a relevant TypeScript contract. Name exact files/tests first. |
| Audits/workers | None by default. Use bounded diagnosis only when in-scope uncertainty blocks the next conclusion. |
| Records | Stable document only if its fact changed. No operational record without its independent trigger. |
| Omit | No unfiltered tests, broad lint, build/ship/Quality Scan, architecture refresh, unrelated Knowledge check, Supabase/Lovable work, roleplay gate, audit, reviewer, or subagent. Delivery is separate. |
| Expand | Only for a proved behavior, persistence, service, permission, handoff, or materially different-consumer consequence; report it first. |
| Stop | Focused proof and actual result agree; unchanged behavior/meaning and limits are reported. |

### 2.6 Routine completion report

Report the exact owner/surface, files, focused proof, inspected state, unchanged behavior/meaning, evidence limits, and delivery status. Name omitted broad work, then stop.

---

## 3. Connected Feature Work

Connected work proves one complete behavior path instead of auditing the application. `[WM-CONNECTED-001]`

### 3.1 Define the behavior contract

Before editing, state:

- the user action or system trigger;
- the expected successful visible or stored result;
- the important failure, empty, retry, or recovery result;
- the source owners and exact boundary crossed;
- nearby behavior that must remain unchanged;
- focused positive, negative, and integration checks;
- triggered safeguards, records, and review;
- omitted broad work and the finding that would justify it.

### 3.2 Trace the real path

Follow the trigger through the actual component, handler, service or API, state transition, persistence owner when present, and final visible or stored result. Inspect the existing tests that exercise this path. Do not substitute a type definition, mock, generated map, or neighboring flow for the real owner.

When an established handoff carries identifiers, name each identifier crossing the boundary and decide from approved product behavior whether durable lineage must be preserved. Do not silently add a lineage, schema, or identity requirement merely because the handoff exists.

Implement one complete user-meaningful result. Do not scatter partial fixes across several layers without proving the handoff between them.

### 3.3 Required proof

Run:

1. the smallest focused regression test for the requested behavior;
2. the important negative or recovery test;
3. the exact integration test that crosses the changed boundary;
4. visible exercise of the result, or an explicitly approved internal evidence package when the state cannot reasonably be judged in the interface.

Select existing tests by the source owner, changed behavior, and boundary they actually exercise. If no integration test crosses the changed boundary, add the smallest regression test that proves that handoff when the test is part of the authorized implementation and the repository has a suitable harness. If a meaningful automated test cannot be created without a materially different mechanism or unavailable system, do not substitute an unrelated suite: report the gap, use the approved internal or live evidence available for that boundary, and ask only if the missing mechanism materially changes the requested work.

For persistence, also prove the intended write, read-back, failure behavior, identity, and ownership. For timing, retry, stale state, concurrency, shared feature state, or partial failure, add only the matching safeguard and one distinct-risk review when material.

A full repository suite is not automatic. It is permitted only when source inspection shows that the changed exposure cannot be bounded or when a separate delivery or certification trigger requires it. **Unbounded exposure** means the current source does not allow the agent to name a finite set of affected consumers, decision boundaries, and focused or integration tests. A shared source with many known consumers, a large diff, unfamiliar code, or a failed focused test is not unbounded. State the exact missing boundary knowledge before running the suite.

### 3.4 Documentation, records, and stop

Update stable behavior or architecture documentation when its lasting facts changed. Apply Issue, Current Work, accepted history, and archive rules independently; Connected scope alone creates none of them.

Stop when positive, negative, integration, and any specifically triggered live, internal, visible, or review evidence agree; changed stable facts are current; evidence limits are stated; and any required continuity or operational record is accurate. Do not continue into optional cleanup or adjacent improvements.

### 3.5 Complete Connected operating package

The exact source, focused-test, integration, typecheck, and visible/internal evidence definitions are in [Sections 11.1 and 11.2](#111-before-validation). Review and diagnosis operations are defined in [Chapter 10](#10-subagents-research-and-independent-review). This package decides which are authorized for one Connected path.

| Required area | What the agent actually does |
|---|---|
| Planning and tracking | Declare the one complete trigger-to-result behavior, unchanged behavior, owners, crossed boundary, exact planned tests, safeguards, omissions, and stop. Current Work is used only when real continuity exists. |
| Source reading and tools | Use bounded `rg` search and source inspection to follow the actual trigger, handler, service or API, state, persistence owner when present, and final result. Read the exact focused and integration tests for that path. Do not audit unrelated capabilities. |
| Tests and checks | Name exact test files and test names. Run focused positive, important negative or recovery, and boundary-crossing integration tests through `npm run test:product -- <exact-test-files>` or `npm test -- <exact-test-files>` for Knowledge-bearing selections. Add `npx eslint <exact-paths>` or `npm run typecheck` only when the changed source or TypeScript boundary requires them. Exercise the route/state or use the approved internal evidence package. |
| Review, audits, and subagents | One independent review is allowed only for a named material risk such as timing, retry, partial failure, shared state, persistence, or handoff behavior. Use diagnosis only when uncertainty blocks the path trace. Do not create a generic review panel or broad audit. |
| Documentation and records | Update stable behavior or architecture facts that changed. Issues, Current Work, Accepted Updates, Changelog, and archives remain independently triggered; Connected scope alone creates none. |
| Evidence and human review | Report positive, negative, integration, and visible or internal evidence separately. Ask for human review only when the outcome is meaningfully visible or qualitative; invisible backend correctness closes through the approved evidence package. |
| Explicit omissions | Do not run unfiltered `npm test`, full Playwright, production build, Ship Check, Quality Scan, architecture refresh, security scan, Supabase/Lovable work, roleplay batches, or Knowledge certification unless their exact boundary or separate delivery/certification trigger applies. |
| Expansion | Unfiltered `npm test` is allowed only after declaring why the exposure cannot be bounded by a finite owner, consumer, and focused/integration set. Many known consumers, a large diff, unfamiliar code, or a failed focused test are not that reason. |
| Stop | Stop when focused positive, negative, integration, and specifically triggered evidence agree and changed stable facts and continuity records are current. |

### 3.6 Connected completion report

State the trigger-to-result path, boundary crossed, files changed, focused positive and negative checks, integration check, visible or internal evidence, any safeguard or review used, records created or correctly omitted, broader checks omitted, source state, and what remains unproved.

---

## 4. Multi-System Program Work

Use a Multi-System Program when one approved outcome requires several capability owners, several handoffs, or several user-meaningful results. Breadth comes from coordination, not sensitivity or file count. `[WM-PROGRAM-001]`

### 4.1 Establish the program

Record one approved versioned outcome, one coordinator, the affected authorities and systems, the invariants that must not regress, and the concrete acceptance method. Create Current Work because a real program needs continuity, not because the label itself demands paperwork.

Divide the work into named user-meaningful result slices. Each slice must state its owners, consumers, positive result, important negative or recovery result, integration boundary, safeguards, exact planned checks, and stop gate. Avoid a giant technical phase list whose items cannot be judged as product results.

### 4.2 Work one result at a time

For each result:

1. Recheck the current Resume Here point and source state.
2. Inspect only the authorities and delivery paths that result needs.
3. Implement the complete slice without overwriting unrelated concurrent work.
4. Run its declared focused positive and negative checks.
5. Prove integration across its real owners.
6. Use a separate reviewer only for a distinct material risk.
7. Update the one current summary and evidence limits.
8. Verify the slice gate. If the next slice is already authorized, continue to it; otherwise stop before beginning another result.

Do not run the full suite after every edit or every slice. After the slices have focused and integration proof, run a full suite once only if combined exposure is genuinely unbounded or a separate certification or delivery requirement calls for it.

### 4.3 Final integrated proof

Exercise the representative end-to-end result or use the approved internal evidence package for inaccessible backend behavior. Run only the applicable security, migration, rollback, Supabase, Knowledge, roleplay, or delivery checks. Compare the result with the approved outcome and invariants. Keep live facts open until the live system and accessible reference agree.

If unfinished, preserve one exact Resume Here point: latest completed result, stopping point, remaining authorized work, best evidence, uncertainty, blockers, next action, source state, reading order, and scope guard. If accepted, perform the triggered narrative closeout and archive through protected records.

### 4.4 Complete Multi-System operating package

The exact command catalogue and delivery/certification expansions are in [Chapter 11](#11-checks-delivery-and-reporting). Subagent, audit, diagnosis, research, and distinct-risk review operations are in [Chapter 10](#10-subagents-research-and-independent-review). This package decides which of those operations each program result actually needs.

| Required area | What the agent actually does |
|---|---|
| Planning and tracking | Maintain one versioned outcome, coordinator, Current Work record, invariants, acceptance method, user-meaningful results, and one Resume Here point. Do not create competing plans or coordinators. |
| Source reading and tools | For each result, inspect only its affected authorities, consumers, persistence boundaries, provider stages, live systems, and delivery paths. Use bounded searches and exact source traces; do not load unrelated capabilities or the complete historical dossier by habit. |
| Tests and checks | Before each result, name its exact positive, negative, and integration test files, test names, routes, gates, or live probes. Use the focused product or Knowledge-bearing runners that own those tests. After all results have integrated proof, run unfiltered `npm test` once only for a declared unbounded exposure or separate certification/delivery trigger. Use `npm run test:e2e`, build, Quality Scan, roleplay, Deno, Knowledge, security, migration, rollback, or live-system commands only when their exact safeguard or layer applies. |
| Review, audits, and subagents | Bounded subagents may own non-overlapping result slices. Assign one independent review per distinct material risk, not repeated generic reviews of the same patch. A full repository audit is not automatic. |
| Documentation and records | Keep the one Current Work record accurate. Update stable manuals for changed facts. Create Issues only for verified unresolved gaps, and complete narrative Changelog/archive closeout only after real acceptance. Use protected record operations for canonical records. |
| Evidence and human review | Keep implementation, real-path use, decision control, automated proof, live verification, and human acceptance separate. Use a representative playthrough or visible review when the result is experiential; use approved internal evidence for inaccessible backend behavior. |
| Explicit omissions | Do not rerun the full suite after each edit or result, launch a generic reviewer team, run every specialist command, certify unrelated Knowledge, or inspect all Chronicle systems. |
| Expansion | Add only the exact authority, result slice, safeguard, reviewer, check, live operation, or record shown necessary by current source. Ask only when the expansion changes product outcome, authority, live state, destructive scope, deployment, or another stated approval boundary. |
| Stop | If unfinished, preserve one exact Resume Here point. If accepted, complete only the triggered closeout. Stop when implementation, integrated evidence, limitations, live state where applicable, and records agree. |

### 4.5 Multi-System completion report

State the approved outcome, completed result slices, coordinator, affected authorities, integration evidence, specialist safeguards, distinct-risk reviews, full-suite or certification reason when used, live evidence, limitations, records, source state, and exact next point or accepted closeout. Do not claim that broad automated success proves every live or human outcome.

---

## 5. Expansion and Approval Rules

Expansion means adding work that was not in the initial declaration. The deciding question is whether a current source finding shows the extra work is necessary to produce the same requested outcome. `[WM-START-001] [WM-START-002]`

### 5.1 Expand automatically within the same outcome

Update the declaration, explain the concrete finding, and continue when the task needs:

- a newly discovered direct consumer;
- a broader base scope that still produces the same requested outcome;
- the relevant negative or recovery branch;
- one named risk safeguard;
- continuity across tasks or blockers;
- a bounded subagent or one distinct-risk reviewer;
- a broad check because the changed exposure is demonstrably unbounded;
- an operational record whose independent factual trigger now applies.

The update names the new rule, check, reviewer, or record and why it is required. It does not list every tool call.

### 5.2 Ask before changing authority or consequence

Stop and ask one specific question when the discovery would:

- change the requested product result or add an optional improvement;
- alter an unrelated capability;
- require a product choice the user has not made;
- mutate live data, permissions, authentication, deployment, or an external system outside the authorized request;
- delete, overwrite, bulk-change, or migrate material data without explicit authority and recovery;
- commit, push, publish, deploy, buy, or communicate externally when not already requested;
- replace an approved mechanism in a materially different way;
- resolve a genuinely new policy conflict that the approved manual cannot answer.

Explain the practical consequence of each available answer. Do not ask the user to approve ordinary technical evidence they cannot meaningfully judge.

### 5.3 Do not expand from proxies

The following facts are not expansion triggers by themselves: unfamiliar code, a large file, many files, many consumers with the same usage pattern, a long test collection, elapsed time, a failed command, a dirty repository, a powerful available skill, an agent's uncertainty, or a desire for maximum confidence.

If a check fails, determine whether it proves a defect in the requested path, an unrelated pre-existing failure, an environment restriction, stale evidence, or a broader shared exposure. Only the last kind of source-backed consequence changes the declared work.

### 5.4 Blockers and exact stopping

Exhaust safe in-scope checks and reasonable alternatives. Preserve the last verified state. Report a blocker when the required authority, input, live access, dependency, or decision cannot be obtained. Do not keep generating status-only updates, repeat the same failed command, or claim that incomplete work is accepted.

Stop when the selected scope's proof agrees with the requested result, triggered safeguards and records are current, evidence limits are stated, no new in-scope action remains, and delivery has either completed or was not requested. Do not continue merely because adjacent cleanup exists.

---

## 6. Risk Safeguards

A safeguard adds proof or protection for one concrete risk. It does not automatically add another base scope, a full suite, a project, or unrelated audits. `[WM-SAFE-001]`

### 6.0 Safeguard operator map

The base work package remains in force. Add only the row whose factual trigger exists, and fill every placeholder with the exact current path, test, gate, route, object, operation, or reviewer risk before execution.

| Triggered safeguard | Added operation or command | Evidence and limit | Not authorized |
|---|---|---|---|
| Shared presentation | Bounded `rg` consumer search, `git diff -- <exact-paths>`, focused shared-source lint/test when meaningful, and visible inspection of the requested surface plus one representative per materially different pattern. | Proves only the inspected patterns and selected source assertion. | Inspecting every identical instance, full suite, or program-level review. |
| Persistent data | Exact focused write/read-back/failure/identity/ownership tests through `npm run test:product -- <exact-test-files>` or `npm test -- <exact-test-files>` when Knowledge-bearing; add an approved live probe only when the claim depends on live state. | Proves the selected persistence boundary and named identities; local tests do not prove live policy. | Unrelated schema audit, private-row inspection, or migration without its own trigger and approval. |
| Timing, retry, concurrency, stale state, or partial failure | Exact failure/recovery test file and test name, state-transition inspection, and one independent review for the named risk when material. | Proves the exercised timing or recovery behavior, not unrelated async paths. | Generic reviewer teams or a full suite without a separate reason. |
| Authentication, privacy, permissions, security, or storage | Name actors, protected data, enforcement point, allowed and forbidden probes; invoke only the specifically applicable security mechanics. Use Lovable/live inspection only when live evidence is required. | Proves only the named boundary and probe. | Generic repository security scan, private-data browsing, or live mutation outside approval. |
| Destructive, bulk, or migration work | Read-only target resolution, explicit authorization, exact backup/rollback/abort plan, rehearsal or protected transaction, then exact result and recovery verification. | Proves the named operation and recovery path at the observed source state. | Unresolved targets, unsafe recursive scope, or unapproved live mutation. |
| Live Supabase or Lovable | Controlled Lovable handoff naming exact tables, policies, functions, storage, auth, or Edge Functions plus repository and live validation. | Live probe proves only the named deployed fact at that time; synchronized local references alone do not prove live state. | Lovable for ordinary repository code or documentation. |
| Roleplay or LLM | Name affected pipeline stages, exact deterministic tests or registered `validation:gate` ID, artifact check when relevant, and representative integrated or human-quality review for experiential changes. | Proves the selected stages and scenarios; fixtures do not prove all roleplay quality. | Loading the entire historical dossier, running every gate, or tuning permanent rules to one story. |
| Chronicle Knowledge or workflow infrastructure | Run only the affected Knowledge contract tests and the applicable `knowledge:check`, `knowledge:operational:check`, or `knowledge:work-manual:check`; use protected `knowledge:records` operations for canonical records. | Proves only the named structural, authority, or record contract. | Treating ordinary capability prose as infrastructure or certifying unrelated product behavior. |

### 6.1 Shared presentation source

Use bounded search to identify consumer categories. Inspect the requested surface and one representative of each materially different rendering, state, or layout pattern. Run the focused shared-source check. Do not inspect every instance. Reclassify only if another behavior or capability contract actually changes.

### 6.2 Persistent user or public data

Prove the intended write, read-back, failure behavior, record identity, and ownership. Confirm that a user cannot write or read another user's data unless that access is explicitly intended. This safeguard does not create a project or archive for one bounded change.

### 6.3 Timing, concurrency, retry, stale state, and partial failure

Add the exact failure or recovery test and inspect state transitions before, during, and after the risk. When timing or shared state is material, assign one reviewer to that named risk. Do not add several generic reviewers or a full suite without a separate reason.

### 6.4 Authentication, privacy, permissions, security, and storage

Name the protected data, actor identities, trust boundary, allowed action, forbidden action, and enforcement point. Use source and live evidence appropriate to the claim. Private raw evidence stays outside Git and public builds unless the user explicitly authorizes a necessary, protected location. Sanitize public fixtures. Do not inspect private row content unless the user explicitly authorizes it and it is necessary. `[WM-SAFE-002]`

Changes that loosen access, alter authentication, touch private data, change billing, or reach broad schema areas require explicit approval before live execution. A generic security audit is not a substitute for the named data and permission boundary.

### 6.5 Destructive, irreversible, bulk, and migration work

Resolve the exact targets with read-only checks. Obtain explicit authorization. Define backup, rollback, validation, and abort behavior before mutation. Use a recoverable transaction or rehearsal appropriate to the operation. Never use a broad unresolved path, unsafe recursive target, or destructive command whose scope depends on an unverified variable. Afterward, state exactly what changed, what can be recovered, and what remains at risk.

### 6.6 Live Supabase or inaccessible live facts

Local code, migrations, generated types, and synchronized references do not prove the inaccessible live project. When the conclusion or mutation depends on live tables, columns, RLS, functions, triggers, storage, authentication, or deployed Edge Functions, use the controlled Lovable handoff in Chapter 9. Keep the claim open until the live result and accessible synchronized reference are verified. This safeguard does not make Lovable the normal coding environment.

### 6.7 Roleplay or LLM behavior

Identify only the generation, context, state, memory, support-call, or post-turn stages actually affected. Use scenario-independent behavior contracts and representative integrated or human-quality review for those stages. Do not load the entire historical roleplay dossier or permanently tune instructions around one test story. See Chapter 9.

### 6.8 Chronicle Knowledge or workflow infrastructure

Add only the affected contract, compatibility, recovery, authority, and source-derivation checks. A capability-manual wording or factual update is not infrastructure work merely because it appears in the Knowledge Base. Infrastructure begins when the change alters shared record contracts, registries, loaders, validators, protected writes, renderers, authority, or migration mechanisms.

### 6.9 Continuity and delivery are separate

Work that crosses tasks, agents, blockers, or an external decision may need Current Work and coordinator discipline, but technical scope stays based on the product consequence. A later request to commit, push, build, or deploy adds delivery checks after change validation; it does not reclassify the underlying change.

---

## 7. Evidence and Human Review

Evidence is useful only when the claim and source state are named. `[WM-EVIDENCE-003] [WM-EVIDENCE-004]`

### 7.1 What each kind of evidence means

| Claim | Appropriate evidence | It does not prove |
|---|---|---|
| A plan exists | Approved written outcome and scope | Code exists or behavior changed |
| Implementation is present | Current-source inspection and diff | The real product path uses it |
| The real path uses it | Trace or integration evidence across actual owners | Every state produces the intended experience |
| A decision is controlled | Positive and negative proof at the enforcement point | The full user experience is acceptable |
| A focused test passes | Named assertion against a named source state | Unwritten requirements or unrelated regressions |
| A full suite passes | Every currently collected automated assertion in that command passed | Live deployment, untested states, or human quality |
| A build passes | The source compiled and bundled under that build command | The deployed product changed or works in every state |
| A browser state was observed | The exercised route, state, and width appeared and operated as recorded | Every user, device, backend branch, or persistence result |
| A synchronized Supabase reference contains a fact | The last documented mirror contains it | The inaccessible live project still matches it |
| A live-system check passes | The named deployed object or behavior matched the probe at that time | Unchecked live objects or future state |
| An independent review passes | No remaining issue was found within the named risk and evidence | Guaranteed correctness or unrelated risks |
| The user accepts a visible result | The reviewed experience met the user's expectation | Invisible internal correctness or inaccessible live facts |

### 7.2 Visible and human review

Require user or human review only when the outcome is visible, experiential, qualitative, or otherwise meaningful for that person to judge. Give the reviewer the exact URL or other review surface, actions to perform, expected result, result that must not occur, and one focused acceptance question. Name the exact route, control, state, device or width, conversation, or output exercised and its limits. Do not ask a non-programmer to inspect backend code or approve internal correctness. `[WM-EVIDENCE-001]`

When a backend or inaccessible state cannot reasonably be judged in the interface, use an explicitly approved internal evidence package: source trace, focused positive and negative checks, integration evidence, live probes when required, source identity, and limitations. Passing that package is evidence-based completion, not visual acceptance. `[WM-EVIDENCE-002]`

### 7.3 Regression proof

When a new regression test is the key proof of a bug fix, show that it passes with the fix. When practical and safe, temporarily remove or disable only the fix in an isolated state, require the test to fail for the expected reason, restore the exact fix, and require the test to pass again. Do not disturb unrelated dirty work to manufacture a red-green demonstration.

### 7.4 Completion language

Lead with the practical result. Then state what changed, the actual path or source used, exact checks and results, visible or live observations, evidence limits, records, delivery state, and next action. Separate these claims: planned, implemented, wired into the real path, controlled at the decision point, automatically checked, live-verified, human-reviewed, accepted, delivered, and deployed.

Never say “done” solely because a file exists, a page renders, an agent approved a diff, or many tests passed. Never turn an unverified inference into a fact. If acceptance or deployment is still pending, say so plainly.

---

## 8. Records and Continuity

Records answer different questions. Base scope never creates a record by itself. `[WM-EVIDENCE-004]`

### 8.1 Stable manuals

Update a stable capability manual when approved behavior, visible-control meaning, failure behavior, ownership, handoff, current architecture, or verified Supabase guidance changed. Do not store temporary status, active attempts, or unresolved findings there. Source-check and proofread the affected facts. Validate only the relevant manual, loader, renderer, or linked contract.

### 8.2 Issues

Create an Issue only when a verified gap between required and current behavior remains unresolved, requires follow-up beyond the bounded task, or must survive another task or decision. Record required behavior, current problem, why it matters, supporting evidence, what that evidence establishes, and what remains unverified. A defect found and fully resolved inside one bounded task creates no Issue. Do not create speculative placeholders or use Issues as project checklists. `[WM-RECORDS-001]`

When an audit or investigation produces findings, classify each finding exactly once before deciding whether it belongs in an Issue:

- **Implementation fact:** current source or observation establishes a narrow fact, but no mismatch is proven.
- **Verified discrepancy:** approved required behavior and current delivered behavior are both established and conflict.
- **Candidate needing evidence:** one side of the comparison or the complete delivery path remains unverified.
- **Unresolved product decision:** intended behavior is not approved clearly enough to judge the implementation.
- **Unknown:** required evidence is unavailable, inaccessible, stale, or contradictory.

Only a verified discrepancy can satisfy the Issue threshold, and it must still meet the persistence or follow-up trigger above. A recommendation, code smell, incomplete test, historical note, unusual implementation, candidate, decision, or unknown is not promoted into an Issue without the missing comparison and evidence.

### 8.3 Current Work and Resume Here

Create Current Work only for genuine continuity across tasks, agents, blockers, or external decisions. It owns one active objective, versioned success contract, one coordinator, bounded steps, evidence, append-only decisions, and one editable Resume Here summary. Unfamiliarity, technical sensitivity, or one delegated subtask is not enough. `[WM-RECORDS-002]`

Resume Here must tell a fresh reader: latest completed result, where work stopped, remaining authorized work, exact next action, best evidence, uncertainty, blocker and unblock condition, external decision, current source state, reading order, and scope guard. Preserve one exact next action; do not make the reader reconstruct it from old logs.

Keep exactly one editable Resume Here summary. Do not add duplicate project summaries, handoff summaries, global Current Projects lists, separate Markdown trackers, copied full records, dashboards, progress percentages, completion bars, temporary status inside stable manuals, or automatic completion inferred from steps or tests. Preserve failed and superseded routes. Append a typed history entry only when understanding, a decision, source, implementation, proof, blocker, coordinator, plan, or next action materially changes; routine rereading and unchanged command runs do not change last activity. Correct historical errors with an appended Correction instead of rewriting the original entry.

### 8.4 Handoff and coordinator transfer

A canonical Handoff is required only when responsibility for the active project formally transfers from one coordinator to another. It names sender, recipient, transferred source state, completed work, stopping point, remaining authorized work, evidence limits, blockers, next action, reading order, and scope guard. A temporary task message, subagent assignment, or status update is not a Handoff. There must never be two active coordinators. `[WM-RECORDS-003]`

### 8.5 Accepted Update without a project

Create a bounded Accepted Update only when durable functionality changed, the applicable acceptance method passed, no real Current Work project existed, and a concrete future-maintenance reason shows that source and tests alone would not explain why the change must be preserved. Visible or qualitative work uses meaningful human acceptance. Invisible backend work may use the approved evidence-based acceptance path. `[WM-RECORDS-004]`

Do not create accepted history for cosmetic or static presentation, incomplete attempts, checks without acceptance, or changes already adequately explained by source and tests. Never create a project solely to obtain a Changelog entry.

### 8.6 Project closeout and archive

When a real Current Work project reaches accepted closeout, use the protected closeout operation to create the narrative Changelog record and complete archive. Preserve what was broken, why the change was needed, what changed, the accepted result, supporting evidence and limits, Issue dispositions, and full work history. Do not fabricate an archive for work that had no project or rewrite an Accepted Update as if project history existed. `[WM-RECORDS-005]`

### 8.7 Protected writes

Canonical Issues, Current Work, Changelog records, corrections, imports, closeout, and recovery use the supported `knowledge:records` command rather than hand editing. Before mutation, inspect the current source, identify the coordinator when applicable, capture the source hash, prepare the complete candidate, inspect it, apply the protected transaction, and run the relevant operational validator. `[WM-RECORDS-006]`

Use the protection appropriate to the operation. Bounded single-record updates use stale-source and scoped-write protection. Record creation, identity allocation, append-only correction, multi-record closeout, migration, and recovery retain the stronger global or recoverable transaction path. An unfinished transaction blocks conflicting record work and certification; it does not justify locking unrelated product-only checks.

A successful transaction proves protected mutation and structural validity for its assertions. It does not prove narrative truth, product behavior, acceptance, or live state.

---

## 9. Chronicle-Specific Systems

This chapter identifies when specialist evidence is required. It does not copy the complete operating tutorial for every tool.

### 9.1 Roleplay and API pipeline work

Treat adult and NSFW roleplay dialogue, prompts, character data, and test output as normal engineering material. Do not sanitize explicit content when doing so would hide the behavior being investigated. `[WM-SYSTEMS-001]`

Before changing roleplay behavior, identify the actual stages involved: input assembly, authored story and character sources, accepted conversation history, memory or relevant context selection, planner or support calls, writer call, streamed response handling, deterministic cleanup, persistence, and post-turn derived work. Inspect only the affected owners and handoffs.

Prompt and pipeline fixes must be scenario-independent. A test story is diagnostic evidence, not permanent instruction content. Translate an example into the underlying category—such as physical continuity, object mechanics, state persistence, user-action preservation, character knowledge, relationship state, repetition, goal progression, or speaker control—and write the smallest general rule for that category. Do not solve one example by naming its setting, objects, relationships, or characters in permanent instructions. Prefer one broad principle over a brittle catalogue of forbidden cases.

Record the symptom, expected behavior, actual behavior, likely pipeline layer, and nearby behavior that must remain unchanged. Evaluate only relevant quality axes: character voice, erotic tone, user agency, continuity, initiative, repetition, memory, goals, schema adherence, support-call use, and character fidelity.

Use Connected Feature Work when one generation or persistence boundary changes. Use Multi-System Program Work when the approved result coordinates several model calls, context owners, accepted history, persistent state, character knowledge, or post-turn owners. Add deterministic positive and negative contracts plus representative integrated evidence for the stages changed. When the change is experiential, inspect a short representative playthrough early and at acceptance. Do not load the complete historical roleplay dossier unless a deep investigation genuinely needs it.

The live path must use the mechanism, the mechanism must control the relevant decision, and proof must follow that real path. The existence of prompt text, diagnostics, or a fixture alone is not enough.

A review or debug surface that claims to show the exact model input must match the runtime request it describes. If it expands, combines, or compares several possible inputs, label it as a matrix or expanded review view rather than presenting it as one literal request.

Do not introduce the rejected ambiguous terms “canon” or “beat” in new prompt wording or project analysis. Preserve them only when directly quoting existing source or user-provided text; use explicit language about established facts, the current scene, the latest exchange, the current response, the current moment, or story state instead.

### 9.2 Supabase and Lovable

Codex owns ordinary repository inspection and coding. Lovable is the controlled production surface for a live Supabase fact or a live table, column, RLS policy, function, trigger, storage, authentication, or Edge Function mutation that cannot be verified or performed safely from the repository. `[WM-SYSTEMS-002]`

Before a handoff:

1. Identify the exact live fact or mutation required and why repository evidence is insufficient.
2. Read the current synchronized Supabase reference and relevant repository source.
3. Name the affected objects, intended result, non-goals, privacy boundary, validation, rollback, reference update, and redeploy needs.
4. Obtain explicit user approval for live mutation, private-data access, destructive behavior, authentication or permission changes, billing, or broad schema work not already authorized.
5. Draft the complete handoff outside Lovable. Use Lovable planning for database, RLS, storage, Edge Function, security, privacy, schema, migration, and deployment work; do not accept a vague fix-all plan.

During and after the handoff, wait for the real response, compare its plan and GitHub diff with the approved scope, correct mismatches, inspect only authorized data, and run the applicable repository and live checks. For RLS or storage, require concrete policy, access-probe, bucket, signed-URL, or linter evidence where available. For Edge Functions, identify exactly which functions changed and verify their deployment or logs. Refresh migrations, generated types, synchronized references, documentation, and tests when their facts changed.

Keep live closure open until both the deployed result and accessible reference are verified. A GitHub push does not deploy Supabase Edge Functions. A local migration or generated type does not prove live application. Lovable is not an autopilot and is not invoked for ordinary code or documentation work.

### 9.3 Authentication, security, privacy, and destructive operations

Use the exact safeguards in Chapter 6. Define actors, protected data, trust boundaries, enforcement, rollback, and live evidence. Security work is as broad as its real boundary—not automatically a repository-wide audit. Use a specialized security workflow only for the named scan, threat, finding, fix, or validation task it is built to perform. Do not convert one permission change into unrelated product testing.

### 9.4 Knowledge and manual maintenance

Stable capability content lives under `docs/architecture-knowledge/`; operational records live under `docs/current-work/` and `docs/architecture-knowledge/changelog/` according to their current registries. Verify exact locations before changing them. `[WM-SYSTEMS-003]`

For a capability manual, inspect the actual capability and relevant source owner, update the affected facts, check manifest/loader/renderer integration when applicable, proofread, and run only the focused Knowledge checks that cover those sources. Do not repair runtime issues discovered during documentation work; record a verified unresolved gap only when the Issue trigger applies.

Knowledge infrastructure work begins only when shared contracts, registries, route policy, source derivation, protected records, transactions, validation, rendering, migration, recovery, or instruction authority changes. It requires its named compatibility, recovery, and authority safeguards. Ordinary documentation does not.

### 9.5 Research and Development prototypes

When a task names Chronicle Research & Development, R&D, or a registered prototype, first read `src/components/admin/research-development/README.md`. Use the shared R&D shell and registry. Treat every displayed file as a prototype, not evidence of implemented Chronicle behavior. Do not recreate the shell or substitute a standalone HTML mockup for a registered prototype. `[WM-SYSTEMS-004]`

R&D isolation does not make a prototype disposable. Production adoption, replacement, cleanup, or a production rewrite never authorizes prototype retirement or deletion by inference. Preserve the prototype unless the user directly names that lifecycle change. Production must not import or depend on prototype code or state, and a reference prototype may coexist with its production implementation.

### 9.6 Historical HTML, dashboards, and audits

Historical HTML, mockups, audits, podcast-derived notes, and old recommendation documents may explain why a decision was made. They do not control current work unless the current manual expressly incorporates the decision. Verify any current claim against its owner. Do not load these sources during routine work merely because they exist.

### 9.7 Private repository map and canonical history

The repository map has one pinned Graphify input, one Chronicle-owned normalized contract, one private per-worktree artifact, and one shared Knowledge renderer. The browser and command tools must refuse stale graph data. No graph artifact belongs in a public bundle, and no map process may read secrets, arbitrary home-directory content, live Supabase data, or files outside the allowlisted repository corpus.

Start with `WM-GRAPH-STATUS` only when the selected work has a concrete map question. A `ready-current` result allows one bounded `WM-GRAPH-QUERY`, `WM-GRAPH-PATH`, or `WM-GRAPH-EXPLAIN` operation. Open and inspect the actual source behind the result before relying on it. Structural edges and clusters show extracted relationships; they do not prove product ownership, behavior, runtime order, accessibility, permissions, live Supabase state, acceptance, or historical causation.

Use `WM-GRAPH-UPDATE` only when the current task needs the map, the status is stale or unavailable because relevant allowlisted source or capability-lens policy changed, and the authorized scope includes regenerating the private artifact. Regeneration is not an automatic after-edit step. It must not create a new skill, hook, watcher, memory store, MCP service, public artifact, or workflow authority. If regeneration is unnecessary or fails, continue from canonical manuals and current source and state that the map was omitted.

`WM-GRAPH-HISTORY` reads the canonical repository-owned Changelog directly; it does not read Graphify memory or infer history from Git. Use it only to locate recorded prior changes, affected capabilities, Issue dispositions, provenance, corrections, or recorded source paths. Then open the canonical Changelog record or archived Current Work link for the complete authority. An empty result means no matching recorded history was found; it does not prove that no work occurred.

---

## 10. Subagents, Research, and Independent Review

### 10.1 Delegation decision

`WM-SUBAGENT-BOUNDED` is authorized only when bounded parallel help materially improves speed or quality. Use subagents for broad audits, distinct source investigations, independent verification, or separable implementation slices. Do not use them for a tiny one-file fix, a quick command check, urgent blocking work the coordinator must understand directly, or work that cannot begin until the user answers a material question. `[WM-AGENTS-001]`

Every assignment states the goal, product context, exact files or systems when known, success condition, validation, non-goals, ownership boundary, instruction not to revert unrelated edits, and required report with changed files and evidence. For audits, require file paths and line evidence. A worker reports out-of-scope findings instead of fixing them.

For a requirement or plan review, the coordinator gives the worker access to the raw supplied artifacts, stable source IDs, and every material user amendment. The worker reconstructs the requested outcome, preservation rules, exclusions, placement, and acceptance conditions from that packet before comparing a proposed plan. The general mechanics and re-reading rules remain in `SUBAGENTS.md`; the detailed planning protocol remains in `requirements-fidelity-planning`.

The main coordinator reviews the worker's evidence and diff, reconciles it with the user's scope, and runs current validation before integrating or claiming completion. Parallel agents must not edit the same file or compete for the same lock. Delegation does not transfer canonical coordinator ownership unless a formal Handoff records that transfer.

When the user asks to coordinate existing persistent Codex tasks, resolve exact task identity before messaging. Reuse the named existing task. Create a new user-visible task only when the user explicitly asks for one. Send bounded context, wait without flooding the conversation, and do not treat a task's status report as final proof without review.

Coordination conflicts are based on overlapping mutation, not shared context. Before editing, a task identifies the exact files, hunks when practical, canonical record identities, or protected record scopes it intends to change. Read-only inspection, document compilation, research, testing that does not mutate the same source, work in another project, work on different files, and a dirty working tree do not conflict and continue normally. The fact that two tasks mention Chronicle, use the same repository, or touch the same capability is not enough to stop either task.

There is no automatic lock claim for ordinary files. If a later task is about to mutate an exact file, hunk, record, or protected scope already owned by an active writer, the earlier active writer keeps priority. Pause only the later task's conflicting mutation. Send one targeted wait notice only to that later conflicting task, naming the overlapping owner, exact path or record scope, and the condition for retry. Do not broadcast lock, pause, release, or unlock messages to other tasks. Releasing the overlap is silent; a coordinator may send one deliberate resume message only to the specific task that was actually paused for that overlap. A protected command may still enforce its documented record or transaction lock, but that lock does not become a repository-wide task pause.

### 10.2 Independent review

`WM-REVIEW-INDEPENDENT` is a fresh challenge to one named material risk, not a ceremonial second opinion. Assign one reviewer per distinct risk—such as timing, persistence, shared state, handoff, security, live data, destructive recovery, instruction authority, or experiential roleplay behavior. Give the reviewer the approved outcome, scope, source state, diff or artifact, evidence, exclusions, and questions to answer. `[WM-AGENTS-002]`

Do not repeat generic audits of the same patch for the same reason. Correct material findings, then rerun the affected checks on current source. A passing review proves only that the reviewer found no remaining issue within the assigned scope.

### 10.3 Audit, diagnosis, and research

`WM-AUDIT-BOUNDED` is a read-only comparison of a bounded subject against its approved requirements and current delivery path. By default, inspect only the requested capability or boundary, trace the delivered behavior, classify the findings using [Section 8.2](#82-issues), and return evidence-backed conclusions or proposals. Do not change product code, schema, stable manuals, or canonical records unless the user separately authorizes implementation or a record update. A broad repository audit, full test suite, or generic review panel is not automatic; each requires its own concrete exposure or certification trigger. `[WM-AGENTS-003]`

`WM-DIAGNOSE-BOUNDED` uses proportional diagnosis only when uncertainty blocks the next conclusion: reproduce, minimize, form competing hypotheses, inspect or instrument the relevant owner, test the hypotheses, and state the supported cause and remaining uncertainty. Do not invoke the full diagnosis mechanics merely because the user reported a bug, and do not implement a fix when the user asked only for diagnosis. `[WM-AGENTS-003]`

`WM-RESEARCH-BOUNDED` uses deeper research only when the task explicitly asks for research, current external facts are required, or a demonstrated gap lacks an adequate architecture. Do not invoke the research workflow merely because a task uses words such as investigate, compare, or find. Define the question, evidence standard, sources, and stop condition first. Prefer primary technical sources and current official documentation. Compare research with approved Chronicle contracts and current implementation; say what exists, why it is insufficient, what would replace or complete it, and where it connects.

Research is read-only. Do not edit application code, prompts, database schema, migrations, tests, stable manuals, or canonical records unless the user explicitly changes the scope to implementation or separately authorizes the applicable record update. Before a substantive investigation, state the exact question, in-scope and out-of-scope areas, supplied artifacts, evidence that would change the answer, and assumptions caused by missing context. Keep that declaration brief for a bounded question.

Build the local Chronicle map before browsing. Use external research only for the gap the local map exposes, prioritizing official provider sources, then primary papers and reproducible work, then clearly labeled practitioner reports. Record useful and rejected sources and their credibility limits. A substantive report leads with the practical answer, then explains the method, unavailable evidence, local and external findings, confidence, competing explanations, controlled experiments, risky paths to avoid, and open questions. Prefer a one-variable controlled experiment over a large prompt, model, or architecture rewrite.

A dossier, research matrix, web survey, multi-agent critique, or long written report is optional evidence, not a default workflow for clear fixes or document edits.

### 10.4 Mechanics references are not workflow authority

This manual owns the trigger, scope, evidence, and stop. The following sources may supply operating technique only after a manual rule invokes them:

| Need already triggered by this manual | Mechanics source |
|---|---|
| Inspect an actual browser route, state, or responsive width | `browser:control-in-app-browser` |
| Perform an approved live Supabase or Lovable handoff | `lovable-controlled-handoff` |
| Run a disciplined bug diagnosis | `diagnose` |
| Conduct an approved research assignment | `research-workflow` or the applicable technical research skill |
| Preserve and trace requirement-heavy supplied material before planning | `requirements-fidelity-planning` |
| Run one distinct-risk adversarial review | `critical-patch-review` |
| Coordinate bounded subagents | `/Users/thomashall/.codex/SUBAGENTS.md` for mechanics and platform constraints |
| Use a registered R&D prototype | `src/components/admin/research-development/README.md` |
| Apply a named security technique | Only the specifically applicable `codex-security` skill for that named scan, threat, finding, fix, or validation task |
| Operate protected Knowledge records | `scripts/knowledge-records.ts` and its request/transaction contracts |
| Inspect the Quality Scan implementation | `scripts/run-quality-hub-scan.mjs`; do not rely on the stale playbook as command authority |
| Create a requested standalone HTML artifact | `codex-html-document`; the artifact does not become Chronicle authority |

The retired Chronicle pre-push and Chronicle research skills must not remain separate workflow authorities after cutover. The thin Chronicle onboarding skill points only to Start Here.

---

## 11. Checks, Delivery, and Reporting

Checks are selected by the changed boundary and separate delivery request. The executable command owner is the current `package.json` or named script; if it differs from this reviewed draft, stop and correct the draft before relying on the command. `[WM-CHECKS-001] [WM-CHECKS-003]`

### 11.1 Before validation

State the check or operation ID below, exact command or operation, exact selected paths, test files and test names or pattern, route/state, gate ID, live object, record operation, or reviewer risk as applicable; why it is authorized; when it will run; what it is expected to prove; what it cannot prove; and which broader checks are omitted. Routine work keeps this in the short declaration. An undeclared full suite, audit, review, certification, live operation, or record mutation cannot be added silently.

For long-running or broad commands, report the command, the currently active suite or test when available, why the collection applies, and what the count means. “Hundreds of checks passed” is incomplete without the command, trigger, failures or skips, and proof limits. Do not narrate every search or tool call.

### 11.2 Repository and focused checks

Run commands from `/Users/thomashall/Documents/New project/Chronicle-main` unless the command says otherwise.

| Check ID | Operation | Exact command or operation | Use and boundary |
|---|---|---|---|
| `WM-SOURCE-OWNER` | Locate the owner | `rg -n -- "<exact-label-symbol-route-or-field>" <bounded-paths>` | Finds candidate ownership in the named area. Follow direct imports, handlers, or callers only until the real decision owner is established; search results do not prove ownership. |
| `WM-SOURCE-CONSUMERS` | Group direct consumers | `rg -n -- "<owner-symbol-or-import>" <bounded-paths>` | Identifies real consumer patterns for a shared owner. Inspect representative materially different patterns, not every identical match. |
| `WM-REPO-STATE` | Inspect repository state | `git status --short` and `git diff --stat` | Identify current task files and unrelated work before editing or delivery. These commands do not validate behavior. |
| `WM-DIFF-OWNED` | Inspect owned changes | `git diff -- <exact-paths>` | Review only current-task paths or hunks. |
| `WM-DIFF-CHECK` | Whitespace/diff hygiene | `git diff --check` | Finds whitespace errors in the diff; does not test behavior. |
| `WM-VISIBLE-DEV` | Local app for visible inspection | `npm run dev` | Starts the Vite development server only when an existing Chronicle localhost is not already available. Use the browser mechanics to inspect the exact route, state, and width. Opening a page proves only the state exercised. |
| `WM-VISIBLE-PREVIEW` | Preview an existing build | `npm run preview` | Runs `vite preview` against an already built output. It does not rebuild, prove build freshness, deploy, or validate behavior. |
| `WM-LINT-FOCUSED` | Targeted lint | `npx eslint <exact-paths>` | Use for changed lint-covered source when full lint is not otherwise required; it proves lint only for selected paths. |
| `WM-TYPECHECK` | Type checking | `npm run typecheck` | Runs `tsc -b`. Use when the changed TypeScript contract or separate delivery layer makes repository compilation relevant. It is independent of Knowledge records and proves only TypeScript compilation assertions. |
| `WM-TEST-PRODUCT` | Product-only focused tests | `npm run test:product -- <exact-test-files> [-t "<exact-test-name-or-pattern>"]` | Preferred for explicit product test files. Name the files and tests before running. The runner fails closed if the selection or import graph can reach Knowledge sources. No Knowledge certification lease is used. |
| `WM-TEST-KNOWLEDGE` | Focused Knowledge-bearing tests | `npm test -- <exact-test-files> [-t "<exact-test-name-or-pattern>"]` | Use only when selected tests import Knowledge sources. Name the files and tests before running. The package script acquires the Knowledge certification lease. |
| `WM-INVENTORY-VITEST` | List the complete current Vitest collection without running it | `npx vitest list --json` | Required before a proposed unfiltered `npm test` so the source snapshot, complete collected files and test names, and expected collection size are visible. Collection does not prove any test passes. Preserve or present the inventory when the user needs to inspect what a broad count contains. |
| `WM-TEST-FULL` | Complete Vitest suite | `npm test` | Use only for declared unbounded exposure or a separate certification/delivery trigger. It runs every test returned by `WM-INVENTORY-VITEST` under the Knowledge lease. Report pass, fail, and skip counts against that inventory. A throttle may add justified runner flags, but those flags are not the canonical command. |
| `WM-INVENTORY-E2E` | List the current Playwright collection without running it | `npx playwright test --list` | Required before a proposed full browser collection so every included file and test name is visible. Listing does not prove browser behavior. |
| `WM-TEST-E2E` | Browser tests | `npm run test:e2e -- <exact-spec-files-or-grep-when-supported>` | Use a focused selection for the affected route or state. An unfiltered collection requires its own declared browser-certification reason and the `WM-INVENTORY-E2E` list. It runs under the Knowledge lease. |
| `WM-BUILD` | Production build | `npm run build` | npm first runs `prebuild`, which executes `node scripts/generate-roleplay-artifact-identity.mjs` and may rewrite the two generated roleplay identity files; it then runs `vite build` under the Knowledge lease. Inspect generated changes. A pass proves generation and bundling, not deployment or behavior. |
| `WM-GRAPH-TOOLCHAIN-SETUP` | Recreate the private Graphify environment | `npm run graph:toolchain:setup` | Specialist setup only when the private Graphify environment is absent or intentionally being rebuilt. Requires the exact `uv 0.12.7`, performs a frozen sync from the checked-in lock, and then verifies the complete installed dependency environment. It is not a normal application dependency install or consumer-task check. |
| `WM-GRAPH-STATUS` | Check private map freshness | `npm run graph:status` | Use only after a concrete map question is declared. Reports `ready-current`, `ready-stale`, `refreshing`, `unavailable`, or `error`, plus freshness reasons and counts. It does not validate graph meaning or product behavior. |
| `WM-GRAPH-QUERY` | Search the current map | `npm run graph:query -- <literal>` | Use one bounded literal after `WM-GRAPH-STATUS` reports `ready-current`. Returns matching private graph nodes and relationships; open the actual source before relying on them. |
| `WM-GRAPH-PATH` | Trace a candidate structural path | `npm run graph:path -- --from <node-id> --to <node-id>` | Use when the declared question requires a candidate path between two known node IDs. A returned path is structural evidence only, not proof of runtime sequence or ownership. |
| `WM-GRAPH-EXPLAIN` | Explain one map node | `npm run graph:explain -- <node-id>` | Use for one known node ID to inspect its recorded source and relationships. It does not replace reading that source. |
| `WM-GRAPH-UPDATE` | Regenerate the private map | `npm run graph:update` | Use only when the task needs the map, relevant allowlisted source or lens policy changed, and the authorized scope includes regeneration. The command uses the pinned toolchain, exclusive graph lock, last-good publication, and recovery custody. It is not an automatic check after edits. |
| `WM-GRAPH-HISTORY` | Query canonical recorded history | `npm run graph:history -- [--capability <capability-id>] [--source <repository-path>] [<literal>] [--limit <1-50>]` | Supply at least one capability, source path, or literal. Reads only canonical Changelog records and preserves their provenance and verification limits. It does not infer unrecorded history from Git or Graphify memory. |
| `WM-GRAPH-CHECK` | Validate graph infrastructure | `npm run graph:check` | Use when the graph pipeline, contract, lenses, historian, shared renderer, or local middleware changed. It runs the declared focused graph test collection; it is not a product-wide suite or a normal consumer-task check. |

The Knowledge certification lease keeps Knowledge-bearing readers on one stable source set. It is not the exclusive writer lock used for canonical record mutation. Independent product-only tests, typecheck, lint, and roleplay artifact checks must not acquire the Knowledge lease merely for uniformity.

### 11.3 Knowledge commands and protected records

| Check ID | Purpose | Exact command | Trigger and proof limit |
|---|---|---|---|
| `WM-KNOWLEDGE-STRUCTURE` | Knowledge manual/manifest structure | `npm run knowledge:check` | Use when canonical Knowledge documents or their application wiring changed. Runs under the Knowledge lease. |
| `WM-KNOWLEDGE-RECORDS` | Operational records | `npm run knowledge:operational:check` | Use when Issues, Current Work, evidence relationships, Changelog, or archives changed. Structural proof only. |
| `WM-KNOWLEDGE-AUTHORITY` | Canonical Work Manual authority | `npm run knowledge:work-manual:check` | Use when the canonical Work Manual, its Knowledge delivery surface, or an active onboarding pointer changes. It validates the active manual contract and thin pointers under the Knowledge lease; it does not prove product behavior or final human acceptance. |
| `WM-ARCHITECTURE-REFRESH` | Architecture inventory refresh | `npm run architecture:refresh` | Use when generated App Architecture data must reflect source changes. It rewrites inventories under the Knowledge lease; do not run for ordinary CSS or prose. |
| `WM-RECORD-STATUS` | Record state | `npm run knowledge:records -- status` | Confirm locks, leases, recovery artifacts, blockers, and unfinished transactions before protected record work. |
| `WM-RECORD-PREPARE` | Prepare record mutation | `npm run knowledge:records -- prepare <operation> --request <absolute-request.json>` | Builds and validates a proposed record transaction without applying canonical bytes. The eight supported operations are `project-create`, `project-update`, `issue-create`, `issue-update`, `accepted-update`, `legacy-import`, `correction`, and `closeout`. |
| `WM-RECORD-APPLY` | Apply prepared mutation | `npm run knowledge:records -- apply --transaction <transaction-id>` | Rechecks source state, applies the protected transaction, and validates the result. |
| `WM-RECORD-RECOVER` | Recover interrupted mutation | `npm run knowledge:records -- recover --transaction <transaction-id>` | Restores the last known-good bytes for an unfinished transaction. Do not hand-repair the canonical records. |

Legacy Quality Hub migration commands are specialist mechanics, not a normal Work Manual path. Use them only when an approved legacy migration explicitly selects them, and follow their current executable contracts. Canonical import still uses the protected `legacy-import` record operation.

### 11.4 Roleplay validation commands

Use only when the changed roleplay stages or a named roleplay certification require them.

| Check ID | Purpose | Exact command | Boundary |
|---|---|---|---|
| `WM-ROLEPLAY-ARTIFACT-REFRESH` | Refresh roleplay artifact identity | `npm run artifacts:roleplay:refresh` | Regenerates identities from runtime, Edge Function, and migration sources; does not validate behavior. |
| `WM-ROLEPLAY-ARTIFACT-CHECK` | Check roleplay artifact identity | `npm run artifacts:roleplay:check` | Confirms checked-in identities match current roleplay sources. |
| `WM-ROLEPLAY-BATCH-0` | Fixture batch 0 | `npm run validation:roleplay:batch0` | Runs the registered batch-0 fixtures and writes the separate validation ledger. Before running, identify the current registered fixture set from `src/features/validation-evidence/roleplay-gates.ts`; do not summarize the batch only as a count. |
| `WM-ROLEPLAY-BATCH-1` | Fixture batch 1 | `npm run validation:roleplay:batch1` | Runs the registered batch-1 fixtures and writes the separate validation ledger. Before running, identify the current registered fixture set from `src/features/validation-evidence/roleplay-gates.ts`; do not summarize the batch only as a count. |
| `WM-ROLEPLAY-GATE` | Registered validation gate | `npm run validation:gate -- --gate <predefined-gate-id>` | Uses the registered gate catalogue under the Knowledge lease. Name the selected gate, its current registry definition, and trigger; do not run the catalogue generically. |
| `WM-ROLEPLAY-RECONCILE` | Reconcile roleplay evidence | `npm run validation:reconcile` | Reconciles the separate roleplay evidence stores. |
| `WM-ROLEPLAY-MANUAL` | Record approved manual review | `npm run validation:manual-review -- --gate <id> --outcome <approved\|rejected> --reviewer <name> --notes <text> [--evidence <reference>]` | Records a real completed manual review; never fabricate a receipt. |

When experiential behavior changed, automated fixtures do not replace the representative playthrough and human quality review appropriate to the affected stage.

### 11.5 Edge Function check

`WM-EDGE-DENO` applies when a changed boundary includes a Supabase Edge Function or its shared helper. Run Deno against each changed entry point because the normal ship check does not fully validate Deno imports:

`deno check --no-lock <changed-edge-function-or-helper.ts>`

If `deno` is not on the path, use the verified local binary:

`/Users/thomashall/.deno/bin/deno check --no-lock <changed-edge-function-or-helper.ts>`

Name every checked entry point. This check does not deploy the function or prove live behavior.

### 11.6 Delivery is a separate layer

Commit, push, publish, build, and deployment checks are added only when requested or already authorized. `[WM-DELIVERY-001]`

Before commit or push, run `WM-REPO-STATE`, `WM-DIFF-OWNED`, and `WM-DIFF-CHECK`. Run the change-validation checks first. Then `WM-DELIVERY-SHIP` runs:

`npm run ship-check`

The current script expansion is:

`npm run -s typecheck && npm run -s lint && npm run -s build`

Typecheck and lint run independently. When the nested `npm run -s build` starts, npm automatically runs `prebuild`, which executes `node scripts/generate-roleplay-artifact-identity.mjs` and can rewrite `src/generated/roleplay-artifact-identity.ts` and `supabase/functions/_shared/roleplay-artifact-manifests.ts`; the subsequent Vite build acquires the Knowledge lease. Inspect and classify any generated diff. `ship-check` is a delivery floor, not proof of the requested behavior. The configured `.githooks/pre-push` hook reruns `npm run -s ship-check`; do not bypass a failing hook.

Use the complete test suite only when the changed exposure is unbounded or another explicit certification trigger requires it. Use browser smoke on the exact affected route and state when the UI changed. Run Deno for changed Edge Functions. Run architecture refresh only when generated architecture data changed. After push, check `git status --short` and `git log --oneline -1`. If Edge Functions changed, arrange the separately authorized Lovable redeploy and verify the intended functions and logs.

### 11.7 System certification and Quality Scan

`WM-CERT-QUALITY` is not a normal change check. Run it only when Quality Hub or a named certification requires the aggregate result:

`npm run quality:scan`

It acquires one Knowledge lease and stops on the first failure while running, in order:

1. `npm run lint`;
2. `npm run typecheck`;
3. complete Vitest through `node_modules/vitest/vitest.mjs run`;
4. roleplay artifact generation through `scripts/generate-roleplay-artifact-identity.mjs`;
5. production build through Vite;
6. `npm audit --omit=dev`.

Passing Quality Scan means those commands passed on one source state. It does not prove deployment, live Supabase, untested product requirements, or human quality.

### 11.8 Dirty working tree and ownership

Preserve all user and concurrent work. Identify owned paths and hunks before editing. A dirty working tree by itself is not a conflict, a lock, or a reason to stop unrelated work. Determine conflict from the exact paths, hunks, canonical records, or protected scopes that another active writer is actually mutating. Do not use broad reset, checkout, clean, or deletion to obtain a tidy tree. Do not claim a mixed working tree wholesale. Delivery reports list the exact included files and identify unrelated changes that remain. For a claim about a dirty source state, capture the exact revision and relevant working-state identity rather than pretending the commit alone describes it. `[WM-CHECKS-002]`

### 11.9 Final report and stop

Lead with the result in plain English. State:

- selected base scope and any safeguard, continuity, delivery, or record trigger;
- source owner, real consumers, and actual path changed;
- exact files or records changed;
- exact commands and checks, why they were authorized, and their result;
- visible, live, internal, or human evidence and the state exercised;
- what the evidence proves and does not prove;
- deliberately omitted broader checks and why;
- delivery, deployment, and repository state;
- unresolved limits, blocker, exact next action, or confirmed stop.

If no decision is needed and an already authorized next action remains, continue. If the current gate is complete and the next phase requires separate authorization, stop and name that phase without beginning it.
