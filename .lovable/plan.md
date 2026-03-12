

# Account Page Swatches — Audit Plan

## Current State (4 swatches, lines 1655-1658)
1. **Near Black** (#121214) — Page background
2. **Charcoal** (#1e1e22) — Setting cards
3. **Warm Charcoal** (#2b2b2e) — Pill tab container
4. **Frosted Slate** (rgba(74,95,127,0.2)) — Subscription plan badge bg

## Source Code Audit

Reviewed: `AccountSettingsTab.tsx`, `PublicProfileTab.tsx`, `SubscriptionTab.tsx`, `Index.tsx` (lines 2358-2391).

### Missing Swatches (11 new entries)

| # | Color | Name | Location | Source |
|---|---|---|---|---|
| 1 | #4a5f7f | Slate Blue | Active tab pill, icon accent (Mail/Shield), focus ring, Update Password/Add/Save buttons, Published Works card border, Coming Soon badge | Index:2374, AccountSettings:46/57/79/97/109, PublicProfile:370/382/395/408/411/460/540, Subscription:76/115 |
| 2 | #5a6f8f | Light Slate Blue | Button hover states (Update Password, Add, Save Profile) | AccountSettings:109, PublicProfile:411/540 |
| 3 | #2a2a2f | Dark Charcoal | Input field backgrounds, email display bg, SFW/NSFW/Remix badge bg on published works | AccountSettings:49/79/97, PublicProfile:370/382/408/483/492 |
| 4 | #7ba3d4 | Steel Blue | Genre tag text, Pro tier name/icon color | PublicProfile:395, Subscription:27 |
| 5 | #a1a1aa | Silver Gray | Inactive tab pill text | Index:2375 |
| 6 | #ffffff | White | All heading text, input text, button text, price text | Everywhere |
| 7 | rgba(255,255,255,0.1) | Faint White | Card borders, input borders (border-white/10) | AccountSettings:44/55/69/79/97, PublicProfile:292/370/382/408/422 |
| 8 | rgba(248,250,252,0.3) | Ghost White | Subtitle text, description text, stat values, loading text | PublicProfile:273/432/445/502/505/523, Subscription:63 |
| 9 | #34d399 | Emerald | "Current Plan" badge text (text-emerald-400) | Subscription:83 |
| 10 | rgba(16,185,129,0.2) | Emerald Badge | "Current Plan" badge bg (bg-emerald-500/20) | Subscription:83 |
| 11 | #fbbf24 | Amber 400 | Premium tier icon/name accent (text-amber-400) | Subscription:43 |

**Total after update: 15 swatches**

## ALL_SWATCHES Updates

New entries needed:
- **Steel Blue** (#7ba3d4) — genre tag text, Pro tier accent
- **Amber 400** (#fbbf24) — Premium tier accent

All others already exist in ALL_SWATCHES.

## Screenshot Capture Plan

Navigate to Account page in the live app, capture real screenshots:

| Screenshot | Target |
|---|---|
| `account-settings-tab.png` | Settings tab: Email card, Plan card, Password form |
| `account-subscription-tab.png` | Subscription tab: 3 tier cards with badges |
| `account-profile-tab.png` | Profile tab: Avatar, form fields, genre tags |
| `account-published-works.png` | Published Works grid with story cards |
| `account-tab-pills.png` | Tab pill bar with active/inactive states |

Each of the 15 swatches gets `locationImages` arrays pointing to the relevant screenshot.

## Implementation Steps

1. Navigate to Account page in preview, capture 4-5 real screenshots
2. Upload to `guide_images/account-page/` bucket
3. Expand Account Page section from 4 → 15 swatches with `locationImages`
4. Add Steel Blue (#7ba3d4) and Amber 400 (#fbbf24) to `ALL_SWATCHES`

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — expand Account Page section, add locationImages, update ALL_SWATCHES

