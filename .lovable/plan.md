

# Fix API Inspector Header and Back Navigation

## Problems
1. The API Inspector's topbar (inside the HTML iframe) doesn't match the app's standard header — it uses a 52px serif-styled breadcrumb bar instead of the 64px white header with bold uppercase title used by Quality Hub and other pages.
2. The back button is a small square bordered icon instead of a round chevron like the other pages.
3. The back button uses `window.top.location.href` which doesn't work from inside an iframe in the preview sandbox.

## Solution
Move the header out of the iframe and into the React wrapper (`api-inspector.tsx`), matching the exact pattern from `ui-audit.tsx`. The iframe then fills the remaining space below the header. Remove the topbar from the HTML file entirely (or hide it) so there's no duplication.

## Changes

| File | Change |
|------|--------|
| `src/pages/style-guide/api-inspector.tsx` | Add a proper React header with `useNavigate()` back button matching the Quality Hub header pattern (white bg, h-16, chevron button, uppercase bold title). Render the iframe below it filling the remaining viewport height. |
| `public/api-call-inspector-chronicle.html` | Hide or remove the `.topbar` element since the React wrapper now provides the header. |

### Header pattern (from ui-audit.tsx):
```
<header className="flex-shrink-0 h-16 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 shadow-sm">
  <button onClick={() => navigate('/?tab=admin&adminTool=style_guide')} className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors">
    <svg chevron icon />
  </button>
  <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">API Call Inspector</h1>
</header>
```

