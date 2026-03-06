
## Standardize Play Button on Community Gallery

**File:** `src/components/chronicle/GalleryStoryCard.tsx`, lines 132-139

Update the Play button to match the My Stories page style:
- Change text from "Play" to "PLAY" (all caps)
- Remove the Play icon (currently `<Play className="w-3.5 h-3.5 fill-current" />`)
- Keep the gap-1.5 but remove the icon flex display
- Keep Like and Save buttons unchanged

The Play button should change from:
```
<Play className="w-3.5 h-3.5 fill-current" />
Play
```

To just:
```
PLAY
```

Keep the existing button styling: `px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-2xl hover:bg-blue-500 transition-colors`
