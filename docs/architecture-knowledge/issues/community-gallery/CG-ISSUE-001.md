---
record_type: issue
issue_id: CG-ISSUE-001
title: Gallery request failures appear as empty results
owner_capability: community-gallery
status: resolved
discovered_on: 2026-07-25
last_verified_on: 2026-08-08
source_record: docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md
---
# CG-ISSUE-001: Gallery request failures appear as empty results

## Expected Behavior

Community Gallery must distinguish a failed publication request from a successful request that returned no matching stories. An initial failure must keep the discovery controls available, explain that the catalog could not be loaded, and offer a retry. A later-page failure must preserve the cards already loaded, explain that additional results could not be retrieved, and allow the same request to be retried without changing the viewer’s feed, search, or filters.

## Problem

### Current Behavior

`fetchGalleryScenarios()` still calls the existing `fetch_gallery_scenarios` Supabase RPC, but it now rejects when that request returns an error. A successful response containing no stories remains a legitimate empty array. This gives React Query a real failure state instead of a false successful page.

`GalleryHub.tsx` now presents that failure according to where it occurred. A first-page failure keeps the discovery controls visible, explains that the catalog could not be loaded, and offers Retry. A later-page failure keeps the cards already loaded, explains that additional stories could not be retrieved, pauses automatic paging, and offers Retry for the same missing page. Feed, search, hashtag, category filters, and NSFW state remain part of the same request. An older retry cannot clear the failure state for a newer query.

### Why This Is a Problem

Before the repair, a temporary network, RPC, authentication, or backend failure could be presented as evidence that no stories existed, no stories matched, or the viewer had reached the end. The repair was needed so the Gallery would tell the truth about failure, preserve valid discovery context, and give the viewer a deliberate recovery action.

## Evidence and Verification

### Supporting Evidence

- Required behavior is defined in `docs/architecture-knowledge/community-gallery.md` under **Continuity, Feedback, and Recovery** and **UI Elements and Functions → Failure Presentation and Recovery**.
- `src/services/gallery-data.ts` now throws the RPC error while preserving a successful empty response as `[]`.
- `src/components/chronicle/GalleryHub.tsx` renders separate first-page and later-page failure branches, preserves loaded cards and the complete discovery request, pauses automatic paging while a page is failed or offline-paused, and retries the same request deliberately.
- `src/services/gallery-data.test.ts` verifies RPC-error rejection and legitimate empty success.
- `src/components/chronicle/GalleryHub.test.tsx` verifies first-page failure, later-page failure, preserved cards and criteria, exact-page Retry, offline-paused requests, stale-retry isolation, legitimate empty results, and genuine catalog exhaustion.
- Seven focused Gallery tests, the serial complete-repository suite, type checking, lint, production build, both Knowledge Base validators, architecture refresh, whitespace validation, independent review, source proofreading, and a safe normal-route load passed on 2026-08-08.
- The exact repaired runtime and focused-proof files are bound by `sha256:26734dd3508526ba40cc89ca5fd0e66da6172c3b999f75f186dc64ffa6aa403b` at baseline commit `d9a3fa6adfd84ab896289e03d82283f676a1695e` plus the current dirty Knowledge Base worktree.

### What This Evidence Establishes

This evidence establishes the bounded client repair: failed requests no longer become successful empty pages; both visible recovery branches preserve their required context; deliberate Retry repeats the correct request; and ordinary empty and end states remain separate.

### What Remains Unverified

This evidence does not establish how often live failures occur, which production failures reach the branch, the exact deployed Supabase RPC body, live Supabase enforcement, or deployment. The normal interface has no safe end-user control for forcing this RPC failure, so the user approved evidence-based completion rather than being asked to inspect code or deliberately break the service.

The source path was first identified on 2026-07-25 and the repaired path was reverified on 2026-08-08. CG-WORK-002 owns the repair; CG-WORK-001 remains the separate Knowledge Base documentation project.

## Resolution

CG-ISSUE-001 is resolved by the bounded Gallery client repair recorded in CG-CHANGE-001 and archived CG-WORK-002. The service now rejects request errors; the Gallery presents separate first-page and later-page recovery states; existing cards and discovery criteria survive; Retry repeats the correct request; and successful empty and exhausted results keep their truthful presentations. Completion used the user-approved evidence-based route because the failure cannot be safely induced through the ordinary interface. Production failure frequency, the exact deployed RPC body, live Supabase enforcement, deployment, and unrelated Gallery behavior remain outside this resolution.
