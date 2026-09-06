# Overview

## Finance Dashboard at a Glance

### An unfinished operations workspace with real connections

Finance Dashboard is Chronicle's internal workspace for understanding usage and operating costs, exploring business assumptions, organizing financial reference material, and managing selected account and subscription settings. It is intended to help the owner develop Chronicle's usage and cost management as the product grows. It is not an ordinary player screen, and its inclusion in the Knowledge Base does not mean every financial feature is complete.

The current dashboard combines three kinds of work. Some regions request actual application records or provider billing summaries. Some controls save shared configuration, operational notes, documents, advertising records, or moderation records. Other regions calculate local scenarios or display checked-in planning material and placeholders. Those distinctions matter more than the common visual styling: two adjacent cards can have different sources and very different consequences.

For example, changing a price in Revenue Calculator changes a local projection. **Save & Apply** in Subscription Tiers writes configuration used by the ordinary Account Subscription page. Changing a user's tier also invokes the administrator-access function. None of these actions should be described simply as changing a dashboard number.

### What a useful visit accomplishes

A useful visit lets the administrator answer a specific question while understanding the evidence behind the answer. They may inspect which activities have been counted, compare estimated text and image spend, read an available xAI balance, explore a growth scenario, revise a tier's displayed offering, review an account, update a recurring marketing expense, or save a financial document and notes.

The dashboard should be read as an operations and planning workspace under development, not as certified accounts, a complete payment processor, or an automatically enforced subscription system. The current source contains a header Net Income placeholder, a cost-only mini-chart labeled Net Income, fixed financial assumptions, static strategy data, and a model-pricing refresh that is not connected. Those limitations coexist with real writes and must remain visible in the documentation.

## Entry, Navigation, and the Nine Working Areas

Finance Dashboard opens from its Admin hub card inside Chronicle's existing application. Its own sidebar supplies **Overview**, **Finance & Projections**, **Strategy**, **User Management**, **API & Usage**, **Subscription Tiers**, **Documents**, **Revenue Calculator**, and **Styling Rules**. These are internal dashboard views, not nine independent application routes. The selected view begins at Overview when the dashboard mounts.

The dashboard header shows the current page name and explanation, the loaded account breakdown by tier, and the Net Income placeholder. The shared Chronicle Admin shell remains responsible for entering and leaving the tool. The dashboard does not add a separate authentication experience or expose these controls in player navigation.

Each page owns its local interaction state. Search, chart selections, projection inputs, open dialogs, and unsaved tier drafts can reset when their page unmounts. Stored notes, documents, subscription configuration, account-role changes, and operational rows have separate persistence paths. A page switch is not a general Save command.

## Understanding the Numbers

### Account summaries are not a payment ledger

The dashboard loads profiles, role assignments, story-owner counts, administrator tier overrides, and subscription-tier configuration. It joins those sources into its account list. Display names and usernames provide identification; the property called `email` in the dashboard model is populated from profile display data, not an authentication-email query.

The fetched list initially assigns accounts an active status. Moderation data later adds report and strike signals inside User Management. A count labeled Active Users is therefore a count under this dashboard's current representation, not independently verified subscription activity, payment success, or account-login enforcement.

The subscriber snapshot multiplies account counts by configured prices and assumed per-user costs. Its Monthly/Yearly selector changes the calculation period. App Growth reconstructs counts from loaded profiles' join dates and current tier assignments, excluding administrator accounts; it is not a historical record of every upgrade, cancellation, or payment. These displays can help with planning while remaining different from reconciled revenue.

### Usage counts, estimated spend, and provider balance answer different questions

**API & Usage** reads application usage summaries, time-series data, and grouped diagnostic-session reports through administrator server functions. Counts describe recorded activities such as messages, image-related events, builder assistance, character updates, and memory work. They are not interchangeable units: a user message, a provider request, an updated character, and an extracted memory event can each increment different counters.

