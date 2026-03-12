

# Replace `border-ghost-white` with Slate Blue `#4a5f7f` in Story Builder

Same treatment as the Character Builder: replace all `border-ghost-white` with `border-[#4a5f7f]` and all `bg-[#3a3a3f]/30` inner cards with solid `bg-[#2e2e33]`.

## Files & Counts

### 1. `src/components/chronicle/WorldTab.tsx` — 67 replacements
- Global find-replace `border-ghost-white` → `border-[#4a5f7f]`
- Replace `bg-[#3a3a3f]/30` → `bg-[#2e2e33]` on inner card containers (lines 644, 894, 1266)
- Excludes the sidebar "add character" placeholder button which uses `bg-[#3a3a3f]/30` as a hover background (not a bordered card)

### 2. `src/components/chronicle/StoryCardView.tsx` — 46 replacements
- Global find-replace `border-ghost-white` → `border-[#4a5f7f]`
- Replace `bg-[#3a3a3f]/30` → `bg-[#2e2e33]` on the inner card (line 34)

### 3. `src/components/chronicle/ContentThemesSection.tsx` — 22 replacements
- Global find-replace `border-ghost-white` → `border-[#4a5f7f]`

### 4. `src/components/chronicle/StoryGoalsSection.tsx` — 12 replacements
- Global find-replace `border-ghost-white` → `border-[#4a5f7f]`
- Note: line 293 has a conditional border (red on error, ghost-white otherwise) — only the ghost-white fallback changes

