---
record_type: issue
issue_id: MS-ISSUE-002
title: My Stories copy and play handoffs do not prove independent durable state
owner_capability: my-stories
status: open
discovered_on: 2026-08-21
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/my-stories/MS-ISSUE-002.md
---
# MS-ISSUE-002: My Stories copy and play handoffs do not prove independent durable state

## Expected Behavior

Reusing a saved story must create an independently owned copy of the permitted story content and media before Story Builder takes ownership. Starting Play must establish the new conversation durably before Chat Interface becomes the visible owner, and Chat History must have enough durable source access to resume that conversation later.

## Problem

### Current Behavior

The saved-story clone path regenerates structural child identifiers but does not load or persist `content_themes`; Story Builder opens the clone with default classifications. It can retain the source cover's hydrated presentation URL and source-owner private avatar paths without copying those media objects into the new owner's storage. Play starts conversation persistence without awaiting it before opening Chat Interface. Chat History later reloads the current story by `scenario_id`, while conversations and messages contain no complete source snapshot, so a saved-story conversation can become non-resumable if later publication visibility removes source access.

### Why This Is a Problem

The visible handoff can succeed while classification, private-media ownership, conversation durability, or future resumability remains incomplete. That weakens the promised independent-copy boundary and makes a newly opened playthrough look safer than the persisted evidence establishes.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/my-stories.md` records these exact departures under **App Architecture → Current Implementation Limitations → Collection and action consistency** and the ordered clone, Play, and Chat History flows.
- `src/services/persistence/scenarios.ts` owns the full source load and clone persistence.
- `src/services/persistence/content-themes.ts` owns theme reads outside the clone persistence path.
- `src/services/persistence/scene-media-portability.ts` handles supported scene-media portability, which is narrower than all cover and avatar media.
- `src/hooks/use-index-scenario-lifecycle.ts` opens Story Builder or Chat Interface after the respective handoff.
- `src/services/persistence/conversations.ts` owns the conversation insert used by Play.

### What This Evidence Establishes

Current source establishes that the clone omits content themes, does not make every referenced private-media object destination-owned, and that the Play navigation does not wait for conversation persistence. Current resume logic depends on continuing source visibility rather than a complete conversation-owned source snapshot.

### What Remains Unverified

No authenticated clone or Play mutation was executed during the read-only UI review. Full saved-source authorization is not proven live, and the synchronized Supabase reference contains conflicting table-level and field-level visibility guidance for some related rows. Lovable or equivalent backend-authority reconciliation is required before claiming the deployed boundary. No product repair is part of this record.
