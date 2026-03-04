

# Steps 3-6: Admin Security, Extraction Throttle, DB Model Preferences, CORS Hardening

## Step 3 — Replace Hardcoded Admin UUID (2 files + 1 DB migration)

**Database migration:**
- Insert admin role: `INSERT INTO user_roles (user_id, role) VALUES ('98d690d7-...', 'admin') ON CONFLICT DO NOTHING`
- Update `app_settings` RLS policies to use `has_role()` instead of hardcoded UUID

**`src/services/app-settings.ts`:**
- Remove `ADMIN_USER_ID` constant and `isAdminUser()` function
- Add async `checkIsAdmin(userId)` that calls `supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })`

**`src/components/chronicle/ModelSettingsTab.tsx`:**
- Replace sync `isAdminUser(user?.id)` with `useState(false)` + `useEffect` calling `checkIsAdmin`

**`src/pages/Index.tsx`:**
- Same pattern: replace sync `isAdminUser(user?.id)` with async state for admin sidebar visibility

---

## Step 4 — Throttle Character Extraction (1 file)

**`src/components/chronicle/ChatInterfaceTab.tsx`:**
- Add `extractionCountRef = useRef(0)` at line ~380
- Add `extractionCountRef.current = 0` to the conversation-reset effect at line 387
- Wrap extraction call at line 2236: increment counter, only fire when `% 5 === 0`

---

## Step 5 — Move Model Preference to Database (1 file + 1 DB migration)

**Database migration:**
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_model text;
```

**`src/contexts/ModelSettingsContext.tsx`:**
- On mount: fetch from `profiles.preferred_model`, fall back to localStorage, then `LLM_MODELS[0].id`
- On change: write to both `profiles` table and localStorage (cache)

---

## Step 6 — CORS Hardening (12 edge functions)

Replace static `'*'` origin with dynamic check in all 12 functions:

```typescript
const ALLOWED_ORIGINS = [
  'https://hello-git-hug.lovable.app',
  'https://id-preview--a004b824-bad4-4e86-a30f-524c97ca4ddb.lovable.app',
  'http://localhost:5173',
];
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
```

Functions: `chat`, `check-shared-keys`, `compress-day-memories`, `evaluate-arc-progress`, `extract-character-updates`, `extract-memory-events`, `generate-cover-image`, `generate-scene-image`, `generate-side-character`, `generate-side-character-avatar`, `migrate-base64-images`, `sync-guide-to-github`.

Each function's `corsHeaders` constant becomes a `getCorsHeaders(req)` call, and every `Response` that currently spreads `...corsHeaders` will instead spread `...getCorsHeaders(req)`.

---

## Summary

| Step | Files | DB Migration |
|------|-------|-------------|
| 3 - Admin role | `app-settings.ts`, `ModelSettingsTab.tsx`, `Index.tsx` | Yes (insert role + update RLS) |
| 4 - Extraction throttle | `ChatInterfaceTab.tsx` | No |
| 5 - DB model pref | `ModelSettingsContext.tsx` | Yes (add column) |
| 6 - CORS | 12 edge functions | No |

