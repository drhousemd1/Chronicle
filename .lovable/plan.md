

# Auto-Retry with Content Redirection on xAI Safety Rejections

## Approach

When xAI returns a 403 (content safety rejection), the edge function will automatically retry once with a modified system prompt that instructs Grok to sidestep the flagged content naturally -- keeping the roleplay going without directly addressing what was said. If the retry also fails, the friendly fallback message appears in chat.

## Changes

### File 1: `supabase/functions/chat/index.ts`

Update `callXAI` to detect 403 errors and return a structured result instead of throwing. Add retry logic in the main handler:

- When xAI returns 403, extract the last few messages and prepend a "content redirection" system message like:

```
[CONTENT REDIRECT] The previous user message touched on content the model
cannot engage with directly. Continue the roleplay naturally by:
1. Having the character(s) gracefully deflect, redirect, or change the subject
2. Maintain the current scene's tone and momentum
3. Do NOT reference the filter or moderation -- stay fully in-character
4. Move the story forward in a way that feels organic
```

- Retry the xAI call once with this injected directive
- If the retry also 403s, return a new HTTP status `422` with a specific error type `"content_filtered"`

### File 2: `src/services/llm.ts` (around line 830)

Update the error handling block to check for the `content_filtered` error type and yield the friendly in-character message:

```
"It seems your story got a bit too spicy for the model. Change up the story and try again."
```

This message appears as a normal assistant message in the chat, not as a toast or popup.

## Technical Details

```text
User sends message
       |
       v
  Edge function -> xAI API
       |
    200 OK? -----> Stream response normally
       |
    403? --------> Inject redirect directive
       |              |
       v              v
  Retry xAI API   
       |
    200 OK? -----> Stream redirected response (story continues naturally)
       |
    403 again? --> Return 422 { error_type: "content_filtered" }
       |
       v
  Frontend yields friendly message in chat
```

## Files Modified

1. `supabase/functions/chat/index.ts` -- Add 403 detection, retry with redirect directive, fallback to 422
2. `src/services/llm.ts` -- Handle 422/content_filtered with friendly in-chat message
