

## Fix Enhance Sparkle Buttons to Match Style Guide Mockup

The style guide document specifies the Physical Appearance sparkle button (`.prev-pa-sparkle`) as:

- **Size**: `26px × 26px`
- **Border radius**: `7px`
- **Background**: `linear-gradient(135deg, #1a1a2e 0%, #16213e 15%, #0f3460 35%, #1a6b8a 50%, #533483 65%, #9b2c5e 80%, #e94560 100%)` — a deep navy-to-teal-to-purple-to-rose diagonal gradient
- **Icon**: white (`#fff`), centered, 10px
- **No border**, no iridescent layers, no glow/drop-shadow on the icon

### What's wrong now vs the mockup

| Property | Mockup | Current |
|----------|--------|---------|
| Background | Solid diagonal gradient (navy→teal→purple→rose) | Layered teal/purple iridescent border with dark center |
| Size | 26×26px fixed | Sized by padding (7px around 14px icon ≈ 28px) |
| Icon color | Plain white `#fff` | `cyan-200` with cyan glow drop-shadow |
| Border | None | Faux gradient border via absolute spans |
| Box shadow | None specified | `0 4px 12px rgba(0,0,0,0.40)` |
| Structure | Single element | 3 layered spans + icon |

### Changes in `src/components/chronicle/CharactersTab.tsx`

**HardcodedRow enhance button (lines 461–475)** — replace with:
```tsx
<button
  type="button"
  onClick={onEnhance}
  disabled={isEnhancing}
  title="Enhance with AI"
  className={cn(
    "w-[26px] h-[26px] rounded-[7px] flex-shrink-0 flex items-center justify-center transition-all",
    isEnhancing ? "animate-pulse cursor-wait" : "hover:brightness-125"
  )}
  style={{
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 15%, #0f3460 35%, #1a6b8a 50%, #533483 65%, #9b2c5e 80%, #e94560 100%)'
  }}
>
  <Sparkles size={10} className="text-white" />
</button>
```

**ExtraRow enhance button (lines 507–521)** — identical replacement.

This matches the mockup exactly: a compact gradient square with a plain white sparkle icon, no layered borders or glows.

