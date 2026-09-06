---
record_type: issue
issue_id: SB-ISSUE-002
title: Story Builder media and action failures lack durable recovery boundaries
owner_capability: story-builder
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/story-builder/SB-ISSUE-002.md
---
# SB-ISSUE-002: Story Builder media and action failures lack durable recovery boundaries

## Expected Behavior

Cover and scene upload, copy, generation, import/export, deletion, save, and publication actions must expose pending, success, partial, and failure outcomes. Durable paths and media types must remain portable, and authored fields shown as saved must reload with the same value.

## Problem

### Current Behavior

Cover and scene media can be created before a parent save with no superseded/orphan cleanup. Scene title is kept in working data and transfer files but is absent from the atomic scene payload, so it is lost after save/reload. Resize is not a strict two-dimensional bound. My Images copy can retain an extension that does not match JPEG bytes. Export omits durable `coverImagePath`, and import can leave an old cover path authoritative over the imported presentation. Several generation, upload, publish, update, and unpublish failures are console-only or clear user input without a visible retryable error.

### Why This Is a Problem

An author can lose a field or retry context, create inaccessible or orphaned media, or export an expiring/nonportable reference while the builder appears to have accepted the action.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/story-builder.md` records these exact departures under **Media lifecycle and portability** and **AI and publication feedback**.
- `src/features/story-builder/StoryBuilderScreen.tsx`, `src/features/story-builder/components/StoryBuilderMediaModals.tsx`, and `src/features/story-builder/hooks/use-story-builder-media.ts` own the visible media actions and working state.
- `src/services/persistence/media-settings.ts` and `library-copy.ts` own uploads and destination copies.
- `src/services/persistence/scenarios.ts` owns the atomic scene payload and cover persistence.
- `src/hooks/use-index-scenario-persistence.ts` owns import/export translation.
- `src/lib/story-transfer.ts` owns portable story-package fields and import precedence, while `src/utils.ts` owns the shared image-resize behavior.

### What This Evidence Establishes

Current source proves the missing scene-title durable field, incomplete media cleanup, nonportable cover export/import precedence, MIME/extension mismatch path, and failure branches without complete user recovery.

### What Remains Unverified

No provider failure, storage mutation, export round trip across accounts, or deployed save/publish operation was exercised live. Deployed storage policies and provider outputs remain unverified. No runtime repair is part of this record.
