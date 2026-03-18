

# Fix App Guide and API Inspector Navigation

## Problems Found

1. **App Guide button**: Calls `navigate('/?tab=admin&adminTool=app_guide')` but `Index.tsx` never reads `tab` or `adminTool` from URL query params. The page reloads to its default state instead of switching to the admin tab with the app guide tool active.

2. **API Inspector button**: Calls `navigate('/style-guide/api-inspector')` which routes correctly, but the iframe references `public/api-call-inspector-chronicle.html` which **does not exist** -- the file was never created. The page loads but shows an empty iframe.

## Fix Plan

### 1. Fix App Guide navigation in `StyleGuideTool.tsx`
- Change `openAppGuide` from `navigate('/?tab=admin&adminTool=app_guide')` to instead directly call the parent's `onSetActiveTool` callback
- Thread a new prop `onSwitchToAppGuide?: () => void` from Admin.tsx down to StyleGuideTool
- In Admin.tsx, pass `onSwitchToAppGuide={() => onSetActiveTool('app_guide')}` to the StyleGuideTool component

### 2. Fix API Inspector navigation
- Same approach: instead of navigating to a separate route, load the API Inspector inline within the dashboard
- OR: keep the route but create `public/api-call-inspector-chronicle.html` -- however this file is ~3000 lines from the transfer pack and was never extracted
- Simplest fix: change to use the same prop-callback pattern as App Guide, passing `onSwitchToApiInspector` which navigates to the route, BUT the HTML file still needs to exist

### 3. Create `public/api-call-inspector-chronicle.html`
- This file needs to be created for the API Inspector iframe to have content
- The content is from the transfer pack (lines ~12600-15573) -- a large HTML document

## Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add `onSwitchToAppGuide` prop; call it instead of `navigate()` |
| `src/pages/Admin.tsx` | Pass `onSwitchToAppGuide={() => onSetActiveTool('app_guide')}` to StyleGuideTool |
| `src/pages/Index.tsx` | Add `useEffect` to read `tab` and `adminTool` from URL query params on mount, setting `tab` and `adminActiveTool` accordingly |
| `public/api-call-inspector-chronicle.html` | Create placeholder HTML file so the API Inspector iframe renders content |

The most robust fix is to make `Index.tsx` read URL query params for `tab` and `adminTool`, which fixes the App Guide navigation and any future deep-linking needs. The API Inspector needs its HTML asset file created.

