import { supabase } from "@/integrations/supabase/client";
import type { AuthenticatedOwnerSnapshot } from "@/lib/quality-hub-changelog-migration";
import { projectQualityHubChangeLog } from "@/lib/quality-hub-changelog-migration";
import {
  isQualityHubRegistry,
} from "@/lib/ui-audit-schema";

export type PreloadLocalStorageCapture =
  | { presence: "captured"; capturedAt: string; registry: unknown; changeLogCount: number }
  | { presence: "absent"; capturedAt: string; registry: null }
  | { presence: "invalid"; capturedAt: string; registry: null };

export type OwnerSnapshotReader = (
  expectedUserId: string,
) => Promise<AuthenticatedOwnerSnapshot>;

function safeNow(): string {
  return new Date().toISOString();
}

export function capturePreloadLocalStorage(
  storage: Pick<Storage, "getItem"> | null,
  capturedAt = safeNow(),
): PreloadLocalStorageCapture {
  if (!storage) return { presence: "absent", capturedAt, registry: null };
  try {
    const raw = storage.getItem("chronicle-quality-hub-v1");
    if (raw === null) return { presence: "absent", capturedAt, registry: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isQualityHubRegistry(parsed)) {
      return { presence: "invalid", capturedAt, registry: null };
    }
    const changeLog = projectQualityHubChangeLog(parsed.changeLog);
    return {
      presence: "captured",
      capturedAt,
      registry: parsed,
      changeLogCount: changeLog.length,
    };
  } catch {
    return { presence: "invalid", capturedAt, registry: null };
  }
}

export async function readAuthenticatedOwnerSnapshot(
  expectedUserId: string,
): Promise<AuthenticatedOwnerSnapshot> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authenticatedUserId = authData.user?.id;
  if (authError || !authenticatedUserId || authenticatedUserId !== expectedUserId) {
    throw new Error("The signed-in owner could not be verified.");
  }

  const { data, error } = await supabase
    .from("quality_hub_registries")
    .select("registry, updated_at")
    .eq("user_id", authenticatedUserId)
    .maybeSingle();

  if (error || !data || typeof data.updated_at !== "string") {
    throw new Error("The authenticated owner database history could not be read.");
  }
  const registry: unknown = data.registry;
  if (!isQualityHubRegistry(registry)) {
    throw new Error("The authenticated owner database history is not valid for migration.");
  }
  projectQualityHubChangeLog(registry.changeLog);

  return {
    authenticatedUserId,
    authenticatedUserEmail: authData.user?.email ?? null,
    databaseUpdatedAt: data.updated_at,
    readAt: safeNow(),
    registry,
  };
}
