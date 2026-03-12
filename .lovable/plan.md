

# Auth Revamp: Public Gallery Landing + Login Modal

## Overview
Convert the app from a hard auth wall (`/auth` redirect) to a public-browsable experience where Community Gallery is the landing page for unauthenticated users, and protected actions trigger a lightweight login modal overlay instead of a full-page redirect.

## Changes

### 1. New File: `src/components/auth/AuthModal.tsx`
Create a modal version of the existing Auth.tsx form:
- Uses `Dialog` from radix (existing `dialog.tsx` component)
- Same email/password sign-in/sign-up form logic as `Auth.tsx`
- Dark theme matching the app's style guide: `bg-[#121214]` card, `border-white/10`, `#2a2a2f` inputs
- Sign In button uses `bg-[#4a5f7f]` (Slate Blue) instead of the current purple — aligns with the app's established accent color
- On successful auth, calls `onClose()` — auth state updates automatically via `useAuth`
- Close button (X) in top-right corner
- Overlay: `bg-black/60 backdrop-blur-sm`

Props: `{ open: boolean; onClose: () => void }`

### 2. `src/pages/Index.tsx` — Remove hard redirect, add auth gating

**Remove** the auth redirect useEffect (lines 233-238):
```tsx
// DELETE this block
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    navigate('/auth');
  }
}, [authLoading, isAuthenticated, navigate]);
```

**Change default tab** to `"gallery"` instead of `"hub"`:
```tsx
const [tab, setTab] = useState<TabKey | "library">("gallery");
```

**Fix loading gate** — guests shouldn't be blocked by `isLoading` (which requires auth). Change:
```tsx
if (authLoading || isLoading) {
```
to:
```tsx
if (authLoading) {
```

**Add auth modal state + requireAuth helper**:
```tsx
const [authModalOpen, setAuthModalOpen] = useState(false);

const requireAuth = useCallback((action: () => void) => {
  if (!isAuthenticated) {
    setAuthModalOpen(true);
    return;
  }
  action();
}, [isAuthenticated]);
```

**Gate all sidebar items except Community Gallery**:
- My Stories, Character Library, Image Library, Chat History, Story Builder, Account — wrap `onClick` with `requireAuth()`
- Community Gallery stays ungated

**Update Account sidebar label** for guests:
```tsx
label={isAuthenticated ? "Account" : "Log In"}
```

**Update handleSignOut** — instead of navigating to `/auth`, just set tab to `"gallery"`:
```tsx
const handleSignOut = async () => {
  await signOut();
  setTab("gallery");
};
```

**Render AuthModal** at the bottom of the return JSX:
```tsx
<AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
```

### 3. `src/components/chronicle/GalleryHub.tsx` — Add `onAuthRequired` prop

Add optional prop `onAuthRequired?: () => void` to `GalleryHubProps`.

In `handleLike`, `handleSave`, and `handlePlay` — replace the `if (!user)` early returns with `onAuthRequired?.()` calls so the modal opens instead of silently failing.

Pass `onAuthRequired={() => setAuthModalOpen(true)}` from Index.tsx.

### 4. Keep `/auth` route working
No changes to `Auth.tsx` or `App.tsx` routing — direct URL access still works as a fallback.

## Colors Used (from Style Guide)
- Modal bg: `#121214` (Near Black — Account Page)
- Input bg: `#2a2a2f` (Dark Charcoal)
- Borders: `border-white/10` (Faint White)
- Primary button: `#4a5f7f` (Slate Blue)
- Button hover: `#5a6f8f` (Light Slate Blue)
- Text: `#ffffff` (White), `rgba(248,250,252,0.3)` (Ghost White for subtitles)
- Overlay: `bg-black/60` with `backdrop-blur-sm`

## Files Changed
1. `src/components/auth/AuthModal.tsx` — **NEW** — modal auth form
2. `src/pages/Index.tsx` — remove redirect, default to gallery, add requireAuth gating, render AuthModal
3. `src/components/chronicle/GalleryHub.tsx` — add `onAuthRequired` prop, call it on like/save/play when no user

