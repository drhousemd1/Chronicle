

# Complete Security and Optimization Audit -- Implementation Plan

This plan covers all 8 issues from the Claude audit plus the xAI model migration. Here is every step in detail.

---

## Step 1: Update xAI Model Names (Issues #3 + #4)

**The problem:** The codebase uses outdated model names (`grok-3`, `grok-3-mini`, `grok-2`, `grok-2-image-1212`). The default is `grok-3` at $3.00/M tokens. The xAI docs confirm newer, cheaper models exist.

**The fix -- 10 files:**

### File 1: `src/constants.tsx` (lines 16-33)
Replace `LLM_MODELS` array with 6 current models. The first entry becomes the default:
```
grok-4-1-fast-non-reasoning  (default -- $0.20/M, 2M context)
grok-4-1-fast-reasoning      ($0.20/M, 2M context, adds reasoning)
grok-4-fast-non-reasoning    ($0.60/M, 2M context)
grok-4-fast-reasoning        ($0.60/M, 2M context)
grok-3-mini                  ($0.30/M, 131K context)
grok-3                       ($3.00/M, 131K context -- admin only)
```
Replace `IMAGE_MODEL_MAP` so all models map to `grok-imagine-image` ($0.02/image) except `grok-3` which maps to `grok-imagine-image-pro` ($0.07/image). Update `getImageModelForTextModel` fallback from `grok-2-image-1212` to `grok-imagine-image`.

### File 2: `supabase/functions/chat/index.ts` (line 88-89)
Replace `VALID_GROK_MODELS` with all 6 new model IDs. Change fallback from `'grok-3-mini'` to `'grok-4-1-fast-non-reasoning'`.

### File 3: `supabase/functions/extract-character-updates/index.ts` (line 510-511)
Replace `VALID_GROK_MODELS` with all 6 new model IDs. Change fallback from `'grok-3'` to `'grok-4-1-fast-non-reasoning'`.

### File 4: `supabase/functions/extract-memory-events/index.ts` (line 107)
Change `"grok-3-mini"` to `"grok-4-1-fast-non-reasoning"`.

### File 5: `supabase/functions/compress-day-memories/index.ts` (line 66)
Change `"grok-3-mini"` to `"grok-4-1-fast-non-reasoning"`.

### File 6: `supabase/functions/evaluate-arc-progress/index.ts` (line 118)
Change `"grok-3-mini"` to `"grok-4-1-fast-non-reasoning"`.

### File 7: `supabase/functions/generate-side-character/index.ts` (line 34)
Change fallback from `'grok-3'` to `'grok-4-1-fast-non-reasoning'`.

### File 8: `supabase/functions/generate-side-character-avatar/index.ts` (lines 53, 141)
- Line 53: Change text model from `'grok-3-mini'` to `'grok-4-1-fast-non-reasoning'`
- Line 141: Change image model from `'grok-2-image-1212'` to `'grok-imagine-image'`

### File 9: `supabase/functions/generate-cover-image/index.ts` (lines 71, 80)
- Change image model from `"grok-2-image-1212"` to `"grok-imagine-image"`
- Update the console.log on line 71 to match

### File 10: `supabase/functions/generate-scene-image/index.ts` (lines 47-51, 184, 209, 216, 225)
- Replace `TEXT_MODEL_MAP` with all 6 new model entries
- Change text fallback on line 184 from `'grok-3'` to `'grok-4-1-fast-non-reasoning'`
- Change image model on line 225 from `'grok-2-image-1212'` to `'grok-imagine-image'`
- Update comments and console.log references

**After fix:** Default model costs 15x less. All edge functions accept the new model names. Image generation uses the current xAI image model.

**Risk:** If any model string is wrong, that specific feature breaks. Immediate testing required.

---

## Step 2: Fix Connection Status Badge (Issue #8)

**The problem:** `ModelSettingsTab.tsx` line 30 defaults `connectionStatus` to `'connected'`, showing a green "System Linked" badge before the async check runs. Line 46 always sets status to `'connected'` after refresh regardless of actual result.

**The fix -- 1 file:**

### File: `src/components/chronicle/ModelSettingsTab.tsx`
- Line 30: Change default from `'connected'` to `'checking'`
- Lines 38-40: Update the `useEffect` to set `connectionStatus` based on `xaiConfigured` result:
  ```
  checkSharedKeyStatus().then(status => {
    setSharedKeyStatus(status);
    setConnectionStatus(status.xaiConfigured ? 'connected' : 'error');
  });
  ```
- Line 46: Change `handleRefreshConnection` to set status based on actual result instead of always `'connected'`:
  ```
  setConnectionStatus(status.xaiConfigured ? 'connected' : 'error');
  ```

**After fix:** Badge shows "Checking Link..." on load, then switches to green or red based on actual API key status. No more false green flash.

---

## Step 3: Replace Hardcoded Admin UUID (Issue #2)

**The problem:** `src/services/app-settings.ts` line 3 has your personal UUID hardcoded. The `isAdminUser()` function is a client-side string comparison that anyone can see and bypass.

**The fix -- 2 files + 1 database migration:**

