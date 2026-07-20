## 1. Synchronized source revision

- Target commit from request: `2ab32fb6ea8a78c5caa99bd7397ce39a03179178` ("Complete roleplay runtime overhaul") — present in local git history.
- Current working HEAD: `fb7e2997` ("Work in progress").
- Diff `2ab32fb6..fb7e2997` = **only `bun.lock`**. None of the six edge functions nor either shared roleplay file differ from the merged main revision. Deploying from current source is byte-equivalent to deploying from `2ab32fb6` for these bundles.

## 2. Six-function deployment plan

Single call to `supabase--deploy_edge_functions` with:

```
["chat",
 "compress-day-memories",
 "evaluate-goal-alignment",
 "evaluate-goal-progress",
 "extract-character-updates",
 "extract-memory-events"]
```

No other functions redeployed. No `supabase/config.toml` edits. No secret changes. No DB/RLS/storage/auth changes. No repo file edits.

## 3. How the two shared files enter the bundles

Supabase bundles each function together with every file it imports (transitively) from `supabase/functions/_shared/`. The six functions import the shared roleplay identity module directly or transitively:

- `chat/index.ts`, `compress-day-memories/index.ts`, `evaluate-goal-alignment/index.ts`, `evaluate-goal-progress/index.ts`, `extract-character-updates/index.ts`, `extract-memory-events/index.ts` each `import { buildRoleplayEdgeArtifactIdentity } from "../_shared/roleplay-artifact-identity.ts"`.
- `roleplay-artifact-identity.ts` in turn imports `./roleplay-artifact-manifests.ts`.

Both shared files therefore ship inside each bundle automatically as import dependencies. They are not (and must not be) deployed as separate functions.

## 4. Post-deployment verification

- Read the deploy tool response for each of the six functions; confirm all six report success.
- For each function, fetch the latest edge logs via `supabase--edge_function_logs` and confirm a fresh `booted` / `Listening on http://localhost:9999/` pair with no import/startup errors (e.g. no failures resolving `../_shared/roleplay-artifact-identity.ts` or `../_shared/roleplay-artifact-manifests.ts`).
- Confirm no other function, no DB object, no policy, no secret, and no storage bucket was touched (only the six deploy calls were issued).
- If any function fails to boot, report the exact log line and stop — no unrelated remediation.

## 5. Blockers

None. Plan is ready for approval.