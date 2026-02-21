
# Restyle Story Arc Components to Match HTML Mockup Exactly

## Overview

The current implementation uses our app's default dark zinc styling (`bg-[#3a3a3f]/30`, small text inputs, simple SVG connectors). The HTML mockup uses a distinctly different visual language. This plan details every styling mismatch and the exact fix.

---

## 1. Outer Shell (`StoryGoalsSection.tsx`)

**Current**: `bg-[#2a2a2f]` with `rounded-[24px]`, header `bg-[#4a5f7f]`
**Mockup**: `.hybrid-shell` uses `bg-[rgba(39,43,54,0.98)]` with `rounded-[38px]`, border `rgba(104,129,171,0.28)`, heavy shadow `0 28px 72px rgba(0,0,0,0.58)`. Header `.hybrid-shell-header` uses `bg-[#4f6b95]` with `min-h-[80px]`, padding `18px 30px`, border-bottom `rgba(201,214,238,0.18)`.

**Fix**: Update shell border-radius to `rounded-[38px]`, background to `rgba(39,43,54,0.98)`, shadow to match. Header background to `#4f6b95`, larger padding, title font-size `43px` equivalent (~`text-4xl`), caret character.

---

## 2. Goal Card (Root Phase)

**Current**: `p-5 bg-[#3a3a3f]/30 rounded-2xl border-blue-500/20`
**Mockup**: `.hybrid-goal-card` uses `border: 1px solid rgba(80,111,157,0.5)`, `rounded-[26px]`, `bg-[rgba(46,49,60,0.98)]`, `padding: 30px`.

**Fix**: Update border color to `rgba(80,111,157,0.5)`, background to `rgba(46,49,60,0.98)`, border-radius to `rounded-[26px]`, padding to `p-[30px]`.

---

## 3. Goal Card Layout Grid

**Current**: `grid-cols-12` with `md:col-span-9` / `md:col-span-3`
**Mockup**: `.hybrid-goal-grid` uses `grid-template-columns: minmax(0,1fr) 220px` -- a fixed 220px right column for progress.

**Fix**: Change grid to `grid-cols-[1fr_220px]` on desktop.

---

## 4. Field Labels

**Current**: `text-[10px] font-bold text-zinc-400 uppercase tracking-widest`
**Mockup**: `.hybrid-row-label` uses `font-size: 11px`, `letter-spacing: 0.22em`, `color: rgba(198,213,238,0.86)`, `font-weight: 700`, `margin-bottom: 8px`.

**Fix**: Change to `text-[11px]` with `tracking-[0.22em]` and color `text-[rgba(198,213,238,0.86)]`.

---

## 5. Input Fields

**Current**: `text-sm bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2`
**Mockup**: `.hybrid-field` uses `border-radius: 14px`, `bg: rgba(24,28,37,0.92)`, `padding: 0 18px`, `font-size: 16px`, `height: 54px` (input) or `height: 84px` (textarea), `margin-bottom: 14px`. Placeholder color `rgba(151,160,180,0.82)`.

**Fix**: Update to `rounded-[14px]`, `bg-[rgba(24,28,37,0.92)]`, `px-[18px]`, `text-base`, input height `h-[54px]`, textarea `h-[84px]`, `mb-3.5`, placeholder color.

---

## 6. Progress Ring

**Current**: Uses `CircularProgress` SVG component at 96px
**Mockup**: `.hybrid-progress-ring` is a simple CSS circle: `154px x 154px`, `border: 12px solid rgba(51,80,125,0.85)`, `border-radius: 999px`, text `42px font-weight 700`, color `rgba(195,211,237,0.94)`.

**Fix**: Replace `CircularProgress` SVG with a CSS-based ring matching the mockup exactly. The trash button sits in `.hybrid-progress-top` above the ring, right-aligned.

---

## 7. Guidance Strength Section

**Current**: Uses our `GuidanceStrengthSlider` component with dot-based track
**Mockup**: Uses a continuous track with fill + draggable knob:
- Title: `11px`, `letter-spacing: 0.22em`, `color: rgba(198,212,236,0.84)`, margin `14px 0 6px`
- Subtitle: `16px`, `color: rgba(171,185,208,0.86)`, margin `0 0 10px`
- Track: `12px` tall, `bg: rgba(21,25,34,0.95)`, rounded full
- Fill: gradient `linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)`, width based on selected value
- Knob: `24px` circle, white with border, positioned at fill end
- Labels: `flex justify-between`, `11px`, `tracking-[0.16em]`, `font-weight: 700`, active label `color: #6ea1ff`
- Body: bordered box `rounded-[16px]`, `bg: rgba(37,40,50,0.92)`, `border: rgba(255,255,255,0.08)`, padding `18px`, text `15px`, `color: rgba(206,216,233,0.88)`, `line-height: 1.45`

