

# Improve Readability of Internal Thought Text in Chat

## Problem
Internal thoughts (text wrapped in parentheses) use `text-sm font-light italic` styling, which makes the font smaller and thinner than other text types (speech, action, narration). Combined with the indigo glow effect, this makes thoughts harder to read.

## Change

**File: `src/components/chronicle/ChatInterfaceTab.tsx` (line 143)**

Current thought styling:
```
text-indigo-200/90 text-sm italic font-light tracking-tight
```

Updated thought styling:
```
text-indigo-200/90 italic tracking-tight
```

- Remove `text-sm` -- keeps font the same size as surrounding text
- Remove `font-light` -- uses normal weight instead of thin, improving legibility
- Keep `italic` -- still visually distinguishes thoughts from narration
- Keep `tracking-tight` and the purple glow `textShadow` -- preserves the distinctive look
- Keep `animate-in fade-in zoom-in-95 duration-500` -- preserves the entrance animation

The result: thoughts remain visually distinct (italic + purple glow) but are no longer smaller or thinner than other text.

