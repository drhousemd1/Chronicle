

## Fix Enhance Sparkle Buttons — Exact Layered Style from Mockup

The current buttons use a solid diagonal gradient fill with a white icon. The mockup uses a **4-layer structure**: outer box-shadow, iridescent border ring, dark interior mask, and cyan icon with glow.

### Changes in `src/components/chronicle/CharactersTab.tsx`

**HardcodedRow enhance button (lines 461–475)** and **ExtraRow enhance button (lines 507–521)** — replace both with identical markup:

```tsx
<button
  type="button"
  onClick={onEnhance}
  disabled={isEnhancing}
  title="Enhance with AI"
  className={cn(
    "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
    isEnhancing ? "animate-pulse cursor-wait" : "hover:brightness-125"
  )}
  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
>
  {/* Iridescent border ring */}
  <span
    aria-hidden
    className="absolute inset-0 rounded-lg pointer-events-none"
    style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)'
    }}
  />
  {/* Dark interior mask */}
  <span
    aria-hidden
    className="absolute rounded-[6px] pointer-events-none"
    style={{
      inset: '1.5px',
      background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33'
    }}
  />
  {/* Icon */}
  <Sparkles
    size={13}
    className="relative z-10"
    style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }}
  />
</button>
```

Key differences from what's currently deployed:
- **No solid gradient fill** — replaced with border-ring + dark-mask layers
- **Icon color**: `text-cyan-200` (not white)
- **Icon size**: 13px (not 10px)
- **Icon glow**: `drop-shadow` filter on the SVG
- **Padding**: 6px (not fixed 26×26)
- **Border radius**: `rounded-lg` (8px, not 7px)
- **Background**: transparent on the button itself; visual comes from layered spans

This matches the exact inline HTML provided by the user, translated to React/Tailwind.