Some summary counters combine tracked events with existing database-row counts. Consequently, an Images Generated label is not by itself a precise invoice quantity. Cost displays use estimates associated with usage metadata or fixed UI assumptions. Missing or failed sources can also produce zero or fallback values. A zero must not be read as proof that an activity never happened or incurred no charge.

The xAI balance panel is a separate request for provider billing information. It can report total, remaining, used, and current-month prepaid credits plus an estimated next invoice when its backend integration returns them. Application-estimated spend and provider billing need not share a time window, event set, or accounting method. The dashboard does not reconcile them into an audited total.

### Static prices and placeholders remain static

The **xAI Model Pricing — Live** panel currently starts from checked-in model rows. Its Refresh handler deliberately takes the unfinished path and returns to those fallback rows with **Using cached data**. The updated time is the time of that attempt, not proof that new provider prices were downloaded. The In use filter also uses a checked-in model set, not runtime discovery.

The header's Net Income figure is explicitly labeled as a placeholder. The smaller Net Income chart currently treats each time bucket's revenue as zero and displays the negative of estimated API cost. It does not combine real receipts, advertising, hosting, fees, refunds, or taxes. These labels describe unfinished presentation, not authoritative financial reporting.

## Planning Without Changing the Product

### Finance & Projections explores growth from the loaded account picture

Finance & Projections combines the summary widgets with editable growth assumptions and tier prices. Its charts project Starter, Premium, and Elite counts forward independently, and its tables estimate revenue, costs, contribution, and break-even under the formulas in the page. The starting counts come from the dashboard's account data; per-user API costs, payment-fee assumptions, and hosting costs are constants in the implementation.

Changing these growth or price controls changes the page's scenario. It does not save the public subscription offering, charge an account, or modify a user's tier. The same page also contains Marketing & Ad Spend, which does have its own real save/delete workflow. A local financial assumption and a saved expense record are deliberately described separately below.

### Strategy is reference material, not a live market feed

Strategy groups checked-in content under Market Context, Unit Economics, Break-Even Calc, 36-Month Forecast, Pricing Sensitivity, and Annual Summary. Pricing Sensitivity switches between Starter and Premium examples. The competitor descriptions, scenarios, costs, and conclusions come from source constants; the page does not refresh market research or validate that those assumptions remain current.

This is useful reference material for thinking about the unfinished business model. It is not permission to treat historical competitor prices, forecast returns, or commercial assumptions as current facts. The manual does not repeat those numbers as financial recommendations.

### Revenue Calculator is an independent local scenario

Revenue Calculator accepts subscriber counts and monthly prices for three paid tiers, then shows monthly revenue, assumed API and payment costs, hosting, net income, and one-, three-, six-, and twelve-month totals. It initializes from its own example counts and prices rather than the live account list or a saved scenario library.

Its controls are exploratory. They do not persist, change Subscription Tiers, assign accounts, or initiate checkout. The result is the consequence of the values and formulas on screen, not a prediction that those subscribers or earnings will occur.

## Workflows That Save Real Changes

### Publish a subscription presentation

Subscription Tiers loads the shared tier configuration into an editable draft. The administrator can revise tier names, prices, limits, feature flags, and presentation. The local preview responds before anything is saved. **Save & Apply** normalizes and writes the configuration under `app_settings.subscription_tiers_v1`; the ordinary Account Subscription page loads and subscribes to that setting.

This is a real shared-configuration change. It is not a complete billing action. The inspected Account Subscription page's plan buttons have no purchase handler, and its Current Plan label is derived from authenticated-user metadata. Saving this configuration does not, by itself, demonstrate payment processing, subscription entitlement enforcement, or a change to that user's metadata.

### Change an account's tier and administrator authority

User Management lets the administrator search and filter the loaded account list, begin a tier edit, choose a new tier, and accept a confirmation naming the before-and-after labels. The choices include Alpha, Starter, Premium, Elite, Admin, and Admin (CFO).

