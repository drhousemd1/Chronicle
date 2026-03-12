

# Sidebar Auth Display: Avatar + Name + Dropdown

## What Changes

Replace the bottom "Account" / "Log In" `SidebarItem` with a user identity block:

### When **not authenticated**:
- Show a "Log In" button styled consistently with the sidebar (Slate Blue accent)
- Clicking opens the `AuthModal`

### When **authenticated**:
- Show the user's avatar (from `profiles` table) + display name + email in a compact block at the sidebar bottom
- Clicking opens a `DropdownMenu` with:
  - **Public Profile** → navigates to account profile tab
  - **Account Settings** → navigates to account settings tab  
  - **Sign Out** → calls `handleSignOut`, returns to gallery

### Collapsed sidebar state:
- Guest: Show a `LogIn` icon button
- Authenticated: Show just the avatar circle, dropdown still works on click

## Implementation

### File: `src/pages/Index.tsx`

**Replace** the bottom `<div className="pt-4 mt-4 border-t...">` block (lines 1598-1600) with an inline user block that:

1. Fetches the user's profile (display_name, avatar_url) — reuse the same pattern from `AccountButton.tsx`
2. Renders a `DropdownMenu` from radix (already in the project)
3. Uses the existing `Avatar` / `AvatarFallback` components
4. For guests, renders a simple "Log In" button that calls `setAuthModalOpen(true)`

**Colors** (from style guide):
- Avatar fallback bg: `#4a5f7f` (Slate Blue)
- Text: `#ffffff` (White), `rgba(248,250,252,0.3)` (Ghost White for email)
- Dropdown: uses existing `DropdownMenuContent` styling (dark theme)
- Hover: `hover:bg-white/5`
- Border-top divider: `border-white/10` (existing)

No new files needed — the logic is small enough to inline in Index.tsx, using the existing `DropdownMenu` and `Avatar` components already imported/available.

### Files Changed
- `src/pages/Index.tsx` — replace Account SidebarItem with avatar+dropdown block (authenticated) or Log In button (guest)

