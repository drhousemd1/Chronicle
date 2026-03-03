

# Add "Test A" Mockup Section to Character Builder

## What
Add a purely visual, hardcoded mockup section called **"Test A"** below the Goals and Desires section in the character builder detail view. This uses the shadcn card styling from your uploaded code/screenshot -- no database connections, no app wiring, just a static visual test.

## Where
**File:** `src/components/chronicle/CharactersTab.tsx`
**Location:** Between line 1189 (after `CharacterGoalsSection`) and line 1191 (before user-created custom sections)

## What Gets Added
A self-contained JSX block using shadcn's Card component structure with:
- Card shell with header ("Test A" title + description subtitle)
- 11 static rows matching the Physical Appearance layout from your mockup: Hair Color, Eye Color, Build, Body Hair, Height, Breasts, Genitalia, Skin Tone, Makeup, Body Markings, Temporary Conditions
- Each row uses a 4-column grid: label pill, sparkle icon, value field, lock icon
- Styling uses shadcn/Tailwind dark theme tokens (`bg-card`, `border-input`, `dark:bg-input/30`, `text-muted-foreground`)
- "Add Row" dashed button in the footer
- All elements are static/non-functional -- purely for visual comparison

## Technical Detail
- Uses Lucide icons (`Sparkles`, `Lock`, `Plus`) already imported in the file
- No new components, no new state, no props -- just a block of JSX
- Easy to remove later once you've decided on the styling direction

