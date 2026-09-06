# Overview

## Shared Application Systems at a Glance

Shared Application Systems documents the product-wide foundations that several Chronicle capabilities rely on: application routing, authentication state, administrator access checks, the persistent shell, shared navigation, authenticated startup loading, core data types, and persistence service boundaries. It exists so those cross-cutting owners are documented once instead of being inaccurately assigned to whichever feature happens to call them.

This is not a miscellaneous category. A source belongs here only when its primary responsibility is shared across real Chronicle capabilities. Community Gallery still owns discovery, My Stories owns the story collection, Chat History owns saved-session discovery, and each builder owns its authored material. Shared Application Systems explains the foundation and handoffs between them without taking over their product meaning.

## Application Routing

The `App.tsx` file establishes Chronicle’s browser routes and product-wide providers. The main application lives at `/`; public creator profiles use `/creator/:userId`; the authentication alias redirects into the main page’s authentication entry. Administrative documentation and quality routes are lazy-loaded behind the shared administrator guard. Unknown paths end at the Not Found screen.

The route layer decides which page may be mounted. It does not decide the detailed behavior inside that page. A route existing in source is also not proof that every linked database or external service is available.

## Authentication and Administrator State

`useAuth` is the shared session source. It subscribes to authentication changes, reads the existing session, exposes the active user and session, and provides sign-up, sign-in, and sign-out operations. Capabilities that require an account receive or consume this state rather than creating their own competing session store.

Administrator access adds a separate authorization check. `AdminOnlyRoute` waits for the session, calls `checkIsAdmin` for the active user, and redirects signed-out or non-admin visitors. Index uses the same resolved status to decide whether the Admin navigation is visible. Authentication answers who is signed in; the administrator check answers whether that user may access protected tools.

## Persistent Application Shell

`Index.tsx` composes the main Chronicle experience. It owns the active application tab, selected story and character identities, account and Admin subtabs, modal coordination, and the hook boundaries that load or persist data. `AppSidebar`, `AppShellTopBar`, and `AppShellWorkspace` supply the persistent frame around the active capability.

The sidebar opens Community Gallery, My Stories, Character Library, Image Library, Chat History, Story Builder, Account entries, and Admin when allowed. The top bar changes its title, navigation, filters, and actions according to the active capability. The workspace maintains the bounded flex layout required by nested builders and scrolling surfaces.

## Shared Authenticated Startup

After authentication, `use-index-authenticated-data.ts` assembles the common startup collections in parallel: owned stories, the character library, the conversation registry, user backgrounds, the selected Image Library background, saved Gallery stories, the user’s published-story map, and basic profile presentation. It also loads content themes for owned and saved story sources.

Each request has a bounded timeout and a neutral fallback so one slow source does not prevent the shell from settling forever. That resilience has an important limit: a fallback empty collection does not prove the live source actually contains no records. Feature manuals must distinguish a confirmed empty result from a request that timed out or failed.

## Shared Types and Persistence Boundaries

`src/types.ts` defines the common Chronicle shapes used across the shell, stories, characters, conversations, messages, content themes, images, and application tab state. The `src/services/persistence/` modules separate durable operations by subject: scenarios, conversations, characters, content themes, side characters, media settings, library copying, signed media, and related cleanup.

These services are technical owners of reads and writes, not product owners. A conversation service can store a conversation without deciding what Chat History should call it. A scenario service can persist a story without deciding Story Builder’s accepted authoring contract.

## Handoffs and Evidence Limits

All feature capabilities hand into the shared shell for navigation and identity. Authenticated capabilities depend on the shared session. Feature-level actions call their appropriate persistence or service boundary and then return a visible result to the owning capability. Admin-only destinations additionally depend on the shared route guard.

Source inspection confirms the current composition, shared providers, route list, shell contracts, startup loader, and service organization. It does not prove live Supabase availability, deployed access policies, every cross-capability workflow, or the internal Roleplay Pipeline, which remains outside this Knowledge project.

# UI Elements and Functions

## Application Shell

- The Chronicle sidebar can collapse or expand without changing the active capability.
- Community Gallery is available as the public discovery entry; authenticated personal areas use the shell’s authentication requirement before opening.
- The active story title appears as Story Builder context when a story is loaded.
- The signed-in user control shows avatar, display name or email fallback, and opens Public Profile, Account Settings, and Sign Out.
- Admin appears only when the resolved administrator state allows it.

