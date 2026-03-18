

# Move HTML Topbar Buttons into React Header, Remove Duplicate

## Problem
The API Inspector has two header bars: the React header (`api-inspector.tsx` lines 9-16) and the iframe's own topbar (`.topbar` in the HTML file, lines 676-690). The screenshot shows both stacked, with the lower one containing breadcrumbs, a back button, and action buttons (+ Add Block, Save, Edit, View).

## Fix

### 1. Hide the HTML topbar (`public/api-call-inspector-chronicle.html`)
- Change `.topbar` CSS (line 54) to `display: none` so the iframe no longer renders its own header bar. This removes the duplicate back button and breadcrumb.

### 2. Move action buttons into the React header (`src/pages/style-guide/api-inspector.tsx`)
- Add the four buttons (+ Add Block, Save, Edit, View) to the right side of the existing React header bar using `ml-auto flex gap-2`.
- These buttons will communicate with the iframe via `postMessage` to trigger `addNewBlock()`, `openSave()`, `toggleEditMode()`, and `openView()`.

### 3. Add postMessage listener in the HTML file
- Add a `window.addEventListener('message', ...)` handler in the HTML that listens for action commands (`addBlock`, `save`, `editToggle`, `view`) and calls the corresponding functions.
- Also post status messages back to parent (edit mode state, save enabled state) so the React buttons can reflect the correct visual state.

### 4. Breadcrumb in React header
- Add the breadcrumb text ("Admin › API Call Inspector › Chat (Main Roleplay)") to the React header, replacing the simple title, or keep the current title and skip the breadcrumb since the React header already shows "API CALL INSPECTOR" with a back button.

