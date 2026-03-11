

# Move Visibility Flags Inline with Name Row

## What
Move the "Page Specific" and "App Wide" checkboxes from the bottom of the metadata (inside the collapsible content) to sit inline on the same row as the name label (e.g., "Color Name:"). This makes them visible even when the card is collapsed.

## How (single file: `StyleGuideTool.tsx`)

### 1. Update `CollapsibleCardBody` layout (~line 214-218)

Change the name row from a vertical stack to a horizontal flex row with the name label on the left and `VisibilityFlags` on the right:

```tsx
// Before (lines 215-217):
<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
  <span style={labelStyle}>{nameLabel}:</span>
  <span style={valueStyle}>{nameValue}</span>
</div>

// After:
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={labelStyle}>{nameLabel}:</span>
    <span style={valueStyle}>{nameValue}</span>
  </div>
  <VisibilityFlags pageSpecific={pageSpecific} appWide={appWide} />
</div>
```

### 2. Remove the old `VisibilityFlags` call (~line 224)

Delete `<VisibilityFlags pageSpecific={pageSpecific} appWide={appWide} />` from the bottom of the measured content container (it's now in the name row).

### 3. Adjust `VisibilityFlags` styling (~line 171)

Remove `marginTop: 4` since it's now inline. Optionally add `flexShrink: 0` so the checkboxes don't compress on narrow cards.

No other cards, grids, or formatting changes.

