import type { IncomingMessage, ServerResponse } from 'node:http';

import { describe, expect, it, vi } from 'vitest';

import { validationEvidenceDevPlugin } from './dev-middleware';

type Middleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => void | Promise<void>;

function captureMiddleware() {
  const captured: { middleware?: Middleware } = {};
  const plugin = validationEvidenceDevPlugin();
  const configureServer = plugin.configureServer;
  if (typeof configureServer !== 'function') throw new Error('Missing development middleware hook.');
  configureServer.call({} as never, {
    config: { root: process.cwd() },
    middlewares: {
      use(value: Middleware) {
        captured.middleware = value;
      },
    },
  } as never);
  if (!captured.middleware) throw new Error('Development middleware was not registered.');
  return captured.middleware;
}

function responseRecorder() {
  const headers = new Map<string, string>();
  let body = '';
  const response = {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    end(value = '') {
      body += value;
    },
  } as unknown as ServerResponse;
  return { response, headers, body: () => body };
}

function request(url: string, method = 'GET') {
  return {
    url,
    method,
    socket: { remoteAddress: '127.0.0.1' },
  } as IncomingMessage;
}

describe('validation evidence development middleware', () => {
  it('rejects mutation methods before reading evidence', async () => {
    const middleware = captureMiddleware();
    const recorded = responseRecorder();

    await middleware(request('/__validation-evidence/roleplay-pipeline-ledger.json', 'POST'), recorded.response, vi.fn());

    expect(recorded.response.statusCode).toBe(405);
    expect(JSON.parse(recorded.body())).toEqual({ error: 'method_not_allowed' });
  });

  it('rejects traversal-shaped execution ids', async () => {
    const middleware = captureMiddleware();
    const recorded = responseRecorder();

    await middleware(request('/__validation-evidence/report?executionId=..%2F..%2Fprivate'), recorded.response, vi.fn());

    expect(recorded.response.statusCode).toBe(400);
    expect(JSON.parse(recorded.body())).toEqual({ error: 'invalid_execution_id' });
  });

  it('passes unrelated routes through without exposing evidence', async () => {
    const middleware = captureMiddleware();
    const next = vi.fn();
    const recorded = responseRecorder();

    await middleware(request('/unrelated'), recorded.response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(recorded.response.statusCode).toBe(0);
    expect(recorded.body()).toBe('');
  });
});
