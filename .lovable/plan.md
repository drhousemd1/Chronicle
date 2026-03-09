

# Convert Remaining SwatchCard Sections to SwatchCardV2 with Human-Readable Color Names

## Scope
File: `src/components/admin/styleguide/StyleGuideTool.tsx`

6 sections still use old `SwatchCard` format with location-based names. Convert all to `SwatchCardV2` with proper color names.

## Account Page (lines 517-520) — 4 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Account Page BG | Near Black | #121214 | bg-[#121214] | Full page background for Account section | ✓ | | |
| Settings Card BG | Charcoal | #1e1e22 | bg-[#1e1e22] | Email, Plan, Password setting cards | ✓ | | |
| Tab Container BG | Warm Charcoal | #2b2b2e | bg-[#2b2b2e] | Pill tab container on Account and Gallery pages | | ✓ | |
| Plan Badge BG | Frosted Slate | rgba(74,95,127,0.2) | bg-[#4a5f7f]/20 | Subscription plan badge background | ✓ | | dashed border |

## Auth Page (lines 529-533) — 5 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Auth Page Gradient | Navy-to-Purple Gradient | from-slate-900 via-purple-900 to-slate-900 | — | Auth page full-screen background | ✓ | | extraPreviewStyle kept |
| Auth Card BG | Dark Slate Glass | rgba(30,41,59,0.5) | bg-slate-800/50 | Login/signup card background | ✓ | | dashed border |
| Auth Input BG | Slate Glass | rgba(51,65,85,0.5) | bg-slate-700/50 | Email and password input fields | ✓ | | dashed border |
| Purple 600 / Auth Submit | Vivid Purple | #7c3aed | bg-purple-600 | Sign In / Create Account button | ✓ | | |
| Purple 400 / Auth Toggle Link | Soft Purple | #a78bfa | text-purple-400 | "Don't have an account? Sign up" toggle text | ✓ | | |

## Creator Profile (lines 545-549) — 5 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Profile Page BG | Near Black | #121214 | bg-[#121214] | Full page background (same as Gallery/Account) | ✓ | | |
| Profile Card BG | Charcoal | #1e1e22 | bg-[#1e1e22] | Profile info card, bio section | ✓ | | |
| Profile Header Bar | White | #ffffff | bg-white | Top header bar on Creator Profile | ✓ | | |
| Stats Pill BG | Ghost White | rgba(255,255,255,0.05) | bg-white/5 | Stat pills (followers, plays, etc.) | ✓ | | dashed border |
| Unfollow Button BG | Faint White | rgba(255,255,255,0.1) | bg-white/10 | Unfollow button (toggle state) | ✓ | | dashed border |

## Global Sidebar (lines 562-564) — 3 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Sidebar Background | Soft Black | #1a1a1a | bg-[#1a1a1a] | Global left sidebar | | ✓ | |
| Active Sidebar Item | Slate Blue | #4a5f7f | bg-[#4a5f7f] | Active navigation item background | | ✓ | effect="shadow-lg shadow-black/40" |
| Inactive Sidebar Text | Muted Slate | #94a3b8 | text-slate-400 | Inactive sidebar item text and icons | | ✓ | |

## Character Builder (lines 573-575) — 3 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Inner Card Surface | Muted Charcoal | rgba(58,58,63,0.3) | bg-[#3a3a3f]/30 | Inner card, character trait row containers | ✓ | | dashed border |
| HardcodedRow Label BG | Smoke Black | rgba(24,24,27,0.5) | bg-zinc-900/50 | Read-only trait labels (Physical Appearance, etc.) | ✓ | | dashed border |
| Enhance Hover BG | Faint Blue | rgba(96,165,250,0.1) | bg-blue-500/10 | AI Enhance sparkle button hover state | ✓ | | dashed border |

## Model Settings (lines 584-587) — 4 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| Model Card BG (Inactive) | White | #ffffff | bg-white | Inactive model selection card | ✓ | | |
| Model Card BG (Active) | Deep Navy | #0f172a | bg-slate-900 | Active/selected model card | ✓ | | |
| Admin Share Panel | Pale Lavender | #faf5ff | bg-purple-50 | Admin-only share toggle row | ✓ | | |
| Connection Setup BG | Ice White | #f8fafc | bg-slate-50 | Connection setup container | ✓ | | |

## World Tab (lines 600-601) — 2 swatches

| Current Name | New Name | Value | Token | Locations | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| CharacterButton BG | Near Black Glass | rgba(0,0,0,0.8) | bg-black/80 | World Tab character card button background | ✓ | | |
| CharacterButton Border | Slate Blue | #4a5f7f | border-[#4a5f7f] | Character card border, hover brightens to #6b82a8 | ✓ | | |

## Summary
- Convert 26 old `SwatchCard` calls → `SwatchCardV2` with human-readable color names
- Preserve all existing `InconsistencyNote` blocks and `extraPreviewStyle` where applicable
- Add dashed border previews to all semi-transparent swatches

