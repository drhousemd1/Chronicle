import type { ChatDebugRequestRecord } from "@/features/chat-debug/types";

export type EdgeDebugPayload = {
  modelRequest?: ChatDebugRequestRecord["modelRequest"];
  modelRequests?: ChatDebugRequestRecord["modelRequests"];
  primaryModelRequest?: ChatDebugRequestRecord["modelRequest"];
  artifactIdentity?: ChatDebugRequestRecord["roleplayArtifactIdentity"];
};

export function splitEdgeDebugPayload(data: unknown): {
  responseBody: unknown;
  modelRequest?: ChatDebugRequestRecord["modelRequest"];
  modelRequests?: ChatDebugRequestRecord["modelRequests"];
  artifactIdentity?: ChatDebugRequestRecord["roleplayArtifactIdentity"];
} {
  if (!data || typeof data !== "object") {
    return { responseBody: data ?? null };
  }

  const raw = data as Record<string, unknown>;
  const payload = raw.chronicle_debug_payload as EdgeDebugPayload | undefined;
  if (!payload || typeof payload !== "object") {
    return { responseBody: data };
  }

  const responseBody = { ...raw };
  delete responseBody.chronicle_debug_payload;
  const modelRequests = [
    ...(payload.modelRequests || []),
    ...(payload.primaryModelRequest
      ? [{ ...payload.primaryModelRequest, label: "Primary request before fallback retry" }]
      : []),
  ];

  return {
    responseBody,
    modelRequest: payload.modelRequest,
    modelRequests: modelRequests.length ? modelRequests : undefined,
    artifactIdentity: payload.artifactIdentity,
  };
}

export function stringifySupportCallError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getSupportCallResponseError(responseBody: unknown): string | undefined {
  if (!responseBody || typeof responseBody !== "object") return undefined;
  const raw = responseBody as Record<string, unknown>;
  const providerBodyError = typeof raw.providerBodyError === "string" && raw.providerBodyError.trim()
    ? raw.providerBodyError.trim()
    : "";
  if (providerBodyError) return `providerBodyError: ${providerBodyError}`;

  const parseError = typeof raw.parseError === "string" && raw.parseError.trim()
    ? raw.parseError.trim()
    : "";
  if (parseError) return `parseError: ${parseError}`;

  const focusedRetryParseError = typeof raw.focusedRetryParseError === "string" && raw.focusedRetryParseError.trim()
    ? raw.focusedRetryParseError.trim()
    : "";
  if (focusedRetryParseError) return `focusedRetryParseError: ${focusedRetryParseError}`;

  const responseError = typeof raw.error === "string" && raw.error.trim()
    ? raw.error.trim()
    : "";
  if (responseError) return responseError;

  return undefined;
}

export function buildSupportCallDebugStatus(
  edgeError: unknown,
  responseBody: unknown,
): Pick<ChatDebugRequestRecord, "status" | "error"> {
  const error = stringifySupportCallError(edgeError) || getSupportCallResponseError(responseBody);
  return {
    status: error ? "error" : "completed",
    error,
  };
}
