---
record_type: issue
issue_id: MI-ISSUE-002
title: My Images mutations and consumer copies lack atomic media ownership
owner_capability: my-images
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/my-images/MI-ISSUE-002.md
---
# MI-ISSUE-002: My Images mutations and consumer copies lack atomic media ownership

## Expected Behavior

Upload, edit, delete, background, and consumer-copy actions must expose pending and failure outcomes, preserve retryable user input, and keep database rows and private storage objects consistent. A consumer must receive its own durable media object before it adopts the selection.

## Problem

### Current Behavior

Uploads write storage before the `library_images` row and stop a batch at the first thrown failure without itemized partial results. Folder/image/background removal does not consistently inspect storage-removal errors before deleting rows. Several modals close before persistence settles and lack duplicate guards. Background selection and overlay updates are non-transactional or optimistic without rollback. Consumer copies create destination media before the consuming row saves, and filename extension can outrank fetched MIME type, allowing JPEG bytes under another extension.

### Why This Is a Problem

A visible action can leave orphaned media, stale selection state, lost retry input, or a destination object whose metadata does not describe its bytes. The source library and consuming capability can disagree about what was durably adopted.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/my-images.md` records these exact departures under **Mutation ordering and recovery limitations**, **Page-background limitations**, and **Consumer-copy and handoff limitations**.
- `src/components/chronicle/ImageLibraryTab.tsx` owns upload, edit, thumbnail, image, and folder mutations.
- `src/hooks/use-index-background-workspace.ts` owns page-background selection, deletion, and overlay persistence.
- `src/services/persistence/media-settings.ts` owns image/background rows and storage operations.
- `src/services/persistence/library-copy.ts` owns cross-capability private-media copying.

### What This Evidence Establishes

Current client operations cross storage and row boundaries without one atomic transaction or complete rollback, and multiple triggers do not expose their actual pending/partial outcome. The consumer-copy extension rule is source-confirmed.

### What Remains Unverified

No authenticated upload, deletion, background mutation, or consumer copy was executed in the documentation review. Deployed storage/RLS behavior and orphan frequency remain unverified. No runtime repair is part of this record.
