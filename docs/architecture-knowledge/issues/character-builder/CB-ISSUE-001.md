---
record_type: issue
issue_id: CB-ISSUE-001
title: Character Builder entry and edit actions do not preserve truthful save state
owner_capability: character-builder
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/character-builder/CB-ISSUE-001.md
---
# CB-ISSUE-001: Character Builder entry and edit actions do not preserve truthful save state

## Expected Behavior

Character Builder must enforce the correct authentication and entry mode, keep the selected profile stable while it is edited, distinguish loading/failure from empty data, and make Back, Cancel, Save, and Update preserve or discard the documented working snapshot deliberately.

## Problem

### Current Behavior

Story Builder can open the editor while signed out although persistence/media handlers then return without a visible authentication explanation. Reusable loading uses an empty fallback, and filtered selection can disappear after editing a search-matching field. Back bypasses Cancel restoration. After a successful reusable update, the old opening snapshot remains, so a later Cancel can restore stale pre-save data locally. Story-character Save starts a background draft save without awaiting or reporting it and can return a finalized story to draft. Required-field validation and consistent unsaved-change confirmation are not enforced at the editor boundary.

### Why This Is a Problem

The user can see an editor that cannot persist, lose or resurrect working values, or leave the editor believing a save completed when its durable result is unknown or changed the parent lifecycle.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/character-builder.md` records these departures under **Entry, loading, and collection feedback** and **Edit-session and persistence feedback**.
- `src/hooks/use-index-character-workspace.ts` owns selection, snapshots, create/update/Cancel, and both ownership modes.
- `src/features/character-builder/CharacterBuilderScreen.tsx` owns selected-profile and editor presentation.
- `src/hooks/use-index-scenario-persistence.ts` owns the background story draft save.
- `src/components/app-shell/AppShellTopBar.tsx` owns Back, Cancel, Save, and Update triggers.

### What This Evidence Establishes

Current source proves inconsistent signed-out entry, neutral loading fallback, selection and snapshot divergence, fire-and-forget story persistence, and missing editor-specific validation/confirmation boundaries.

### What Remains Unverified

Authenticated library/story saves and forced failure branches were not exercised against the deployed backend. Deployed RLS and parent-story draft results remain unverified beyond repository source. No runtime repair is part of this record.
