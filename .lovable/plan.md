
Goal: fix the App Architecture back arrow by copying the existing admin-page pattern already used elsewhere, not inventing a new one.

What I checked
- `src/pages/style-guide/api-inspector.tsx`
- `src/pages/style-guide/ui-audit.tsx`
- `src/pages/style-guide/app-architecture.tsx`

What the code shows
- The App Architecture page already has `useNavigate`, `ArrowLeft`, and a back button wired to `/?tab=admin&adminTool=style_guide`.
- The button is currently missing the dark text color and matching icon stroke used on the working admin pages.
- `app-architecture.tsx` sets `.app-architecture-page { color: var(--text); }` with a light text color, so the arrow inherits a faint color against the white header and appears missing.

Exact implementation to make
- File: `src/pages/style-guide/app-architecture.tsx`
- Do not add custom CSS.
- Do not create a new button style.
- Replace the current back button markup with the same pattern used in `api-inspector.tsx`:

```tsx
<button
  type="button"
  onClick={() => navigate("/?tab=admin&adminTool=style_guide")}
  className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
  aria-label="Go back"
  title="Go back"
>
  <ArrowLeft size={20} strokeWidth={2.5} />
</button>
```

Notes
- Keep the existing route target exactly the same as the other style-guide/admin pages.
- No import changes should be needed if the current file still already has `useNavigate` and `ArrowLeft`.
- No other header layout changes are needed unless the current wrapper was altered beyond this snippet.

Scope
- One file only: `src/pages/style-guide/app-architecture.tsx`

Expected result
- The App Architecture header will show the same visible back chevron style and behavior as the existing admin pages, returning to the admin/style guide dashboard.
