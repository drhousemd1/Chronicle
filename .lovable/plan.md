
## Guide Documents Needing Updates After Steps 1-6

We made 6 significant changes across the codebase:
1. **Model migration** (default changed from `grok-3` to `grok-4-1-fast-reasoning`)
2. **Admin security** (hardcoded UUID removed, replaced with database-backed role checks)
3. **Extraction throttling** (added 5-message throttle)
4. **Model preference persistence** (moved from localStorage to `profiles.preferred_model` column)
5. **CORS hardening** (replaced `*` wildcard with dynamic origin check)

After reviewing the 4 core guide files, **3 documents require updates**:

### **1. Edge Functions & AI Services Structure Guide**
**Outdated content:**
- Line 25: `extract-character-updates` — lists default as `grok-3`, should be `grok-4-1-fast-reasoning`
- Line 33: `compress-day-memories` — lists as `grok-3-mini`, should be `grok-4-1-fast-reasoning`
- Line 26: `extract-memory-events` — lists as "AI model", should explicitly state `grok-4-1-fast-reasoning`
- Line 34: `evaluate-arc-progress` — lists as "AI model", should explicitly state `grok-4-1-fast-reasoning`

**Updates needed:**
- Update the AI Model Used column for all 4 functions to reflect the new default and fallback models
- Add a note in Section 12 Known Issues documenting the model migration from grok-3 family to grok-4-1-fast-reasoning
- Optionally document extraction throttling in Section 5 or add to Known Issues

### **2. Admin Panel Page Structure Guide**
**Outdated content:**
- Line 30: Says "Requires `isAdminUser()` check — queries `user_roles` table for `admin` role" — this is correct but should note it's now async
- Line 160: Says "Admin panel tab only visible when `isAdminUser()` returns true" — outdated, now uses async `checkIsAdmin()`
- Lines 179-180: Active issues still list hardcoded UUID as a problem — this is now RESOLVED

**Updates needed:**
- Update Section 10 Security & Access Control to clarify the async `checkIsAdmin(userId)` function
- Update Section 12 Known Issues to mark the hardcoded UUID issue as RESOLVED and document the implementation (database role check via `has_role()` RPC)
- Update Section 12 to mark the `app_settings` RLS hardcoded check as also RESOLVED (now uses `has_role()`)
- Add a note about CORS hardening applied to all edge functions

### **3. App Overview & Global Systems Structure Guide**
**Outdated content:**
- Line 154: Says "`admin` role check via `isAdminUser()` in `src/services/app-settings.ts`" — this is still correct but should note async implementation
- Line 158: Says "Admin check: `isAdminUser()` queries `user_roles` table for role = 'admin'" — outdated, now async
- Section 280: ModelSettingsProvider description doesn't mention the new database persistence

**Updates needed:**
- Update Section 6c User Roles to clarify that `checkIsAdmin(userId)` is now async and uses the `has_role()` RPC function
- Update Section 8 State Management to note that `ModelSettingsProvider` now syncs model preference to `profiles.preferred_model` column
- No structural changes needed; mostly clarifications about async/persistence behavior

### **4. Chat Interface Page Structure Guide**
**May need update (not yet read, but mentioned in plan):**
- If this guide documents extraction behavior, should mention the new 5-message throttle

**Action: Read and verify if extraction is documented**

---

## Implementation Strategy

**Total: 3 primary updates + 1 verification**
- Edge Functions guide: 4 model name updates + 1 Known Issues entry
- Admin Panel guide: 1 Security section update + 1 Known Issues update + 1 CORS note
- App Overview guide: 2 clarifications (async + persistence)
- Chat Interface guide: Verify if extraction needs documenting

All updates follow the mandatory GUIDE_STYLE_RULES.md format and must preserve the 13-section structure per guide header instructions.