## Shared Top Bar

- The title and left-side controls change according to the active capability.
- Filters, searches, Back actions, Save actions, and capability settings are supplied through typed configuration objects rather than duplicated top bars.
- Chat Interface intentionally suppresses the shared top bar because its active play layout owns the full session chrome.
- A capability-specific action is visible only when its handler and relevant state are supplied.

## Authentication Presentation

- Signed-out actions can open the authentication dialog through the main shell.
- Sign Up submits email and password with a redirect back to Chronicle.
- Sign In uses email and password against the shared authentication client.
- Sign Out ends the shared session and returns personal areas to their signed-out boundary.
- While session discovery is unresolved, protected routes do not render privileged content.

## Shared Loading and Fallback Behavior

- The authenticated startup loader reports a common loading state while core personal collections are assembled.
- Bounded timeouts allow the shell to recover from a request that never settles.
- Empty-array and null fallbacks keep the application usable but must not be described as verified live emptiness.
- Lazy administrative routes and tools use neutral suspense fallbacks until their modules load.

## Layout and Navigation Guarantees

The main shell is a full-height flex layout. `AppShellWorkspace` keeps `flex-1`, `min-h-0`, and bounded overflow so nested panes can scroll without expanding the entire browser document. Navigation handlers coordinate unsaved Admin and builder work before switching the active destination.

# App Architecture

## Root Composition

`src/App.tsx` composes the Query client, art-style context, tooltip provider, browser router, suspense boundary, and notification toaster. It registers public and protected routes. `Index` is the primary authenticated application orchestrator rather than a leaf feature component.

## Shell Ownership

`src/pages/Index.tsx` owns the application-level state needed to coordinate capabilities. It passes bounded configuration objects into `AppSidebar` and `AppShellTopBar` and mounts the selected feature inside `AppShellWorkspace`. The shell components emit named actions; they do not query product data directly.

This separation lets a feature own its meaning while the shell owns placement. For example, Chat History decides what a session row means, Index supplies the registry and handlers, and the top bar adds Delete All only when the feature reports that conversations exist.

## Authentication and Access Flow

The `useAuth` hook subscribes before requesting the existing session so later authentication events and initial state converge on one React source. `AdminOnlyRoute` keys its resolved administrator result to the requested user ID, preventing a prior user’s cached React state from authorizing a newly selected user while the fresh check runs.

The `src/services/app-settings.ts` file supplies `checkIsAdmin` and the shell’s cached presentation state. The backend remains responsible for enforcing privileged data mutations even when the application route is guarded.

## Authenticated Data Flow

The `use-index-authenticated-data.ts` file calls the subject services and commits their results into Index-owned state. It enriches conversation summaries only when Chat History is active. The `use-index-scenario-lifecycle.ts` file owns new-session and resume orchestration, while individual persistence modules own subject-specific durable operations.

The loader’s fallback behavior prevents an indefinite startup block, but consumers must retain the distinction between loaded, empty, timed out, and failed states wherever that distinction affects the user.

## Capability Ownership Rule

A shared component, hook, type, or service may support several features without erasing their boundaries. The shared-system manual documents only the common mechanism. The corresponding capability manual remains the authority for the user’s goal, visible behavior, acceptance state, and feature-specific failure handling.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/components/app-shell/AppSidebar.tsx
src/components/app-shell/AppShellTopBar.tsx
src/components/app-shell/AppShellWorkspace.tsx
src/hooks/use-auth.ts
src/hooks/use-index-authenticated-data.ts
src/hooks/use-index-scenario-lifecycle.ts
src/services/app-settings.ts
src/services/supabase-data.ts
src/services/persistence/shared.ts
src/services/persistence/scenarios.ts
src/services/persistence/conversations.ts
src/services/persistence/characters.ts
src/services/persistence/content-themes.ts
src/services/persistence/side-characters.ts
src/integrations/supabase/client.ts
src/types.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 4, 2026. It establishes the current root providers, routes, shared session, administrator guard, shell composition, startup data assembly, and persistence ownership pattern. It does not prove live external services, deployed authorization, every feature workflow, or the excluded Roleplay Pipeline.
