

# Add Back Navigation to API Inspector Page

## Problem
The API Inspector page (`/style-guide/api-inspector`) renders a full-screen iframe with no way to navigate back to the main app. The HTML inside has its own topbar but no back button.

## Solution
Add a back button to the existing topbar inside `public/api-call-inspector-chronicle.html`, matching the breadcrumb area. This is simpler than adding a React overlay on top of the iframe (which would create z-index/click issues).

## Changes

| File | Change |
|------|--------|
| `public/api-call-inspector-chronicle.html` | Add a back arrow button before the breadcrumb in the `.topbar`, styled to match. On click, navigates to `/?tab=admin&adminTool=style_guide` (back to the App Dashboard). Add a small CSS rule for the back button. |

The back button will use `window.top.location.href` to break out of the iframe and navigate back to the admin dashboard, since the iframe can't use React Router directly.

