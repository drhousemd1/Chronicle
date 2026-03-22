
Fix the builder layout by correcting the height/scroll container chain instead of adding more `h-full` wrappers.

What’s actually broken
- The Story Builder and Character Builder roots use `flex-1 min-h-0 ... overflow-hidden`, but they are mounted inside `src/pages/Index.tsx` wrappers that are not flex containers themselves.
- Because of that, `flex-1` on the builder roots does not establish a real height, so:
  - the left sidebar collapses to content height
  - the inner `overflow-y-auto` panels never get a bounded height, so scrolling is effectively disabled
- There is also a parent content container in `Index.tsx` using `className="flex-1 overflow-hidden"` without `min-h-0`, which is a common reason nested scroll areas stop working in flex-column layouts.

Implementation plan

1. Fix the parent content region in `src/pages/Index.tsx`
- Change the main tab content wrapper from:
  - `flex-1 overflow-hidden`
- To:
  - `flex-1 min-h-0 overflow-hidden`
- This ensures children inside the column layout can shrink and create real scroll containers.

2. Fix the World and Characters tab wrappers in `src/pages/Index.tsx`
- Keep these wrappers, but make them true height containers for their children:
  - `className="h-full min-h-0 overflow-hidden"`
- The current `flex-1 min-h-0 overflow-hidden` wrappers are not helping because they are not inside a flex parent at that level.

3. Fix the root layout containers in both builders
- In `src/features/story-builder/StoryBuilderScreen.tsx`
- In `src/features/character-builder/CharacterBuilderScreen.tsx`
- Replace root `flex-1` usage with explicit full-height container semantics:
  - from `flex flex-1 min-h-0 min-w-0 ...`
  - to `flex h-full min-h-0 min-w-0 ...`
- This gives the sidebars and scroll panes a real height to resolve against.

4. Keep scroll where it belongs
- Preserve the current intended scroll containers:
  - Story Builder main pane: `TabFieldNavigator` with `overflow-y-auto`
  - Character Builder main pane: `TabFieldNavigator` with `overflow-y-auto`
  - Story roster sidebar: inner `div` with `flex-1 overflow-y-auto`
  - Character Builder sidebar nav tray: inner `div` with `flex-1 overflow-y-auto`
- Do not move scrolling to the whole page unless necessary; the current architecture is meant to use internal pane scrolling.

5. Re-check for consistency with Chat Interface
- The chat layout uses the same responsive/sidebar pattern and already has `h-full` on its root.
- I would align the builder roots to that same pattern so the three major workspaces behave consistently.

Files to update
- `src/pages/Index.tsx`
  - add `min-h-0` to the main content wrapper
  - change World/Characters wrappers to height containers
- `src/features/story-builder/StoryBuilderScreen.tsx`
  - change root container from `flex-1`-based sizing to `h-full`
- `src/features/character-builder/CharacterBuilderScreen.tsx`
  - change root container from `flex-1`-based sizing to `h-full`

Expected result
- Story Builder left column extends full height again
- Character Builder and Story Builder regain vertical scrolling
- Internal pane scrolling works without making the whole app shell scroll
- Layout behavior matches the chat workspace more closely

Technical note
- The console warning about refs in `StoryHub.tsx` is separate from this issue. It should be cleaned up too, but it is not the cause of the broken sidebar height or missing scroll.
