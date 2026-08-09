import { webcrypto } from "node:crypto";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import {
  QualityHubChangelogMigrationCapture,
} from "@/features/quality-hub/quality-hub-changelog-migration-capture";
import {
  capturePreloadLocalStorage,
  type OwnerSnapshotReader,
} from "@/features/quality-hub/quality-hub-changelog-migration-capture-support";
import type { QualityHubRegistry } from "@/lib/ui-audit-schema";

const ownerId = "owner-id-for-test";
const updatedAt = "2026-08-01T12:00:00.000Z";
const applicationBuild = {
  applicationVersion: "0.0.0",
  sourceRevision: "d9a3fa6adfd84ab896289e03d82283f676a1695e",
  sourceFingerprint: "a".repeat(64),
};

function testRegistry(): QualityHubRegistry {
  return structuredClone({
    ...qualityHubInitialRegistry,
    changeLog: [qualityHubInitialRegistry.changeLog[0]],
  });
}

function ownerReader(
  registry: QualityHubRegistry,
  finalUpdatedAt = updatedAt,
): OwnerSnapshotReader {
  let reads = 0;
  return vi.fn(async () => {
    reads += 1;
    return {
      authenticatedUserId: ownerId,
      authenticatedUserEmail: "owner@example.test",
      databaseUpdatedAt: reads === 1 ? updatedAt : finalUpdatedAt,
      readAt: reads === 1
        ? "2026-08-01T12:00:01.000Z"
        : "2026-08-01T12:00:02.000Z",
      registry: structuredClone(registry),
    };
  });
}

describe("pre-load Quality Hub local-storage capture", () => {
  it("distinguishes absent, malformed, and valid data without substituting seed data", () => {
    expect(capturePreloadLocalStorage({ getItem: () => null }).presence).toBe("absent");
    expect(capturePreloadLocalStorage({ getItem: () => "{" }).presence).toBe("invalid");
    const registry = testRegistry();
    const captured = capturePreloadLocalStorage({
      getItem: () => JSON.stringify(registry),
    });
    expect(captured.presence).toBe("captured");
    if (captured.presence === "captured") {
      expect(captured.changeLogCount).toBe(1);
    }

    const legacyRegistry = structuredClone(testRegistry()) as unknown as Record<string, unknown>;
    delete legacyRegistry.changeLog;
    const legacy = capturePreloadLocalStorage({
      getItem: () => JSON.stringify(legacyRegistry),
    });
    expect(legacy.presence).toBe("captured");
    if (legacy.presence === "captured") expect(legacy.changeLogCount).toBe(0);
  });
});

