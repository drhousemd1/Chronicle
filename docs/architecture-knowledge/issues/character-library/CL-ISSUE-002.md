---
record_type: issue
issue_id: CL-ISSUE-002
title: Character Library copy identity and avatar ownership are not durable
owner_capability: character-library
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/character-library/CL-ISSUE-002.md
---
# CL-ISSUE-002: Character Library copy identity and avatar ownership are not durable

## Expected Behavior

Copying a reusable character into a story must create a new story-owned identity. Copying a story character into the library must preserve an explicit durable relationship or remain clearly independent. Avatar removal and copied media must persist without retaining an inaccessible path or leaking destination ownership.

## Problem

### Current Behavior

Library-to-story import deep-clones the profile without assigning a new UUID, and the atomic story save refuses to update the existing scenario-less library row under a story. Story-to-library copy creates a new UUID, but its mapping is kept only in browser state, so reload permits another duplicate copy. Avatar deletion clears the presentation data but not `avatarPath`, which wins during serialization. Upload, My Images copy, and generation create private objects before the row save and have no cleanup transaction for abandonment, replacement, failed save, or profile deletion.

### Why This Is a Problem

The visible copy can fail to persist, repeated copies can diverge without a durable relationship, and private media can remain referenced or orphaned contrary to the intended ownership boundary.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/character-library.md` records these exact departures under **Copy and ownership handoffs** and **Media lifecycle, AI context, and accessibility**.
- `src/hooks/use-index-character-workspace.ts` owns both copy directions and avatar working state.
- `src/features/character-builder/CharacterBuilderScreen.tsx` owns avatar removal, upload, My Images selection, and field-level AI controls.
- `src/services/persistence/characters.ts` owns row serialization, including avatar-path precedence.
- `src/services/persistence/scenarios.ts` and the `save_scenario_atomic` repository path enforce story-child ownership.
- `src/services/persistence/library-copy.ts` owns My Images destination copying.

### What This Evidence Establishes

Current source proves the UUID collision, session-only reverse mapping, path-backed avatar-clear mismatch, and missing client cleanup transaction. The repository-defined atomic story boundary rejects reuse of the library row as a story child.

### What Remains Unverified

The deployed atomic function, storage policies, signed URL behavior, and authenticated copy mutations were not exercised live. The synchronized Supabase reference documents the intended boundary but is not proof of deployment. No runtime repair is part of this record.
