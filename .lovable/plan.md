

## Fix Basics Container — Match Physical Appearance Styling

The Basics container at lines 1233-1244 still uses the old styling with `border border-[#4a5f7f]` and flat header. It needs to match the updated HardcodedSection styling.

### Changes in `src/components/chronicle/CharactersTab.tsx`

**Line 1233 — Outer container**

From:
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-[#4a5f7f] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
```
To:
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
```

**Line 1234 — Header**

From:
```tsx
<div className="bg-[#4a5f7f] border-b border-[#4a5f7f] px-5 py-3 flex items-center justify-between shadow-lg">
```
To:
```tsx
<div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg overflow-hidden">
```

**After line 1234 — Add gloss sheen overlay** (before the h2 title):
```tsx
<div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
```

**Line 1235 — Title**: Add `relative z-[1]` and tracking:
```tsx
<h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Basics</h2>
```

**Line 1236-1241 — Chevron button**: Add `relative z-[1]` so it sits above the gloss overlay.

**Line 1244 — Inner card**

From:
```tsx
<div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl border border-[#4a5f7f]">
```
To:
```tsx
<div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
```

**Input fields inside Basics** (lines 1367-1457): Update all `AutoResizeTextarea` instances from `bg-zinc-900/50 border border-[#4a5f7f]` to `bg-[#1c1c1f] border-t border-black/35 border-x-0 border-b-0` to match the HardcodedRow field styling.

This covers: Name, Nicknames, Age, Sex/Identity, Sexual Orientation, Location, Current Mood, and Role Description fields (8 inputs total).

