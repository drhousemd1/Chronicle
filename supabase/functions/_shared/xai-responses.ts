export type XaiResponsesReasoningEffort = "low" | "medium" | "high";

export type XaiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type XaiResponsesUsage = {
  input_tokens?: number;
  input_tokens_details?: unknown;
  output_tokens?: number;
  total_tokens?: number;
  reasoning_tokens?: number;
  [key: string]: unknown;
};

export type XaiResponsesDebugModelRequest = {
  endpoint: "https://api.x.ai/v1/responses";
  method: "POST";
  capturedAt: number;
  requestBody: Record<string, unknown>;
  notes?: string[];
};

export type XaiResponsesCallOptions = {
  apiKey: string;
  model: string;
  messages: XaiMessage[];
  stream?: boolean;
  maxOutputTokens?: number;
  temperature?: number;
  store?: boolean;
  reasoningEffort?: XaiResponsesReasoningEffort;
  textFormat?: unknown;
  notes?: string[];
};

export type XaiResponsesResult =
  | { ok: true; response: Response; modelRequest: XaiResponsesDebugModelRequest }
  | { ok: false; status: number; errorText: string; modelRequest: XaiResponsesDebugModelRequest };

export type NormalizedResponsesStreamEvent = {
  visibleText: string;
  reasoningSummary: string;
  completed: boolean;
  failed: boolean;
  incomplete: boolean;
  errorMessage: string | null;
  responseUsage: XaiResponsesUsage | null;
};

const XAI_RESPONSES_ENDPOINT = "https://api.x.ai/v1/responses" as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getProviderErrorMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!isRecord(value)) return null;

  const message = value.message;
  if (typeof message === "string" && message.trim()) return message.trim();

  const error = value.error;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (isRecord(error)) {
    const nestedMessage = error.message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage.trim();
    const nestedCode = error.code;
    if (typeof nestedCode === "string" && nestedCode.trim()) return nestedCode.trim();
  }

  const code = value.code;
  if (typeof code === "string" && code.trim()) return code.trim();

  return null;
}

function collectTextFromContent(content: unknown): string[] {
  if (typeof content === "string") return [content];
  if (!Array.isArray(content)) return [];

  const parts: string[] = [];
  for (const item of content) {
    if (!isRecord(item)) continue;
    const type = typeof item.type === "string" ? item.type : "";
    if (type === "output_text" && typeof item.text === "string") parts.push(item.text);
  }
  return parts;
}

function hasVisibleOutputText(payload: unknown): boolean {
  return extractXaiResponsesText(payload).trim().length > 0;
}

function hasRefusalOutput(payload: unknown): boolean {
  if (!isRecord(payload) || !Array.isArray(payload.output)) return false;
  return payload.output.some((item) => {
    if (!isRecord(item) || !Array.isArray(item.content)) return false;
    return item.content.some((contentItem) => {
      if (!isRecord(contentItem)) return false;
      return contentItem.type === "refusal" || typeof contentItem.refusal === "string";
    });
  });
}

export function getXaiResponsesBodyError(
  payload: unknown,
  options: { requireOutputText?: boolean } = {},
): string | null {
  if (!isRecord(payload)) return "Responses response envelope missing or malformed";

  const providerMessage = getProviderErrorMessage(payload.error);
  if (providerMessage) return providerMessage;

  if (payload.object !== "response") {
    return "Responses response envelope missing or malformed";
  }

  const status = typeof payload.status === "string" ? payload.status : "";
  if (!status) return "Responses response missing status";
  if (status !== "completed") {
    return `Responses request did not complete: ${status}`;
  }

  if (!Array.isArray(payload.output) && typeof payload.output_text !== "string") {
    return "Responses response missing output";
  }

  if (options.requireOutputText && !hasVisibleOutputText(payload)) {
    return hasRefusalOutput(payload)
      ? "Responses request completed with refusal content instead of output_text"
      : "Responses request completed without output_text";
  }

  return null;
}

export function convertChatJsonSchemaToResponsesTextFormat(responseFormat: unknown): unknown {
  if (!isRecord(responseFormat) || responseFormat.type !== "json_schema") return responseFormat;
  const jsonSchema = responseFormat.json_schema;
  if (!isRecord(jsonSchema)) return responseFormat;

  return {
    type: "json_schema",
    name: jsonSchema.name,
    schema: jsonSchema.schema,
    ...(typeof jsonSchema.strict === "boolean" ? { strict: jsonSchema.strict } : {}),
  };
}

