

# Replace Handoff Tab with Change Log

## Concept

Replace the unused "Handoff" tab with a **Change Log** — a persistent, searchable record of every fix, refactor, or design change made during development. Each entry captures:
- **What the issue was** (title + short description)
- **The plan/proposed fix** (what was going to be done)
- **What was actually changed** (files modified, what changed and why)
- **Who made it** (Lovable, Codex, manual, etc.)
- **When** (timestamp)

This gives you a durable reference that survives context window limits. Any agent can read this page to understand *why* code is the way it is.

## Data Structure

A new `ChangeLogEntry` type, simpler than `QualityFinding` but with the same expandable card UI pattern:

| Field | Purpose |
|-------|---------|
| `id` | Unique ID |
| `title` | Short issue/change title (shown collapsed) |
| `summary` | One-line subtitle (shown collapsed, like "Chat Interface · Layout fix") |
| `severity` | `patch` / `fix` / `refactor` / `feature` / `breaking` — badge color coding |
| `status` | `planned` / `in-progress` / `completed` |
| `problem` | What was wrong / what triggered the change |
| `plan` | The proposed fix (the plan text before implementation) |
| `changes` | What was actually done — free-text description of the implementation |
| `filesAffected` | Array of file paths that were modified |
| `agent` | Who did it (Lovable, ChatGPT Codex, manual, etc.) |
| `relatedFindingIds` | Optional links to Quality Hub findings |
| `tags` | Freeform tags for filtering |
| `createdAt` / `updatedAt` | Timestamps |
| `comments` | Same comment array pattern as findings — for follow-up notes |

## UI Design

Reuses the exact same visual patterns as the Findings tab:
- **Collapsed view**: Severity badge + type badge + status badge → Title → Subtitle (page/component) → Chevron
- **Expanded view** (click chevron): Problem → Plan → Changes Made → Files Affected → Metadata → Comments
- **Filters**: Search, filter by severity type, filter by agent, filter by status
- **Add Entry button** in the header — opens a form to manually log a change (useful when you want to record a Codex change or a manual edit)

## Persistence

Same pattern as the rest of the Quality Hub:
- Stored in the `QualityHubRegistry` object (new `changeLog: ChangeLogEntry[]` field)
- Persisted to `quality_hub_registries` table + localStorage cache
- Included in Import/Export JSON
- `registryVersion` bump to migrate existing data

## Files to modify

1. **`src/lib/ui-audit-schema.ts`** — Add `ChangeLogEntry` interface, `CHANGE_LOG_SEVERITY` const, add `changeLog` field to `QualityHubRegistry`, update `isQualityHubRegistry` validator
2. **`src/lib/ui-audit-utils.ts`** — Update `mergeRegistries` to handle `changeLog` array
3. **`src/data/ui-audit-findings.ts`** — Add empty `changeLog: []` to seed data, bump `registryVersion`
4. **`src/pages/style-guide/ui-audit.tsx`** — Replace `handoff` view ID with `changelog`, build the Change Log tab UI (card list with expand/collapse, filters, add-entry form), reuse existing style constants

## What stays the same
- Overview, Findings, and Runs tabs — untouched
- All existing Findings data and functionality — untouched
- Import/Export — enhanced to include change log entries
- Visual styling — identical card patterns, badges, recessed blocks

