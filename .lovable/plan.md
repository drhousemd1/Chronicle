
You’re right to call this out. The previous fix targeted the wrong UI surface (chat-play character cards), while your screenshot/complaint is about the Scenario Builder roster column. That is why you saw “no change.”

## What actually went wrong

1. The visible roster in Scenario Builder is rendered by `CharacterButton` in `src/components/chronicle/WorldTab.tsx` (not the chat card components we edited).
2. In that component, the card is currently transparent at rest and only gets `bg-slate-50` on hover:
   - `... hover:bg-slate-50 ...`
3. The name uses dark text:
   - `text-slate-800`
4. Dark text on transparent/dark background = hidden until hover.  
   So this is a contrast/state bug in `WorldTab` card styling.

## Corrective implementation scope

### 1) Fix the Scenario Builder roster card contrast at rest (primary fix)
**File:** `src/components/chronicle/WorldTab.tsx`  
**Component:** `CharacterButton`

- Make the card light-themed at rest (not only on hover), consistent with existing intended contrast:
  - add default `bg-slate-50`
  - keep hover polish (e.g. `hover:bg-white` or keep subtle border change)
- Keep name text dark (`text-slate-800`) since background will now be light and readable.
- Preserve the existing visual language (rounded card, subtle border, avatar treatment).

This fixes the hidden-name problem without forcing white text and avoids clashing with the existing sidebar style preference.

### 2) Add Sex + Age directly under name in the same roster card
**File:** `src/components/chronicle/WorldTab.tsx`  
**Component:** `CharacterButton`

- Insert metadata line under name:
  - value: `{[char.sexType, char.age].filter(Boolean).join(' · ')}`
- Show only if one/both values exist (no dangling separator).
- Style in smaller muted text, still readable on light card:
  - e.g. `text-[10px] text-slate-500 truncate`
- Keep current `controlledBy` line below this metadata.

Resulting order:
1. Name
2. Sex · Age (new)
3. AI/User controlledBy (existing)

### 3) Clean up the prior mis-targeted change (so we explicitly fix the “wrong edit”)
Because the last edit changed chat-play card styling instead of Scenario Builder, I’ll include a cleanup pass:

- Re-check `ChatInterfaceTab.tsx` and `SideCharacterCard.tsx` for unintended side effects from the wrong-target patch.
- If those changes were not requested for that surface, revert them to prior behavior.
- If they are acceptable and harmless, keep them but document that the actual bug fix is in `WorldTab.tsx`.

Given your feedback, I will treat these earlier changes as out-of-scope for this request and roll back if they alter behavior you did not ask for.

## Why this plan is the right fix

- It targets the exact component rendering the broken UI.
- It resolves contrast correctly at the container level (background), not just text color hacks.
- It adds the requested Sex/Age display where you are actually looking.
- It explicitly includes undoing the wrong-target work to address the “fix the fuck up” concern.

## Validation checklist after implementation

1. Open Scenario Builder and confirm names are visible without hover.
2. Confirm each card shows Sex/Age under name when available.
3. Confirm no weird separators (e.g. just `·`) when one field is missing.
4. Confirm controlledBy label still renders correctly.
5. Confirm both Main and Side character lists in Scenario Builder reflect this.
6. Confirm chat-play card behavior is either reverted (if unintended) or unchanged per your preference.
