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

function setLocalState(enabled: boolean, sessionId?: string | null) {
  if (!hasWindow()) return;
  window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  if (enabled && sessionId) {
    window.localStorage.setItem(SESSION_ID_KEY, sessionId);
  } else {
    window.localStorage.removeItem(SESSION_ID_KEY);
  }
}

export async function fetchActiveApiUsageTestSession(): Promise<ApiUsageTestSession | null> {
  const { data, error } = await supabase.functions.invoke("api-usage-test-session", {
    body: { action: "get" },
  });
  if (error) throw new Error(error.message || "Failed to load test session");
  return (data?.session || null) as ApiUsageTestSession | null;
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

  if (error) throw new Error(error.message || "Failed to start test session");
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
