

# Create ButtonCardV2 for Story Builder Buttons

## What
Replace the 3 Story Builder `EntryCard` button entries (lines 968-1001) with a new `ButtonCardV2` component that uses structured metadata rows — matching the pattern established by `SwatchCardV2` and `TypoCardV2`.

## ButtonCardV2 Component (new, ~80 lines)

Based on your mockup, each card will have:

| Section | Content |
|---------|---------|
| **Header row** | "Button Name:" label + value |
| **Preview strip** | Button rendered centered, white background, with drop shadow for visibility |
| **Metadata rows** | Button Color, Text Color, Size, Purpose, Visual Effects, Locations — each as label/value pairs using the existing `labelStyle`/`valueStyle` |
| **Footer** | Page Specific / App Wide checkboxes |

Interface:
```typescript
interface ButtonV2Props {
  buttonName: string;        // e.g. "Shadow Surface"
  preview: React.ReactNode;  // live button render
  buttonColor: string;       // e.g. "hsl(228 7% 20%) — bg-[hsl(var(--ui-surface-2))]"
  textColor: string;         // e.g. "hsl(210,20%,93%) — text-[hsl(var(--ui-text))]"
  size: string;              // e.g. "h-10 (40px) × px-6 — rounded-xl (12px)"
  purpose: string;           // e.g. "Header action buttons (save, drafts, close)"
  visualEffects: string;     // e.g. "Drop shadow: 0 10px 30px rgba(0,0,0,0.35)"
  locations: string;         // e.g. "Story Builder header, modal footers"
  pageSpecific: boolean;
  appWide: boolean;
}
```

## Story Builder Button Cards (3 entries)

1. **Shadow Surface** — header action buttons (DRAFTS, SAVE AND CLOSE)
2. **AI Generate** — purple gradient generate button
3. **Dashed Add** — dashed border add-new buttons

Each will have all 6 metadata fields populated from the existing specs data already in the `EntryCard` entries, just restructured into the new format.

## Approach
- Add `ButtonCardV2` component definition near the other V2 card components (~line 280)
- Replace lines 968-1001 (3 `EntryCard` calls) with 3 `ButtonCardV2` calls
- Same visual styling patterns as SwatchCardV2/TypoCardV2 (2px black border, hover lift, labelStyle/valueStyle text)
- Remove the code snippet block that EntryCard had — not needed in the structured format

