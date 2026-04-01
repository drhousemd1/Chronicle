> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> That file defines heading hierarchy, table formatting, code block rules, good-vs-bad content patterns, and section-specific requirements. You must follow it exactly.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format — do not skip sections, do not reorganize
> 5. USE REAL VALUES from the code — exact file paths, exact Tailwind classes, exact hex codes
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component
>
> If a section does not apply, write: `N/A — [specific reason]`
>
> Never write: "see code for details" — this document exists so no one needs to read the code.

# PAGE: APP OVERVIEW & GLOBAL SYSTEMS

---

## 1. Page Overview

| Field | Detail |
|-------|--------|
| **Purpose** | Foundational reference for the entire Chronicle Studio application. Documents the tech stack, navigation architecture, data flow, shared components, and global systems that all other pages depend on. |
| **App Name** | Chronicle Studio |
| **Framework** | React 18 + Vite + TypeScript + Tailwind CSS |
| **State Management** | React Query (`@tanstack/react-query`), local `useState`, URL-based tab routing |
| **Backend** | Supabase (Postgres + Auth + Storage + Edge Functions) |
| **Routing** | `react-router-dom` v6 — 4 routes: `/` (Index), `/auth` (Auth), `/creator/:userId` (CreatorProfile), `*` (NotFound) |
| **Entry Point** | `src/App.tsx` → wraps everything in `QueryClientProvider` > `ArtStylesProvider` > `TooltipProvider` > `BrowserRouter` |
| **Main Page** | `src/pages/Index.tsx` (~2306 lines) — the monolithic page that renders all tabs via a sidebar |

---

## 2. Layout & Structure

The app uses a fixed sidebar + content area layout rendered entirely within `src/pages/Index.tsx`.

### App Shell

```tsx
<QueryClientProvider>  # src/App.tsx
  <ArtStylesProvider>  # src/contexts/ArtStylesContext.tsx
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />  # src/pages/Index.tsx
          <Route path="/auth" element={<Auth />} />  # src/App.tsx (/auth redirect route)
          <Route path="/creator/:userId" element={<CreatorProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ArtStylesProvider>
</QueryClientProvider>
```

### Sidebar Navigation

The sidebar is defined inline in `src/pages/Index.tsx` using a `SidebarItem` component. It supports expanded and collapsed modes (persisted to `localStorage` key `chronicle_sidebar_collapsed`).

| Sidebar Label | Tab Key | Icon | Component Rendered |
|---------------|---------|------|--------------------|
| Gallery | `gallery` | `IconsList.Gallery` | `GalleryHub` |
| Your Stories | `hub` | `IconsList.Hub` | `StoryHub` |
| Characters | `characters` | `IconsList.Characters` | `CharactersTab` |
| World | `world` | `IconsList.World` | `WorldTab` |
| Chat History | `conversations` | `IconsList.Chat` | `ConversationsTab` |
| Chat | `chat` | `IconsList.ChatInterface` | `ChatInterfaceTab` |
| Library | `library` | `IconsList.Library` | Character library view |
| Image Library | `images` | `IconsList.ImageLibrary` | `ImageLibraryTab` |
| Admin | `admin` | `Settings` (lucide) | `AdminPage` |
| Account | `account` | `UserCircle` (lucide) | Account tabs |

---

## 3. UI Elements — Complete Inventory

### Global UI Components

| Element | Type | Component File | Notes |
|---------|------|----------------|-------|
| Sidebar toggle | Button | `src/pages/Index.tsx` | `PanelLeftClose` / `PanelLeft` icons from lucide |
| Sidebar item | Custom button | `src/pages/Index.tsx` (SidebarItem) | Active: `bg-[#4a5f7f]` / Inactive: `text-slate-400 hover:bg-white/10` |
| Character picker | Dropdown | `src/components/chronicle/CharacterPicker.tsx` | Shows when scenario loaded |
| Background picker | Modal | `src/components/chronicle/BackgroundPickerModal.tsx` | User background selection |
| Delete confirm | Dialog | `src/components/chronicle/DeleteConfirmDialog.tsx` | Shared styled delete confirmation |
| AI Prompt modal | Dialog | `src/components/chronicle/AIPromptModal.tsx` | Fill/Generate character AI |

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect |
|--------|---------|--------|
| Sidebar collapse toggle | `setSidebarCollapsed` | Toggles sidebar width, persists to localStorage |
| Tab switch | `setTab(tabKey)` | Changes active content area |
| Scenario select | `handleSelectScenario(id)` | Loads scenario data from Supabase |
| Sign out | `signOut()` via `useAuth` | Clears session, redirects to `/auth` |
| Auto-collapse on mobile | `matchMedia(max-width: 1024px)` | Sidebar collapses on tablet viewports |

