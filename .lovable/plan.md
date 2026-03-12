

# Remove Solid Border from Avatar Placeholder When Empty

Same double-border issue as the cover image. The outer container (line 686) always applies `border-2 border-ghost-white`, and the inner empty-state div (line 706) adds `border-2 border-dashed border-zinc-600`.

## Fix: `src/components/chronicle/CharactersTab.tsx`

**Line 686** — Make the solid border conditional on having an avatar:

```tsx
// From:
className={`relative group w-48 h-48 rounded-2xl overflow-hidden shadow-lg select-none ${isRepositioning ? 'ring-4 ring-blue-500 cursor-move' : 'border-2 border-ghost-white'}`}

// To:
className={`relative group w-48 h-48 rounded-2xl overflow-hidden shadow-lg select-none ${isRepositioning ? 'ring-4 ring-blue-500 cursor-move' : selected.avatarDataUrl ? 'border-2 border-ghost-white' : ''}`}
```

When no avatar exists, the outer container has no border, leaving only the inner dashed border visible.

