
# Replace Account Button in Sidebar with Simple Icon

## Problem

The current `AccountButton` in the sidebar bottom shows the user's initials in a circle plus their username text, which overflows the collapsed sidebar and looks inconsistent with the other sidebar items (which are all icon-only when collapsed, icon+label when expanded).

## Solution

Replace the `AccountButton` component in the sidebar bottom with a standard `SidebarItem` that uses a `User` (or `UserCircle`) icon from lucide-react -- matching every other sidebar item's styling. Clicking it navigates to the account tab. The sign-out and profile dropdown functionality moves into the account page itself (it already has those options there).

## Changes

### File: `src/pages/Index.tsx`

1. **Remove** the `<div className="p-4 border-t ..."><AccountButton ... /></div>` block at lines 1318-1327
2. **Add** a new `SidebarItem` at the end of the nav section (after Model Settings, inside the existing nav), styled like the other items:

```
<div className="pt-4 mt-4 border-t border-white/10">
  <SidebarItem
    active={tab === "account"}
    label="Account"
    icon={<UserCircle className="w-5 h-5" />}
    onClick={() => setTab("account")}
    collapsed={sidebarCollapsed}
  />
</div>
```

3. **Remove** the `AccountButton` import (line 5) since it will no longer be used anywhere

This gives the account entry the exact same rounded-xl button with icon styling as every other sidebar item -- icon-only when collapsed, icon + "Account" label when expanded.
