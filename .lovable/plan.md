

# Match Synopsis Body Text to Other Fields

**File:** `src/components/chronicle/StoryDetailModal.tsx`, line 478

The Synopsis body text is missing `text-sm`, making it larger than the subtext under Genre, Character Types, etc. Add `text-sm` to match.

**Change:**
```tsx
// Line 478 — add text-sm
<p className="text-sm text-[rgba(248,250,252,0.8)] leading-relaxed max-w-2xl whitespace-pre-wrap">
```

Single class addition, no other changes needed.

