# Overview

## Account & Subscription at a Glance

Account & Subscription is the signed-in person’s private account area. It groups three related destinations under one application entry: **Account Settings** for identity and password information, **Subscription** for the current tier and available plan configuration, and **Public Profile** for the creator-facing information that may be shown to other people.

The section does not own Chronicle authentication as a whole. The shared authentication layer establishes the signed-in user and guards account access. This capability presents account-specific controls and sends authorized changes to the appropriate authentication, profile, or subscription configuration boundary.

## Account Settings

Account Settings shows the signed-in email address, derives the visible current-plan label from user metadata, and provides a password-change form. The email is informational on this screen; there is no email-edit operation. Legacy `pro` metadata is displayed as Starter and `free_trial` as Free so the current interface uses the active tier vocabulary.

The password form requires a non-empty new password of at least six characters and a matching confirmation. It shows a local explanation when either rule fails. A valid submission calls the authentication service’s user-update operation. While the request is pending, the button displays **Updating...** The form then reports either success or the returned failure. A password field’s visibility control affects display only; it does not change the submitted value.

## Subscription Presentation

Subscription displays the tier configuration currently supplied by Chronicle’s subscription-tier service. The visible cards include the tier name, subtitle, monthly price, optional badge, message and image limits, and enabled features. The signed-in user’s metadata determines which card is labeled **Current Plan**.

The tier source can update while the screen is open because the component subscribes to configuration changes. The interface currently renders non-current plan action labels, but it does not attach a purchase or upgrade handler. Those buttons must not be documented as a working checkout. **Coming Soon** and the current tier are disabled; other visual actions are not proof that billing or entitlement changes are implemented.

## Public Profile Relationship

Public Profile is included here because it is edited from the account area, but it has its own Knowledge capability because it also owns the public `/creator/:userId` experience, profile visibility, following, and published-work presentation. The Account top bar supplies its registered Save action. The **Public Profile** manual contains the complete profile contract.

## Loading, Failure, and Access

The account area requires the authenticated user supplied by the shared shell. Password submission provides explicit success and error text. Subscription begins with a checked-in default configuration so the screen is not structurally empty. While the configuration request is active, it displays **Loading subscription tiers...**

A displayed default tier is not proof that live configuration loaded successfully. Likewise, a tier card and price are presentation, not proof of billing availability. Account access and password changes depend on the active authentication session and deployed service policy.

## Handoffs and Evidence Limits

The application shell owns opening and leaving Account. The authentication boundary owns email identity, password updates, and session validity. The subscription-tier service owns plan presentation data. Public Profile owns the creator fields and public visibility behavior. Admin Finance may update tier configuration that the Subscription screen then reads.

Source inspection confirms the current tabs, form validation, metadata normalization, subscription presentation, and service calls. It does not prove live authentication policy, payment processing, subscription entitlement enforcement, or deployed database state.

# UI Elements and Functions

## Account Navigation

- **Account Settings** opens the private email, current-plan, and password controls.
- **Subscription** opens the available tier comparison.
- **Public Profile** opens the creator identity editor and enables the top-bar Save action described in the Public Profile manual.
- **Back** returns to the previous application destination through the shell-owned navigation path.

## Email and Current Plan

- **Email Address** displays the authenticated user’s email or **No email found**. It is not editable here.
- **Current Plan** displays Free, Starter, Premium, or Elite using normalized user metadata.
- The adjacent description explains the visible tier at a glance. It is informational and does not calculate or enforce usage.

## Change Password

- **New Password** accepts the replacement value; its eye control toggles whether the value is visibly masked.
- **Confirm New Password** must match the first field.
- **Update Password** is disabled while no new password exists and while an update is pending.
- Fewer than six characters shows **Password must be at least 6 characters.**
- A mismatch shows **Passwords do not match.**
- The pending label is **Updating...** Completion reports either the authentication error or the success message **Password updated successfully.**

## Subscription Cards

- **Choose Your Plan** introduces the current configuration and explains that tier data can update from Admin Finance.
- Each card displays the tier identity, price, per-month unit, limits, and feature set. Higher tiers separate newly added features from inherited ones.
- The active tier displays **Current Plan** and is disabled. A tier carrying a coming-soon badge displays **Coming Soon** and is disabled.
- Other cards may display **Start Free** or **Get [tier]**, but the current component has no purchase or tier-change handler. They are presentation only.
- While the service request is pending, the screen displays **Loading subscription tiers...**

## Failure Boundaries

Password failures are visible in the form. Subscription configuration loading falls back to the bundled defaults and does not currently display a distinct load-failure notice. The manual therefore does not claim that the cards prove a live configuration response or an available billing flow.

# App Architecture

## Application Entry and Internal Tabs

`src/pages/Index.tsx` owns the `account` application destination and the active account subtab. It renders `AccountSettingsTab`, `SubscriptionTab`, or `PublicProfileTab` according to that state. `AppShellTopBar` renders the account sub-navigation, Back action, and the registered Public Profile Save action.

`src/components/app-shell/AppSidebar.tsx` opens the account area from the signed-in identity controls. Authentication remains centralized in `useAuth`; the child account components receive the user or read the same provider rather than establishing another session authority.

## Authentication Settings Boundary

`AccountSettingsTab` reads email and `subscription_tier` from the supplied authenticated user. It performs local password validation before calling `supabase.auth.updateUser`. The Supabase authentication service, not the component, decides whether the current session may complete that update.

The component normalizes historical tier labels for presentation only. It does not write subscription metadata, grant features, or modify billing records.

## Subscription Configuration Boundary

`SubscriptionTab` reads the signed-in user from `useAuth`, initializes from `DEFAULT_SUBSCRIPTION_TIERS`, then calls `loadSubscriptionTiersConfig`. It registers `subscribeToSubscriptionTiersConfig` so a later configuration update replaces the visible cards. `TIER_FEATURE_SECTIONS` defines the ordered feature rows used to compare each tier with its predecessor.

The component has no checkout callback, payment client, or entitlement mutation. Any future billing implementation must establish its own verified ownership and failure handling rather than treating the current visual buttons as an active purchase boundary.

## Public Profile Handoff

`PublicProfileTab` registers a save function with Index and reports its pending state. Index passes those into `AppShellTopBar`, keeping the top-level Save control synchronized with the active editor. Profile rows, avatar storage, published works, and visitor visibility are documented under the separate Public Profile capability.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/components/account/AccountSettingsTab.tsx
src/components/account/SubscriptionTab.tsx
src/components/account/PublicProfileTab.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppSidebar.tsx
src/hooks/use-auth.ts
src/services/subscription-tier-config.ts
src/integrations/supabase/client.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 4, 2026. It establishes the current account tabs, password validation and service call, tier presentation and update source, and Public Profile save handoff. It does not prove a live billing flow, entitlement enforcement, deployed authentication policy, or successful Supabase operations.
