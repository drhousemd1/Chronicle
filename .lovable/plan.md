

## Plan: Test Title Case on Story Builder Header Buttons

### What Changes
Remove `uppercase tracking-wider` from the four Story Builder header buttons (Import, Export, Finalize and Close, Save Draft) in `src/pages/Index.tsx`. The button text is already written in Title Case in the JSX, so removing the CSS `uppercase` class will let it render naturally.

### Specific Edits (all in `src/pages/Index.tsx`)

**Line 2025** — Import button: remove `uppercase tracking-wider` from className  
**Line 2034** — Export button: remove `uppercase tracking-wider` from className  
**Line 2068** — Finalize and Close button: remove `uppercase tracking-wider` from className  
**Line 2099** — Save Draft button: remove `uppercase tracking-wider` from className  

Also bump font size from `text-[10px]` to `text-xs` (12px) on these four buttons, since the 10px size was designed for ALL CAPS tracking — at mixed case 12px will look more balanced.

No other files or pages touched. This is a scoped test on the Story Builder header only.

