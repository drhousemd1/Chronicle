> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> MANDATORY: Before editing this file, read `docs/guides/GUIDE_STYLE_RULES.md` in full.
>
> This document is the SINGLE SOURCE OF TRUTH for this page's architecture.
>
> When making changes to this page's code, you MUST:
>
> 1. READ `docs/guides/GUIDE_STYLE_RULES.md` before making any edits to this document
> 2. READ this entire document before making any code changes
> 3. UPDATE this document IN-PLACE after making code changes — do NOT append summaries
> 4. PRESERVE the exact 13-section format
> 5. USE REAL VALUES from the code
> 6. UPDATE the Known Issues section (Section 12) when fixing or discovering bugs
> 7. CROSS-REFERENCE the Shared Elements page when modifying any shared component

# PAGE: ACCOUNT

---

## 1. Page Overview

| Field | Detail |
|-------|--------|
| **Tab Key** | `account` |
| **Source Files** | `src/components/account/AccountSettingsTab.tsx`, `src/components/account/PublicProfileTab.tsx`, `src/components/account/SubscriptionTab.tsx` |
| **Purpose** | User account management: profile editing, avatar management, account settings, subscription |
| **User Role** | Authenticated users only |
| **Sidebar Label** | Account (UserCircle icon from lucide) |

---

## 2. Layout & Structure

The Account page uses sub-tabs managed by `accountActiveTab` state in Index.tsx:

| Sub-tab | Key | Component |
|---------|-----|-----------|
| Account Settings | `settings` | `AccountSettingsTab` |
| Public Profile | `profile` | `PublicProfileTab` |
| Subscription | `subscription` | `SubscriptionTab` |

`PublicProfileTab` uses two Chronicle panel sections:

- **Profile Info card**: `w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden` with a header gradient `from-[#5a7292] to-[#4a5f7f]`
- **Profile body layout**: `grid grid-cols-1 gap-6 md:grid-cols-[288px_minmax(0,1fr)] md:items-start`
- **Avatar column**: fixed `288px` rail for square avatar + upload/generate actions
- **Details column**: `space-y-4 min-w-0`; display name, bio, and preferred genres fields remain beside the avatar from medium widths upward and only stack below on narrower/mobile widths

---

## 3. UI Elements — Complete Inventory

See individual sub-tab components for detailed element inventories.

---

## 4. User Interactions & Event Handlers

| Action | Handler | Effect |
|--------|---------|--------|
| Switch sub-tab | `setAccountActiveTab` | Changes active account section |
| Update profile | In `PublicProfileTab` | Updates `profiles` table |
| Upload avatar | In `PublicProfileTab` | Uploads to Supabase storage, updates profile |

---

## 5. Modals, Dialogs & Sheets

N/A — Account pages use inline forms rather than modals.

---

## 6. Data Architecture

### 6a. Profile Data

Table: `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Matches `auth.users.id` |
| `username` | text | Unique username |
| `display_name` | text | Display name |
| `avatar_url` | text | Profile avatar URL |
| `avatar_position` | jsonb | `{x: 50, y: 50}` crop position |
| `about_me` | text | Bio text |
| `preferred_genres` | text[] | Genre preferences |
| `hide_published_works` | boolean | Privacy: hide published scenarios |
| `hide_profile_details` | boolean | Privacy: hide profile details |

RLS: Public read, owner-only insert/update, no delete.

---

## 7. Component Tree

```tsx
{/* Account section in Index.tsx */}
<AccountSettingsTab>  # src/components/account/AccountSettingsTab.tsx
<PublicProfileTab>  # src/components/account/PublicProfileTab.tsx
<SubscriptionTab>  # src/components/account/SubscriptionTab.tsx
```

---

## 8. State Management

| State | Location | Purpose |
|-------|----------|--------|
| `accountActiveTab` | `Index.tsx` | Active sub-tab key |
| `userProfile` | `Index.tsx` | Cached profile data |

---

## 9. Styling Reference

Account pages follow the Chronicle dark theme.

### 9a. Public Profile Styling

| Element | Classes / Values | Notes |
|--------|-------------------|-------|
| Outer profile panel | `bg-[#2a2a2f] rounded-[24px] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]` | Chronicle dark slate shell |
| Panel header | `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3` | Matches Chronicle blue header bars |
| Panel body | `p-5 bg-[#2e2e33] rounded-b-[24px]` | Inner slate tray |
| Field labels | `text-[10px] font-bold text-zinc-400 uppercase tracking-widest` | Labels sit above fields, matching Story Builder / Character Builder |
| Text inputs / textarea | `bg-[#1c1c1f] border border-black/35 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:ring-blue-500/20` | Same Chronicle recessed input treatment |
| Genre add button | `h-10 shrink-0 rounded-xl bg-[#3c3e47] text-[#eaedf1] text-xs font-bold` | Raised Chronicle action button |

---

## 10. Security & Access Control

- Profile read: Any authenticated user (public profiles)
- Profile write: Owner only (`auth.uid() = id`)
- No profile deletion allowed (RLS blocks DELETE)

---

## 11. Dependencies & Cross-Page Interactions

| Dependency | Direction | Detail |
|-----------|-----------|--------|
| Profile → Gallery | Display | Creator profiles shown on published scenarios |
| Profile → Creator Profile page | Navigation | `/creator/:userId` route |

---

## 12. Known Issues & Gotchas

- RESOLVED: 2026-04-04 — Public Profile fields used left-side labels and stacked below the avatar too early. Root cause: `PublicProfileTab` used fixed-width horizontal label rows plus an `xl`-only two-column layout (`xl:grid-cols-[288px_minmax(0,1fr)]`). Fix: moved the split layout to `md`, let the form column shrink with `min-w-0`, and converted the editable fields to stacked label-above-input groups to match builder pages.

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-04-04 — Updated Public Profile layout documentation to reflect the fixed avatar/details split and stacked Chronicle field-label pattern.
