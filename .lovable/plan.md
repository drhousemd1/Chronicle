
Root cause:
- Yes — the inconsistency is no longer just margin classes. Some subheadings are plain block labels, some are wrapped in `flex` rows with AI buttons, some have tooltip icons, and custom sections use editable title rows with delete buttons.
- Even when all of them say `mb-1.5`, the actual visual gap differs because the header row itself has a different height depending on whether it contains an AI/tooltip/delete control.

Implementation approach:
1. Create one shared header pattern for all “subheading + field below” cases
- Standardize every builder header to:
  - a fixed-height header row
  - consistent bottom spacing
  - a dedicated right-side action rail
- The action rail will hold AI / tooltip / delete controls when present, and an invisible spacer when absent so plain headings sit on the same vertical rhythm.

2. Replace ad-hoc header markup across both builders
- Convert these mixed patterns:
  - plain `label.mb-1.5 block`
  - `flex items-center gap-* mb-1.5`
  - custom title row + `mt-1.5`
- Into one consistent structure where the field always starts after the same header height.

3. Audit every heading-to-field pair on Story Builder
- Normalize:
  - Story Name
  - Brief Description
  - Story Premise
  - Primary Locations
  - custom structured section titles
  - custom freeform section titles
  - Opening Dialog
  - Starting Day & Time
  - Mode / Time Interval / similar control groups
  - Art Style / Custom Rules / Additional Entries
- For custom sections, remove “title row height + extra top margin” drift and make the content start on the same spacing rhythm as normal labeled fields.

4. Audit every heading-to-field pair on Character Builder
- Normalize:
  - Profile labels
  - Role Description
  - any label rows with AI buttons
  - custom section subheadings
  - freeform custom subsection titles
  - structured custom subsection titles
- Ensure section-title rows with trash buttons use the same header height as plain labels, so the field below does not drop lower.

5. Keep Scenario Card as the spacing reference
- Use the Story Card / Scenario Card spacing as the baseline target.
- Only make small parity adjustments there if any header/action combination still deviates.

Files to update:
- `src/components/chronicle/WorldTab.tsx`
- `src/components/chronicle/CharactersTab.tsx`
- `src/components/chronicle/StoryCardView.tsx`
- likely one small shared helper/component for builder subheadings so this stops drifting again

Expected result:
- A heading with AI, tooltip, delete, or no button at all will all produce the same visible spacing to the field beneath it.
- The inconsistency will be fixed at the header-row architecture level, not by chasing individual margins one by one.
