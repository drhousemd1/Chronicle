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

Account pages follow the Chronicle dark theme. Specific styles documented per sub-tab component.

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

No active issues documented. (2026-03-01)

---

## 13. Planned / Future Changes

None documented.

> Last updated: 2026-03-01 — Initial creation.