**Fix**: Rewrite `GuidanceStrengthSlider` to use a continuous fill track with knob instead of dot positions, matching the mockup's exact colors and dimensions.

---

## 8. Steps Section Header

**Current**: `text-[10px] font-bold text-white uppercase tracking-[0.2em]` with a basic label
**Mockup**: `.hybrid-steps-head` uses `11px`, `tracking-[0.2em]`, `font-weight: 700`, `color: rgba(226,234,247,0.95)`, includes a checkbox icon in blue `#67a6ff`, border-top `rgba(255,255,255,0.08)`, padding-top `20px`, margin-top `18px`.

**Fix**: Match exact colors and include the blue checkbox icon.

---

## 9. Mode Toggle (Simple/Advanced)

**Current**: Rectangular buttons with `bg-zinc-800/80 rounded-lg`
**Mockup**: `.hybrid-mode-toggle` uses `border-radius: 999px` (pill shape), `border: 1px solid rgba(123,155,203,0.44)`, `bg: rgba(21,25,35,0.86)`. Buttons: `10px`, `tracking-[0.14em]`, `font-weight: 700`. Active: `bg: rgba(99,135,194,0.58)`, `color: #edf3ff`. Inactive: `color: rgba(198,213,238,0.82)`.

**Fix**: Update `ArcModeToggle` to pill shape with exact border/background colors.

---

## 10. Split Connector

**Current**: Simple static SVG with lines
**Mockup**: `.hybrid-flow-split-connector` is `66px` tall, uses SVG path with glow filter (`stdDeviation: 0.8`, white `flood-opacity: 0.28`), stroke `rgba(232,238,248,0.82)`, `stroke-width: 1.8`. Positioned absolutely with `padding-top: 72px` on the flow container.

**Fix**: Replace simple SVG with a dynamically-drawn split connector using the mockup's glow filter and stroke style. The steps flow area should have `padding-top: 72px` with the connector absolutely positioned at top.

---

## 11. Branch Lanes (`ArcBranchLane.tsx`)

**Current**: Simple `rounded-xl border p-4` with `bg-red-500/5` / `bg-green-500/5`
**Mockup** uses a nested structure:
- Outer: `.branch-group` with `border: 1px dotted`, `border-radius: 24px`, `padding: 14px`, `bg: rgba(13,17,25,0.26)`. Fail: `border-color: rgba(240,74,95,0.52)`. Success: `border-color: rgba(34,197,127,0.52)`.
- Header cluster: `.cluster.header` with `border-radius: 18px`, `bg: rgba(43,47,57,0.9)`, `box-shadow: 0 14px 26px rgba(0,0,0,0.4)`. Strip (title bar): fail `bg: rgba(240,74,95,0.28)`, success `bg: rgba(34,197,127,0.28)`, `padding: 14px 18px` (or `12px 16px` in hybrid flow). Body: `padding: 16px` (or `13px` in hybrid flow).
- Title: `12px`, `tracking-[0.22em]`, `font-weight: 700`, `color: rgba(255,255,255,0.72)`
- Caption (trigger label): `10px`, `tracking-[0.2em]`, `color: rgba(214,227,248,0.72)`, `font-weight: 700`
- Trigger input: `.input` with `height: 48px`, `border-radius: 12px`, `bg: rgba(0,0,0,0.25)`, `font-size: 15px`

**Fix**: Completely restyle `ArcBranchLane` to use the nested `.branch-group` > `.cluster.header` > `.cluster-strip` + `.cluster-body` structure with exact colors.

---

## 12. Step Cards

