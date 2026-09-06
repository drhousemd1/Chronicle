---
record_type: issue
issue_id: CB-ISSUE-002
title: Character Builder identity, avatar, and AI handoffs lack durable ownership
owner_capability: character-builder
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/character-builder/CB-ISSUE-002.md
---
# CB-ISSUE-002: Character Builder identity, avatar, and AI handoffs lack durable ownership

## Expected Behavior

Reusable-to-story and story-to-library copies must have independent identities and an explicit durable relationship when one is intended. Avatar removal and media adoption must persist with destination ownership. AI actions must expose reachable controls, stable context, and retryable failure results.

## Problem

### Current Behavior

Library-to-story import retains the reusable UUID and cannot persist through the atomic story save. Story-to-library mapping exists only in session state, allowing duplicate copies after reload. Both directions retain avatar references rather than copying the private object. Delete image does not clear `avatarPath`, and new avatar objects have no cleanup transaction for failed/abandoned save or profile deletion. Bulk AI failure resolves as an empty patch after closing its prompt, filtered library search changes enhancement context, and the implemented full AI Generate Character branch has no visible Character Builder trigger.

### Why This Is a Problem

Copied profiles can fail to save or duplicate, independent rows can still share inaccessible media, and AI requests can fail or change context without a truthful, recoverable presentation.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/character-builder.md` records these exact departures under **Copy identity and ownership tracking**, **Avatar and global-media lifecycle**, and **AI context, reachability, and failure presentation**.
- `src/hooks/use-index-character-workspace.ts` owns copy identities, session mapping, avatar state, and bulk AI.
- `src/features/character-builder/CharacterBuilderScreen.tsx` owns avatar removal, upload, My Images selection, and field-level AI controls.
- `src/services/persistence/characters.ts` owns avatar-path serialization and library row persistence.
- `src/services/persistence/library-copy.ts` owns My Images destination copying.
- `src/services/character-ai.ts` and `src/components/chronicle/AIPromptModal.tsx` own AI modes and failure handling.

### What This Evidence Establishes

Current source proves the UUID conflict, session-only copy mapping, shared avatar references, path-backed deletion mismatch, missing media cleanup, changing AI context, and dormant generation entry.

### What Remains Unverified

Authenticated copies, media cleanup consequences, AI provider failures, deployed atomic save, storage policy, and public-style RPC grants were not exercised live. No runtime repair is part of this record.
