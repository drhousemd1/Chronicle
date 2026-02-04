
# Add Community Gallery to Left Sidebar Navigation

## Overview

Move the Community Gallery access from the banner inside ScenarioHub to a dedicated navigation item in the left sidebar, positioned above "Your Stories".

---

## Changes

### 1. Add Gallery Icon to IconsList

**File:** `src/pages/Index.tsx` (around line 31)

Add a new icon for the Gallery navigation item:

```tsx
const IconsList = {
  Gallery: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Hub: () => ...,
  // ... rest of icons
};
```

Or better, use a different icon to distinguish from "World" (which already uses a globe). Use a grid/gallery style icon:

```tsx
Gallery: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>,
```

---

### 2. Add Gallery Navigation Item to Sidebar

**File:** `src/pages/Index.tsx` (line 966-971)

Insert the Community Gallery item ABOVE "Your Stories":

```tsx
<nav className={`flex-1 overflow-y-auto pb-4 mt-4 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
  {/* NEW: Community Gallery - First item */}
  <SidebarItem 
    active={false} 
    label="Community Gallery" 
    icon={<IconsList.Gallery />} 
    onClick={() => navigate('/gallery')} 
    collapsed={sidebarCollapsed} 
  />
  
  <SidebarItem active={tab === "hub"} label="Your Stories" icon={<IconsList.Hub />} onClick={() => { setActiveId(null); setTab("hub"); setPlayingConversationId(null); }} collapsed={sidebarCollapsed} />
  <SidebarItem active={tab === "library"} label="Character Library" icon={<IconsList.Library />} onClick={() => { setActiveId(null); setTab("library"); setSelectedCharacterId(null); setPlayingConversationId(null); }} collapsed={sidebarCollapsed} />
  {/* ... rest of navigation items */}
</nav>
```

---

### 3. Remove Banner from ScenarioHub

**File:** `src/components/chronicle/ScenarioHub.tsx` (lines 99-120)

Remove the entire Gallery Navigation Banner since it's now in the sidebar:

**Before:**
```tsx
return (
  <div className="w-full h-full p-10 flex flex-col overflow-y-auto">
    {/* Gallery Navigation Banner */}
    <div className="mb-8">
      <button onClick={() => navigate('/gallery')} ...>
        ...
      </button>
    </div>
    
    <div className="grid ...">
```

**After:**
```tsx
return (
  <div className="w-full h-full p-10 flex flex-col overflow-y-auto">
    <div className="grid ...">
```

Also remove the `useNavigate` import and hook if no longer needed.

---

## Visual Result

**Sidebar Navigation (from top to bottom):**
```
┌─────────────────────────┐
│  C  CHRONICLE           │
├─────────────────────────┤
│  🌐 Community Gallery   │  ← NEW (navigates to /gallery)
│  ⊞ Your Stories         │  ← Existing
│  📚 Character Library   │
│  🖼 Image Library        │
│  💬 Chat History        │
│  🔧 Scenario Builder    │
│  ─────────────────────  │
│  ⚡ Model Settings      │
└─────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add Gallery icon to IconsList (line ~31), add SidebarItem for Community Gallery above "Your Stories" (line ~967) |
| `src/components/chronicle/ScenarioHub.tsx` | Remove the Gallery Navigation Banner (lines 99-120), remove unused navigate import |
