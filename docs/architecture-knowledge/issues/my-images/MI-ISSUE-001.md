---
record_type: issue
issue_id: MI-ISSUE-001
title: My Images failures and search states can be presented as empty or complete
owner_capability: my-images
status: open
discovered_on: 2026-08-22
last_verified_on: 2026-08-22
source_record: docs/architecture-knowledge/issues/my-images/MI-ISSUE-001.md
---
# MI-ISSUE-001: My Images failures and search states can be presented as empty or complete

## Expected Behavior

My Images must distinguish loading, empty, no-match, failed, and partially loaded media states. Folder and image requests must retain useful context, explain failures, and offer recovery without simultaneously claiming the folder is empty.

## Problem

### Current Behavior

Folder, open-folder, and consumer-picker failures can render their error and empty conclusion together. Signing failure can become a blank image or placeholder without per-media recovery. One failed preview can prevent every measured aspect ratio from being committed. Search matches title, filename, and tags even though its label says tags, and a nonempty folder with zero matches renders a blank grid without a no-results message or clear action.

### Why This Is a Problem

The interface can misstate whether data exists, whether every item loaded, and why the current view is blank. Users cannot tell whether to retry, clear search, or add content.

## Evidence and Verification

### Supporting Evidence

- `docs/architecture-knowledge/my-images.md` records these departures under **Folder and image refresh limitations**.
- `src/components/chronicle/ImageLibraryTab.tsx` owns folder/image loading, search filtering, preview ratios, and error/empty rendering.
- `src/components/chronicle/ImageLibraryPickerModal.tsx` owns the consumer folder/image load states.
- `src/services/persistence/signed-media.ts` owns private signing and fallback results.

### What This Evidence Establishes

Current source contains overlapping failure/empty branches, incomplete signing feedback, an all-or-nothing ratio commit, and a blank no-match branch. It does not establish production frequency.

### What Remains Unverified

No deployed request or signing failure was induced. Authenticated folder contents, live storage policies, and browser-media failure frequency remain unverified. No runtime repair is part of this record.
