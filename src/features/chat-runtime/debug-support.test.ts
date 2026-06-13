import { describe, expect, it } from "vitest";

import {
  buildSupportCallDebugStatus,
  getSupportCallResponseError,
  splitEdgeDebugPayload,
  stringifySupportCallError,
} from "./debug-support";

const modelRequest = (requestBody: unknown) => ({
  endpoint: "https://api.x.ai/v1/responses",
  method: "POST",
  requestBody,
  capturedAt: 123,
});

describe("chat runtime debug support helpers", () => {
  it("returns primitive and null response bodies without debug metadata", () => {
    expect(splitEdgeDebugPayload("ok")).toEqual({ responseBody: "ok" });
    expect(splitEdgeDebugPayload(null)).toEqual({ responseBody: null });
    expect(splitEdgeDebugPayload(undefined)).toEqual({ responseBody: null });
  });

  it("leaves ordinary response objects unchanged when no edge debug payload exists", () => {
    const responseBody = { ok: true, events: [] };

    expect(splitEdgeDebugPayload(responseBody)).toEqual({ responseBody });
  });

  it("strips chronicle_debug_payload and exposes request metadata for debug export", () => {
    const primaryModelRequest = modelRequest({ attempt: "primary" });
    const retryModelRequest = modelRequest({ attempt: "retry" });
    const response = {
      ok: true,
      updates: [],
      chronicle_debug_payload: {
        modelRequest: retryModelRequest,
        modelRequests: [{ ...primaryModelRequest, label: "Existing primary label" }],
        primaryModelRequest,
      },
    };

    expect(splitEdgeDebugPayload(response)).toEqual({
      responseBody: { ok: true, updates: [] },
      modelRequest: retryModelRequest,
      modelRequests: [
        { ...primaryModelRequest, label: "Existing primary label" },
        { ...primaryModelRequest, label: "Primary request before fallback retry" },
      ],
    });
  });

  it("stringifies support-call thrown errors without throwing itself", () => {
    expect(stringifySupportCallError(new Error("network failed"))).toBe("network failed");
    expect(stringifySupportCallError("plain failure")).toBe("plain failure");
    expect(stringifySupportCallError({ error: "bad json" })).toBe('{"error":"bad json"}');
    expect(stringifySupportCallError(null)).toBeUndefined();
  });

  it("reads response-body errors in the same priority order as the prior component helper", () => {
    expect(getSupportCallResponseError({ providerBodyError: " provider failed " })).toBe("providerBodyError: provider failed");
    expect(getSupportCallResponseError({ parseError: " malformed " })).toBe("parseError: malformed");
    expect(getSupportCallResponseError({ focusedRetryParseError: " retry malformed " })).toBe("focusedRetryParseError: retry malformed");
    expect(getSupportCallResponseError({ error: "edge failed" })).toBe("edge failed");
    expect(getSupportCallResponseError({ ok: true })).toBeUndefined();
  });

  it("builds completed or error debug statuses with edge errors taking precedence", () => {
    expect(buildSupportCallDebugStatus(null, { ok: true })).toEqual({
      status: "completed",
      error: undefined,
    });
    expect(buildSupportCallDebugStatus(null, { parseError: "missing_json_object" })).toEqual({
      status: "error",
      error: "parseError: missing_json_object",
    });
    expect(buildSupportCallDebugStatus(new Error("network failed"), { parseError: "missing_json_object" })).toEqual({
      status: "error",
      error: "network failed",
    });
  });
});