After acceptance, the parent dashboard updates its local account and override state, persists the override map under `admin_user_tier_overrides_v1`, and calls `set_admin_access`. Admin and Admin (CFO) both request administrator access; non-admin selections request removal of that access. This is not merely a cosmetic badge change. The checked-in database function adds or removes the `admin` role after checking the caller's administrator authority.

The override write and role change are sequential requests, not one atomic transaction. A later role failure can leave the override saved. The caller logs errors and reloads the account data rather than promising a full rollback. The dashboard's override is also different from the Account page's `subscription_tier` metadata; the inspected flow does not update that metadata or create a paid subscription.

### Review reports and strikes without overstating enforcement

Account Review presents actual loaded reports and strike history. Add Strike writes a `user_strikes` row, including a reason, points, note, issuer, and optional fall-off date. Dismiss updates the selected report's status. These are persistent moderation records.

The current **Ban Account** handler only toggles the local dashboard status between active and suspended. Adding a third active strike also marks the local account suspended. Neither path shown here calls an authentication ban or durable suspension service. The interface's reason labels and point descriptions therefore must not be mistaken for implemented permanent account enforcement. A fall-off date is stored and displayed; this page does not establish an automatic expiration process.

### Record advertising costs and operational notes

Marketing & Ad Spend summarizes saved channels on Overview and provides the full editor in Finance & Projections. The editor saves a channel's name, description, URL, active/cancelled status, recurring amount, monthly/yearly cadence, and start date. The displayed accumulated spend is calculated from elapsed calendar periods and the stored recurring amount; it is not fetched from an advertising platform or bank. Canceling a channel here changes its tracking status, not an external subscription.

Overview Notes is a shared administrator note, not a personal note per account. Typing schedules an autosave after a short pause, and Save requests an immediate write. The service sanitizes the rich text and stores both HTML and plain text under the known overview-note key. Loading, saving, last-saved time, and errors have visible status text. Navigating away cancels a pending autosave timer rather than guaranteeing a final save, so unsaved visible text and stored notes remain distinct.

### Store and retrieve finance documents

Documents accepts one chosen or dropped file, an optional category, and notes. Save Document uploads the bytes to private finance storage, resolves the current account, and inserts a metadata row with the storage path. On success the upload dialog closes and the list reloads. The original filename is retained; blank category becomes Uncategorized.

View requests temporary signed access. PDF and image files have inline presentations. Text types can expose View but currently receive the preview-not-available message; other types use Download. Download also requests a signed URL rather than making the stored object public.

Delete immediately removes a row from the current list, then attempts storage and metadata deletion without confirmation or rollback. This is a destructive real request with incomplete feedback, not removal of a local sample. An upload can likewise leave stored bytes behind if authentication or metadata insertion fails afterward. These limitations are important when relying on the dashboard as a reference library.

## Loading, Failure, Ownership, and Handoffs

Different pages have different recovery behavior. Usage and billing have visible failure messages; subscription Save reports failure; moderation can report unavailable tables or failed writes; notes show load/save errors. Some top-level account and chart failures are only logged or retain defaults. Documents silently handles list-load failure and can show an empty-looking list. A shared dark panel does not imply a shared success or recovery contract.

Finance owns its operational notes, expense-tracking records, document workflow, reporting presentation, and selected administrative mutation paths. Account & Subscription owns the ordinary user's plan presentation. Authentication and role services own access enforcement. Story, character, conversation, and AI generation capabilities produce the records that usage reporting consumes; Finance does not rewrite roleplay because it displays their counters. The [Roleplay Pipeline](?section=roleplay-pipeline&tab=overview) manual remains the explanation of those generation and post-turn mechanisms.

The intended direction is fuller usage and cost management. The current implementation must be understood on its own terms: real connected administration, useful local planning, and unfinished accounting and enforcement are all present. The remaining tabs describe the exact controls and source paths without treating future intent as delivered behavior.

# UI Elements and Functions

## Dashboard Frame

The sidebar presents the nine named pages in a fixed order and highlights the selected one. The page header changes title and subtitle, shows the loaded active-user breakdown, and retains the explicitly marked Net Income placeholder. These controls do not provide a global Save. The outer Admin Back action belongs to the application shell.

