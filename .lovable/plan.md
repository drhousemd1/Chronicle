
Diagnosis:
- You’re right: this is not a “multiple gray choice” problem, it’s a compositing mismatch.
- The Add/Create tile body is not solid `#2a2a2f`; it is `bg-[#3a3a3f]/40` on top of a `#2a2a2f` parent in `src/components/chronicle/WorldTab.tsx` (tile at line ~455, parent at ~471/476).
- That renders to an effective center color of approximately `#303035` (not `#2a2a2f`), which is why your overlay test fails against the Import button.

Implementation plan (single-scope fix):
1. In `src/pages/Index.tsx`, update only the 4 Story Builder header action buttons (Import, Export, Finalize and Close, Save Draft; lines ~2025, 2034, 2068, 2099).
2. Change default background:
   - `bg-[#2a2a2f]` → `bg-[#303035]` (matches Add/Create rendered center tone).
3. Match interaction tone to the same source logic:
   - `hover:bg-[#35353b] active:bg-[#35353b]` → `hover:bg-[#343439] active:bg-[#343439]` (equivalent of `#3a3a3f/60` over `#2a2a2f`).
4. Keep everything else exactly unchanged (shadow stack, border-0, sizing, typography, rings, spacing).

Why this will finally match:
- We’ll match the rendered pixel color of the Add/Create tile body (what your overlay test measures), not the underlying sidebar base token.
- This removes the alpha-on-dark-vs-solid-color mismatch that caused prior drift.

Verification plan:
- Re-run your exact overlay method:
  1) sample center of Add/Create tile body,
  2) sample center of Import button body,
  3) confirm no visible shift at center.
- If there is still a residual delta, we’ll do one final 1-hex-step calibration (`#303035` ↔ `#313136`) and lock it.
