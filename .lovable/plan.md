

## Fix: Align Goals and Desires Styling with Standard HardcodedSection

### Problems Found
Comparing `CharacterGoalsSection` against the `HardcodedSection` pattern used by all other containers (Relationships, Secrets, Basics, etc.):

| Element | Goals (Current) | Standard (Correct) |
|---|---|---|
| **Outer border** | `border border-[#4a5f7f]` (slate blue) | No border — uses inset shadow stack |
| **Outer shadow** | Only drop shadow | Full stack: drop + inset highlights |
| **Header bg** | Flat `bg-[#4a5f7f]` | Gradient `from-[#5a7292] to-[#4a5f7f]` |
| **Header border** | `border-b border-[#4a5f7f]` | `border-t border-white/20` |
| **Gloss sheen** | Missing | White gradient overlay at 60% height |
| **Title font** | `font-semibold tracking-tight` | `font-bold tracking-[-0.015em]` |
| **Title z-index** | None | `relative z-[1]` |
| **Input focus** | `focus:ring-2 focus:ring-blue-500/20` | adds `focus:border-blue-500` |

### Changes — Single File: `CharacterGoalsSection.tsx`

**1. Outer container (line 208):** Remove `border border-[#4a5f7f]`, add full shadow stack matching HardcodedSection.

**2. Header (line 210):** Replace flat bg with gradient, swap `border-b` for `border-t border-white/20`, add gloss sheen overlay div.

**3. Title (line 211):** Change `font-semibold tracking-tight` to `font-bold tracking-[-0.015em]`, add `relative z-[1]`.

**4. Toggle button (line 213):** Add `relative z-[1]` so it sits above the gloss overlay.

**5. All textarea focus classes (lines 241, 277, 314):** Add `focus:border-blue-500` to match the standard input focus effect.

