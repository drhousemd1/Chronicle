

# Premium AI Generate Button Implementation

## Overview

Replace the current simple gradient button with the premium multi-layered design from your ChatGPT reference. The new button has:
- Iridescent glowing border (teal + purple + white shimmer)
- Inner surface with subtle gradient overlay
- Localized color blooms (teal left, purple right)
- Top sheen highlight
- Glowing cyan sparkles icon

---

## Key Visual Layers (from reference code)

| Layer | Purpose | Effect |
|-------|---------|--------|
| **1. Outer ring** | Iridescent border | 90° gradient with white/teal/purple at high opacity |
| **2. Mask** | Creates 2px border | Solid dark fill at `inset-[2px]` |
| **3. Surface** | Button background | Teal-to-purple gradient over dark base |
| **4. Top sheen** | Glass-like highlight | Vertical gradient (white top → transparent → dark bottom) |
| **5. Border sheen** | Extra shimmer | Diagonal gradient with screen blend mode |
| **6. Teal bloom** | Left glow | Blurred radial gradient positioned top-left |
| **7. Purple bloom** | Right glow | Blurred radial gradient positioned bottom-right |
| **8. Inner edge** | Crisp definition | Inset box-shadows for depth |
| **9. Content** | Icon + text | Glowing cyan sparkles icon with text |

---

## Adaptation for Avatar Panel

The reference uses `h-12 px-6 rounded-2xl text-base` (larger button). We need to scale it down to fit the Avatar panel:

| Property | Reference | Adapted |
|----------|-----------|---------|
| Height | `h-12` (48px) | `h-10` (40px) |
| Padding | `px-6` | `px-4` |
| Border radius | `rounded-2xl` (16px) | `rounded-xl` (12px) |
| Text size | `text-base` | `text-[10px] font-bold` |
| Icon size | `h-5 w-5` | `w-3.5 h-3.5` |
| Inner mask inset | `inset-[2px]`, `rounded-[14px]` | `inset-[2px]`, `rounded-[10px]` |

---

## Implementation

### File: `src/components/chronicle/AvatarActionButtons.tsx`

Replace the current AI Generate button (lines 75-97) with the layered premium version:

```tsx
{/* AI Generate Button - Premium layered design */}
<button
  type="button"
  onClick={onGenerateClick}
  disabled={isDisabled || isGenerating}
  className="group relative flex w-full min-w-0 h-10 px-4 rounded-xl overflow-hidden
    text-white text-[10px] font-bold leading-none
    shadow-[0_12px_40px_rgba(0,0,0,0.45)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
    disabled:opacity-50"
>
  {/* Layer 1: Iridescent outer border ring */}
  <span
    aria-hidden
    className="absolute inset-0 rounded-xl"
    style={{
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)",
      filter:
        "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))",
    }}
  />

  {/* Layer 2: Mask to create 2px border effect */}
  <span
    aria-hidden
    className="absolute inset-[2px] rounded-[10px]"
    style={{ background: "#2B2D33" }}
  />

  {/* Layer 3: Button surface with gradient */}
  <span
    aria-hidden
    className="absolute inset-[2px] rounded-[10px]"
    style={{
      background:
        "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33",
    }}
  />

  {/* Layer 4: Soft top sheen */}
  <span
    aria-hidden
    className="absolute inset-[2px] rounded-[10px]"
    style={{
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))",
    }}
  />

  {/* Layer 5: Border sheen (top-left diagonal) */}
  <span
    aria-hidden
    className="absolute inset-0 rounded-xl pointer-events-none"
    style={{
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)",
      mixBlendMode: "screen",
    }}
  />

  {/* Layer 6: Teal bloom (top-left) */}
  <span
    aria-hidden
    className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none"
    style={{
      background:
        "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)",
    }}
  />

  {/* Layer 7: Purple bloom (bottom-right) */}
  <span
    aria-hidden
    className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none"
    style={{
      background:
        "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)",
    }}
  />

  {/* Layer 8: Crisp inner edge */}
  <span
    aria-hidden
    className="absolute inset-0 rounded-xl pointer-events-none"
    style={{
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)",
    }}
  />

  {/* Content layer */}
  <span className="relative z-10 flex items-center justify-center gap-2 w-full">
    <Sparkles 
      className="w-3.5 h-3.5 shrink-0 text-cyan-200" 
      style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
    />
    <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
      {isGenerating ? "Generating..." : "AI Generate"}
    </span>
  </span>
</button>
```

---

## Layer Breakdown (Visual Reference)

```text
┌─────────────────────────────────────────┐
│  Layer 1: Iridescent gradient border    │ ← Full button size
│  ┌───────────────────────────────────┐  │
│  │  Layer 2: Dark mask (#2B2D33)     │  │ ← inset-[2px]
│  │  Layer 3: Teal-purple gradient    │  │
│  │  Layer 4: Top sheen highlight     │  │
│  │                                   │  │
│  │    ✨ AI Generate                 │  │ ← Content (z-10)
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  🔵 Teal bloom (blur, top-left)         │ ← Extends beyond button
│                        🟣 Purple bloom  │ ← Extends beyond button
└─────────────────────────────────────────┘
```

---

## Key Color Values

| Color | HSL/RGB | Usage |
|-------|---------|-------|
| **Teal** | `rgb(34,184,200)` / `#22B8C8` | Left bloom, border accent, sparkles |
| **Purple** | `rgb(109,94,247)` / `#6D5EF7` | Right bloom, border accent |
| **Surface** | `#2B2D33` | Button background |
| **White** | Various alphas | Border shimmer, sheens |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/AvatarActionButtons.tsx` | Replace AI Generate button with premium layered version |

---

## Expected Result

The AI Generate button will have:
- A glowing iridescent border that shimmers teal → white → purple
- A dark inner surface with subtle gradient
- Colored bloom effects extending from the corners
- A glowing cyan sparkles icon
- Premium glass-like top sheen
- Matches your ChatGPT mockup exactly

