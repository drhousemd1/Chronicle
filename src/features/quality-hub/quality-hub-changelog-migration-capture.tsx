import { useCallback, useEffect, useRef, useState } from "react";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import {
  ChangelogMigrationError,
  createChangelogMigrationExport,
  projectQualityHubChangeLog,
  type ApplicationBuildIdentity,
  type AuthenticatedOwnerSnapshot,
  type LocalStorageMigrationSnapshot,
  type SerializedChangelogMigrationExport,
} from "@/lib/quality-hub-changelog-migration";
import {
  capturePreloadLocalStorage,
  readAuthenticatedOwnerSnapshot,
  type OwnerSnapshotReader,
  type PreloadLocalStorageCapture,
} from "@/features/quality-hub/quality-hub-changelog-migration-capture-support";

const DEFAULT_BUILD_IDENTITY: ApplicationBuildIdentity = {
  applicationVersion:
    import.meta.env.VITE_CHRONICLE_APPLICATION_VERSION ?? "unavailable",
  sourceRevision: import.meta.env.VITE_CHRONICLE_SOURCE_REVISION ?? "unavailable",
  sourceFingerprint:
    import.meta.env.VITE_CHRONICLE_SOURCE_FINGERPRINT ?? "unavailable",
};

const noPendingSave = async () => undefined;

type CaptureStatus =
  | "waiting-auth"
  | "loading-owner"
  | "ready"
  | "verifying"
  | "exported"
  | "error";

function safeNow(): string {
  return new Date().toISOString();
}