**Current**: `bg-zinc-900/40 rounded-lg p-3 border-white/5`
**Mockup**: `.step-card` uses `padding: 10px 12px 12px`, `border-radius: 18px` (from `.cluster`), fail: `bg: rgba(78,58,68,0.78)`, success: `bg: rgba(51,75,66,0.78)`, `border-color: rgba(255,255,255,0.14)`.
- Step index label: `11px`, `tracking-[0.16em]`, `font-weight: 700`, `color: rgba(190,207,232,0.72)`
- Status controls: `FAILED` and `SUCCEEDED` text labels next to buttons. Labels: `10px`, `tracking-[0.08em]`, `color: rgba(205,219,242,0.78)`.
- Status buttons: `30px x 30px`, `border-radius: 9px`, `border: 1px solid rgba(255,255,255,0.22)`, `bg: rgba(255,255,255,0.06)`. Active failed: `border-color: rgba(239,68,68,0.6)`, `color: #fca5a5`, `bg: rgba(239,68,68,0.2)`. Active succeeded: `border-color: rgba(16,185,129,0.6)`, `color: #a7f3d0`, `bg: rgba(16,185,129,0.2)`.
- Step input: `height: 40px`, `border-radius: 12px` (or `10px` in hybrid), `bg: rgba(0,0,0,0.25)`.
- Completion meta: `margin-top: 8px`, `11px`, `tracking-[0.04em]`, `color: rgba(202,214,236,0.72)` -- "Completed on (Day #), (Time icon)"
- Trash icon button: `30px x 30px`, `border-radius: 10px`, `border: 1px solid rgba(248,113,113,0.5)`, `color: #fca5a5`

**Fix**: Completely restyle step cards with exact background colors per branch, proper status button sizing and styling, text labels next to buttons, and the completion meta line.

---

## 13. Add Step Button

**Current**: Text link style `text-red-400 / text-green-400`
**Mockup**: `.lane-add` is a full-width button: `height: 50px` (hybrid), `border-radius: 18px` (from `.cluster`), `letter-spacing: 0.16em`, `font-size: 12px`, `font-weight: 700`, `border: 1px solid rgba(255,255,255,0.16)`. Fail: `bg: rgba(88,60,70,0.78)`. Success: `bg: rgba(58,86,76,0.78)`. Text: `#fff`.

**Fix**: Change from text link to full-width bordered button with exact colors.

---

## 14. Add Next Phase Button

**Current**: Small text link right-aligned
**Mockup**: `.btn.small.blue` -- `height: 42px`, `padding: 0 16px`, `border-radius: 12px`, `border: 1px solid rgba(110,161,255,0.38)`, `bg: rgba(79,106,145,0.42)`, `color: #fff`, `font-weight: 700`, `letter-spacing: 0.14em`. Right-aligned in `.hybrid-linked-actions`.

**Fix**: Change to a proper bordered button matching the mockup.

---

## 15. Add New Story Arc Button

**Current**: Dashed border button at bottom
**Mockup**: `.hybrid-add-goal` -- `height: 64px`, `border: 2px dashed rgba(177,188,210,0.45)`, `border-radius: 18px`, `bg: transparent`, `color: #67a6ff`, `font-size: 16px`, `font-weight: 600`.

**Fix**: Update to exact dimensions and color `#67a6ff`.

---

## 16. Phase Cards (`ArcPhaseCard.tsx`)

Phase cards in the mockup use the same `.hybrid-goal-card` styling as the root -- they don't have a separate lighter treatment. The connector between phases uses the `.hybrid-chain-connector` SVG system. Linked phase nodes in the mockup have `border: 0`, no box-shadow, and use the same branch grid with `gap: 24px`.

**Fix**: Update `ArcPhaseCard` styling to match. Remove the thin blue connector line and use a proper chain connector matching the mockup.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/StoryGoalsSection.tsx` | Outer shell, goal card, grid layout, field labels, input styling, progress ring, buttons -- all restyles to match mockup |
| `src/components/chronicle/arc/ArcBranchLane.tsx` | Complete restyle: nested branch-group/cluster structure, step card backgrounds, status buttons with labels, add step button, completion meta |
| `src/components/chronicle/arc/ArcModeToggle.tsx` | Pill shape, exact border/background/active colors |
| `src/components/chronicle/arc/ArcConnectors.tsx` | Replace simple SVG with glow-filtered connector matching mockup dimensions |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Match root card styling, proper chain connector |
| `src/components/chronicle/GuidanceStrengthSlider.tsx` | Rewrite to continuous fill track with knob, exact colors/dimensions, body text box styling |

No logic changes -- this is purely a visual restyling to match the mockup exactly.
