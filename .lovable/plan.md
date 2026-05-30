## Edge Function Redeploy

Redeploy the following four Supabase Edge Functions from current repository code:

1. `evaluate-goal-alignment`
2. `evaluate-goal-progress`
3. `extract-character-updates`
4. `extract-memory-events`

No database schema, table, RLS, or migration changes.

Verify deployment success for all four functions.

## Technical Details

- Use `supabase--deploy_edge_functions` with function names array.
- No source code edits required.
- Confirm deployment via tool output.