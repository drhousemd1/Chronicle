

## Standardize Gallery PLAY Button to Match My Stories

The two PLAY buttons use different styling:

| Property | My Stories (`StoryHub`) | Gallery (`GalleryStoryCard`) |
|----------|------------------------|------------------------------|
| Height | `h-8` | `py-2.5` |
| Font size | `text-[10px]` | `text-xs` (12px) |
| Letter spacing | `tracking-wider` | none |
| Line height | `leading-none` | default |
| Text transform | `uppercase` class | hardcoded "PLAY" |

**Fix:** Update the Gallery PLAY button in `GalleryStoryCard.tsx` (line 134) to use the same classes as StoryHub:

```
h-8 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl transition-colors
```

Single line change in one file.

