
Goal: make Test A visually match your screenshot by restoring the dark hardcoded container while keeping the value fields editable.

What went wrong
- The latest edit changed the outer wrapper to theme tokens (`bg-card`, `text-card-foreground`).
- In this app, those tokens resolve to a light card (white) unless dark mode classing is active globally.
- That is why the block turned white and stopped matching your screenshot.

Implementation plan

1) Update only `src/components/chronicle/TestAMockup.tsx`
- Keep the editable input behavior exactly as-is (the `useState` + `onChange` logic stays).
- Revert the outer shell/header text colors back to the hardcoded dark values that matched your image.

2) Apply exact container/header classes (restore dark shell)
- Card shell:
  - from: `w-full rounded-lg border bg-card text-card-foreground shadow-sm`
  - to: `w-full rounded-lg border border-white/10 bg-[#1c1c1e] text-white shadow-sm`
- Header wrapper:
  - from: `flex flex-col space-y-1.5 p-6 border-b`
  - to: `flex flex-col space-y-1.5 p-6 border-b border-white/10`
- Title:
  - ensure explicit `text-white`
- Subtitle:
  - ensure `text-zinc-500`

3) Keep rows editable and preserve the row styling you requested
- Leave each value as an `<input>` (not static text).
- Keep your token-based row field styling:
  - labels: `border-input dark:bg-input/30 ...`
  - values: `border-input dark:bg-input/30 ... text-muted-foreground`
  - sparkles/lock: `text-muted-foreground`
- No structural change to row grid or Add Row button behavior in this pass.

4) Visual parity pass (“look at every element”)
- Confirm:
  - dark card background, subtle white border, white title, muted gray subtitle
  - label chips/input fields/icons match current screenshot proportions/colors
  - all value fields are still typeable for testing

Expected result
- The container matches the dark screenshot style again.
- Inputs remain editable for test typing.
- Only the wrapper/header coloring is changed; interaction behavior remains intact.

Technical note
- This component intentionally mixes hardcoded dark container colors with token-based inner row styling because that is the combination you requested and is what matches your screenshot in the current app theme setup.