function downloadExactBytes(filename: string, bytes: Uint8Array, type: string): void {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function readCurrentLocalStorageCapture(): PreloadLocalStorageCapture {
  if (typeof window === "undefined") return capturePreloadLocalStorage(null);
  return capturePreloadLocalStorage(window.localStorage);
}

function toLocalStorageMigrationSnapshot(
  capture: PreloadLocalStorageCapture,
): LocalStorageMigrationSnapshot {
  if (capture.presence === "invalid") {
    throw new ChangelogMigrationError(
      "INVALID_INPUT",
      "The local Quality Hub history is malformed. Export was cancelled.",
    );
  }
  return capture.presence === "absent"
    ? { presence: "absent", capturedAt: capture.capturedAt, registry: null }
    : {
        presence: "captured",
        capturedAt: capture.capturedAt,
        registry: capture.registry,
      };
}

function captureErrorMessage(error: unknown): string {
  if (error instanceof ChangelogMigrationError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "The migration capture failed without producing a file.";
}

export function QualityHubChangelogMigrationCapture({
  authLoading,
  isAuthenticated,
  authenticatedUserId,
  preloadLocalStorage,
  readOwnerSnapshot = readAuthenticatedOwnerSnapshot,
  readLocalStorageCapture = readCurrentLocalStorageCapture,
  beforeOwnerRead = noPendingSave,
  applicationBuild = DEFAULT_BUILD_IDENTITY,
}: {
  authLoading: boolean;
  isAuthenticated: boolean;
  authenticatedUserId: string | null;
  preloadLocalStorage: PreloadLocalStorageCapture;
  readOwnerSnapshot?: OwnerSnapshotReader;
  readLocalStorageCapture?: () => PreloadLocalStorageCapture;
  beforeOwnerRead?: () => Promise<void>;
  applicationBuild?: ApplicationBuildIdentity;
}) {
  const [status, setStatus] = useState<CaptureStatus>("waiting-auth");
  const [message, setMessage] = useState(
    "Quality Hub saves are paused while the signed-in owner history is checked.",
  );
  const [baseline, setBaseline] = useState<AuthenticatedOwnerSnapshot | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [lastExport, setLastExport] = useState<SerializedChangelogMigrationExport | null>(
    null,
  );
  const [copyMessage, setCopyMessage] = useState("");
  const activeLoad = useRef(0);

  useEffect(() => {
    const loadId = activeLoad.current + 1;
    activeLoad.current = loadId;
    setBaseline(null);
    setLastExport(null);
    setCopyMessage("");

    if (authLoading) {
      setStatus("waiting-auth");
      setMessage("Waiting for Chronicle to confirm the signed-in owner.");
      return;
    }
    if (!isAuthenticated || !authenticatedUserId) {
      setStatus("error");
      setMessage("Sign in as the owner before capturing the Quality Hub history.");
      return;
    }

    setStatus("loading-owner");
    setMessage("Reading the authenticated owner database history. No saves are allowed.");
    void beforeOwnerRead()
      .then(() => readOwnerSnapshot(authenticatedUserId))
      .then((snapshot) => {
        if (activeLoad.current !== loadId) return;
        setBaseline(snapshot);
        if (preloadLocalStorage.presence === "invalid") {
          setStatus("error");
          setMessage(
            "The owner database loaded, but the pre-load local Quality Hub history is malformed. Export is blocked so it is not silently discarded.",
          );
          return;
        }
        setStatus("ready");
        setMessage(
          "The authenticated owner database history is loaded. Codex can now prepare the stable migration export.",
        );
      })
      .catch((error: unknown) => {
        if (activeLoad.current !== loadId) return;
        setStatus("error");
        setMessage(captureErrorMessage(error));
      });
  }, [
    authLoading,
    authenticatedUserId,
    beforeOwnerRead,
    isAuthenticated,
    preloadLocalStorage.presence,
    readOwnerSnapshot,
    retryNonce,
  ]);

  const exportHistory = useCallback(async () => {
    if (!baseline || !authenticatedUserId || status !== "ready") {
      return;
    }
    setStatus("verifying");
    setMessage(
      "Re-reading the owner database and verifying that nothing changed during capture.",
    );
    try {
      await beforeOwnerRead();
      const finalLocalStorage = readLocalStorageCapture();
      const finalSnapshot = await readOwnerSnapshot(authenticatedUserId);
      const result = await createChangelogMigrationExport({
        authenticatedOwnerInitial: baseline,
        authenticatedOwnerFinal: finalSnapshot,
        localStorageInitial: toLocalStorageMigrationSnapshot(preloadLocalStorage),
        localStorageFinal: toLocalStorageMigrationSnapshot(finalLocalStorage),
        repositorySeedRegistry: qualityHubInitialRegistry,
        capturedAt: safeNow(),
        applicationBuild,
      });
      setLastExport(result);
      setStatus("exported");
      setMessage(
        "The stable authenticated export is prepared. Download both files below, then stage them outside Git before reconciliation.",
      );
    } catch (error: unknown) {
      setStatus("error");
      setMessage(captureErrorMessage(error));
    }
  }, [
    authenticatedUserId,
    applicationBuild,
    baseline,
    beforeOwnerRead,
    preloadLocalStorage,
    readLocalStorageCapture,
    readOwnerSnapshot,
    status,
  ]);

  const ownerCount = baseline
    ? projectQualityHubChangeLog(
        (baseline.registry as { changeLog?: unknown }).changeLog,
      ).length
    : null;
  const localCount =
    preloadLocalStorage.presence === "captured"
      ? preloadLocalStorage.changeLogCount
      : 0;
  const canExport = status === "ready" && baseline !== null;

  const copyExactText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} copied for Codex staging.`);
    } catch {
      setCopyMessage(`${label} could not be copied. The download remains available.`);
    }
  }, []);

  return (
    <section
      aria-labelledby="quality-hub-migration-capture-title"
      className="rounded-2xl border border-amber-400/50 bg-[#252117] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="quality-hub-migration-capture-title"
            className="text-base font-black text-white"
          >
            Internal Changelog migration capture
          </h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#d4d4d8]">
            This internal route temporarily disables Quality Hub registry saves while Codex
            captures the old Changelog. It is not part of the normal Quality Hub interface.
            Local or seed data never counts as an authenticated database export.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
          Writes locked
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[#d4d4d8] sm:grid-cols-3">
        <div className="rounded-lg bg-black/25 p-3">
          <div className="font-black uppercase tracking-[0.12em] text-[#a1a1aa]">
            Owner database
          </div>
          <div className="mt-1 text-white">
            {ownerCount === null ? "Not verified" : `${ownerCount} Changelog entries loaded`}
          </div>
        </div>
        <div className="rounded-lg bg-black/25 p-3">
          <div className="font-black uppercase tracking-[0.12em] text-[#a1a1aa]">
            Pre-load local storage
          </div>
          <div className="mt-1 text-white">
            {preloadLocalStorage.presence === "invalid"
              ? "Malformed — export blocked"
              : preloadLocalStorage.presence === "absent"
                ? "Absent — recorded as absent"
                : `${localCount} Changelog entries captured`}
          </div>
        </div>
        <div className="rounded-lg bg-black/25 p-3">
          <div className="font-black uppercase tracking-[0.12em] text-[#a1a1aa]">
            Repository seed
          </div>
          <div className="mt-1 text-white">
            {qualityHubInitialRegistry.changeLog.length} Changelog entries available
          </div>
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-4 text-sm text-amber-100">
        {message}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canExport}
          onClick={() => void exportHistory()}
          className="rounded-xl bg-amber-300 px-4 py-2 text-xs font-black text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "verifying" ? "Verifying…" : "Export authenticated Changelog history"}
        </button>
        {status === "error" ? (
          <button
            type="button"
            onClick={() => setRetryNonce((value) => value + 1)}
            className="rounded-xl border border-amber-200/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-white/5"
          >
            Retry owner database read
          </button>
        ) : null}
        {lastExport ? (
          <>
            <button
              type="button"
              onClick={() => downloadExactBytes(lastExport.filename, lastExport.bytes, "application/json;charset=utf-8")}
              className="rounded-xl border border-amber-200/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-white/5"
            >
              Download export JSON
            </button>
            <button
              type="button"
              onClick={() => downloadExactBytes(
                lastExport.checksumFilename,
                new TextEncoder().encode(lastExport.checksumText),
                "text/plain;charset=utf-8",
              )}
              className="rounded-xl border border-amber-200/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-white/5"
            >
              Download checksum
            </button>
            <button
              type="button"
              onClick={() => void copyExactText(
                new TextDecoder().decode(lastExport.bytes),
                "Export JSON",
              )}
              className="rounded-xl border border-amber-200/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-white/5"
            >
              Copy export JSON
            </button>
            <button
              type="button"
              onClick={() => void copyExactText(lastExport.checksumText, "Checksum")}
              className="rounded-xl border border-amber-200/50 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-white/5"
            >
              Copy checksum
            </button>
            <span className="break-all font-mono text-[11px] text-[#d4d4d8]">
              SHA-256: {lastExport.sha256}
            </span>
          </>
        ) : null}
      </div>

      {lastExport ? (
        <div className="mt-4 rounded-lg bg-black/25 p-3 text-xs leading-5 text-[#d4d4d8]">
          Next, run <code className="text-white">npm run quality-hub:migration:stage -- &lt;downloaded-json&gt; &lt;checksum-file&gt;</code>.
          Both downloaded files are required. The staging command verifies the exact bytes and
          places a private copy outside the repository. Do not add the raw download to Git.
        </div>
      ) : null}
      {copyMessage ? (
        <p className="mt-3 text-xs text-[#d4d4d8]">{copyMessage}</p>
      ) : null}
    </section>
  );
}
