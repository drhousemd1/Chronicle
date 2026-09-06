---
record_type: issue
issue_id: CL-ISSUE-001
title: Character Library loading and edit failures can appear as valid local state
owner_capability: character-library
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/character-library/CL-ISSUE-001.md
---
# CL-ISSUE-001: Character Library loading and edit failures can appear as valid local state

## Expected Behavior

Character Library must distinguish loading, empty, stale, failed, saved, and unsaved states. Back and Cancel must restore the correct edit snapshot, and a selected profile must remain available while it is being edited even when search-visible fields change.

## Problem

### Current Behavior

Initial loading uses an empty-array timeout fallback and refresh or mutation failures are generally console-only, so empty or stale data can look current. Back clears selection without restoring the opening snapshot or removing an unsaved new profile. The editor receives the filtered library and resolves the selected ID inside it, so editing a search-matching value can make the selected profile disappear. A successful update does not re-sort the collection or visibly confirm durable state.

### Why This Is a Problem

The user can lose the editing surface, retain unsaved mutations in the grid, or interpret failed/stale data as a successful current library. Recovery then depends on a later refresh rather than an explicit state boundary.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/character-library.md` records these departures under **App Architecture → Current Implementation Limitations → Collection state and user feedback** and **Edit-session correctness**.
- `src/hooks/use-index-authenticated-data.ts` owns initial loading and refresh installation.
- `src/hooks/use-index-character-workspace.ts` owns selection, snapshots, Back, Cancel, create, update, and delete transitions.
- `src/pages/Index.tsx` selects the reusable-character workspace, and `src/features/character-builder/CharacterBuilderScreen.tsx` owns the filtered collection and selected editor presentation.

### What This Evidence Establishes

Current source establishes misleading neutral fallback and console-only branches plus edit-session paths that can retain or hide working changes. It does not establish production failure frequency.

### What Remains Unverified

Authenticated create, update, delete, and forced failure branches were not exercised against the deployed backend. Live Supabase enforcement and provider behavior remain unverified. No runtime repair is part of this record.
