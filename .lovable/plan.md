

# Fix Avatar Placeholder: Corner Clipping + Match Cover Image Style

## Issue 1: Dashed Border Corner Clipping
The outer container has `overflow-hidden` and `rounded-2xl`, while the inner placeholder also has `rounded-2xl` with `border-2 border-dashed`. The dashed border's corners get clipped by the parent's overflow. Fix: remove `overflow-hidden` from the outer container when there's no avatar (it's only needed for image cropping), or remove `rounded-2xl` from the inner placeholder since the parent already clips it — and instead use `rounded-[14px]` (slightly smaller than the parent's 16px) to inset the dashed corners cleanly.

Actually, the simplest fix: remove `overflow-hidden` conditionally — only apply it when there's an image. When empty, the dashed border corners won't clip.

## Issue 2: Match Cover Image Placeholder Style
The cover image placeholder (WorldTab line 563) uses:
- `bg-gradient-to-br from-zinc-800 to-zinc-900`
- An SVG image icon (40x40)
- `"No Cover"` label in `text-[10px] font-black uppercase tracking-widest text-zinc-500`
- `gap-3` between icon and label

The avatar placeholder (CharactersTab line 706) currently just shows the character's first letter on a flat `bg-zinc-800`.

We should update it to match: gradient background, an icon (user/person icon), and a label.

## Changes: `src/components/chronicle/CharactersTab.tsx`

**Line 686** — Make `overflow-hidden` conditional on having an avatar:
```tsx
className={`relative group w-48 h-48 rounded-2xl shadow-lg select-none ${
  isRepositioning 
    ? 'ring-4 ring-blue-500 cursor-move overflow-hidden' 
    : selected.avatarDataUrl 
      ? 'border-2 border-ghost-white overflow-hidden' 
      : ''
}`}
```

**Lines 706-708** — Replace the simple letter placeholder with the cover image style:
```tsx
<div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center border-2 border-dashed border-zinc-600 gap-3 rounded-2xl">
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No Avatar</span>
</div>
```

This uses a person/user SVG icon instead of the image icon, keeping the same visual pattern (gradient, dashed border, icon + label, spacing).

