

# Fix Profile Avatar Buttons, Reposition, and Layout Spacing

## Problems

1. **No Reposition button** -- The `profiles` table lacks an `avatar_position` column, and the component has no repositioning logic. The character builder shows a "Reposition" button below the action buttons when an avatar exists; the profile page needs the same.

2. **"Upload Im..." text truncation** -- The two buttons share 192px and with the elaborate AI Generate button styling, "Upload Image" gets truncated. The avatar column needs to be wider (w-56 / 224px) so both buttons have enough room.

3. **Labels too far from inputs** -- The "Display Name", "About Me", and "Preferred Genres" labels use `w-32` (128px) with `gap-4`, pushing inputs far to the right. Reducing label width to `w-28` and gap to `gap-2` will tighten the layout.

## Changes

### 1. Database Migration -- Add `avatar_position` to `profiles`

```sql
ALTER TABLE public.profiles ADD COLUMN avatar_position jsonb DEFAULT '{"x": 50, "y": 50}';
```

This stores the user's avatar crop position, matching the pattern used by `characters.avatar_position`.

### 2. `src/components/account/PublicProfileTab.tsx` -- Full updates

**a) Fetch and store `avatar_position`**

- Add `avatar_position` to the `ProfileData` interface as `{ x: number; y: number }`.
- Include it in the profiles select query.
- Initialize it from the DB response (defaulting to `{ x: 50, y: 50 }`).
- Save it in `handleSave`.

**b) Add repositioning state and drag handlers**

Port the repositioning logic from `CharactersTab.tsx`:
- `isRepositioning` state (boolean)
- `dragStart` state for tracking mouse/touch drag origin
- `avatarContainerRef` (already exists as concept, add ref)
- `handleMouseDown`, `handleMouseMove`, `handleMouseUp` handlers
- `handleTouchStart`, `handleTouchMove`, `handleTouchEnd` handlers for iPad support
- Clamp position values between 0-100

**c) Update avatar container**

- Add conditional styling: `ring-4 ring-blue-500 cursor-move` when repositioning, `border-2 border-white/10` otherwise
- Attach mouse and touch event handlers
- Apply `objectPosition` using the avatar position values
- Show crosshair overlay with "Drag to Refocus" label when repositioning
- Set `touch-action: none` when repositioning

**d) Add Reposition button below action buttons**

After `AvatarActionButtons`, conditionally render a "Reposition" / "Save Position" button when `profile.avatar_url` exists -- matching CharactersTab lines 678-686 exactly:
```tsx
{profile.avatar_url && (
  <Button
    variant={isRepositioning ? 'primary' : 'secondary'}
    onClick={() => setIsRepositioning(!isRepositioning)}
    className={`w-full text-[10px] font-bold leading-none ${isRepositioning ? 'bg-blue-600 text-white' : ''}`}
  >
    {isRepositioning ? "Save Position" : "Reposition"}
  </Button>
)}
```

**e) Widen avatar column**

- Change avatar square from `w-48 h-48` to `w-56 h-56` (224px)
- This gives each side-by-side button ~108px, enough for "Upload Image" and "AI Generate" text

**f) Tighten label-to-input spacing**

- Change label width from `w-32` to `w-28` on all three field rows (Display Name, About Me, Preferred Genres)
- Change `gap-4` to `gap-2` on all three field rows
- This pulls inputs closer to their labels

**g) Import the `Button` component**

Add `import { Button } from '@/components/chronicle/UI';` for the Reposition button.

## What stays the same

- `AvatarActionButtons` component is not modified (shared with character builder)
- No toasts added anywhere
- Published Works card rendering stays as-is
- The overall section structure and save button remain unchanged

