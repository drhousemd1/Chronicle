

# Change Synopsis Heading to Slate Blue Underline

**File:** `src/components/chronicle/StoryDetailModal.tsx`

**Line 475-477** — Replace the banner wrapper with an underline style:

From:
```tsx
<div className="bg-[#4a5f7f] rounded-xl px-4 py-2 mb-3 inline-block shadow-sm">
  <h3 className="text-xs font-bold text-[rgba(248,250,252,0.9)] uppercase tracking-widest">Synopsis</h3>
</div>
```

To:
```tsx
<div className="border-b-2 border-[#4a5f7f] pb-1 mb-3 inline-block">
  <h3 className="text-xs font-bold text-[rgba(248,250,252,0.9)] uppercase tracking-widest">Synopsis</h3>
</div>
```

Only the Synopsis heading changes. All other headings keep their banner style for comparison.