---

## 5. Modals, Dialogs & Sheets

Global modals managed at the Index level:

| Modal | Trigger | Component File |
|-------|---------|----------------|
| AI Prompt (Fill/Generate) | Character tab sparkle buttons | `src/components/chronicle/AIPromptModal.tsx` |
| Character Picker | World/Chat tab character select | `src/components/chronicle/CharacterPicker.tsx` |
| Background Picker | Hub/ImageLibrary background button | `src/components/chronicle/BackgroundPickerModal.tsx` |
| Delete Confirm | Various delete actions | `src/components/chronicle/DeleteConfirmDialog.tsx` |
| Change Name | Conversation rename | `src/components/chronicle/ChangeNameModal.tsx` |

---

## 6. Data Architecture

### 6a. Initial Data Load

On authentication, `Index.tsx` fires 8 parallel requests with 15s timeouts:

```
1. fetchMyScenariosPaginated(userId, 50, 0) → scenarios
2. fetchCharacterLibrary() → library characters
3. fetchConversationRegistry() → conversation list
4. fetchUserBackgrounds(userId) → background images
5. getImageLibraryBackground(userId) → selected image lib bg
6. fetchSavedScenarios(userId) → bookmarked scenarios
7. fetchUserPublishedScenarios(userId) → user's published scenarios
8. fetchUserProfile(userId) → profile data
```

### 6b. Auth System

Hook: `useAuth()` (`src/hooks/use-auth.ts`)
- Uses Supabase Auth with email/password
- Returns: `{ user, loading, signIn, signUp, signOut, isAuthenticated }`
- Auth page: `src/App.tsx` — email + password form with Zod validation
- Non-authenticated users redirected to `/auth`

### 6c. User Roles

| Role | Table | Check Function |
|------|-------|----------------|
| `admin` | `user_roles` | `checkIsAdmin(userId)` (async) in `src/services/app-settings.ts` — calls `has_role()` RPC |
| `moderator` | `user_roles` | `has_role()` database function |
| `user` | Default | All authenticated users |

Admin check: `checkIsAdmin(userId)` is an async function that calls `supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })`. Result stored in `isAdminState` via `useEffect` in `Index.tsx`. Admin-only features: Admin Panel tab visibility.

---

## 7. Component Tree

```tsx
<App>  # src/App.tsx
  <QueryClientProvider>
    <ArtStylesProvider>  # src/contexts/ArtStylesContext.tsx
      <TooltipProvider>
        <BrowserRouter>
          <Index>  # src/pages/Index.tsx
            <ModelSettingsProvider>  # src/contexts/ModelSettingsContext.tsx
              <IndexContent>
                {/* Sidebar */}
                <SidebarItem> (×10+)
                {/* Content area - conditional on tab */}
                <GalleryHub>  # src/components/chronicle/GalleryHub.tsx
                <StoryHub>  # src/components/chronicle/StoryHub.tsx
                <CharactersTab>  # src/components/chronicle/CharactersTab.tsx
                <WorldTab>  # src/components/chronicle/WorldTab.tsx
                <ConversationsTab>  # src/components/chronicle/ConversationsTab.tsx
                <ChatInterfaceTab>  # src/components/chronicle/ChatInterfaceTab.tsx
                <ImageLibraryTab>  # src/components/chronicle/ImageLibraryTab.tsx
                <AdminPage>  # src/pages/Admin.tsx
                <AccountSettingsTab>  # src/components/account/AccountSettingsTab.tsx
                <PublicProfileTab>  # src/components/account/PublicProfileTab.tsx
                <SubscriptionTab>  # src/components/account/SubscriptionTab.tsx
              </IndexContent>
            </ModelSettingsProvider>
          </Index>
        </BrowserRouter>
      </TooltipProvider>
    </ArtStylesProvider>
  </QueryClientProvider>
</App>
```

---

## 8. State Management

All state is managed via `useState` in `IndexContent` component (~50+ state variables). Key state:

