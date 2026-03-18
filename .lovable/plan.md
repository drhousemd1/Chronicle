

# Replace API Inspector HTML with Uploaded Design

## Problem
The current `public/api-call-inspector-chronicle.html` is a 143-line basic placeholder with simple cards. The user's actual design is a 2847-line fully-featured inspector with a sidebar, topbar, tree navigation, detailed API blocks with request/response payloads, edit mode, and proper styling.

## Changes

### 1. Replace `public/api-call-inspector-chronicle.html`
Copy the uploaded file (`user-uploads://API_Call_Inspector_—_Chronicle.html`) to `public/api-call-inspector-chronicle.html`, replacing the current placeholder entirely.

### 2. Simplify `src/pages/style-guide/api-inspector.tsx`
The uploaded HTML already has its own topbar with Edit, Save, Add Block, and View buttons built in. The current React wrapper duplicates these controls in a separate header bar. Since the HTML is self-contained, the wrapper should be simplified to just render a full-screen iframe without the redundant header toolbar. Keep only the back button overlay if needed, or remove the wrapper header entirely since the HTML has its own navigation.

| File | Change |
|------|--------|
| `public/api-call-inspector-chronicle.html` | Replace with uploaded 2847-line design |
| `src/pages/style-guide/api-inspector.tsx` | Remove duplicate toolbar; render full-screen iframe only |