## Overview

- **Subscriber Snapshot:** Monthly/Yearly changes the calculation multiplier for counts, income, assumed API spend, fees, and net contribution.
- **App Growth:** Total/By tier and Day/Week/Month/Year change the profile-derived chart presentation.
- **API usage mini-panel:** Total/Tier, Text/Image, and time-period controls request or display the corresponding series. The current Tier branch filters administrator IDs when those are available; it is not a complete arbitrary-tier selector. The balance refresh requests provider billing separately.
- **Net Income mini-panel:** exposes Total/By tier and period controls, but the current underlying data is the negative of estimated API costs, not complete revenue accounting.
- **Marketing & Ad Spend:** summarizes active, paid, free, and cancelled channels and recurring cost; the full editing surface is in Finance & Projections.
- **Notes:** editable rich text with Bold, Italic, Underline, Strikethrough, Small/Normal/Large/H1 sizing, Add checkbox, and Save. Typing schedules autosave; status text reports loading, last save, or error. These formatting controls are not operational-record or workflow controls.

## Finance & Projections

The page repeats summary widgets and adds **Growth Projection**, a 1mo/3mo/6mo/12mo/24mo display selector, per-tier growth inputs and preset choices, and tier-price decrement/input/increment controls. These adjust local calculations and break-even presentation; they do not publish prices.

The full **Marketing & Ad Spend** section offers All, Paid, Active, and Cancelled filters, an add-channel action, and Edit on channel rows. The form contains Name, Description, URL, Status, Recurring cost, Billed cadence, and Subscription start date. Name must contain nonwhitespace text. Save writes the selected channel; Cancel closes without writing. Delete is available when editing and has no second confirmation. The section reports load/save/delete errors. The displayed amount-spent estimate follows saved cadence and date, not a billing integration.

## Strategy

The six tabs are **Market Context**, **Unit Economics**, **Break-Even Calc**, **36-Month Forecast**, **Pricing Sensitivity**, and **Annual Summary**. Pricing Sensitivity offers Starter/Premium. Tabs select checked-in tables, charts, and explanatory material. They do not save assumptions or perform market-data retrieval.

## User Management

Search matches the dashboard's display identity and username fields. Filters are **All**, **Active Users**, **Cancelled**, **Suspended**, **Has Strikes**, and **Pending Reviews**. Refresh reloads the parent account list. The page separately displays Loading users, Loading moderation data, and moderation errors.

The account table shows user identity, tier/cost, administrator-UI status, account status, reported state, strikes, story count, membership age, and an action control. A tier's Edit control opens a select field; Apply requests **Confirm User Tier Change**, while Cancel abandons the edit. **Accept** in the confirmation invokes the actual override/role-change path.

**Account Review** opens above the list with report and history views, current signals, and a chronological report/strike timeline. Add Strike opens Reason, Notes, and optional Falls off date, with Confirm Strike and Cancel. Dismiss targets an open report. Ban Account invokes the local-only status toggle. The displayed View Story control currently has no click handler. Closing the modal changes presentation, not stored reports or strikes.

## API & Usage

The model-pricing panel offers All, Language, Image, Video, and In use filters, a provider-documentation link, and Refresh. **Fetching...**, **Using cached data**, and a timestamp describe the current fallback implementation; the panel title's Live wording is not proof of live pricing.

Summary cards display the named message, image, builder, character, and memory metrics with explanatory help and available cost estimates. **API Cost / Usage** offers Core, Builder, Runtime, Characters, and All series groups; Usage/Cost; and Day/Week/Month/Year. Legend and tooltips identify the selected series. Cost tooltips mark estimates.

**API Test Session Trace** groups recorded sessions by identity, keeping repeated story names as separate runs. It shows the first five by default, offers expansion when more exist, and fills unused columns with **No run yet** placeholders. Rows include activity counts, trusted server events, client diagnostic rows, costed rows, estimated tokens/spend, and registry-defined validation statuses. Reading these records does not run a new test or change a roleplay response.

