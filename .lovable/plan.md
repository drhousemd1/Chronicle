

# Add Back Navigation Button to App Architecture Page

## Problem
The App Architecture page is missing the back navigation chevron that other admin pages (API Inspector, UI Audit) have. Once you're in it, there's no way to navigate back without using browser back.

## Solution
Add a back button with ArrowLeft icon to the header, matching the pattern used in API Inspector and UI Audit pages. The button navigates back to the App Dashboard (/?tab=admin).

## Changes

**File: src/pages/style-guide/app-architecture.tsx**

1. **Add imports** (lines 1-2):
   - Add `useNavigate` import from "react-router-dom"
   - Add `ArrowLeft` import from "lucide-react"

2. **Add navigate hook** (inside the component, before the return statement):
   - Add `const navigate = useNavigate();`

3. **Update header** (around line 4236):
   - Add back button with ArrowLeft icon before the page title
   - Button navigates to `/?tab=admin&adminTool=style_guide`
   - Match the styling from API Inspector (p-2, rounded-full, hover:bg-slate-100)

The back button will appear to the left of "App Architecture" text, consistent with other pages in the admin section.

