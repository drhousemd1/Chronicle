import { webcrypto } from "node:crypto";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import {
  loadChronicleChangelogRegistry,
  selectLoadedChangelogEntries,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import UiAuditPage from "@/pages/style-guide/ui-audit";

const FULL_SUITE_TEST_TIMEOUT_MS = 30_000;

const mocks = vi.hoisted(() => ({
  authState: {
    user: { id: "owner-id" } as { id: string } | null,
    session: { user: { id: "owner-id" } } as { user: { id: string } } | null,
    loading: false,
    isAuthenticated: true,
  },
  getUser: vi.fn(),
  from: vi.fn(),
  readSelect: vi.fn(),
  readEq: vi.fn(),
  readMaybeSingle: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  updateIs: vi.fn(),
  updateSelect: vi.fn(),
  updateMaybeSingle: vi.fn(),
  insert: vi.fn(),
  insertSelect: vi.fn(),
  insertSingle: vi.fn(),
  lastUpdatePayload: null as null | Record<string, unknown>,
  lastInsertPayload: null as null | Record<string, unknown>,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

function ownerRow(updatedAt: string | null = "2026-08-01T12:00:00.000Z") {
  const registry = structuredClone(qualityHubInitialRegistry);
  registry.changeLog[0].summary = "Owner-only legacy Changelog value.";
  return {
    data: {
      registry,
      updated_at: updatedAt,
    },
    error: null,
  };
}

async function expectedGlobalChangelogCount() {
  const result = await loadChronicleChangelogRegistry();
  expect(result.status).toBe("ready");
  return result.status === "ready"
    ? selectLoadedChangelogEntries(result).length
    : 0;
}

describe("Quality Hub normal and migration capture modes", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.authState.user = { id: "owner-id" };
    mocks.authState.session = { user: { id: "owner-id" } };
    mocks.authState.loading = false;
    mocks.authState.isAuthenticated = true;
    mocks.getUser.mockReset().mockResolvedValue({
      data: { user: { id: "owner-id", email: "owner@example.test" } },
      error: null,
    });
    mocks.lastUpdatePayload = null;
    mocks.lastInsertPayload = null;

    const readBuilder = {
      eq: mocks.readEq,
      maybeSingle: mocks.readMaybeSingle,
    };
    const updateBuilder = {
      eq: mocks.updateEq,
      is: mocks.updateIs,
      select: mocks.updateSelect,
      maybeSingle: mocks.updateMaybeSingle,
    };
    const insertBuilder = {
      select: mocks.insertSelect,
      single: mocks.insertSingle,
    };

    mocks.readMaybeSingle.mockReset().mockResolvedValue(ownerRow());
    mocks.readEq.mockReset().mockImplementation(() => readBuilder);
    mocks.readSelect.mockReset().mockImplementation(() => readBuilder);
    mocks.update.mockReset().mockImplementation((payload: Record<string, unknown>) => {
      mocks.lastUpdatePayload = payload;
      return updateBuilder;
    });
    mocks.updateEq.mockReset().mockImplementation(() => updateBuilder);
    mocks.updateIs.mockReset().mockImplementation(() => updateBuilder);
    mocks.updateSelect.mockReset().mockImplementation(() => updateBuilder);
    mocks.updateMaybeSingle.mockReset().mockImplementation(() => ({
      data: {
        registry: mocks.lastUpdatePayload?.registry,
        updated_at: mocks.lastUpdatePayload?.updated_at,
      },
      error: null,
    }));
    mocks.insert.mockReset().mockImplementation((payload: Record<string, unknown>) => {
      mocks.lastInsertPayload = payload;
      return insertBuilder;
    });
    mocks.insertSelect.mockReset().mockImplementation(() => insertBuilder);
    mocks.insertSingle.mockReset().mockImplementation(() => ({
      data: {
        registry: mocks.lastInsertPayload?.registry,
        updated_at: mocks.lastInsertPayload?.updated_at,
      },
      error: null,
    }));
    mocks.from.mockReset().mockImplementation(() => ({
      select: mocks.readSelect,
      update: mocks.update,
      insert: mocks.insert,
    }));
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("keeps the normal Quality Hub free of capture UI and hydrates before persistence", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    let resolveOwner: (value: ReturnType<typeof ownerRow>) => void = () => undefined;
    mocks.readMaybeSingle.mockImplementationOnce(() => new Promise((resolve) => {
      resolveOwner = resolve;
    }));

    render(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/changelog migration capture/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^Changelog Read-only repository change history/ }));
    expect(screen.queryByText(/read-only during migration/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/loading owner history/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Repository history · Read-only")).toBeInTheDocument();
    const globalChangelogCount = await expectedGlobalChangelogCount();
    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(
        globalChangelogCount,
      );
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledWith("quality_hub_registries");
    expect(mocks.readSelect).toHaveBeenCalledWith("registry, updated_at");
    expect(mocks.readEq).toHaveBeenCalledWith("user_id", "owner-id");
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    resolveOwner(ownerRow());
    await waitFor(() => expect(screen.getByRole("button", { name: "Export Workspace" })).toBeEnabled());
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await waitFor(() => expect(setItem).toHaveBeenCalled());
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1), { timeout: 3_000 });
    expect(mocks.insert).not.toHaveBeenCalled();
    const persistedRegistry = mocks.lastUpdatePayload?.registry as typeof qualityHubInitialRegistry;
    expect(persistedRegistry.changeLog).toEqual(ownerRow().data.registry.changeLog);
    expect(mocks.updateEq).toHaveBeenCalledWith("user_id", "owner-id");
    expect(mocks.updateEq).toHaveBeenCalledWith(
      "updated_at",
      "2026-08-01T12:00:00.000Z",
    );

    fireEvent.click(screen.getByRole("button", { name: "Export Workspace" }));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("guards an existing owner row with a null revision and preserves its legacy Changelog", async () => {
    mocks.readMaybeSingle
      .mockResolvedValueOnce(ownerRow(null))
      .mockResolvedValueOnce(ownerRow(null));

    render(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1), { timeout: 3_000 });
    expect(mocks.updateEq).toHaveBeenCalledWith("user_id", "owner-id");
    expect(mocks.updateIs).toHaveBeenCalledWith("updated_at", null);
    expect(mocks.insert).not.toHaveBeenCalled();

    const persistedRegistry = mocks.lastUpdatePayload?.registry as typeof qualityHubInitialRegistry;
    expect(persistedRegistry.changeLog).toEqual(ownerRow(null).data.registry.changeLog);
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("requires a new user action after an authenticated owner changes", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1), { timeout: 3_000 });

    mocks.authState.user = { id: "second-owner-id" };
    mocks.authState.session = { user: { id: "second-owner-id" } };
    mocks.readMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    rerender(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mocks.readEq).toHaveBeenLastCalledWith("user_id", "second-owner-id"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeEnabled());
    await new Promise((resolve) => window.setTimeout(resolve, 1_650));
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.insert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1), { timeout: 3_000 });
    expect(mocks.lastInsertPayload).toMatchObject({
      user_id: "second-owner-id",
      registry: { changeLog: [] },
    });
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("does not carry unscoped browser data into a proven-missing authenticated owner row", async () => {
    const priorOwnerRegistry = structuredClone(qualityHubInitialRegistry);
    priorOwnerRegistry.changeLog[0].summary = "Prior owner legacy Changelog sentinel.";
    priorOwnerRegistry.findings = [
      {
        ...priorOwnerRegistry.findings[0],
        id: "prior-owner-finding-sentinel",
        title: "Prior owner finding sentinel",
      },
      ...priorOwnerRegistry.findings.slice(1),
    ];
    window.localStorage.setItem(
      "chronicle-quality-hub-v1",
      JSON.stringify(priorOwnerRegistry),
    );
    mocks.readMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    render(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Issue Registry/i }));
    expect(await screen.findByPlaceholderText("Search issues...")).toBeEnabled();
    expect(screen.queryByText("Prior owner finding sentinel")).not.toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await waitFor(() => expect(mocks.insert).toHaveBeenCalledTimes(1), { timeout: 3_000 });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.lastInsertPayload).toMatchObject({
      user_id: "owner-id",
      registry: { changeLog: [] },
    });
    const insertedRegistry = mocks.lastInsertPayload?.registry as typeof qualityHubInitialRegistry;
    expect(insertedRegistry.findings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "prior-owner-finding-sentinel" }),
      ]),
    );
    expect(insertedRegistry.changeLog).toEqual([]);

    const locallySavedRegistry = JSON.parse(
      window.localStorage.getItem("chronicle-quality-hub-v1") ?? "null",
    ) as typeof qualityHubInitialRegistry;
    expect(locallySavedRegistry.findings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "prior-owner-finding-sentinel" }),
      ]),
    );
    expect(locallySavedRegistry.changeLog).toEqual([]);
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("does not overwrite the owner row when normal database hydration fails", async () => {
    mocks.readMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: "denied" } });

    render(
      <MemoryRouter>
        <UiAuditPage />
      </MemoryRouter>,
    );

    await screen.findByText(/could not read the owner database/i);
    await new Promise((resolve) => window.setTimeout(resolve, 1_650));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("disables every visible generic write entrance in capture mode and keeps Changelog cards read-only", async () => {
    render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Changelog Read-only repository change history/ }));
    expect(await screen.findByText("Repository history · Read-only")).toBeInTheDocument();
    const globalChangelogCount = await expectedGlobalChangelogCount();
    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(
        globalChangelogCount,
      );
    });
    expect(screen.queryByRole("button", { name: /add entry/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add comment/i })).not.toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Issue Registry/i }));
    expect(await screen.findByPlaceholderText("Search issues...")).toBeEnabled();
    const findingActionButtons = screen.queryAllByRole("button", { name: "Add Comment" });
    expect(findingActionButtons.length).toBeGreaterThan(0);
    expect(findingActionButtons.every((button) => button.hasAttribute("disabled"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Scan Runs/i }));
    expect(
      await screen.findByRole("button", { name: "Log Run Snapshot" }),
    ).toBeDisabled();
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("prepares the authenticated export only after both owner reads remain stable", async () => {
    render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(
      /stable authenticated export is prepared/i,
      undefined,
      { timeout: 10_000 },
    );
    expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /download export json/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /download checksum/i })).toBeEnabled();
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("blocks export when the final authenticated owner read changes", async () => {
    mocks.readMaybeSingle
      .mockResolvedValueOnce(ownerRow())
      .mockResolvedValueOnce(ownerRow("2026-08-01T12:01:00.000Z"));

    render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(/owner database row changed during capture/i);
    expect(screen.queryByRole("button", { name: /download export json/i })).not.toBeInTheDocument();
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("blocks export when local storage changes after the page captured it", async () => {
    const initialLocal = structuredClone(qualityHubInitialRegistry);
    window.localStorage.setItem("chronicle-quality-hub-v1", JSON.stringify(initialLocal));

    render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );

    await screen.findByText(/authenticated owner database history is loaded/i);
    const changedLocal = structuredClone(initialLocal);
    changedLocal.changeLog[0].summary = "Changed after page load.";
    window.localStorage.setItem("chronicle-quality-hub-v1", JSON.stringify(changedLocal));
    fireEvent.click(
      screen.getByRole("button", { name: /export authenticated changelog history/i }),
    );

    await screen.findByText(/local Quality Hub history changed during capture/i);
    expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(2);
  }, FULL_SUITE_TEST_TIMEOUT_MS);

  it("shows authentication and owner-read failures without exporting fallback data", async () => {
    mocks.authState.user = null;
    mocks.authState.session = null;
    mocks.authState.isAuthenticated = false;
    const { unmount } = render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );
    await screen.findByText(/sign in as the owner/i);
    expect(mocks.readMaybeSingle).not.toHaveBeenCalled();
    unmount();

    mocks.authState.user = { id: "owner-id" };
    mocks.authState.session = { user: { id: "owner-id" } };
    mocks.authState.isAuthenticated = true;
    mocks.readMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: "denied" } });
    render(
      <MemoryRouter>
        <UiAuditPage migrationCaptureMode />
      </MemoryRouter>,
    );
    await screen.findByText(/authenticated owner database history could not be read/i);
    expect(screen.queryByRole("button", { name: /download export json/i })).not.toBeInTheDocument();
  }, FULL_SUITE_TEST_TIMEOUT_MS);
});