**xAI API Balance** has a refresh action and displays returned balance fields or loading/error state. Usage, trace, time-series, and billing requests are refreshed periodically while the page remains mounted. The separate pricing refresh is not part of that completed data path.

## Subscription Tiers

The page supplies editable tier presentation, prices, monthly message/image limits, feature controls, and a preview. Feature groups cover Core Chat, Images, Character Builder AI, and Community. The preview responds to local changes.

**Save & Apply** writes the normalized shared configuration. The button changes to **Saving...**, then briefly **Applied!** after success; failure displays **Save failed. Please try again.** The action does not collect payment or assign every displayed feature to a runtime enforcement point.

## Documents

**+ Upload Document** opens a single-file picker/drop area with Category and Notes. The chosen file's name and size appear before upload, and selecting the area again replaces the staged file. Save Document is disabled without a file or while uploading. Cancel or closing the overlay clears the staged form.

The document table shows Type, Name, Category, Notes, Uploaded, and Actions. View opens the temporary preview where offered; Download requests a temporary URL; Delete immediately starts the destructive removal path. PDF previews use an iframe, images use an image element, and unsupported inline types show a download suggestion. The preview has Download and Close controls.

The list displays Loading and a stored-document count. With no rows it shows **No documents yet** even though the current silent error path can also leave the array empty. There is no built-in document search, metadata editor, version history, or confirmation on deletion.

## Revenue Calculator and Styling Rules

Revenue Calculator provides count and monthly-price controls for Starter, Premium, and Elite, with decrement/increment actions and numeric entry. It recalculates tier contributions, a monthly summary, and the four period totals locally. There is no Save or Apply action.

Styling Rules is a read-only reference page containing groups for color, headers, theme, layout, the account table, account-review modal, sidebar, syntax, and general principles. Its historical instructions are reference content, not authority to delete the page or override the current Chronicle Work Manual.

# App Architecture

## Mounting, Page Ownership, and Shared State

`AdminPage` registers `finance_dashboard` and lazy-loads `FinanceDashboardTool`. The default-exported component is named `ChronicleAdmin`; its `NAV` and page mapping select the nine child areas. `FinanceSidebar` and `FinanceHeader` render the internal frame, while the outer Chronicle shell owns Admin navigation.

The parent holds the selected page, dashboard users, user-load state, tier prices, override map, and an estimated API-cost input for administrator snapshot rows. It fetches account data and a monthly usage series on mount. Child pages own their forms, chart selectors, errors, and service requests. `MarketingAdSpend.tsx` is a re-export of `AdSpendTracker` from `OverviewPage.tsx`; the full tracker is mounted by Finance & Projections, whereas Overview mounts `AdSpendMini`.

## Account Load and Tier/Role Mutation

`fetchFinanceDashboardUsers` loads profile identities, `user_roles`, story owner IDs, the tier-override setting, and normalized tier configuration in parallel. It gives administrator roles precedence when constructing the role map, applies a stored override when present, counts stories per owner, and creates display accounts. Missing sources can become empty arrays after logged errors; the result does not distinguish every failed source from an empty table. Status begins as active, with moderation signals initially zero.

The child tier editor calls the parent's `handleTierChange` only after its confirmation. `resolveFinanceUserTier` normalizes the slug and derives whether it is an administrator tier. The parent optimistically updates the account and complete override map, then `saveFinanceUserTierOverride` updates the named `app_settings` row or inserts it if no update row was returned. It subsequently invokes `set_admin_access` with the account ID and desired administrator state.

The inspected SQL function checks `has_role(auth.uid(), 'admin')`, then inserts or deletes that target's `admin` role. Admin (CFO) is a dashboard tier label mapped to the same administrator privilege in this path, not a separately enforced limited CFO role. The two writes are not atomic. On failure the parent logs and reloads; it does not reverse an already successful first write or update auth subscription metadata.

## Subscription Configuration Handoff

