

# Increase CharacterEditModal Height

The modal currently uses `max-h-[90vh]` but no minimum height, so it only grows as tall as its content. Adding a fixed height will make it consistently taller.

## Change — `src/components/chronicle/CharacterEditModal.tsx`

**Line 1049** — Add `h-[85vh]` to the `DialogContent` className alongside the existing `max-h-[90vh]`:

```
max-w-6xl h-[85vh] max-h-[90vh] p-0 gap-0 overflow-hidden bg-[#2a2a2f] border-ghost-white [&>button]:hidden
```

This gives the modal a consistent 85% viewport height while capping at 90vh. Not full-page, but noticeably taller than the current content-driven sizing.

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

