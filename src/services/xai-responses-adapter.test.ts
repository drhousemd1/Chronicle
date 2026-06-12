import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildXaiResponsesRequest,
  callXaiResponses,
  convertChatJsonSchemaToResponsesTextFormat,
  extractXaiResponsesReasoningSummaries,
  extractXaiResponsesText,
  extractXaiResponsesUsage,
  getXaiResponsesBodyError,
  normalizeResponsesStreamEvent,
} from "../../supabase/functions/_shared/xai-responses";

describe("xAI Responses adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds the roleplay runtime Responses request shape", () => {
    const request = buildXaiResponsesRequest({
      model: "grok-4.3",
      messages: [
        { role: "system", content: "System text" },
        { role: "user", content: "User text" },
      ],
      stream: true,
      maxOutputTokens: 3072,
      temperature: 0.6,
      store: false,
      reasoningEffort: "medium",
    });

    expect(request).toMatchObject({
      model: "grok-4.3",
      input: [
        { role: "system", content: "System text" },
        { role: "user", content: "User text" },
      ],
      stream: true,
      max_output_tokens: 3072,
      temperature: 0.6,
      store: false,
      reasoning: { effort: "medium" },
    });
    expect(request).not.toHaveProperty("messages");
    expect(request).not.toHaveProperty("max_tokens");
    expect(request).not.toHaveProperty("response_format");
  });

  it("defaults to store false and medium reasoning when callers omit them", () => {
    const request = buildXaiResponsesRequest({
      model: "grok-4.3",
      messages: [{ role: "user", content: "Use safe defaults" }],
    });

    expect(request).toMatchObject({
      stream: false,
      store: false,
      reasoning: { effort: "medium" },
    });
  });

  it("maps Chat Completions json_schema format into Responses text.format", () => {
    const format = convertChatJsonSchemaToResponsesTextFormat({
      type: "json_schema",
      json_schema: {
        name: "chronicle_test",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { value: { type: "string" } },
          required: ["value"],
        },
      },
    });

    expect(format).toEqual({
      type: "json_schema",
      name: "chronicle_test",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { value: { type: "string" } },
        required: ["value"],
      },
    });

    const request = buildXaiResponsesRequest({
      model: "grok-4.3",
      messages: [{ role: "user", content: "Return JSON" }],
      textFormat: {
        type: "json_schema",
        json_schema: {
          name: "chronicle_test",
          schema: { type: "object", properties: {}, additionalProperties: false },
        },
      },
    });

    expect(request).toMatchObject({
      text: {
        format: {
          type: "json_schema",
          name: "chronicle_test",
          schema: { type: "object", properties: {}, additionalProperties: false },
        },
      },
    });
    expect(request).not.toHaveProperty("response_format");
  });

  it("calls the xAI Responses endpoint with the normalized request body", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ output_text: "ok" }), { status: 200 }),
    );

    const result = await callXaiResponses({
      apiKey: "test-key",
      model: "grok-4.3",
      messages: [{ role: "user", content: "Hello" }],
      stream: true,
      maxOutputTokens: 1024,
      temperature: 0.6,
      store: false,
      reasoningEffort: "medium",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.x.ai/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "grok-4.3",
      input: [{ role: "user", content: "Hello" }],
      stream: true,
      store: false,
      reasoning: { effort: "medium" },
      max_output_tokens: 1024,
      temperature: 0.6,
    });
    expect(result.ok).toBe(true);
    expect(result.modelRequest.endpoint).toBe("https://api.x.ai/v1/responses");
  });

  it("extracts visible text without leaking reasoning summaries", () => {
    const payload = {
      output: [
        {
          type: "reasoning",
          summary: [{ text: "Hidden reasoning summary" }],
        },
        {
          type: "web_search_call",
          content: [
            { type: "output_text", text: "Search detail should not render." },
          ],
        },
        {
          type: "message",
          content: [
            { type: "output_text", text: "Sarah: " },
            { type: "output_text", text: "\"Get inside.\"" },
            { type: "refusal", refusal: "Refusal text should not render." },
            { type: "summary_text", text: "Summary text should not render." },
          ],
        },
      ],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
        output_tokens_details: { reasoning_tokens: 12 },
      },
    };

    expect(extractXaiResponsesText(payload)).toBe("Sarah: \"Get inside.\"");
    expect(extractXaiResponsesReasoningSummaries(payload)).toEqual(["Hidden reasoning summary"]);
    expect(extractXaiResponsesUsage(payload)).toMatchObject({
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
      reasoning_tokens: 12,
    });
  });

  it("uses output_text shortcut when present", () => {
    expect(extractXaiResponsesText({ output_text: "{\"events\":[]}" })).toBe("{\"events\":[]}");
  });

  it("detects non-stream Responses body failures before callers parse empty output as valid state", () => {
    expect(getXaiResponsesBodyError("not an object")).toBe("Responses response envelope missing or malformed");
    expect(getXaiResponsesBodyError({ status: "completed", output_text: "{}" })).toBe("Responses response envelope missing or malformed");
    expect(getXaiResponsesBodyError({ object: "response", output_text: "{}" })).toBe("Responses response missing status");
    expect(getXaiResponsesBodyError({ object: "response", status: "completed" })).toBe("Responses response missing output");

    expect(getXaiResponsesBodyError({
      object: "response",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
    })).toBe("Responses request did not complete: incomplete");

    expect(getXaiResponsesBodyError({
      object: "response",
      status: "completed",
      error: { message: "Safety system blocked the response" },
    })).toBe("Safety system blocked the response");

    expect(getXaiResponsesBodyError({
      object: "response",
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "refusal", refusal: "Cannot comply" }],
        },
      ],
    }, { requireOutputText: true })).toBe("Responses request completed with refusal content instead of output_text");

    expect(getXaiResponsesBodyError({
      object: "response",
      status: "completed",
      output: [],
      usage: { input_tokens: 1, output_tokens: 0, total_tokens: 1 },
    }, { requireOutputText: true })).toBe("Responses request completed without output_text");

    expect(getXaiResponsesBodyError({
      object: "response",
      status: "completed",
      output: [],
      output_text: "{}",
    }, { requireOutputText: true })).toBeNull();
  });

  it("normalizes streaming text, reasoning, completion, and failure events", () => {
    expect(normalizeResponsesStreamEvent({ type: "response.output_text.delta", delta: "Hello" })).toMatchObject({
      visibleText: "Hello",
      completed: false,
    });

    expect(normalizeResponsesStreamEvent({ type: "response.reasoning_summary_text.delta", delta: "internal" })).toMatchObject({
      reasoningSummary: "internal",
      visibleText: "",
    });

    expect(normalizeResponsesStreamEvent({
      type: "response.completed",
      response: {
        object: "response",
        status: "completed",
        output_text: "Done",
        output: [],
        usage: {
          input_tokens: 1,
          output_tokens: 2,
          total_tokens: 3,
          output_tokens_details: { reasoning_tokens: 1 },
        },
      },
    })).toMatchObject({
      completed: true,
      responseUsage: {
        input_tokens: 1,
        output_tokens: 2,
        total_tokens: 3,
        reasoning_tokens: 1,
      },
    });

    expect(normalizeResponsesStreamEvent({
      type: "response.completed",
      response: {
        object: "response",
        status: "incomplete",
        output: [],
        incomplete_details: { reason: "max_output_tokens" },
        usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
      },
    })).toMatchObject({
      failed: true,
      completed: false,
      errorMessage: "Responses request did not complete: incomplete",
      responseUsage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
    });

    expect(normalizeResponsesStreamEvent({
      type: "response.failed",
      error: { message: "blocked" },
    })).toMatchObject({
      failed: true,
      errorMessage: "blocked",
    });

    expect(normalizeResponsesStreamEvent({
      type: "response.incomplete",
      response: {
        incomplete_details: { reason: "max_output_tokens" },
        usage: { input_tokens: 2, output_tokens: 3, total_tokens: 5 },
      },
    })).toMatchObject({
      incomplete: true,
      errorMessage: "max_output_tokens",
      responseUsage: { input_tokens: 2, output_tokens: 3, total_tokens: 5 },
    });

    expect(normalizeResponsesStreamEvent("not an event")).toMatchObject({
      visibleText: "",
      completed: false,
      failed: false,
      incomplete: false,
    });
  });
});