`SubscriptionTiersPage` loads configuration from `subscription-tier-config.ts`, maintains local draft rows, and calls `saveSubscriptionTiersConfig`. The service normalizes rows against the known default tier IDs, types, and feature shape, then updates `app_settings.subscription_tiers_v1` or inserts it when absent. Load failure returns checked-in defaults.

`src/components/account/SubscriptionTab.tsx` is the real consumer: it loads the same setting and subscribes to matching `app_settings` changes. This confirms a shared presentation handoff, not billing implementation. Its Current Plan identity comes from auth metadata, and its rendered plan buttons contain no checkout handler. Finance's independent user override setting is not the same authority.

## Usage Summaries, Time Series, Trace Reports, and Billing

`admin-usage-metrics.ts` provides separate adapters for `admin-ai-usage-summary`, `admin-ai-usage-timeseries`, and `admin-api-usage-test-report`. It normalizes returned counters, dates, row sets, accounting modes, and validation statuses. Missing numeric values become zero; failed invocations throw to the component's recovery path. The API & Usage page refreshes summaries, reports, billing, and the selected time series every 120 seconds while mounted.

The usage server functions verify an authenticated administrator before using a service-role client for their reporting queries. Summary reads count user/assistant message rows, scene rows, story-cover references, side-character rows/avatars, and tracked `ai_usage_events`. Some totals take the maximum of row-derived and tracked counts. This is a reporting approximation with mixed provenance, not an assertion that every counted image came from a chargeable generation event.

Time series groups messages and usage events into the requested period and calculates estimated cost through its shared cost estimator. Optional user filtering applies directly to event owners and resolves conversations before filtering messages. Query failures can be logged while partial or empty data continues into reporting. An empty returned chart is therefore narrower evidence than a successful complete accounting read.

The trace-report function loads `ai_usage_test_sessions` and their `ai_usage_test_events`. It prefers server-authoritative events and can retain client diagnostic fallback where server counts do not cover the activity. It reports which accounting mode was used, aggregates estimated tokens/costs, and preserves session identity. `api-usage-validation-registry.ts` owns the displayed validation row vocabulary. These rows describe recorded evidence; they do not enforce runtime behavior, publish Knowledge records, or independently certify the pipeline.

`xai-billing.ts` calls `xai-billing-balance`. Its server function verifies the administrator and tries the management billing integration before a legacy provider path. It returns a source label and normalized balance information or a configured error. These backend-only credentials are not exposed by the dashboard. The separate `XaiModelPricing` component contains no completed live-pricing call: Refresh throws into fallback by design.

## Moderation Records Versus Local Suspension

`UserManagementPage` reads reports and strikes, joins them to loaded account identities, counts open reports and active strike rows, and passes the selected account to `ActionModal`. New strikes insert a real row after resolving the current issuer. Report dismissal writes status and an available reviewer ID. Reloading moderation data refreshes those signals; failure clears the arrays and sets a visible error.

The active-strike count is a row count, not the sum of the saved points. The third-row threshold and Ban Account both change the parent's local user status only. The page's add form closes after dispatching the asynchronous handler, before success is established. A reverse-strike handler exists in the page source, but the inspected rendered modal does not provide a corresponding reverse control. Neither hidden handler presence nor visible policy wording establishes a complete moderation lifecycle.

## Marketing Records and Shared Notes

`finance-ad-spend.ts` maps `ad_spend` rows into display channels and writes both legacy campaign fields and the newer recurring-expense fields. An empty successful query returns the supplied default channel list, as does the tracker's failure fallback after showing an error. The sample organic channel must not be represented as a proved saved expense.

The full tracker inserts or updates one channel and reloads after success; its delete removes the chosen row. Its accumulated-spend calculation uses whole calendar month or year differences and the recurring amount. No advertising-platform purchase, cancellation, or payment request occurs.

