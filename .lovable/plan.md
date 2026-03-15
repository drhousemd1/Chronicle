

## Plan: Preserve Personality Traits When Toggling Standard ↔ Split

### Problem
When a user fills out traits in Standard mode and switches to Split, they see empty Outward/Inward lists (only default blank traits). Their Standard traits still exist in `personality.traits` but aren't visible. Switching back preserves them, but the one-way loss feeling is frustrating.

### Solution
When toggling modes, seed the destination arrays from the source if the destination is empty or only contains blank default traits.

**File: `src/components/chronicle/PersonalitySection.tsx`**

Update the two toggle button `onClick` handlers (lines 288 and 300):

**Standard → Split (line 300):** If `outwardTraits` are empty/blank, copy current `traits` into `outwardTraits` as a starting point. Leave `inwardTraits` as-is (user adds those manually).

**Split → Standard (line 288):** If `traits` are empty/blank, merge `outwardTraits` + `inwardTraits` into `traits`.

A helper function `hasRealContent(traits)` will check if an array has any trait with a non-empty label or value (i.e., not just the single blank default).

### Implementation Detail

Add helper near top of component:
```typescript
const hasRealContent = (arr: PersonalityTrait[]) =>
  arr.some(t => t.label.trim() || t.value.trim());
```

Standard→Split onClick becomes:
```typescript
onClick={() => {
  const patch: Partial<CharacterPersonality> = { ...personality, splitMode: true };
  if (!hasRealContent(personality.outwardTraits) && hasRealContent(personality.traits)) {
    patch.outwardTraits = personality.traits.map(t => ({ ...t, id: uid('ptrait') }));
  }
  onChange(patch);
}}
```

Split→Standard onClick becomes:
```typescript
onClick={() => {
  const patch: Partial<CharacterPersonality> = { ...personality, splitMode: false };
  if (!hasRealContent(personality.traits) && (hasRealContent(personality.outwardTraits) || hasRealContent(personality.inwardTraits))) {
    patch.traits = [...personality.outwardTraits, ...personality.inwardTraits]
      .filter(t => t.label.trim() || t.value.trim())
      .map(t => ({ ...t, id: uid('ptrait') }));
    if (patch.traits.length === 0) patch.traits = [defaultTrait()];
  }
  onChange(patch);
}}
```

This way data is never lost — it seeds the other mode's arrays on switch, but only when the destination is blank. If the user has already put content in both modes, it respects that and doesn't overwrite.

Single file change, ~20 lines modified.

