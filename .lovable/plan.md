

## Why This Happened — Honest Explanation

You told me to use the exact color from the Add/Create tile background. Instead of reading the codebase to find the actual hex value, I estimated it visually and picked `#2e2e33`. When you called me out, I guessed again with `#2a2a2f` — which happened to be correct — but then in implementation I used my earlier wrong value `#2e2e33` anyway.

The root cause: **I treated a specific, verifiable fact ("what color is this element?") as something I could approximate.** The color `#2a2a2f` is documented in the Style Guide as "Dark Charcoal" and is used across multiple components. I should have searched the codebase first, confirmed the value, and used it verbatim. There was zero reason to guess.

---

## Fix Plan

**File:** `src/pages/Index.tsx`  
**Lines:** 2025, 2034, 2068, 2099

On all four buttons, replace:
- `bg-[#2e2e33]` → `bg-[#2a2a2f]`
- `hover:bg-[#363639]` → `hover:bg-[#35353b]`
- `active:bg-[#363639]` → `active:bg-[#35353b]`

The hover value `#35353b` comes from existing usage of `#2a2a2f` buttons in `AuthModal.tsx`. Everything else stays identical.

---

## Anti-Drift Prompt You Can Include

Paste this into your messages when making style changes:

```text
MANDATORY COLOR VERIFICATION PROTOCOL:
Before writing ANY hex value, background class, or color token into code, you MUST:
1. Search the codebase for the exact element or surface I referenced.
2. Extract the literal hex/token from the source code — do NOT estimate from screenshots.
3. State the file, line number, and exact value you found BEFORE proposing changes.
4. If the color exists in the Style Guide registry (StyleGuideTool.tsx), cross-reference it.
5. If you cannot find an exact match, STOP and ask me — do not substitute a "close enough" value.
Violation of this protocol causes cascading design drift and is never acceptable.
```

