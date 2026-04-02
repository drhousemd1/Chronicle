import { supabase } from "@/integrations/supabase/client";

export type ApiUsageTestSession = {
  id: string;
  userId: string;
  scenarioId: string | null;
  scenarioName: string;
  conversationId: string | null;
  conversationName: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type FetchActiveSessionOptions = {
  retries?: number;
  retryDelayMs?: number;
  suppressErrors?: boolean;
};

const ENABLED_KEY = "chronicle_api_usage_test_enabled";
const SESSION_ID_KEY = "chronicle_api_usage_test_session_id";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function isApiUsageTestEnabledLocal(): boolean {
  if (!hasWindow()) return false;
  return window.localStorage.getItem(ENABLED_KEY) === "1";
}

export function getApiUsageTestSessionIdLocal(): string | null {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(SESSION_ID_KEY);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setLocalState(enabled: boolean, sessionId?: string | null) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  if (enabled && sessionId) {
    window.localStorage.setItem(SESSION_ID_KEY, sessionId);
  } else {
    window.localStorage.removeItem(SESSION_ID_KEY);
  }
}

export async function fetchActiveApiUsageTestSession(
  options: FetchActiveSessionOptions = {},
): Promise<ApiUsageTestSession | null> {
  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 350);
  const suppressErrors = options.suppressErrors ?? true;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const { data, error } = await supabase.functions.invoke("api-usage-test-session", {
      body: { action: "get" },
    });

    if (!error) {
      return (data?.session || null) as ApiUsageTestSession | null;
    }

    const payload = (typeof data === "object" && data !== null)
      ? (data as Record<string, unknown>)
      : null;
    const payloadError = typeof payload?.error === "string" ? payload.error : null;
    const payloadDetails = typeof payload?.details === "string" ? payload.details : null;
    const errorContext = typeof (error as { context?: unknown }).context === "string"
      ? (error as { context: string }).context
      : null;

    const parts = [payloadError, payloadDetails, error.message, errorContext].filter(
      (value): value is string => Boolean(value),
    );
    lastError = new Error(parts.join(" | ") || "Failed to load test session");

    if (attempt < retries) {
      await delay(retryDelayMs * (attempt + 1));
      continue;
    }
  }

  if (suppressErrors) {
    return null;
  }

  throw lastError ?? new Error("Failed to load test session");
}

export async function startApiUsageTestSession(input: {
  scenarioId?: string | null;
  scenarioName?: string;
  conversationId?: string | null;
  conversationName?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApiUsageTestSession> {
  const { data, error } = await supabase.functions.invoke("api-usage-test-session", {
    body: {
      action: "start",
      scenarioId: input.scenarioId || null,
      scenarioName: input.scenarioName || "",
      conversationId: input.conversationId || null,
      conversationName: input.conversationName || "",
      metadata: input.metadata || {},
    },
  });

  if (error) {
    const payload = (typeof data === "object" && data !== null)
      ? (data as Record<string, unknown>)
      : null;
    const payloadError = typeof payload?.error === "string" ? payload.error : null;
    const payloadDetails = typeof payload?.details === "string" ? payload.details : null;
    const payloadHint = typeof payload?.hint === "string" ? payload.hint : null;
    const context = typeof (error as { context?: unknown }).context === "string"
      ? (error as { context: string }).context
      : null;
    const parts = [payloadError, payloadDetails, payloadHint, error.message, context].filter(
      (value): value is string => Boolean(value),
    );
    throw new Error(parts.join(" | ") || "Failed to start test session");
  }
  const session = data?.session as ApiUsageTestSession | undefined;
  if (!session?.id) throw new Error("Test session did not return an id");
  setLocalState(true, session.id);
  return session;
}

export async function stopApiUsageTestSession(sessionId?: string | null): Promise<ApiUsageTestSession | null> {
  const { data, error } = await supabase.functions.invoke("api-usage-test-session", {
    body: { action: "stop", sessionId: sessionId || null },
  });
  if (error) throw new Error(error.message || "Failed to stop test session");
  setLocalState(false, null);
  return (data?.session || null) as ApiUsageTestSession | null;
}

export function setApiUsageTestLocalDisabled(): void {
  setLocalState(false, null);
}
