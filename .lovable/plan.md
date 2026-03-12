

# Apply Underline Style to All Story Detail Modal Headings

**File:** `src/components/chronicle/StoryDetailModal.tsx`

Change the 5 remaining section headings from solid banner style to the underline style matching Synopsis:

From:
```tsx
<div className="bg-[#4a5f7f] rounded-xl px-4 py-2 mb-3 inline-block shadow-sm">
```

To:
```tsx
<div className="border-b-2 border-[#4a5f7f] pb-1 mb-3 inline-block">
```

Apply to: Genre, Character Types, Story Origin, Trigger Warnings, Characters.

