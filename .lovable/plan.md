

# Fix: Apply Correct Header Button Font Style to Story Card Title

I applied the wrong style. The header buttons use `font-semibold` (600 weight), not `font-black` (900). Here's the correction:

## File: `src/components/chronicle/WorldTab.tsx`

**Line 513** — Change from the incorrect `font-black` to the actual header button style:

```tsx
// Current (wrong):
<h2 className="text-white text-2xl font-black tracking-tight">Story Card</h2>

// Corrected to match header button style:
<h2 className="text-white text-sm font-semibold">Story Card</h2>
```

This matches exactly: `text-sm` (14px) + `font-semibold` (600 weight) — the same typography the header buttons use.