describe("Quality Hub migration capture", () => {
  beforeEach(() => {
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("crypto", webcrypto);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(async () => undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("waits for pending work, loads only the owner source, and becomes ready without user attestation", async () => {
    const registry = testRegistry();
    const readOwnerSnapshot = ownerReader(registry);
    const beforeOwnerRead = vi.fn(async () => undefined);

    render(
      <QualityHubChangelogMigrationCapture
        authLoading={false}
        isAuthenticated
        authenticatedUserId={ownerId}
        preloadLocalStorage={{
          presence: "absent",
          capturedAt: "2026-08-01T11:59:00.000Z",
          registry: null,
        }}
        readOwnerSnapshot={readOwnerSnapshot}
        beforeOwnerRead={beforeOwnerRead}
        applicationBuild={applicationBuild}
      />,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    expect(beforeOwnerRead).toHaveBeenCalledTimes(1);
    expect(readOwnerSnapshot).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    ).toBeEnabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("prepares a stable export, rechecks both live sources, and requires explicit file downloads", async () => {
    const registry = testRegistry();
    const readOwnerSnapshot = ownerReader(registry);
    const beforeOwnerRead = vi.fn(async () => undefined);
    const localCapture = capturePreloadLocalStorage(
      { getItem: () => JSON.stringify(registry) },
      "2026-08-01T11:59:00.000Z",
    );
    const readLocalStorageCapture = vi.fn(() => capturePreloadLocalStorage(
      { getItem: () => JSON.stringify(registry) },
      "2026-08-01T12:00:01.000Z",
    ));

    render(
      <QualityHubChangelogMigrationCapture
        authLoading={false}
        isAuthenticated
        authenticatedUserId={ownerId}
        preloadLocalStorage={localCapture}
        readOwnerSnapshot={readOwnerSnapshot}
        readLocalStorageCapture={readLocalStorageCapture}
        beforeOwnerRead={beforeOwnerRead}
        applicationBuild={applicationBuild}
      />,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(/stable authenticated export is prepared/i, undefined, { timeout: 10_000 });
    expect(readOwnerSnapshot).toHaveBeenCalledTimes(2);
    expect(readLocalStorageCapture).toHaveBeenCalledTimes(1);
    expect(beforeOwnerRead).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /download export json/i }));
    fireEvent.click(screen.getByRole("button", { name: /download checksum/i }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: /copy export json/i }));
    fireEvent.click(screen.getByRole("button", { name: /copy checksum/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
  });

  it("blocks the download when the owner row changes during the final reread", async () => {
    const registry = testRegistry();
    const readOwnerSnapshot = ownerReader(
      registry,
      "2026-08-01T12:01:00.000Z",
    );
    const objectUrl = vi.mocked(URL.createObjectURL);

    render(
      <QualityHubChangelogMigrationCapture
        authLoading={false}
        isAuthenticated
        authenticatedUserId={ownerId}
        preloadLocalStorage={{
          presence: "captured",
          capturedAt: "2026-08-01T11:59:00.000Z",
          registry,
          changeLogCount: registry.changeLog.length,
        }}
        readOwnerSnapshot={readOwnerSnapshot}
        readLocalStorageCapture={() => ({
          presence: "captured",
          capturedAt: "2026-08-01T12:00:01.000Z",
          registry: structuredClone(registry),
          changeLogCount: registry.changeLog.length,
        })}
        applicationBuild={applicationBuild}
      />,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(/owner database row changed during capture/i);
    expect(objectUrl).not.toHaveBeenCalled();
    expect(readOwnerSnapshot).toHaveBeenCalledTimes(2);
  });

  it("blocks preparation when local storage changes after the pre-load capture", async () => {
    const registry = testRegistry();
    const changedRegistry = testRegistry();
    changedRegistry.changeLog[0].summary = "Changed in another tab.";

    render(
      <QualityHubChangelogMigrationCapture
        authLoading={false}
        isAuthenticated
        authenticatedUserId={ownerId}
        preloadLocalStorage={{
          presence: "captured",
          capturedAt: "2026-08-01T11:59:00.000Z",
          registry,
          changeLogCount: registry.changeLog.length,
        }}
        readOwnerSnapshot={ownerReader(registry)}
        readLocalStorageCapture={() => ({
          presence: "captured",
          capturedAt: "2026-08-01T12:00:01.000Z",
          registry: changedRegistry,
          changeLogCount: changedRegistry.changeLog.length,
        })}
        applicationBuild={applicationBuild}
      />,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(/local Quality Hub history changed during capture/i);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("blocks export when present pre-load local data is malformed", async () => {
    const registry = testRegistry();
    render(
      <QualityHubChangelogMigrationCapture
        authLoading={false}
        isAuthenticated
        authenticatedUserId={ownerId}
        preloadLocalStorage={{
          presence: "invalid",
          capturedAt: "2026-08-01T11:59:00.000Z",
          registry: null,
        }}
        readOwnerSnapshot={ownerReader(registry)}
        applicationBuild={applicationBuild}
      />,
    );

    await screen.findByText(/pre-load local Quality Hub history is malformed/i);
    expect(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    ).toBeDisabled();
    expect(screen.getAllByText(/owner database/i).length).toBeGreaterThan(0);
  });
});
