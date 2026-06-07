# Quality Hub Scan Playbook

This playbook is the executable baseline for running Chronicle quality scans consistently across LLM agents.

## Command Entry

Run the full gate chain from the repo root:

```bash
npm run quality:scan
```

This executes:
1. Lint (`npm run lint`)
2. Type check (`npx tsc --noEmit`)
3. Unit tests (`npm run test`)
4. Build (`npm run build`)
5. Dependency audit (`npm audit --omit=dev`)

## Module Checklist Contract

Every Quality Hub module must include:
- Scope (files/folders)
- Checks (what to inspect)
- Evidence required (paths/repro/output)
- Logging targets (Issue Registry / Scan Runs / Change Log)
- Done criteria

## Required Logging Flow

1. **Issue Registry**
- Log only diagnosed issues.
- Include severity, confidence, domain, route/component, concrete file paths, and recommendation.

2. **Scan Runs**
- Log each run with profile, scope, summary counts, and notes.

3. **Change Log**
- Log implemented code/doc/config changes.
- Include problem, plan, changes, files affected, tags, and related issue IDs.

## Supabase Snapshot Rule

When a scan or fix changes live Supabase tables, columns, constraints, indexes, RLS policies, database functions/RPCs, triggers, storage buckets, storage policies, or grants, refresh the repo-owned schema inventory before marking the Quality Hub entries current.

- Update the approved schema snapshot source only. The current approved file is `src/data/database-schema-inventory.ts`; if a dedicated Supabase Schema Map is later created, update that approved source instead.
- Include schema metadata, approximate row counts when available, role grants, RLS policies, functions/RPCs, triggers, storage buckets, and storage policies.
- Do not include row contents, secrets, auth tokens, API keys, user emails, private chat/story text, images, or private NSFW user content.
- Mark unverifiable live details as `unknown` or `needs_verification`. Do not invent schema details and do not create alternate schema dump files unless the task explicitly asks for a new schema-map artifact.

## Completion Rule

A scan pass is complete only when:
- Quality gate command succeeds, and
- Open findings are either fixed + verified or explicitly reclassified with evidence, and
- Registry + run + changelog are synchronized.

## Agent Guidance

- Do not leave findings "open" without action.
- Do not claim a fix without file-level evidence.
- Re-run quality gates after changes and record outcomes.