### Database migration
Insert your user ID into the existing `user_roles` table with role `'admin'`:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('98d690d7-ac5a-4b04-b15e-78b462f5eec6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### File 1: `src/services/app-settings.ts`
- Remove line 3 (`const ADMIN_USER_ID = ...`)
- Remove the sync `isAdminUser()` function (lines 23-25)
- Add a new async function:
  ```typescript
  export async function checkIsAdmin(userId: string | undefined): Promise<boolean> {
    if (!userId) return false;
    const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (error) { console.error('Admin check failed:', error); return false; }
    return data === true;
  }
  ```

### File 2: `src/components/chronicle/ModelSettingsTab.tsx`
- Change import from `isAdminUser` to `checkIsAdmin`
- Line 36: Replace `const isAdmin = isAdminUser(user?.id)` with async state:
  ```typescript
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (user?.id) checkIsAdmin(user.id).then(setIsAdmin);
  }, [user?.id]);
  ```

**After fix:** Admin status comes from the database `user_roles` table. Your UUID is no longer in source code. The `has_role()` function (which already exists) is the single source of truth. Even if someone reads the frontend code, they cannot determine who the admin is or grant themselves admin access.

---

## Step 4: Throttle Character Extraction (Issue #6)

**The problem:** `extractCharacterUpdatesFromDialogue()` fires on every single chat message (line 2236 of `ChatInterfaceTab.tsx`), doubling API costs. Most messages ("ok", "haha", "tell me more") contain nothing character-defining.

**The fix -- 1 file:**

### File: `src/components/chronicle/ChatInterfaceTab.tsx`
- Near line 380 (alongside existing `sessionMessageCountRef`), add:
  ```typescript
  const extractionCountRef = useRef<number>(0);
  ```
- In the existing conversation-reset `useEffect` at line 385-389, add one line:
  ```typescript
  extractionCountRef.current = 0;
  ```
- At line 2236, wrap the extraction call:
  ```typescript
  extractionCountRef.current += 1;
  if (extractionCountRef.current % 5 === 0) {
    extractCharacterUpdatesFromDialogue(userInput, fullText).then(updates => {
      // ... existing handler unchanged
    });
  }
  ```
- Leave `handleRegenerate` (line 2413) and `handleContinue` (line 2501) extraction calls unchanged -- those are user-initiated and infrequent.

**After fix:** Extraction runs every 5th message instead of every message. Counter resets to 0 when switching conversations (so new conversations always start fresh). API costs for extraction drop ~80%. Character evolution still updates regularly. Users notice no difference.

---

## Step 5: Move Model Preference to Database (Issue #7)

**The problem:** `ModelSettingsContext.tsx` stores the selected model in `localStorage`. This doesn't sync across devices and is theoretically vulnerable to XSS tampering.

**The fix -- 1 file + 1 database migration:**

### Database migration
Add a `preferred_model` column to `profiles`:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_model text;
```

### File: `src/contexts/ModelSettingsContext.tsx`
- Import `supabase` and `useAuth`
- On mount: read from `profiles.preferred_model` first, fall back to `localStorage`, then fall back to `LLM_MODELS[0].id`
- On change: write to both `profiles` table and `localStorage` (localStorage serves as instant cache so the app doesn't flash while the DB read happens)

**After fix:** Model preference persists in the database. If you log in on a different device, your model choice follows you. localStorage is only a performance cache, not the source of truth.

---

## Step 6: CORS Hardening (Issue #5)

**The problem:** All 12 edge functions have `'Access-Control-Allow-Origin': '*'`, allowing any website to make requests to your API.

**The fix -- 12 edge functions:**

In every edge function, replace:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
};
```
With a dynamic origin check:
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

The 12 functions affected:
1. `chat/index.ts`
2. `check-shared-keys/index.ts`
3. `compress-day-memories/index.ts`
4. `evaluate-arc-progress/index.ts`
5. `extract-character-updates/index.ts`
6. `extract-memory-events/index.ts`
7. `generate-cover-image/index.ts`
8. `generate-scene-image/index.ts`
9. `generate-side-character/index.ts`
10. `generate-side-character-avatar/index.ts`
11. `migrate-base64-images/index.ts`
12. `sync-guide-to-github/index.ts`

**After fix:** Only requests from your app's domains are accepted. Unknown origins are rejected. Development still works via localhost.

---

## Step 7: Skip -- .env in Git (Issue #1)

The `.env` is auto-managed by Lovable Cloud. The keys in it are the public anon key (already embedded in the JS bundle). This is a Git hygiene task you'd handle manually on GitHub if desired. No code change needed.

---

## Implementation Order

| Step | Issues | Files Changed | Risk |
|------|--------|---------------|------|
| 1 | #3 + #4 (Models) | 10 files | Medium -- needs immediate API test |
| 2 | #8 (Badge) | 1 file | None |
| 3 | #2 (Admin) | 2 files + DB migration | Low |
| 4 | #6 (Extraction throttle) | 1 file | Low |
| 5 | #7 (DB preferences) | 1 file + DB migration | Low |
| 6 | #5 (CORS) | 12 files | Low |

**Total: ~26 file edits, 2 database migrations.**

After Steps 1-2, we should pause and test chat + image generation to confirm the new xAI model names work before proceeding with the remaining steps.

