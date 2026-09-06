---
record_type: issue
issue_id: MS-ISSUE-001
title: My Stories failures can look like empty, stale, or successful state
owner_capability: my-stories
status: open
discovered_on: 2026-08-21
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/my-stories/MS-ISSUE-001.md
---
# MS-ISSUE-001: My Stories failures can look like empty, stale, or successful state

## Expected Behavior

My Stories must distinguish loading, empty, partial, failed, and completed states. A failed collection or later page must preserve valid data, explain the failure, and offer a deliberate retry. A story action must not appear complete until the relevant durable operation has succeeded, and a partial related-record failure must not be presented as authoritative missing content.

## Problem

### Current Behavior

The initial loading flag is not rendered and timeout fallbacks can look empty. Later-page failure has no message or Retry control. The owned paging sentinel is mounted under narrowed filters and can request unrelated owned pages. Edit and Play check the story query but not every parallel character, codex, scene, conversation, message, or theme request, so partial failures can appear as empty related content or false zero totals. Several actions close their confirmation immediately or report failure only to the console; publication and detail state can remain stale after a successful mutation.

### Why This Is a Problem

The workspace can tell the user the wrong thing about whether data exists, whether the current view is complete, or whether an action took effect. That makes ordinary recovery ambiguous and risks a later edit or decision being based on incomplete state.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/my-stories.md` defines separate loading, empty, failure, and recovery expectations and records the delivered departures under **App Architecture → Current Implementation Limitations → User-visible state and recovery** and **Collection and action consistency**.
- `src/hooks/use-index-authenticated-data.ts` owns the timeout fallbacks and initial registry installation.
- `src/components/chronicle/StoryHub.tsx` owns filter rendering, the paging sentinel, supplemental detail requests, and card totals.
- `src/hooks/use-index-scenario-lifecycle.ts` owns Edit, Play, clone, delete, unsave, and publication transitions.
- `src/components/chronicle/DeleteConfirmDialog.tsx` supplies the shared confirmation lifecycle.
- The manual's authenticated read-only inspection on 2026-08-21 confirmed the ordinary collections and dialogs; failure branches and mutations were established from current source rather than induced live.

### What This Evidence Establishes

The current client has verified branches in which a request or mutation failure is not given a distinct, recoverable presentation and in which partial or stale data can be displayed as current. This record does not assert which backend failure occurs most often.

### What Remains Unverified

No failure was deliberately induced against the deployed service. Live Supabase policy behavior, production failure frequency, and the outcome of authenticated write branches remain unverified. No product repair is part of this documentation record.
