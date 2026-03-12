

# Make Text Shadow Actually Visible on My Stories Cards

## Problem
The bottom info container already had `textShadow: '0 2px 6px rgba(0,0,0,0.7)'` before our change — so nothing visually changed.

## Solution
Replace the subtle shadow with a much more aggressive one to actually test the effect:

**File: `src/components/chronicle/StoryHub.tsx`** — line 104

```
- style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
+ style={{ textShadow: '0 2px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)' }}
```

This uses a double-layered, fully opaque black shadow that should be noticeably different. Still easy to revert — same single `style` prop.

