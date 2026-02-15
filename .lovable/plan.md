

# Fix: Chat Input Area Layout

## Changes (all in `src/components/chronicle/ChatInterfaceTab.tsx`)

### 1. Fix bottom padding being wider than top/left/right

The outer wrapper uses `p-2` which should be uniform, but `pb-8` on the parent container (line 3098) adds extra visual space at the bottom. The real issue is the `items-end` on the flex container (line 3133) plus the Send button sitting beside the textarea pushes the layout. Removing the Send button from beside the textarea (see below) will fix this. The `p-2` on the textarea wrapper is already uniform.

### 2. Move Send button to top-right, resize to match other buttons

Currently the Send button sits to the right of the textarea at the bottom (lines 3146-3156). Move it up to the Quick Actions Bar (line 3101) and restyle it to match the Chat Settings / Generate Image buttons exactly:
- Same `text-[10px] font-bold uppercase tracking-widest` sizing
- Same `px-4 py-2 rounded-xl` dimensions
- Same shadow/border/color scheme
- Position it at the far right using `ml-auto`

### 3. Extend chat input container full width

Remove the `flex gap-3 items-end` wrapper (line 3133) since the Send button no longer sits beside the textarea. The textarea wrapper becomes a direct child of the layout, spanning the full width of the container.

## Technical Details

**Lines 3101-3130 (Quick Actions Bar):** Add the Send button after the Generate Image button, with `ml-auto` to push it to the far right. Use the same class string as the other buttons, with disabled state styling.

**Lines 3132-3157 (Input Area):** Remove the `flex gap-3 items-end` wrapper div and the Send button. The textarea wrapper div becomes:
```html
<div class="bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] rounded-2xl p-2">
  <textarea ... />
</div>
```

No other files affected.

