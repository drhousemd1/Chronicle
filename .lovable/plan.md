

# Fix: Chat Streaming Uses Wrong Auth Token

## Root Cause

The `generateRoleplayResponseStream` function in `src/services/llm.ts` (line 811) sends the **anon/publishable key** as the Authorization bearer token instead of the user's actual session JWT:

```typescript
'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
```

The anon key is not a user token, so when the edge function calls `supabase.auth.getUser()`, it correctly rejects it as "Invalid token."

Other edge function calls (character updates, memory extraction, etc.) work fine because they use `supabase.functions.invoke()`, which automatically attaches the real user session token. But this chat streaming call uses raw `fetch()` and hardcodes the wrong credential.

## Fix

In `src/services/llm.ts`, replace the hardcoded anon key with the user's actual session token retrieved from the Supabase client:

```typescript
// Before the fetch call, get the real session token
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;
if (!accessToken) {
  yield "Session expired. Please sign in again.";
  return;
}

// Use the real token
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  // ...
});
```

The `apikey` header is also added since Supabase edge functions expect it alongside the Authorization header for proper routing.

## Files Modified

1. `src/services/llm.ts` -- Replace anon key with real session token in the streaming fetch call (around lines 807-812)