| State | Type | Purpose |
|-------|------|--------|
| `registry` | `ScenarioMetadata[]` | All user scenarios |
| `activeId` | `string \| null` | Currently selected scenario |
| `activeData` | `ScenarioData \| null` | Full scenario data |
| `tab` | `TabKey \| "library"` | Active sidebar tab |
| `library` | `Character[]` | Character library |
| `conversationRegistry` | `ConversationMetadata[]` | All conversations |
| `playingConversationId` | `string \| null` | Active chat session |
| `sidebarCollapsed` | `boolean` | Sidebar state (persisted) |

---

## 9. Styling Reference

### 9a. Color Palette

| Token | HSL | Usage |
|-------|-----|-------|
| `--ui-surface` | `240 7% 16%` | Dark panel backgrounds |
| `--ui-surface-2` | `228 7% 20%` | Elevated panel backgrounds |
| `--ui-border` | `0 0% 100% / 0.10` | Subtle borders |
| `--ui-text` | `210 20% 93%` | Primary text on dark surfaces |
| `--ui-text-muted` | `210 20% 93% / 0.75` | Secondary text |
| `--accent-teal` | `186 71% 46%` | Accent color (teal/cyan) |
| `--accent-purple` | `246 91% 67%` | Accent color (purple) |

### 9b. Sidebar Styling

| Element | Class / Value |
|---------|---------------|
| Sidebar bg | Dynamic — uses user background or default dark |
| Active item | `bg-[#4a5f7f] shadow-lg shadow-black/40 text-white` |
| Inactive item | `text-slate-400 hover:bg-white/10 hover:text-white` |
| Brand border | `border-[#4a5f7f]` — slate blue used on all cards/tiles |

---

## 10. Security & Access Control

### Authentication Flow

1. `useAuth()` hook checks Supabase session on mount
2. If no session → redirect to `/auth`
3. Auth page provides email/password sign-in and sign-up
4. On success → redirect to `/`
5. Admin features gated by async `checkIsAdmin(userId)` check

### RLS Policy Pattern

All tables use Row Level Security. Standard pattern:
- SELECT: `auth.uid() = user_id` (own data only)
- INSERT: `auth.uid() = user_id` (can only create own)
- UPDATE: `auth.uid() = user_id` (can only edit own)
- DELETE: `auth.uid() = user_id` (can only delete own)

Exceptions: `published_scenarios` (public read), `profiles` (public read), `art_styles` (public read).

---

## 11. Dependencies & Cross-Page Interactions

### Shared Components (see Shared Elements page)

| Component | File | Used By |
|-----------|------|--------|
| `DeleteConfirmDialog` | `src/components/chronicle/DeleteConfirmDialog.tsx` | All pages with delete actions |
| `AutoResizeTextarea` | `src/components/chronicle/AutoResizeTextarea.tsx` | WorldTab, CharactersTab, StoryGoals |
| `Button`, `TextArea` | `src/components/chronicle/UI.tsx` | All chronicle components |
| `ScrollableSection` | `src/components/chronicle/ScrollableSection.tsx` | ChatInterface, CharactersTab |

### Context Providers

| Provider | File | Provides |
|----------|------|----------|
| `ArtStylesProvider` | `src/contexts/ArtStylesContext.tsx` | Art style data from `art_styles` table |
| `ModelSettingsProvider` | `src/contexts/ModelSettingsContext.tsx` | Selected AI model ID — syncs to `profiles.preferred_model` column (DB persistence) with localStorage fallback |

---

## 12. Known Issues & Gotchas

- **ACTIVE**: `Index.tsx` is ~2306 lines — a monolithic component that manages all state. This makes it fragile for large changes. (2026-03-01)
- **ACTIVE**: Auto-collapse sidebar fires on initial load for tablet viewports, which may surprise users who previously expanded it. (2026-03-01)
- **ACTIVE**: 15-second timeout on data load may cause silent data loss if Supabase is slow — user sees empty state with no error. (2026-03-01)
- **RESOLVED — 2026-03-04**: Admin check was sync `isAdminUser()` with hardcoded UUID — now async `checkIsAdmin(userId)` via `has_role()` RPC.
- **RESOLVED — 2026-03-04**: Model preference was localStorage-only — now persisted to `profiles.preferred_model` column with localStorage as cache fallback.

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-03-04 — Admin security hardened (async role check), model preference DB persistence added.