export function buildXaiResponsesRequest(options: Omit<XaiResponsesCallOptions, "apiKey" | "notes">): Record<string, unknown> {
  const requestBody: Record<string, unknown> = {
    model: options.model,
    input: options.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: options.stream ?? false,
    store: options.store ?? false,
    reasoning: {
      effort: options.reasoningEffort ?? "medium",
    },
  };

  if (typeof options.temperature === "number") {
    requestBody.temperature = options.temperature;
  }
  if (typeof options.maxOutputTokens === "number") {
    requestBody.max_output_tokens = options.maxOutputTokens;
  }
  if (options.textFormat) {
    requestBody.text = {
      format: convertChatJsonSchemaToResponsesTextFormat(options.textFormat),
    };
  }

  return requestBody;
}

export function buildXaiResponsesDebugModelRequest(
  requestBody: Record<string, unknown>,
  notes?: string[],
): XaiResponsesDebugModelRequest {
  return {
    endpoint: XAI_RESPONSES_ENDPOINT,
    method: "POST",
    capturedAt: Date.now(),
    requestBody,
    ...(notes?.length ? { notes } : {}),
  };
}

export async function callXaiResponses(options: XaiResponsesCallOptions): Promise<XaiResponsesResult> {
  const requestBody = buildXaiResponsesRequest(options);
  const modelRequest = buildXaiResponsesDebugModelRequest(requestBody, options.notes);

  const response = await fetch(XAI_RESPONSES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await readXaiErrorText(response);
    return { ok: false, status: response.status, errorText, modelRequest };
  }

  return { ok: true, response, modelRequest };
}

export async function readXaiErrorText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "unknown");
    return `[failed_to_read_xai_error_body: ${message}]`;
  }
}

export function extractXaiResponsesText(payload: unknown): string {
  if (!isRecord(payload)) return "";
  if (typeof payload.output_text === "string") return payload.output_text;

  const output = payload.output;
  if (!Array.isArray(output)) return "";

  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item)) continue;
    const type = typeof item.type === "string" ? item.type : "";
    if (type !== "message") continue;
    parts.push(...collectTextFromContent(item.content));
  }

  return parts.join("");
}

export function extractXaiResponsesReasoningSummaries(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.output)) return [];

  const summaries: string[] = [];
  for (const item of payload.output) {
    if (!isRecord(item)) continue;
    const type = typeof item.type === "string" ? item.type : "";
    if (!type.includes("reasoning")) continue;
    const summary = item.summary;
    if (typeof summary === "string") summaries.push(summary);
    if (Array.isArray(summary)) {
      for (const entry of summary) {
        if (typeof entry === "string") summaries.push(entry);
        else if (isRecord(entry) && typeof entry.text === "string") summaries.push(entry.text);
      }
    }
  }
  return summaries;
}

export function extractXaiResponsesUsage(payload: unknown): XaiResponsesUsage | null {
  if (!isRecord(payload)) return null;
  const usage = payload.usage;
  if (!isRecord(usage)) return null;
  const outputTokensDetails = isRecord(usage.output_tokens_details) ? usage.output_tokens_details : {};
  return {
    ...usage,
    ...(typeof outputTokensDetails.reasoning_tokens === "number"
      ? { reasoning_tokens: outputTokensDetails.reasoning_tokens }
      : {}),
  } as XaiResponsesUsage;
}

export function normalizeResponsesStreamEvent(event: unknown): NormalizedResponsesStreamEvent {
  const base: NormalizedResponsesStreamEvent = {
    visibleText: "",
    reasoningSummary: "",
    completed: false,
    failed: false,
    incomplete: false,
    errorMessage: null,
    responseUsage: null,
  };

  if (!isRecord(event)) return base;
  const type = typeof event.type === "string" ? event.type : "";

  if (type === "response.output_text.delta" && typeof event.delta === "string") {
    return { ...base, visibleText: event.delta };
  }

  if (type.includes("reasoning") && typeof event.delta === "string") {
    return { ...base, reasoningSummary: event.delta };
  }

  if (type === "response.completed") {
    const bodyError = getXaiResponsesBodyError(event.response);
    if (bodyError) {
      return {
        ...base,
        failed: true,
        errorMessage: bodyError,
        responseUsage: extractXaiResponsesUsage(event.response),
      };
    }
    return {
      ...base,
      completed: true,
      responseUsage: extractXaiResponsesUsage(event.response),
    };
  }

  if (type === "response.failed") {
    return {
      ...base,
      failed: true,
      errorMessage: getProviderErrorMessage(event.error) || "Responses stream failed",
    };
  }

  if (type === "response.incomplete") {
    const response = isRecord(event.response) ? event.response : {};
    const details = isRecord(response.incomplete_details) ? response.incomplete_details : {};
    return {
      ...base,
      incomplete: true,
      errorMessage: typeof details.reason === "string" ? details.reason : "Responses stream incomplete",
      responseUsage: extractXaiResponsesUsage(response),
    };
  }

  return base;
}
