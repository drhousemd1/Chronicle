

# Sidebar Auth: Inline Accordion Instead of Floating Dropdown

## Current State
The authenticated user block at the bottom of the sidebar uses a Radix `DropdownMenu` that pops out to the right as a floating menu (visible in the screenshot). The user wants the options to expand **downward inline** within the sidebar instead.

## Proposed Change

Replace the `DropdownMenu` with a simple toggle (collapsible) pattern:

- **Authenticated**: The avatar+name block acts as a button with a chevron (▾). Clicking it expands/collapses a list of inline items below it: **Public Profile**, **Account Settings**, **Sign Out** — styled like the other sidebar items.
- **Not authenticated**: Show a simple "Sign In" button (same as current "Log In").

### Implementation (single file: `src/pages/Index.tsx`, lines 1601-1668)

Replace the `DropdownMenu` block with:

1. Add a `const [userMenuOpen, setUserMenuOpen] = useState(false)` state
2. The avatar+name button toggles `userMenuOpen` and shows a `ChevronDown`/`ChevronUp` icon
3. When open, render 3 sub-items below (indented, same sidebar styling):
   - `UserCircle` icon + "Public Profile" → `setAccountActiveTab('profile'); setTab("account")`
   - `Settings` icon + "Account Settings" → `setAccountActiveTab('settings'); setTab("account")`
   - `LogOut` icon + "Sign Out" (red text) → `handleSignOut()`
4. When sidebar is collapsed: avatar still shows, clicking opens the items (or falls back to the floating dropdown for space reasons)
5. Guest state: button says "Sign In" with `LogIn` icon, opens `AuthModal`

### Colors
- Sub-items: `hover:bg-white/5`, text `text-white/70`, icons `w-4 h-4`
- Sign Out: `text-red-500`
- Chevron: `text-white/30`
- All consistent with existing sidebar item styling

### Files Changed
- `src/pages/Index.tsx` — replace DropdownMenu with inline collapsible menu, remove unused DropdownMenu imports if no longer needed elsewhere in the sidebar

