

# Apply View More Header Style to Story Card Title

## File: `src/components/chronicle/WorldTab.tsx`

**Line 511-513**: Update the section header to match the View More modal's bolder typography

Current:
```tsx
<div className="bg-[#4a5f7f] border-b border-ghost-white px-6 py-4 flex items-center gap-3 shadow-lg">
  <svg ... width="18" height="18" ... strokeWidth="2.5" ... />
  <h2 className="text-white text-xl font-bold tracking-tight">Story Card</h2>
</div>
```

Change to:
```tsx
<div className="bg-[#4a5f7f] border-b border-ghost-white px-6 py-4 flex items-center gap-3 shadow-lg">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/90"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  <h2 className="text-white text-2xl font-black tracking-tight">Story Card</h2>
</div>
```

**Changes:**
- Title: `text-2xl font-black` (larger, weight 900) vs current `text-xl font-bold` (weight 700)
- Icon: Slightly larger (20px), thinner stroke (2px), and `text-white/90` for the cleaner View More look

This will show you how the heavier `font-black` weight looks with mixed case "Story Card" text.

