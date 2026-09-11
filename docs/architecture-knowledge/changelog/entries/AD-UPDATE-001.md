---
record_type: changelog
variant: accepted_update
change_id: AD-UPDATE-001
title: Knowledge Base Issues now show unresolved findings only
change_date: 2026-09-11
why_change_was_needed: Resolved findings duplicated completed history in the Issues tab and lengthened the page unnecessarily.
changes: The shared Issues renderer now hides resolved findings and leaves empty panels blank. Project guidance requires one concise Changelog entry per meaningful verified change, with reciprocal Issue references when applicable. Ordinary update narratives no longer claim that no Issue was involved.
outcome: Community Gallery has a blank Issues panel while its existing fix remains recorded in CG-CHANGE-001. My Stories retains its two unresolved findings. Historical source records are preserved without a Resolved Issues list.
accepted_evidence_summary: Twenty-five focused component and page tests passed, along with targeted lint, typecheck, and Knowledge Base validation. Local browser inspection confirmed the blank Gallery panel, both open My Stories findings, and the existing Gallery Changelog entry.
accepted_evidence_limits: This verifies local Knowledge Base presentation and guidance, not unrelated product behavior, live Supabase, deployment, or user acceptance. These changes have not been committed or pushed.
provenance: accepted-update
affected_capabilities: [admin]
owning_capability: admin
accepted_on: 2026-09-11
accepted_by: Codex local implementation review
review_method: Focused automated checks and direct inspection in the Codex in-app browser. The source hash covers the eight changed implementation, test, and guidance files in sorted path order, using SHA-256 file hashes followed by two spaces, the path, and a newline.
source_revision: sha256:7cd6c3b2e1f72cc4a727312b2854e8c86c117b7a46a223a61030bdda6a0ac8b8
source_record: docs/architecture-knowledge/changelog/entries/AD-UPDATE-001.md
---
# AD-UPDATE-001: Knowledge Base Issues now show unresolved findings only

## Why the Change Was Needed

Resolved findings duplicated completed history in the Issues tab and lengthened the page unnecessarily.

## Changes

The shared Issues renderer now hides resolved findings and leaves empty panels blank. Project guidance requires one concise Changelog entry per meaningful verified change, with reciprocal Issue references when applicable. Ordinary update narratives no longer claim that no Issue was involved.

## Outcome

Community Gallery has a blank Issues panel while its existing fix remains recorded in CG-CHANGE-001. My Stories retains its two unresolved findings. Historical source records are preserved without a Resolved Issues list.

## Accepted Evidence Summary

Twenty-five focused component and page tests passed, along with targeted lint, typecheck, and Knowledge Base validation. Local browser inspection confirmed the blank Gallery panel, both open My Stories findings, and the existing Gallery Changelog entry.

## Accepted Evidence Limits

This verifies local Knowledge Base presentation and guidance, not unrelated product behavior, live Supabase, deployment, or user acceptance. These changes have not been committed or pushed.

## Review Method

Focused automated checks and direct inspection in the Codex in-app browser. The source hash covers the eight changed implementation, test, and guidance files in sorted path order, using SHA-256 file hashes followed by two spaces, the path, and a newline.

## Acceptance and Source State

Codex local implementation review accepted source revision sha256:7cd6c3b2e1f72cc4a727312b2854e8c86c117b7a46a223a61030bdda6a0ac8b8 on 2026-09-11.

## Provenance

This is a bounded Accepted Update, not an accepted closeout.

## Applicability

Affected capabilities: admin.
