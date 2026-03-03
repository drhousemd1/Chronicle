

## Remove the Test A Mockup Component

The `TestAMockup` component and all references to it will be fully removed.

### Changes

**1. Delete `src/components/chronicle/TestAMockup.tsx`**
- Remove the entire file.

**2. Edit `src/components/chronicle/CharactersTab.tsx`**
- Remove the import: `import { TestAMockup } from './TestAMockup';`
- Remove the usage block around line 1192-1193:
  ```
  {/* ── TEST A — editable mockup section ── */}
  <TestAMockup />
  ```

That's it — two files touched, one deleted and one cleaned up. No other components or pages reference it.