`finance-notes.ts` owns the shared `overview_notes` row. It sanitizes HTML on read and write, keeps an allowlisted rich-text subset, removes active content and unsafe attributes, derives a plain-text companion, and upserts by `note_key` with the current author/updater. `NotesEditor` reads the sanitized HTML into its editable area and schedules save 1.2 seconds after input. Unmount clears the pending timer without flushing it. Save state and timestamps describe the completed request, not a revision history or multi-editor conflict guard.

## Document Bytes, Metadata, and Temporary Access

`DocumentsPage` directly owns its Supabase requests. Load selects all permitted `finance_documents` metadata newest first. Upload first stores the file under a timestamp-and-filename path in the same-named bucket, then checks the authenticated user and inserts file metadata. A later failure is reported by alert but does not remove the uploaded object.

Preview and Download request a one-hour signed URL. That URL is temporary presentation access; the metadata's storage path is the lasting file reference. Delete optimistically removes the row from the current array, calls storage removal, then calls metadata deletion. It does not inspect those returned errors, confirm the action, or restore local state on failure. The two resources can therefore diverge. List-load errors are silently handled, and signed-URL failure has no dedicated recovery panel.

## Local Calculations and Unfinished Presentation

`FinanceProjectionsPage` derives counts from loaded accounts but applies local growth/price inputs and fixed cost assumptions. `RevenueCalculatorPage` starts with its own example counts/prices and computes local totals. `StrategyPage` renders source-defined data and tab selections. None of those scenario controls persists a financial model or publishes subscription prices.

`FinanceHeader` contains the explicit Net Income placeholder. `NetIncomeMini` currently maps estimated API cost to negative net without revenue. Other snapshot figures use modeled revenue and costs rather than payment receipts. These are distinct incomplete calculations; the manual does not reconcile or endorse them as current financial truth. Styling Rules is static guidance content within the tool, not an executable style or workflow authority.

## Evidence and Scope Limits

This source account confirms visible controls, request ownership, partial-failure behavior, direct shared consumers, and the documented table/storage boundaries. It does not establish live provider availability, deployed access policies, accounting completeness, real subscription enforcement, automatic moderation bans, or current market prices. Existing prototypes and incomplete controls are preserved rather than repaired by this documentation work.

### Inspected Source Paths

```text
src/pages/Admin.tsx
src/components/admin/finance/FinanceDashboardTool.tsx
src/components/admin/finance/shared/FinanceSidebar.tsx
src/components/admin/finance/shared/FinanceHeader.tsx
src/components/admin/finance/shared/finance-shared.tsx
src/components/admin/finance/overview/OverviewPage.tsx
src/components/admin/finance/overview/MarketingAdSpend.tsx
src/components/admin/finance/projections/FinanceProjectionsPage.tsx
src/components/admin/finance/strategy/StrategyPage.tsx
src/components/admin/finance/users/UserManagementPage.tsx
src/components/admin/finance/usage/ApiUsagePage.tsx
src/components/admin/finance/tiers/SubscriptionTiersPage.tsx
src/components/admin/finance/documents/DocumentsPage.tsx
src/components/admin/finance/calculator/RevenueCalculatorPage.tsx
src/components/admin/finance/style-rules/FinanceStyleRulesPage.tsx
src/services/finance-dashboard/finance-users.ts
src/services/finance-dashboard/finance-ad-spend.ts
src/services/finance-dashboard/finance-notes.ts
src/services/subscription-tier-config.ts
src/services/admin-usage-metrics.ts
src/services/xai-billing.ts
src/components/account/SubscriptionTab.tsx
src/data/api-usage-validation-registry.ts
supabase/functions/admin-ai-usage-summary/index.ts
supabase/functions/admin-ai-usage-timeseries/index.ts
supabase/functions/admin-api-usage-test-report/index.ts
supabase/functions/xai-billing-balance/index.ts
supabase/migrations/20260328113000_2f3d5c4a_admin_role_sync.sql
supabase/migrations/20260619074538_c40f68e6-46ad-48e2-ab2a-2864aad5b794.sql
src/data/supabase-schema-reference.ts
```

# Supabase Tables

## Reference and Policy Limits

