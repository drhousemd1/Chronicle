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

## Completion Rule

A scan pass is complete only when:
- Quality gate command succeeds, and
- Open findings are either fixed + verified or explicitly reclassified with evidence, and
- Registry + run + changelog are synchronized.

## Agent Guidance

- Do not leave findings "open" without action.
- Do not claim a fix without file-level evidence.
- Re-run quality gates after changes and record outcomes.
