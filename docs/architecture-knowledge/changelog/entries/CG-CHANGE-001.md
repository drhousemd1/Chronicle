---
record_type: changelog
variant: accepted_closeout
change_id: CG-CHANGE-001
title: Community Gallery request failures are distinct and retryable
change_date: 2026-08-08
problem: Gallery request failures were converted into successful empty pages, so an initial failure could look like no stories matched and a later-page failure could look like the end of the catalog.
why_change_was_needed: Viewers needed an honest failure explanation and a deliberate Retry action without losing their selected feed, search, filters, or stories already loaded.
changes: The Gallery service now rejects RPC errors while preserving legitimate empty responses. The Gallery presents separate first-page and later-page failure states, preserves discovery context and loaded cards, pauses automatic paging while a request is failed or offline-paused, retries the same request, and prevents a stale retry from clearing a newer query's failure state.
outcome: Failed Gallery requests no longer masquerade as empty results or catalog exhaustion, while legitimate empty and end states retain their existing meaning.
accepted_evidence_summary: Seven focused Gallery tests exercise the repaired service and delivered component branches. The complete repository checks, type checking, lint, production build, Knowledge Base validators, architecture refresh, whitespace validation, source proofreading, independent reviews, and safe normal-route loading passed under the user-approved evidence-based completion route.
accepted_evidence_limits: The accepted evidence does not establish production failure frequency, the exact deployed RPC body, live Supabase enforcement, deployment, or unrelated Gallery behavior. A live RPC failure was not deliberately induced because the ordinary interface has no safe control for doing so.
provenance: accepted-closeout
affected_capabilities: [community-gallery]
owning_capability: community-gallery
accepted_on: 2026-08-08
accepted_by: Codex verification workflow
acceptance_ref: CG-EV-038
source_revision: sha256:26734dd3508526ba40cc89ca5fd0e66da6172c3b999f75f186dc64ffa6aa403b
archived_project_id: CG-WORK-002
archive_record: docs/current-work/archive/community-gallery/CG-WORK-002.md
archive_route: /style-guide/chronicle-knowledge-base/archive/CG-WORK-002
resolved_issue_ids: [CG-ISSUE-001]
remaining_issue_ids: []
source_record: docs/architecture-knowledge/changelog/entries/CG-CHANGE-001.md
---
# CG-CHANGE-001: Community Gallery request failures are distinct and retryable

## Problem

Gallery request failures were converted into successful empty pages, so an initial failure could look like no stories matched and a later-page failure could look like the end of the catalog.

## Why the Change Was Needed

Viewers needed an honest failure explanation and a deliberate Retry action without losing their selected feed, search, filters, or stories already loaded.

## Changes

The Gallery service now rejects RPC errors while preserving legitimate empty responses. The Gallery presents separate first-page and later-page failure states, preserves discovery context and loaded cards, pauses automatic paging while a request is failed or offline-paused, retries the same request, and prevents a stale retry from clearing a newer query's failure state.

## Outcome

Failed Gallery requests no longer masquerade as empty results or catalog exhaustion, while legitimate empty and end states retain their existing meaning.

## Accepted Evidence Summary

Seven focused Gallery tests exercise the repaired service and delivered component branches. The complete repository checks, type checking, lint, production build, Knowledge Base validators, architecture refresh, whitespace validation, source proofreading, independent reviews, and safe normal-route loading passed under the user-approved evidence-based completion route.

## Accepted Evidence Limits

The accepted evidence does not establish production failure frequency, the exact deployed RPC body, live Supabase enforcement, deployment, or unrelated Gallery behavior. A live RPC failure was not deliberately induced because the ordinary interface has no safe control for doing so.

## Provenance

This is a modern accepted closeout created through Chronicle's protected Current Work workflow. It records evidence-based completion approved by Thomas Hall on 2026-08-08; it is not a historical Quality Hub import.

## Applicability

This change applies to Community Gallery request-failure handling only.

## Acceptance and Source State

CG-EV-038 records the passing evidence-based completion route for `sha256:26734dd3508526ba40cc89ca5fd0e66da6172c3b999f75f186dc64ffa6aa403b`.

## Issue Disposition

CG-ISSUE-001 is resolved by this accepted change. No linked Issue remains open in CG-WORK-002.

## Preserved Work Record

The complete investigation, failed-before evidence, repair decisions, verification limits, and closeout history are preserved in `docs/current-work/archive/community-gallery/CG-WORK-002.md` and are available at `/style-guide/chronicle-knowledge-base/archive/CG-WORK-002`.
