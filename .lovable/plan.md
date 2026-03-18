

# Separate Domain Group Containers with Slate-Blue Headers

## What changes

In `src/pages/style-guide/ui-audit.tsx`, lines ~436-543 (the findings rendering loop):

Currently each domain group is just a text label + count pill followed by cards in one long container. Instead, each domain group will be wrapped in its own `<Section>` component — the same one used on the overview page — giving each domain its own slate-blue gradient header bar, title, count pill, and separate container body.

### Specific changes

1. **Wrap each group in `<Section>`**: Replace the current `<div key={group}>` with `<Section title={...}>` so each domain gets its own panel with the slate-blue header, matching Scan Modules / App Pages on the overview tab.

2. **Move count pill into the Section header**: The count badge (e.g., "12") will sit inside the header row next to the title, right-aligned.

3. **Extend `Section` component** (lines 144-151): Add an optional `badge` prop so we can render the count pill inside the header bar without duplicating the header markup.

4. **Remove the old inline group header** (the `<h3>` + `<span>` at line 438) since the `Section` header replaces it.

Result: Each domain (UI/UX, Orphan Code, Cleanup, Functionality, etc.) gets its own visually distinct container with the same slate-blue header treatment used everywhere else in the Quality Hub.

