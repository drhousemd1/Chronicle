

# Fix xAI Billing Parser — Get Correct Numbers

## Problem
The edge function's `summarizePrepaid` uses heuristic regex-based field matching (`findFirstByKeyPattern`) that grabs wrong fields from the xAI API response. Real values: $66.63 total, $55.68 remaining, $10.95 used. Parser returns: $247.21 total, -$100 remaining, $347.21 used.

## Steps

### 1. Add raw response logging to the edge function
Add `console.log(JSON.stringify(prepaidRes.data))` and `console.log(JSON.stringify(invoiceRes.data))` in `tryManagementApi()` so we can see the exact JSON shape xAI returns.

### 2. Deploy and invoke to capture logs
Redeploy the function, trigger a call, then read the edge function logs.

### 3. Replace heuristic parser with exact field mapping
Once we see the real response shape, replace `summarizePrepaid` and `findFirstByKeyPattern` with direct field access that reads the correct values. No more guessing cents vs dollars — we'll map exactly what the API provides.

### 4. Verify output matches screenshot
Confirm the function returns values matching your xAI dashboard: ~$66.63 total, ~$55.68 remaining, ~$10.95 used.

## Technical detail
The root cause is in `supabase/functions/xai-billing-balance/index.ts` — the `summarizePrepaid` function and `toUsdCents` helper assume values might be in cents and apply `* 100` or `/ 100` transformations based on heuristics. The xAI API likely returns dollar amounts directly, and the parser is mangling them.

