import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const chatEdgeSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/chat/index.ts'),
  'utf8',
);

describe('chat edge function request hardening', () => {
  it('bounds direct caller body size, messages, and provider max tokens before xAI calls', () => {
    expect(chatEdgeSource).toContain('CHAT_REQUEST_MAX_BODY_BYTES');
    expect(chatEdgeSource).toContain('CHAT_REQUEST_MAX_MESSAGES');
    expect(chatEdgeSource).toContain('CHAT_REQUEST_MAX_TOTAL_MESSAGE_CHARS');
    expect(chatEdgeSource).toContain('CHAT_MAX_OUTPUT_TOKENS');

    expect(chatEdgeSource).toContain('readBoundedJsonBody(req)');
    expect(chatEdgeSource).toContain('normalizeChatMessages(body.messages)');
    expect(chatEdgeSource).toContain('clampChatMaxTokens(body.max_tokens)');
    expect(chatEdgeSource).toContain('status: 413');

    expect(chatEdgeSource).not.toContain('max_tokens: maxTokens = 4096');
    expect(chatEdgeSource).not.toContain('const body: ChatRequest = await req.json();');
  });
});
