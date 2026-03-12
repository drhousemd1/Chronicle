

# Update Draft Badge: White Text Matching Published Style

## Change

**File**: `src/components/chronicle/StoryHub.tsx` — line 62

The current Draft badge uses `text-amber-400`. Change it to `text-white` to match the user's request, keeping the same container styling as the Published badge (`px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] uppercase tracking-wide`).

```tsx
// Before
<div className="... text-amber-400 uppercase tracking-wide">Draft</div>

// After
<div className="... text-white uppercase tracking-wide">DRAFT</div>
```

Single line change — text color from amber to white, label uppercased to "DRAFT" for consistency with "PUBLISHED".

