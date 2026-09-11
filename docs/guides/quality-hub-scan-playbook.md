# Quality Hub Scan Technical Procedure

This playbook explains how the existing Quality Scan command and Quality Hub storage surfaces operate. It does not decide when a scan, broad check package, Issue, Changelog entry, or Supabase investigation is required. The user's assignment sets the scope and limits.

## Command operation

From the Chronicle repository root:

```bash
npm run quality:scan
```

The package command first acquires the protected Knowledge certification lease, then runs these implemented checks in order and stops at the first failure:

1. `npm run lint`
2. `npm run typecheck`
3. `node node_modules/vitest/vitest.mjs run`
4. `node scripts/generate-roleplay-artifact-identity.mjs`
5. `node node_modules/vite/bin/vite.js build`
6. `npm audit --omit=dev`

This is the exact expansion implemented by `scripts/run-quality-hub-scan.mjs`; it deliberately invokes Vitest and Vite directly rather than calling the package `test` or `build` scripts. Use the aggregate command only when the user has authorized a Quality Scan. Its success proves that those commands passed on the source state named by the run. It does not prove deployment, inaccessible live Supabase state, every product requirement, or human acceptance.

## Module mechanics

A Quality Hub scan module describes its technical scope, checks, required evidence, available logging surfaces, and done criteria. After a scan is authorized:

- select only the authorized module and scope;
- record exact sources checked and skipped;
- record the command results and evidence limits;
- store the run identity, agent/model label, timestamp, and result counts in Scan Runs;
- record verified problems as Issues only when called for by the authorized assignment. A scan does not automatically start a project or require a Changelog entry; Changelog records meaningful completed changes, not scan progress.

Issue Registry stores verified diagnosed problems. Scan Runs stores what the scan executed. The canonical repository Changelog remains read-only in Quality Hub. These surfaces do not create obligations merely because a module lists them as available destinations.

## Live-system mechanics

The approved repository schema reference is a synchronized document, not proof of current deployment. Preserve privacy: do not copy row contents, secrets, tokens, user emails, private story or chat text, or private media into scan evidence. Mark inaccessible facts unverified.

## Failure behavior

Stop the aggregate command at the first failed check. Report the exact failed command and what it proves or cannot prove. Do not silently broaden the scan, create a record, rerun unrelated checks, or claim the entire system failed without a concrete reason relevant to the assigned work.
