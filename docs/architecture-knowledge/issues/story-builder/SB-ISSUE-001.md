---
record_type: issue
issue_id: SB-ISSUE-001
title: Story Builder save and handoff state can diverge from authored working state
owner_capability: story-builder
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/story-builder/SB-ISSUE-001.md
---
# SB-ISSUE-001: Story Builder save and handoff state can diverge from authored working state

## Expected Behavior

Save Draft, Finalize, publication, and other Story Builder-owned authoring actions must preserve the complete authored story state or explain exactly what remains unsaved. Character imports must become independently identified story children, and publication must use the authored state the builder presents as current.

## Problem

### Current Behavior

Content themes persist outside `save_scenario_atomic`; new-story theme upserts can fail before the parent exists and ordinary save does not retry them. Character Library import preserves the reusable UUID, which the atomic story save refuses under the new story parent. Saving a story-owned character can mark a finalized source draft. Publish does not first save current working state and can publish stale backend content or fail for an unsaved story.

### Why This Is a Problem

The editor can show a complete story while the durable source, publication, or copied character represents different data. The author can therefore leave the builder believing the current state was accepted when the persisted source does not support that conclusion.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/story-builder.md` records these departures under **Content-theme persistence**, **Character copy identity**, **Reuse and play handoffs**, and **AI and publication feedback**.
- `src/hooks/use-index-scenario-persistence.ts` owns draft/final save, import/export, navigation, and local safety snapshots.
- `src/services/persistence/scenarios.ts` owns story loading and the atomic save call.
- `src/services/persistence/content-themes.ts` owns the separate theme upsert.
- `src/hooks/use-index-character-workspace.ts` owns Character Library copy handoffs.

### What This Evidence Establishes

Current source establishes separate non-retried theme persistence, the imported UUID conflict, the draft-state side effect, and publication that does not first synchronize working state.

### What Remains Unverified

Authenticated save and publication mutations were not exercised against the deployed backend. Live atomic-function and RLS behavior remain unverified beyond repository-defined evidence. My Stories owns saved-story reuse and Play; their current persistence limitations are tracked by `MS-ISSUE-002`, not this Story Builder record. No runtime repair is part of this record.
