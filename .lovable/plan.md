

# Add Crisp Text Shadow to Image Library Cards

Apologies for the oversight — the Image Library cards were missed. Two files need the same treatment:

### 1. `src/components/chronicle/ImageLibraryTab.tsx` — line 479
Add `style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}` to the bottom info `<div>`.

### 2. `src/components/chronicle/ImageLibraryPickerModal.tsx` — line 174
Same `style` prop on the bottom info `<div>`.

Both are single-line additions, identical to the other card pages.

