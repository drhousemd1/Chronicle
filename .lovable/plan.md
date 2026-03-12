

# Update Remaining Card Text to 70% Opacity on My Stories

In `src/components/chronicle/StoryHub.tsx`, two more text elements use `rgba(248,250,252,0.3)` and need updating to `0.7`:

1. **Stats row** (~line 101): `text-[rgba(248,250,252,0.3)]` on the stats `<div>`
2. **"Created by" text** (~line 119): `text-[rgba(248,250,252,0.3)]` on the `<span>`

Both are single class value changes from `0.3` to `0.7`.

