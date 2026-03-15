

## Fix: Tab Key Skipping Icon Buttons

### Problem
Pressing Tab in text fields on the Story Builder and Character Builder pages stops at every icon button (AI Enhance sparkle buttons, Trash/Delete buttons, etc.) instead of jumping to the next text input.

### Solution
Add `tabIndex={-1}` to all icon-only utility buttons so they are removed from the tab order but remain clickable with a mouse. This is standard HTML accessibility practice for auxiliary action buttons.

### Files to Update

**6 component files** — each gets `tabIndex={-1}` on icon-only `<button>` elements:

1. **`src/components/chronicle/CharactersTab.tsx`** — Enhance buttons (~4 instances), trash/delete buttons
2. **`src/components/chronicle/WorldTab.tsx`** — Enhance buttons (~3 instances), trash buttons (~2 instances)
3. **`src/components/chronicle/StoryGoalsSection.tsx`** — Enhance button, delete arc button
4. **`src/components/chronicle/PersonalitySection.tsx`** — Enhance button, remove trait buttons
5. **`src/components/chronicle/CharacterGoalsSection.tsx`** — Enhance button
6. **`src/components/chronicle/arc/ArcPhaseCard.tsx`** — SparkleButton component, delete phase button
7. **`src/components/chronicle/arc/ArcBranchLane.tsx`** — Delete step buttons
8. **`src/components/chronicle/StoryCardView.tsx`** — Trash buttons (~4 instances)
9. **`src/components/chronicle/CharacterEditModal.tsx`** — Enhance buttons, icon-only action buttons

### Pattern
Every `<button>` that contains only an icon (Sparkles, Trash2, X, Plus, etc.) and no visible text label gets:
```tsx
tabIndex={-1}
```

This is a purely additive change — no behavior or styling modifications. Buttons remain fully functional via mouse/touch, they're just removed from keyboard tab order.

