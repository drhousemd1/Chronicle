

# Fix AI Fill: Robust JSON Extraction and Parsing

## The Problem

The AI Fill function sends a good prompt to the LLM, but the code that extracts and parses the response is brittle. When it fails, it returns an empty object silently, making it look like "nothing happened." Three specific issues:

1. **Fragile JSON extraction** -- A single greedy regex (`\{[\s\S]*\}`) tries to pull JSON from the LLM response. If the LLM wraps it in markdown code fences, adds explanatory text, or returns slightly malformed JSON, this silently fails and returns nothing.
2. **No error recovery** -- Trailing commas, unescaped characters, or truncated output all cause `JSON.parse` to throw, which is caught and silently discarded.
3. **No diagnostic logging** -- When extraction fails, there is zero logging of what the LLM actually returned, making it impossible to debug.

## What will change

### 1. Add a robust `extractJsonFromResponse` utility function

A new helper in `character-ai.ts` that tries multiple strategies in order:
- Strip markdown code fences (```json ... ```)
- Try direct `JSON.parse`
- Use the greedy regex but with cleanup (strip trailing commas, fix control characters)
- Attempt to find the outermost balanced braces manually
- Log the raw response on failure so we can diagnose issues

### 2. Add post-parse validation

After parsing, validate that extracted field values are actually non-empty strings (not `null`, `undefined`, empty string, or whitespace). The LLM sometimes returns `""` or `null` for fields, which passes parsing but results in blank fields in the UI.

### 3. Add diagnostic logging throughout

- Log the number of empty fields detected before the LLM call
- Log the raw LLM response length and first 200 characters
- Log how many fields were successfully extracted and applied
- Log specific failures when individual field extraction goes wrong

## Technical Details

**File: `src/services/character-ai.ts`**

**Change A -- New `extractJsonFromResponse` function (insert around line 560):**
```text
function extractJsonFromResponse(raw: string): any | null {
  // 1. Strip markdown code fences
  // 2. Try direct JSON.parse
  // 3. Regex extract with cleanup (trailing commas, control chars)
  // 4. Log raw on total failure
}
```

**Change B -- Update `aiFillCharacter` (lines 621-625):**
Replace:
```text
const content = data?.choices?.[0]?.message?.content || '';
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (!jsonMatch) return {};
const result = JSON.parse(jsonMatch[0]);
```
With call to `extractJsonFromResponse` plus logging.

**Change C -- Add value validation in the apply sections (lines 628-738):**
Add a helper `isNonEmpty(v)` that checks `typeof v === 'string' && v.trim().length > 0` and use it in place of the current `&& value` checks, which let through whitespace-only strings.

**Change D -- Add summary logging at the end:**
Log how many fields were in the patch before returning, so we can verify the fill actually produced results.

