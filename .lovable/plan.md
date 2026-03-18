

# Quality Hub Scan — Findings Report

## Scan Overview

I reviewed the codebase across all 11 scan modules defined in the Quality Hub. Below are the concrete findings I'll populate into the `ui-audit-findings.ts` initial registry as pre-seeded findings. This is a "standard" depth scan covering security, data integrity, build health, functionality, orphan code, and documentation.

---

## Findings to Add (17 total)

### Security (3 findings)

1. **All edge functions have `verify_jwt = false`** — Every function in `config.toml` disables JWT verification at the gateway level. While some functions (like `chat`) do manual auth checks internally, this bypasses Supabase's built-in JWT layer. If any function has a code path that skips the manual check, it's exposed. Severity: **high**.

2. **`sync-guide-to-github` has no auth check** — Unlike `chat`, `extract-memory-events`, etc., which all validate the Authorization header internally, `sync-guide-to-github` has no `supabase.auth.getUser()` call visible in the first 40 lines and JWT is disabled. Any caller can trigger GitHub writes. Severity: **critical**.

3. **Hardcoded GitHub credentials in edge function** — `sync-guide-to-github` contains `GITHUB_OWNER = "drhousemd1"` and `GITHUB_REPO = "Chronicle"` as hardcoded constants. The GitHub token comes from `Deno.env.get()` (good), but the repo path is non-configurable. Severity: **low**.

### Data Integrity (2 findings)

4. **`stories` table queried with `as any` cast** — Every query to the `stories` table in `supabase-data.ts` uses `.from('stories' as any)`, indicating the table isn't in the generated types file. This silently disables type checking on all story CRUD operations — wrong column names, missing fields, or type mismatches won't be caught at build time. Severity: **high**.

5. **Legacy localStorage functions still present** — `src/utils.ts` and `src/services/storage.ts` contain full localStorage-based CRUD (`loadAppData`, `saveAppData`, `getRegistry`, `saveRegistry`, `getCharacterLibrary`, etc.) that appear to be the pre-Supabase data layer. If any code path still calls these, data could silently diverge from the database. Severity: **medium**.

### Build / Type / Lint Health (2 findings)

6. **176 `as any` casts in service layer** — `src/services/character-ai.ts` and `src/services/supabase-data.ts` contain 176 `as any` type assertions that suppress TypeScript's type checker. Many are on database row conversions and patch objects. Severity: **medium**.

7. **Edge functions missing from `config.toml`** — `evaluate-arc-progress`, `migrate-base64-images`, and `sync-guide-to-github` all exist in `supabase/functions/` but have no entry in `config.toml`. This means they may not deploy or may use default settings. Severity: **high**.

### Functionality (2 findings)

8. **`ChronicleApp.tsx` is a dead placeholder** — The component renders "App migration in progress..." with empty callbacks (`onPlay={() => {}}`, `onEdit={() => {}}`, etc.). It's imported but appears to be unreachable since `Index.tsx` handles the main app. Severity: **low**.

9. **`brainstormCharacterDetails` returns untyped JSON** — `llm.ts` line 1021 parses arbitrary AI-generated JSON with `JSON.parse(jsonMatch[0])` and returns it as `Partial<Character>` without validating the shape. Malformed AI output could inject unexpected keys. Severity: **medium**.

### Orphan / Dead Code (2 findings)

10. **`storage.ts` — entire file may be dead code** — The `loadAppData()` and `saveAppData()` functions use localStorage with a key from `utils.ts`. The main app uses `supabase-data.ts` for persistence. This file may be entirely unused. Severity: **medium**.

11. **`migrate-base64-images` edge function — no callers** — No file in `src/` references `migrate-base64-images`. The `ensureStorageUrl` safety net in `supabase-data.ts` handles base64 migration inline. This function appears to be dead. Severity: **low**.

### Performance (2 findings)

12. **ChatInterfaceTab has 18+ `useEffect` hooks** — The main chat component registers at least 18 separate effects, many with complex dependency arrays. This creates re-render pressure and makes the component difficult to reason about. Severity: **medium**.

13. **Messages query may hit 1000-row Supabase limit** — `fetchScenarioById` fetches all messages for all conversations with `.in('conversation_id', conversationIds)` but has no `.limit()` or pagination. Long stories could silently truncate. Severity: **high**.

### Accessibility (1 finding)

14. **Quality Hub page lacks keyboard navigation** — The Quality Hub dashboard uses custom styled buttons and panels without `role`, `aria-label`, or focus management. Tab navigation through findings, filters, and view switches is not tested. Severity: **medium**.

### Documentation (1 finding)

15. **BYOK investigation note references stale architecture** — `.lovable/notes/byok-routing-investigation.md` references `getGateway()` routing logic and Lovable Gateway, but all edge functions have been updated to "GROK ONLY" mode. The investigation note suggests adding gateway routing that is no longer relevant. Severity: **low**.

### Cleanup (2 findings)

16. **CORS origin list duplicated across 10+ edge functions** — Every edge function contains an identical `ALLOWED_ORIGINS` array and `getCorsHeaders` helper. This should be a shared utility. Severity: **medium**.

17. **`dbToCharacter` / `characterToDb` conversion pair has asymmetric field naming** — `preferredClothing.undergarments` maps to DB column `underwear` (line 144 vs 156 in supabase-data.ts), creating a subtle naming inconsistency that could cause bugs if the DB schema ever gets generated types. Severity: **low**.

---

## Changes to Make

| File | Change |
|------|--------|
| `src/data/ui-audit-findings.ts` | Add all 17 findings to the `findings` array in `qualityHubInitialRegistry`. Update scan module statuses to `completed` for security, data-integrity, build, functionality, orphan-code, performance, cleanup, documentation, and accessibility. Add a scan run entry. Update review unit statuses. Update handoff notes. |

## Scan Module Status Updates

| Module | New Status |
|--------|-----------|
| Security and Dependencies | completed |
| Data and API Integrity | completed |
| Build / Type / Lint Health | completed |
| Functionality and Behavior Bugs | completed |
| Orphan / Dead Code | completed |
| Performance | completed |
| Code Cleanup Candidates | completed |
| Accessibility | completed |
| Documentation and Handoff | completed |
| UI / UX and Design System | not-started (requires visual inspection) |
| Test Health | not-started (requires test runner) |

