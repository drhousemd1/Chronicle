

## Reposition Basics Container — Two-Column Layout

Currently the Basics section stacks vertically: avatar centered on top, then all fields below. The mockup shows a side-by-side layout.

### Layout Change (lines 1247-1460 in CharactersTab.tsx)

Replace the current vertical `flex-col items-center` layout with a horizontal two-column grid:

**Left column (~50%):**
- Avatar image placeholder (increased from `w-48 h-48` to fill the column, roughly `w-full aspect-square`)
- Upload Image + AI Generate buttons underneath the avatar
- Reposition button (if avatar exists)
- Hidden file input

**Right column (~50%):**
- Name field
- Nickname field
- Age + Sex side-by-side (grid-cols-2)
- Remaining fields below the fold stay in the same vertical flow after the two-column area (Sexual Orientation, Location, Current Mood, Controlled By/Role toggles, Role Description)

### Specific Changes

**Line 1248** — Change outer wrapper from:
```tsx
<div className="flex flex-col items-center gap-4">
```
To a two-column grid:
```tsx
<div className="grid grid-cols-2 gap-5">
```

**Left column (lines 1249-1363)** — Wrap avatar + buttons in:
```tsx
<div className="flex flex-col gap-3">
  {/* Avatar container — change w-48 h-48 to w-full aspect-square */}
  {/* AvatarActionButtons + Reposition button + hidden input */}
</div>
```

**Right column** — Wrap Name, Nickname, Age+Sex in:
```tsx
<div className="flex flex-col gap-4">
  {/* Name field */}
  {/* Nickname field */}
  {/* Age + Sex in grid-cols-2 */}
</div>
```

**Below the grid (lines 1384-1459)** — Sexual Orientation, Location, Current Mood, Controlled By/Role toggles, and Role Description remain in the existing vertical `space-y-4` flow, unchanged.

### Avatar Size
- Change `w-48 h-48` to `w-full aspect-square` so it fills the left column naturally
- This makes the avatar roughly half the container width