The [Supabase Schema Reference](/style-guide/supabase-schema-reference), backed by `src/data/supabase-schema-reference.ts`, is the last synchronized documented account. Its RLS summaries describe **row-level security**, the backend rules that decide which callers may read or change rows. They are not proof that the current deployment matches. The current code shows which requests Finance makes; it cannot grant itself permissions through a button, label, or client-side filter.

## Direct Operational and Configuration Records

| Table | Fields and use in the inspected path | Synchronized access summary |
|---|---|---|
| `app_settings` | `setting_key`, `setting_value`, update metadata, and row IDs. Finance writes `subscription_tiers_v1` and `admin_user_tier_overrides_v1`. | Administrator writes/updates; signed-in reads are limited to approved public keys. The inspected migration includes subscription tiers in that public-key list, not administrator overrides. |
| `profiles` | `id`, `username`, `display_name`, `created_at` identify dashboard accounts. | Owner/admin read; owner writes/updates; no direct delete. |
| `user_roles` | `user_id`, `role` supply privilege information. Mutation uses `set_admin_access`, not a direct table write from the dashboard. | Owner/admin read; no direct insert/update/delete exposed by the reference. |
| `stories` | `user_id` is counted for the account list; report summaries also inspect cover references. | Owner/admin/public reads according to story visibility; owner mutations. Reporting functions have their own privileged server path. |
| `reports` | IDs, reporter/accused IDs, story, reason, note, status, dates; dismissal can write `reviewed_by`. | Administrator read/update/delete; owner/admin insert. |
| `user_strikes` | Account/report IDs, reason, points, note, status, issuer, issue date, `falls_off_at`. | Administrator read/write/update/delete. A stored fall-off field does not prove an expiration worker. |
| `ad_spend` | Campaign/platform/amount/date fields plus name, description, URL, status, recurring cost, cadence, start date, and spent override. | Administrator read/write/update/delete. |
| `admin_notes` | `note_key`, plain `content`, sanitized `content_html`, author/updater, and timestamps. The overview note is shared by key. | Administrator read/write/update/delete. |
| `finance_documents` | Uploader, original filename, storage path, MIME type, byte size, category, note, and timestamps. | Administrator read/write/update/delete. |

The checked-in `set_admin_access` function requires an administrator caller and adds or removes the target account's `admin` role. Its existence in a migration establishes the repository definition, not proof of the deployed function or transaction completion. Neither that function nor the tier-setting save is a payment operation.

## Reporting Sources

`ai_usage_events` supplies event type, source, count, owner, metadata, and timestamps. The synchronized reference describes administrator reads and owner inserts, with no direct update/delete. `ai_usage_test_sessions` groups diagnostic runs by account, story/conversation, status, and time; owners manage their sessions and administrators can read them. `ai_usage_test_events` supplies event keys/sources, status, metadata, token and cost estimates, and validation evidence; the reference describes owner/admin reads and owner inserts without direct updates/deletes.

The administrator report functions additionally read `messages`, `conversations`, `scenes`, `stories`, and `side_characters` for counts and owner filtering. These remain product-owned conversation and story records, not Finance-editable datasets. The synchronized reference describes messages/conversations/side characters as owner-scoped, while story and scene visibility has its own documented rules. The inspected functions perform an administrator check before service-role queries; that server route must not be confused with ordinary client table access.

## Finance Document Storage

The `finance_documents` bucket stores private file bytes. The synchronized reference describes administrator-only read, write, update, and delete. The metadata table's `storage_path` connects each row to its object; preview/download use one-hour signed URLs. Deleting metadata and deleting bytes are separate requests in the current client, without transactional rollback.

## External Billing Is Not a Supabase Balance Table

`xai-billing-balance` obtains billing information from server-side provider integrations after authorization. Its response is displayed in component state. This manual does not invent a local invoice, payment, or balance table, and it does not reproduce credentials. Future billing, entitlement, reconciliation, and account-enforcement work remains distinct from the implemented rows and requests described here.
