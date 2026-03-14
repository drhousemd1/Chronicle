

## Apply Iridescent Sparkle Button to All Remaining Enhance Icons

Four locations still use the old plain style (`p-1.5 rounded-md text-zinc-400`). Each needs the exact 4-layer iridescent button already implemented in `HardcodedRow`/`ExtraRow`.

### Locations to update

1. **`PersonalitySection.tsx`** (lines 103–116) — `TraitRow` enhance button
2. **`CharacterGoalsSection.tsx`** (lines 185–202) — `SparkleButton` component
3. **`CharactersTab.tsx`** (lines 1482–1490) — Role Description enhance button
4. **`CharactersTab.tsx`** (lines 1907–1914) — Custom section item enhance button

### Replacement for each

Every instance gets the same markup (with its existing `onClick`/`disabled`/field-key logic preserved):

```tsx
<button
  type="button"
  onClick={...}
  disabled={...}
  title="Enhance with AI"
  className={cn(
    "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
    isEnhancing ? "animate-pulse cursor-wait" : "hover:brightness-125"
  )}
  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
>
  <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none"
    style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
  <span aria-hidden className="absolute rounded-[6px] pointer-events-none"
    style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
  <Sparkles size={13} className="relative z-10"
    style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
</button>
```

Each button keeps its own `onClick` handler and disabled/enhancing field key — only the visual wrapper changes.

