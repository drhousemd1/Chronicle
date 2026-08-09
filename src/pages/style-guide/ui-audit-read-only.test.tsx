// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import type {
  ChangeLogEntry,
  QualityFinding,
  QualityHubRegistry,
} from "@/lib/ui-audit-schema";
import UiAuditPage from "@/pages/style-guide/ui-audit";

const STORAGE_KEY = "chronicle-quality-hub-v1";
const PENDING_OWNER_SAVE_KEY_PREFIX = "chronicle-quality-hub-pending-v1";
const OWNER_ID = "phase-7-owner";
const SECOND_OWNER_ID = "phase-7-second-owner";
const INITIAL_UPDATED_AT = "2026-08-06T08:00:00.000Z";
const ASYNC_SAVE_TIMEOUT_MS = 5_000;

type OwnerRow = {
  registry: QualityHubRegistry;
  updated_at: string | null;
};

const mocks = vi.hoisted(() => ({
  authState: {
    user: { id: "phase-7-owner" } as { id: string } | null,
    session: { user: { id: "phase-7-owner" } } as { user: { id: string } } | null,
    loading: false,
    isAuthenticated: true,
  },
  ownerRow: null as OwnerRow | null,
  secondOwnerRow: null as OwnerRow | null,
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  selectEq: vi.fn(),
  readMaybeSingle: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  forceConditionalUpdateMiss: false,
  updateGate: null as Promise<void> | null,
  updateReturnedRegistryOverride: null as QualityHubRegistry | null,
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

function cloneRegistry(): QualityHubRegistry {
  return structuredClone(qualityHubInitialRegistry);
}

function makeLegacyEntry(id: string, title = id): ChangeLogEntry {
  return {
    ...structuredClone(qualityHubInitialRegistry.changeLog[0]),
    id,
    title,
  };
}

function protectedLegacyHistory(): ChangeLogEntry[] {
  return [
    makeLegacyEntry("legacy-owner-second", "Owner history second"),
    makeLegacyEntry("legacy-owner-first", "Owner history first"),
  ];
}

function makeFinding(id: string, title: string): QualityFinding {
  return {
    ...structuredClone(qualityHubInitialRegistry.findings[0]),
    id,
    title,
  };
}

function currentOwnerRegistry(): QualityHubRegistry {
  const registry = cloneRegistry();
  registry.changeLog = protectedLegacyHistory();
  return registry;
}

function cloneOwnerRow(row: OwnerRow | null): OwnerRow | null {
  return row === null ? null : structuredClone(row);
}

function ownerRowFor(ownerUserId: unknown): OwnerRow | null {
  if (ownerUserId === SECOND_OWNER_ID) return mocks.secondOwnerRow;
  if (ownerUserId === OWNER_ID || ownerUserId === undefined) return mocks.ownerRow;
  return null;
}

function setOwnerRowFor(ownerUserId: unknown, row: OwnerRow): void {
  if (ownerUserId === SECOND_OWNER_ID) {
    mocks.secondOwnerRow = row;
    return;
  }
  if (ownerUserId === OWNER_ID) mocks.ownerRow = row;
}

function pendingOwnerSaveKey(ownerUserId: string): string {
  return `${PENDING_OWNER_SAVE_KEY_PREFIX}:${encodeURIComponent(ownerUserId)}`;
}

function readPendingOwnerRegistry(ownerUserId: string): QualityHubRegistry | null {
  const raw = window.localStorage.getItem(pendingOwnerSaveKey(ownerUserId));
  if (!raw) return null;
  return (JSON.parse(raw) as { registry: QualityHubRegistry }).registry;
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function configureSupabaseMock() {
  mocks.readMaybeSingle.mockImplementation(async (ownerUserId?: string) => ({
    data: cloneOwnerRow(ownerRowFor(ownerUserId)),
    error: null,
  }));
  mocks.selectEq.mockImplementation((_column: string, ownerUserId: string) => ({
    maybeSingle: () => mocks.readMaybeSingle(ownerUserId),
  }));
  mocks.select.mockImplementation(() => ({
    eq: mocks.selectEq,
  }));

  mocks.update.mockImplementation((payload: {
    registry: QualityHubRegistry;
    updated_at: string;
  }) => {
    const filters = new Map<string, unknown>();
    const updateBuilder = {
      eq: vi.fn((column: string, value: unknown) => {
        filters.set(column, value);
        return updateBuilder;
      }),
      is: vi.fn((column: string, value: unknown) => {
        filters.set(column, value);
        return updateBuilder;
      }),
      select: vi.fn(() => ({
        maybeSingle: vi.fn(async () => {
          if (mocks.updateGate) await mocks.updateGate;
          if (mocks.forceConditionalUpdateMiss) {
            return { data: null, error: null };
          }
          const ownerUserId = filters.get("user_id");
          const row = ownerRowFor(ownerUserId);
          const matchesOwner = ownerUserId === OWNER_ID || ownerUserId === SECOND_OWNER_ID;
          const expectedUpdatedAt = filters.get("updated_at");
          const matchesRevision = row !== null
            && (expectedUpdatedAt === undefined || row.updated_at === expectedUpdatedAt);
          if (!row || !matchesOwner || !matchesRevision) {
            return { data: null, error: null };
          }
          const savedRow = {
            registry: structuredClone(payload.registry),
            updated_at: payload.updated_at,
          };
          setOwnerRowFor(ownerUserId, savedRow);
          const returnedRow = cloneOwnerRow(savedRow);
          if (returnedRow && mocks.updateReturnedRegistryOverride) {
            returnedRow.registry = structuredClone(mocks.updateReturnedRegistryOverride);
          }
          return { data: returnedRow, error: null };
        }),
      })),
    };
    return updateBuilder;
  });

  mocks.insert.mockImplementation((payload: {
    user_id: string;
    registry: QualityHubRegistry;
    updated_at: string;
  }) => ({
    select: vi.fn(() => ({
      single: vi.fn(async () => {
        if (
          ownerRowFor(payload.user_id) !== null
          || (payload.user_id !== OWNER_ID && payload.user_id !== SECOND_OWNER_ID)
        ) {
          return { data: null, error: { message: "owner row already exists" } };
        }
        const savedRow = {
          registry: structuredClone(payload.registry),
          updated_at: payload.updated_at,
        };
        setOwnerRowFor(payload.user_id, savedRow);
        return { data: cloneOwnerRow(savedRow), error: null };
      }),
    })),
  }));

  mocks.from.mockImplementation(() => ({
    select: mocks.select,
    update: mocks.update,
    insert: mocks.insert,
  }));
}

function renderQualityHub() {
  return render(
    <MemoryRouter
      initialEntries={["/style-guide/ui-audit"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UiAuditPage />
    </MemoryRouter>,
  );
}

async function waitForWorkspaceControls() {
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "Import Workspace" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Export Workspace" }),
    ).toBeEnabled();
  });
}

function hiddenImportInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("Quality Hub import input was not rendered.");
  return input;
}

function importRegistryFile(
  payload: unknown,
  name = "quality-hub-workspace.json",
): File {
  const contents = JSON.stringify(payload);
  const file = new File([contents], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn().mockResolvedValue(contents),
  });
  fireEvent.change(hiddenImportInput(), { target: { files: [file] } });
  return file;
}

function lastPersistedRegistry(
  setItem: ReturnType<typeof vi.spyOn>,
): QualityHubRegistry {
  const lastWrite = setItem.mock.calls
    .filter(([key]) => key === STORAGE_KEY)
    .at(-1);
  if (!lastWrite) throw new Error("Quality Hub did not write its local registry.");
  return JSON.parse(String(lastWrite[1])) as QualityHubRegistry;
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

const rejectedImportCases: Array<[
  string,
  (history: ChangeLogEntry[]) => ChangeLogEntry[],
]> = [
  ["edited", (history) => history.map((entry, index) => (
    index === 0 ? { ...entry, title: "Changed by import" } : entry
  ))],
  ["reordered", (history) => [...history].reverse()],
];

describe("Quality Hub permanent read-only Changelog behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.authState.user = { id: OWNER_ID };
    mocks.authState.session = { user: { id: OWNER_ID } };
    mocks.authState.loading = false;
    mocks.authState.isAuthenticated = true;
    mocks.ownerRow = {
      registry: currentOwnerRegistry(),
      updated_at: INITIAL_UPDATED_AT,
    };
    mocks.secondOwnerRow = null;
    mocks.getUser.mockReset().mockResolvedValue({
      data: { user: { id: OWNER_ID } },
      error: null,
    });
    mocks.from.mockReset();
    mocks.select.mockReset();
    mocks.selectEq.mockReset();
    mocks.readMaybeSingle.mockReset();
    mocks.update.mockReset();
    mocks.insert.mockReset();
    mocks.forceConditionalUpdateMiss = false;
    mocks.updateGate = null;
    mocks.updateReturnedRegistryOverride = null;
    configureSupabaseMock();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:quality-hub-test"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  it("upgrades older local workspace data without merging or reordering seed Changelog history", async () => {
    mocks.authState.user = null;
    mocks.authState.session = null;
    mocks.authState.isAuthenticated = false;
    mocks.ownerRow = null;

    const olderRegistry = cloneRegistry();
    olderRegistry.meta.registryVersion = 1;
    olderRegistry.changeLog = protectedLegacyHistory();
    olderRegistry.findings = [
      makeFinding("phase-7-local-finding", "Older local workspace finding"),
      ...olderRegistry.findings,
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(olderRegistry));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    renderQualityHub();
    await waitForWorkspaceControls();
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    await waitFor(() => expect(setItem).toHaveBeenCalled());
    const saved = lastPersistedRegistry(setItem);
    expect(saved.meta.registryVersion).toBe(
      qualityHubInitialRegistry.meta.registryVersion,
    );
    expect(saved.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "phase-7-local-finding" }),
      ]),
    );
    expect(saved.changeLog).toEqual(olderRegistry.changeLog);
    expect(saved.changeLog.map((entry) => entry.id)).toEqual([
      "legacy-owner-second",
      "legacy-owner-first",
    ]);
    expect(saved.changeLog).toHaveLength(2);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it.each(rejectedImportCases)("rejects an import with %s legacy Changelog data before any persistence", async (_variant, alterHistory) => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderQualityHub();
    await waitForWorkspaceControls();

    const candidate = currentOwnerRegistry();
    candidate.handoffNotes = "This unrelated change must also be rejected.";
    candidate.changeLog = alterHistory(candidate.changeLog);
    importRegistryFile(candidate, `quality-hub-${_variant}.json`);

    await screen.findByText(
      /Import blocked: this file would change the read-only legacy Changelog\. No Quality Hub data was imported\./,
    );
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("imports supported workspace data without a Changelog and preserves the exact owner history", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderQualityHub();
    await waitForWorkspaceControls();

    const candidate = structuredClone(currentOwnerRegistry()) as Partial<QualityHubRegistry>;
    delete candidate.changeLog;
    candidate.findings = [
      makeFinding("phase-7-imported-finding", "Imported workspace finding"),
      ...(candidate.findings ?? []),
    ];
    importRegistryFile(candidate, "quality-hub-without-changelog.json");

    await screen.findByText(
      /Imported Quality Hub workspace data from quality-hub-without-changelog\.json\. Its guarded owner-database save is being verified, and the read-only legacy Changelog was unchanged\./,
    );
    await waitFor(() => expect(setItem).toHaveBeenCalled());

    const locallySaved = lastPersistedRegistry(setItem);
    expect(locallySaved.changeLog).toEqual(protectedLegacyHistory());
    expect(locallySaved.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "phase-7-imported-finding" }),
      ]),
    );

    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const databasePayload = mocks.update.mock.calls[0]?.[0] as {
      registry: QualityHubRegistry;
    };
    expect(databasePayload.registry.changeLog).toEqual(protectedLegacyHistory());
    expect(databasePayload.registry.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "phase-7-imported-finding" }),
      ]),
    );
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("keeps finding status, verification, and comments writable while preserving the protected Changelog", async () => {
    const targetFinding = makeFinding(
      "phase-7-writable-finding",
      "Phase 7 writable finding controls",
    );
    targetFinding.status = "open";
    targetFinding.verificationStatus = "unverified";
    targetFinding.verifiedBy = undefined;
    targetFinding.comments = [];
    if (!mocks.ownerRow) throw new Error("Expected the owner fixture to exist.");
    mocks.ownerRow.registry.findings = [targetFinding];

    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(window, "prompt").mockReturnValue("Phase 7 finding comment");
    renderQualityHub();
    await waitForWorkspaceControls();

    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    const findingTitle = await screen.findByText(targetFinding.title);
    const details = findingTitle.closest("details");
    if (!details) throw new Error("Expected the finding details element to render.");
    fireEvent.click(findingTitle);

    const findingControls = within(details);
    const [statusSelect, verificationSelect] = findingControls.getAllByRole("combobox");
    const addCommentButton = findingControls.getByRole("button", { name: "Add Comment" });
    expect(statusSelect).toBeEnabled();
    expect(verificationSelect).toBeEnabled();
    expect(addCommentButton).toBeEnabled();

    fireEvent.change(statusSelect, { target: { value: "in-progress" } });
    await waitFor(() => {
      const saved = lastPersistedRegistry(setItem);
      expect(saved.findings[0]).toMatchObject({
        id: targetFinding.id,
        status: "in-progress",
      });
      expect(saved.changeLog).toEqual(protectedLegacyHistory());
    });

    fireEvent.change(verificationSelect, { target: { value: "verified" } });
    await waitFor(() => {
      const saved = lastPersistedRegistry(setItem);
      expect(saved.findings[0]).toMatchObject({
        id: targetFinding.id,
        status: "in-progress",
        verificationStatus: "verified",
      });
      expect(saved.findings[0].verifiedBy).toBeDefined();
      expect(saved.changeLog).toEqual(protectedLegacyHistory());
    });

    fireEvent.click(addCommentButton);
    expect(window.prompt).toHaveBeenCalledWith("Add note/comment for this finding:");
    expect(await findingControls.findByText("Phase 7 finding comment")).toBeInTheDocument();
    await waitFor(() => {
      const saved = lastPersistedRegistry(setItem);
      expect(saved.findings[0]).toMatchObject({
        id: targetFinding.id,
        status: "in-progress",
        verificationStatus: "verified",
      });
      expect(saved.findings[0].comments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "Phase 7 finding comment" }),
        ]),
      );
      expect(saved.changeLog).toEqual(protectedLegacyHistory());
    });

    await waitFor(
      () => expect(mocks.update).toHaveBeenCalled(),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    expect(mocks.insert).not.toHaveBeenCalled();
    const databasePayload = mocks.update.mock.calls.at(-1)?.[0] as {
      registry: QualityHubRegistry;
    };
    const persistedFinding = databasePayload.registry.findings.find(
      (finding) => finding.id === targetFinding.id,
    );
    expect(persistedFinding).toMatchObject({
      status: "in-progress",
      verificationStatus: "verified",
    });
    expect(persistedFinding?.comments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ text: "Phase 7 finding comment" }),
      ]),
    );
    expect(databasePayload.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("exports a workspace package without scheduling local or database persistence", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderQualityHub();
    await waitForWorkspaceControls();

    fireEvent.click(screen.getByRole("button", { name: "Export Workspace" }));

    expect(await screen.findByText(/Exported Quality Hub workspace data without saving/)).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(setItem).not.toHaveBeenCalled();

    const exportedBlob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0];
    if (!(exportedBlob instanceof Blob)) {
      throw new Error("Expected the Quality Hub export to create a JSON Blob.");
    }
    const exportedPackage = JSON.parse(await readBlobAsText(exportedBlob)) as {
      packageType: string;
      registry: QualityHubRegistry;
    };
    expect(exportedPackage.packageType).toBe("chronicle-quality-hub-transfer");
    expect(exportedPackage.registry.changeLog).toEqual(protectedLegacyHistory());

    await new Promise((resolve) => window.setTimeout(resolve, 1_650));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("visibly refuses a concurrent owner update that wins after the fresh preflight read", async () => {
    renderQualityHub();
    await waitForWorkspaceControls();
    const ownerBeforeSave = cloneOwnerRow(mocks.ownerRow);
    mocks.forceConditionalUpdateMiss = true;

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(
        /Quality Hub detected a concurrent owner update and refused to overwrite it\. Reload before saving again\./,
        undefined,
        { timeout: ASYNC_SAVE_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
    expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(2);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.ownerRow).toEqual(ownerBeforeSave);
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("visibly refuses a stale owner save before any conditional update or insert", async () => {
    renderQualityHub();
    await waitForWorkspaceControls();

    const newerRegistry = currentOwnerRegistry();
    newerRegistry.handoffNotes = "Changed by another owner session.";
    mocks.ownerRow = {
      registry: newerRegistry,
      updated_at: "2026-08-06T08:05:00.000Z",
    };
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(
        /Quality Hub detected newer owner data and refused to overwrite it\. Reload before saving again\./,
        undefined,
        { timeout: ASYNC_SAVE_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.readMaybeSingle).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("alert")).toHaveTextContent("Unsaved owner recovery needs review");
    expect(screen.getByRole("button", { name: "Import Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeDisabled();
    expect(hiddenImportInput()).toBeDisabled();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).not.toBeNull();
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("immediately locks an in-session refused save until its exact recovery is discarded", async () => {
    const targetFinding = makeFinding(
      "phase-7-live-recovery-lock-finding",
      "Live refused save locks every write surface",
    );
    targetFinding.status = "open";
    targetFinding.verificationStatus = "unverified";
    targetFinding.verifiedBy = undefined;
    targetFinding.comments = [];
    if (!mocks.ownerRow) throw new Error("Expected the owner fixture to exist.");
    mocks.ownerRow.registry.findings = [targetFinding];
    mocks.ownerRow.registry.handoffNotes = "Authoritative database state before refusal.";
    const authoritativeRegistry = structuredClone(mocks.ownerRow.registry);
    const authoritativeRunIds = authoritativeRegistry.runs.map((run) => run.id);
    const secondOwnerRecoveryBytes = "other-owner-recovery-must-remain";
    window.localStorage.setItem(
      pendingOwnerSaveKey(SECOND_OWNER_ID),
      secondOwnerRecoveryBytes,
    );

    renderQualityHub();
    await waitForWorkspaceControls();
    mocks.forceConditionalUpdateMiss = true;
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    await screen.findByText(
      /Quality Hub detected a concurrent owner update and refused to overwrite it/i,
      undefined,
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const pendingRaw = window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID));
    if (pendingRaw === null) throw new Error("Expected the refused save to leave recovery bytes.");
    const pendingEnvelope = JSON.parse(pendingRaw) as {
      registry: QualityHubRegistry;
    };
    const discardedRun = pendingEnvelope.registry.runs.find(
      (run) => !authoritativeRunIds.includes(run.id),
    );
    if (!discardedRun) throw new Error("Expected the recovery copy to contain the refused snapshot.");
    expect(pendingEnvelope.registry.changeLog).toEqual(protectedLegacyHistory());
    expect(mocks.ownerRow?.registry).toEqual(authoritativeRegistry);

    expect(screen.getByRole("alert")).toHaveTextContent("Unsaved owner recovery needs review");
    const importButton = screen.getByRole("button", { name: "Import Workspace" });
    const exportButton = screen.getByRole("button", { name: "Export Workspace" });
    const logSnapshotButton = screen.getByRole("button", { name: "Log Snapshot" });
    expect(importButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(logSnapshotButton).toBeDisabled();
    expect(hiddenImportInput()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    const findingTitle = await screen.findByText(targetFinding.title);
    const details = findingTitle.closest("details");
    if (!details) throw new Error("Expected the live-lock finding details to render.");
    fireEvent.click(findingTitle);
    const findingControls = within(details);
    const [statusSelect, verificationSelect] = findingControls.getAllByRole("combobox");
    const addCommentButton = findingControls.getByRole("button", { name: "Add Comment" });
    expect(statusSelect).toBeDisabled();
    expect(verificationSelect).toBeDisabled();
    expect(addCommentButton).toBeDisabled();

    mocks.forceConditionalUpdateMiss = false;
    mocks.update.mockClear();
    mocks.insert.mockClear();
    const nativeSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      return Reflect.apply(nativeSetItem, this, [key, value]);
    });
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("This must remain blocked");
    fireEvent.click(importButton);
    fireEvent.click(exportButton);
    fireEvent.click(logSnapshotButton);
    fireEvent.change(statusSelect, { target: { value: "in-progress" } });
    fireEvent.change(verificationSelect, { target: { value: "verified" } });
    fireEvent.click(addCommentButton);
    expect(prompt).not.toHaveBeenCalled();
    expect(statusSelect).toHaveValue("open");
    expect(verificationSelect).toHaveValue("unverified");

    fireEvent.click(screen.getByRole("button", { name: /^Scan Runs/ }));
    const logRunSnapshotButton = await screen.findByRole("button", {
      name: "Log Run Snapshot",
    });
    expect(logRunSnapshotButton).toBeDisabled();
    fireEvent.click(logRunSnapshotButton);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download Unsaved Recovery" }));
    expect(
      await screen.findByText(/Downloaded the exact unsaved owner recovery copy/i),
    ).toBeInTheDocument();
    const recoveryBlob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0];
    if (!(recoveryBlob instanceof Blob)) {
      throw new Error("Expected the live recovery download to create a JSON Blob.");
    }
    expect(await readBlobAsText(recoveryBlob)).toBe(pendingRaw);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    const confirmDiscard = vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const discardButton = screen.getByRole("button", {
      name: "Discard Recovery and Use Database Version",
    });
    fireEvent.click(discardButton);
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(logSnapshotButton).toBeDisabled();
    expect(logRunSnapshotButton).toBeDisabled();

    fireEvent.click(discardButton);
    expect(confirmDiscard).toHaveBeenCalledTimes(2);
    expect(
      await screen.findByText(/Discarded the unsaved recovery copy\. Quality Hub reloaded the current owner database version and enabled changes\./i),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBe(
      secondOwnerRecoveryBytes,
    );
    expect(importButton).toBeEnabled();
    expect(exportButton).toBeEnabled();
    expect(logSnapshotButton).toBeEnabled();
    expect(logRunSnapshotButton).toBeEnabled();
    await waitFor(() => {
      expect(screen.queryByText(discardedRun.name)).not.toBeInTheDocument();
    });

    fireEvent.click(logSnapshotButton);
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.ownerRow?.registry.handoffNotes).toBe(authoritativeRegistry.handoffNotes);
    expect(mocks.ownerRow?.registry.findings).toEqual(authoritativeRegistry.findings);
    expect(mocks.ownerRow?.registry.runs.some((run) => run.id === discardedRun.id)).toBe(false);
    expect(mocks.ownerRow?.registry.runs).toHaveLength(authoritativeRegistry.runs.length + 1);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
    const generalBrowserCopy = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as QualityHubRegistry;
    expect(generalBrowserCopy.runs.some((run) => run.id === discardedRun.id)).toBe(false);
    expect(generalBrowserCopy.changeLog).toEqual(protectedLegacyHistory());
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBe(
      secondOwnerRecoveryBytes,
    );
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("restores an unsaved owner edit after reload, retries it, and clears recovery after confirmation", async () => {
    const firstRender = renderQualityHub();
    await waitForWorkspaceControls();
    mocks.forceConditionalUpdateMiss = true;

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    await screen.findByText(
      /Quality Hub detected a concurrent owner update and refused to overwrite it/i,
      undefined,
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const pendingBeforeReload = readPendingOwnerRegistry(OWNER_ID);
    expect(pendingBeforeReload?.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(pendingBeforeReload?.changeLog).toEqual(protectedLegacyHistory());
    expect(mocks.ownerRow?.registry.runs).toEqual(currentOwnerRegistry().runs);

    firstRender.unmount();
    mocks.forceConditionalUpdateMiss = false;
    renderQualityHub();

    expect(
      await screen.findByText(/recovered an unsaved local change against the same owner revision/i),
    ).toBeInTheDocument();
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(2),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    });
    expect(mocks.ownerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("keeps recovery data separate and reports a conflict when the owner database changed before reload", async () => {
    const firstRender = renderQualityHub();
    await waitForWorkspaceControls();
    mocks.forceConditionalUpdateMiss = true;

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await screen.findByText(
      /Quality Hub detected a concurrent owner update and refused to overwrite it/i,
      undefined,
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const pendingRaw = window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID));
    const pendingRegistry = readPendingOwnerRegistry(OWNER_ID);
    expect(pendingRaw).not.toBeNull();
    expect(pendingRegistry?.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(pendingRegistry?.changeLog).toEqual(protectedLegacyHistory());

    firstRender.unmount();
    const changedOwnerRegistry = currentOwnerRegistry();
    changedOwnerRegistry.handoffNotes = "Changed by another owner session before reload.";
    const changedDatabaseFinding = makeFinding(
      "phase-7-changed-database-conflict",
      "Changed database copy rendered during recovery conflict",
    );
    changedDatabaseFinding.status = "open";
    changedOwnerRegistry.findings = [changedDatabaseFinding];
    mocks.ownerRow = {
      registry: changedOwnerRegistry,
      updated_at: "2026-08-06T08:10:00.000Z",
    };
    mocks.forceConditionalUpdateMiss = false;
    renderQualityHub();

    expect(
      await screen.findByText(/preserved an unsaved local change but did not apply it because the owner database changed\. Use the recovery controls below before making another change\./i),
    ).toBeInTheDocument();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    expect(
      await screen.findByText("Changed database copy rendered during recovery conflict"),
    ).toBeInTheDocument();
    expect(mocks.ownerRow?.registry.handoffNotes).toBe(changedOwnerRegistry.handoffNotes);
    expect(mocks.ownerRow?.registry.runs).toEqual(changedOwnerRegistry.runs);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("does not auto-apply recovery when database content changes without an updated_at change", async () => {
    const firstRender = renderQualityHub();
    await waitForWorkspaceControls();
    mocks.forceConditionalUpdateMiss = true;

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await screen.findByText(
      /Quality Hub detected a concurrent owner update and refused to overwrite it/i,
      undefined,
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const pendingRaw = window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID));
    const pendingRegistry = readPendingOwnerRegistry(OWNER_ID);
    expect(pendingRaw).not.toBeNull();
    expect(pendingRegistry?.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(pendingRegistry?.changeLog).toEqual(protectedLegacyHistory());

    firstRender.unmount();
    const sameTimestampChangedRegistry = currentOwnerRegistry();
    sameTimestampChangedRegistry.handoffNotes = "Database content changed without a timestamp change.";
    const sameTimestampDatabaseFinding = makeFinding(
      "phase-7-same-timestamp-conflict",
      "Same-timestamp database copy rendered during recovery conflict",
    );
    sameTimestampDatabaseFinding.status = "open";
    sameTimestampChangedRegistry.findings = [sameTimestampDatabaseFinding];
    mocks.ownerRow = {
      registry: sameTimestampChangedRegistry,
      updated_at: INITIAL_UPDATED_AT,
    };
    mocks.forceConditionalUpdateMiss = false;
    renderQualityHub();

    expect(
      await screen.findByText(/preserved an unsaved local change but did not apply it because the owner database changed\. Use the recovery controls below before making another change\./i),
    ).toBeInTheDocument();
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(screen.getByRole("button", { name: "Export Workspace" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    expect(
      await screen.findByText("Same-timestamp database copy rendered during recovery conflict"),
    ).toBeInTheDocument();
    expect(mocks.ownerRow?.registry.handoffNotes).toBe(sameTimestampChangedRegistry.handoffNotes);
    expect(mocks.ownerRow?.registry.runs).toEqual(sameTimestampChangedRegistry.runs);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("locks all writes around a recovery conflict and resumes from the database only after confirmed discard", async () => {
    const targetFinding = makeFinding(
      "phase-7-recovery-lock-finding",
      "Recovery conflict locks every write surface",
    );
    targetFinding.status = "open";
    targetFinding.verificationStatus = "unverified";
    targetFinding.verifiedBy = undefined;
    targetFinding.comments = [];
    if (!mocks.ownerRow) throw new Error("Expected the owner fixture to exist.");
    mocks.ownerRow.registry.findings = [targetFinding];
    mocks.ownerRow.registry.handoffNotes = "Base registry before the failed save.";

    const firstRender = renderQualityHub();
    await waitForWorkspaceControls();
    mocks.forceConditionalUpdateMiss = true;
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await screen.findByText(
      /Quality Hub detected a concurrent owner update and refused to overwrite it/i,
      undefined,
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    const pendingRaw = window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID));
    if (pendingRaw === null) throw new Error("Expected the failed save to leave recovery bytes.");
    const pendingEnvelope = JSON.parse(pendingRaw) as {
      registry: QualityHubRegistry;
    };
    const discardedRunId = pendingEnvelope.registry.runs[0]?.id;
    expect(discardedRunId).toBeTruthy();
    expect(pendingEnvelope.registry.changeLog).toEqual(protectedLegacyHistory());
    firstRender.unmount();

    const authoritativeRegistry = currentOwnerRegistry();
    authoritativeRegistry.findings = [structuredClone(targetFinding)];
    authoritativeRegistry.handoffNotes = "Authoritative database content loaded for conflict review.";
    mocks.ownerRow = {
      registry: authoritativeRegistry,
      updated_at: INITIAL_UPDATED_AT,
    };
    mocks.forceConditionalUpdateMiss = false;
    const secondOwnerRecoveryBytes = "second-owner-recovery-must-remain";
    window.localStorage.setItem(
      pendingOwnerSaveKey(SECOND_OWNER_ID),
      secondOwnerRecoveryBytes,
    );
    renderQualityHub();

    expect(
      await screen.findByText(/preserved an unsaved local change but did not apply it because the owner database changed\. Use the recovery controls below before making another change\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Unsaved owner recovery needs review");
    const importButton = screen.getByRole("button", { name: "Import Workspace" });
    const logSnapshotButton = screen.getByRole("button", { name: "Log Snapshot" });
    expect(importButton).toBeDisabled();
    expect(logSnapshotButton).toBeDisabled();
    expect(hiddenImportInput()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    const findingTitle = await screen.findByText(targetFinding.title);
    const details = findingTitle.closest("details");
    if (!details) throw new Error("Expected the recovery-lock finding details to render.");
    fireEvent.click(findingTitle);
    const findingControls = within(details);
    const [statusSelect, verificationSelect] = findingControls.getAllByRole("combobox");
    const addCommentButton = findingControls.getByRole("button", { name: "Add Comment" });
    expect(statusSelect).toBeDisabled();
    expect(verificationSelect).toBeDisabled();
    expect(addCommentButton).toBeDisabled();

    mocks.update.mockClear();
    mocks.insert.mockClear();
    const nativeSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      return Reflect.apply(nativeSetItem, this, [key, value]);
    });
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("Blocked recovery comment");
    fireEvent.click(logSnapshotButton);
    fireEvent.click(importButton);
    fireEvent.change(statusSelect, { target: { value: "in-progress" } });
    fireEvent.change(verificationSelect, { target: { value: "verified" } });
    fireEvent.click(addCommentButton);
    expect(prompt).not.toHaveBeenCalled();
    expect(statusSelect).toHaveValue("open");
    expect(verificationSelect).toHaveValue("unverified");

    fireEvent.click(screen.getByRole("button", { name: /^Scan Runs/ }));
    const logRunSnapshotButton = await screen.findByRole("button", {
      name: "Log Run Snapshot",
    });
    expect(logRunSnapshotButton).toBeDisabled();
    fireEvent.click(logRunSnapshotButton);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download Unsaved Recovery" }));
    expect(
      await screen.findByText(/Downloaded the exact unsaved owner recovery copy/i),
    ).toBeInTheDocument();
    const recoveryBlob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0];
    if (!(recoveryBlob instanceof Blob)) {
      throw new Error("Expected the recovery download to create a JSON Blob.");
    }
    expect(await readBlobAsText(recoveryBlob)).toBe(pendingRaw);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    const confirmDiscard = vi.spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const discardButton = screen.getByRole("button", {
      name: "Discard Recovery and Use Database Version",
    });
    fireEvent.click(discardButton);
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBe(pendingRaw);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(logSnapshotButton).toBeDisabled();
    expect(logRunSnapshotButton).toBeDisabled();

    fireEvent.click(discardButton);
    expect(confirmDiscard).toHaveBeenCalledTimes(2);
    expect(
      await screen.findByText(/Discarded the unsaved recovery copy\. Quality Hub reloaded the current owner database version and enabled changes\./i),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBe(
      secondOwnerRecoveryBytes,
    );
    expect(importButton).toBeEnabled();
    expect(logSnapshotButton).toBeEnabled();
    expect(logRunSnapshotButton).toBeEnabled();

    fireEvent.click(logSnapshotButton);
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.ownerRow?.registry.handoffNotes).toBe(authoritativeRegistry.handoffNotes);
    expect(mocks.ownerRow?.registry.findings[0]).toMatchObject({
      id: targetFinding.id,
      status: "open",
      verificationStatus: "unverified",
      comments: [],
    });
    expect(mocks.ownerRow?.registry.runs[0]?.id).not.toBe(discardedRunId);
    expect(mocks.ownerRow?.registry.runs.some((run) => run.id === discardedRunId)).toBe(false);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
    const generalBrowserCopy = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as QualityHubRegistry;
    expect(generalBrowserCopy.runs.some((run) => run.id === discardedRunId)).toBe(false);
    expect(generalBrowserCopy.changeLog).toEqual(protectedLegacyHistory());
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBe(
      secondOwnerRecoveryBytes,
    );
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("disables writes throughout an owner transition and hydrates the new owner before accepting work", async () => {
    if (!mocks.ownerRow) throw new Error("Expected the first owner fixture to exist.");
    mocks.ownerRow.registry.handoffNotes = "Old owner registry must never seed the second owner.";
    const secondOwnerHydration = deferred<{
      data: OwnerRow | null;
      error: null;
    }>();
    const rendered = renderQualityHub();
    await waitForWorkspaceControls();
    mocks.readMaybeSingle.mockImplementation((ownerUserId?: string) => {
      if (ownerUserId === SECOND_OWNER_ID) return secondOwnerHydration.promise;
      return Promise.resolve({ data: cloneOwnerRow(ownerRowFor(ownerUserId)), error: null });
    });

    mocks.authState.user = { id: SECOND_OWNER_ID };
    mocks.authState.session = { user: { id: SECOND_OWNER_ID } };
    rendered.rerender(
      <MemoryRouter
        initialEntries={["/style-guide/ui-audit"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <UiAuditPage />
      </MemoryRouter>,
    );

    const importButton = screen.getByRole("button", { name: "Import Workspace" });
    const exportButton = screen.getByRole("button", { name: "Export Workspace" });
    const logSnapshotButton = screen.getByRole("button", { name: "Log Snapshot" });
    expect(importButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(logSnapshotButton).toBeDisabled();
    expect(hiddenImportInput()).toBeDisabled();
    fireEvent.click(logSnapshotButton);
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();

    secondOwnerHydration.resolve({ data: null, error: null });
    await waitForWorkspaceControls();
    expect(logSnapshotButton).toBeEnabled();
    fireEvent.click(logSnapshotButton);

    await waitFor(
      () => expect(mocks.insert).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    expect(mocks.insert.mock.calls[0]?.[0]).toMatchObject({ user_id: SECOND_OWNER_ID });
    expect(mocks.secondOwnerRow?.registry.handoffNotes).not.toBe(
      "Old owner registry must never seed the second owner.",
    );
    expect(mocks.secondOwnerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(mocks.secondOwnerRow?.registry.changeLog).toEqual([]);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("rejects Log Snapshot when the owner-specific recovery copy cannot be written", async () => {
    const ownerBeforeAction = cloneOwnerRow(mocks.ownerRow);
    renderQualityHub();
    await waitForWorkspaceControls();
    const nativeSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === pendingOwnerSaveKey(OWNER_ID)) {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }
      return Reflect.apply(nativeSetItem, this, [key, value]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(/could not create its owner-specific recovery copy, so the change was not accepted/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Run snapshot added to this workspace/i)).not.toBeInTheDocument();
    expect(setItem).toHaveBeenCalledWith(
      pendingOwnerSaveKey(OWNER_ID),
      expect.any(String),
    );
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.ownerRow).toEqual(ownerBeforeAction);

    fireEvent.click(screen.getByRole("button", { name: "Export Workspace" }));
    const exportedBlob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0];
    if (!(exportedBlob instanceof Blob)) {
      throw new Error("Expected the rejected-action export to create a JSON Blob.");
    }
    const exportedPackage = JSON.parse(await readBlobAsText(exportedBlob)) as {
      registry: QualityHubRegistry;
    };
    expect(exportedPackage.registry.runs).toEqual(ownerBeforeAction?.registry.runs);
    expect(exportedPackage.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("disables writes after owner hydration fails and refuses local or database persistence", async () => {
    const ownerBeforeHydration = cloneOwnerRow(mocks.ownerRow);
    mocks.readMaybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "owner read failed" },
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderQualityHub();

    await screen.findByText(/could not read the owner database/i);
    const importButton = screen.getByRole("button", { name: "Import Workspace" });
    const exportButton = screen.getByRole("button", { name: "Export Workspace" });
    const logSnapshotButton = screen.getByRole("button", { name: "Log Snapshot" });
    expect(importButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    expect(logSnapshotButton).toBeDisabled();
    expect(hiddenImportInput()).toBeDisabled();
    fireEvent.click(logSnapshotButton);

    expect(setItem).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.ownerRow).toEqual(ownerBeforeHydration);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("continues the guarded database save when only the general browser copy cannot be written", async () => {
    renderQualityHub();
    await waitForWorkspaceControls();
    const nativeSetItem = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === STORAGE_KEY) {
        throw new DOMException("General browser storage unavailable", "QuotaExceededError");
      }
      return Reflect.apply(nativeSetItem, this, [key, value]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(/could not update its general browser copy/i),
    ).toBeInTheDocument();
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    });
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(setItem).toHaveBeenCalledWith(pendingOwnerSaveKey(OWNER_ID), expect.any(String));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mocks.ownerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("describes a successful Log Snapshot as awaiting guarded owner-save verification", async () => {
    renderQualityHub();
    await waitForWorkspaceControls();

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(
        "Run snapshot added to this workspace. Its guarded owner-database save is being verified.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Run snapshot logged/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/owner-database save is complete/i)).not.toBeInTheDocument();
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    expect(mocks.ownerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("does not let a delayed old-owner save response poison a newly hydrated owner", async () => {
    const oldOwnerUpdate = deferred<void>();
    mocks.updateGate = oldOwnerUpdate.promise;
    const rendered = renderQualityHub();
    await waitForWorkspaceControls();

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));

    mocks.authState.user = { id: SECOND_OWNER_ID };
    mocks.authState.session = { user: { id: SECOND_OWNER_ID } };
    rendered.rerender(
      <MemoryRouter
        initialEntries={["/style-guide/ui-audit"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <UiAuditPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(mocks.readMaybeSingle).toHaveBeenCalledWith(SECOND_OWNER_ID);
      expect(screen.getByRole("button", { name: "Log Snapshot" })).toBeEnabled();
    });

    oldOwnerUpdate.resolve(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    await waitFor(
      () => expect(mocks.insert).toHaveBeenCalledTimes(1),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    expect(mocks.insert.mock.calls[0]?.[0]).toMatchObject({ user_id: SECOND_OWNER_ID });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
    expect(mocks.secondOwnerRow?.registry.changeLog).toEqual([]);
    expect(mocks.secondOwnerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    const retainedOldOwnerRecovery = readPendingOwnerRegistry(OWNER_ID);
    if (retainedOldOwnerRecovery) {
      expect(retainedOldOwnerRecovery.changeLog).toEqual(protectedLegacyHistory());
    }
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBeNull();
    });
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("serializes two rapid finding edits and confirms both in the final owner registry", async () => {
    const targetFinding = makeFinding(
      "phase-7-rapid-finding",
      "Phase 7 rapid finding edits",
    );
    targetFinding.status = "open";
    targetFinding.verificationStatus = "unverified";
    targetFinding.verifiedBy = undefined;
    if (!mocks.ownerRow) throw new Error("Expected the owner fixture to exist.");
    mocks.ownerRow.registry.findings = [targetFinding];

    const firstUpdate = deferred<void>();
    mocks.updateGate = firstUpdate.promise;
    renderQualityHub();
    await waitForWorkspaceControls();
    fireEvent.click(screen.getByRole("button", { name: /^Issue Registry/ }));
    const findingTitle = await screen.findByText(targetFinding.title);
    const details = findingTitle.closest("details");
    if (!details) throw new Error("Expected the rapid finding details element to render.");
    fireEvent.click(findingTitle);
    const [statusSelect, verificationSelect] = within(details).getAllByRole("combobox");

    fireEvent.change(statusSelect, { target: { value: "in-progress" } });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    fireEvent.change(verificationSelect, { target: { value: "verified" } });
    await waitFor(() => {
      const pending = readPendingOwnerRegistry(OWNER_ID);
      expect(pending?.findings[0]).toMatchObject({
        id: targetFinding.id,
        status: "in-progress",
        verificationStatus: "verified",
      });
      expect(pending?.changeLog).toEqual(protectedLegacyHistory());
    });
    expect(mocks.update).toHaveBeenCalledTimes(1);

    firstUpdate.resolve(undefined);
    await waitFor(
      () => expect(mocks.update).toHaveBeenCalledTimes(2),
      { timeout: ASYNC_SAVE_TIMEOUT_MS },
    );
    await waitFor(() => {
      expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    });
    expect(mocks.ownerRow?.registry.findings[0]).toMatchObject({
      id: targetFinding.id,
      status: "in-progress",
      verificationStatus: "verified",
    });
    expect(mocks.ownerRow?.registry.findings[0]?.verifiedBy).toBeDefined();
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("refuses a mismatched successful update response and keeps the owner recovery record", async () => {
    const mismatchedReturnedRegistry = currentOwnerRegistry();
    mismatchedReturnedRegistry.handoffNotes = "Unexpected registry returned by the database.";
    mocks.updateReturnedRegistryOverride = mismatchedReturnedRegistry;
    renderQualityHub();
    await waitForWorkspaceControls();

    fireEvent.click(screen.getByRole("button", { name: "Log Snapshot" }));

    expect(
      await screen.findByText(/could not verify the saved owner data/i, undefined, {
        timeout: ASYNC_SAVE_TIMEOUT_MS,
      }),
    ).toBeInTheDocument();
    const pending = readPendingOwnerRegistry(OWNER_ID);
    expect(pending?.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(pending?.changeLog).toEqual(protectedLegacyHistory());
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).not.toBeNull();
    expect(mocks.ownerRow?.registry.runs[0]?.name).toMatch(/^Manual Snapshot /);
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("cancels a delayed import after an owner switch without local or database persistence", async () => {
    const rendered = renderQualityHub();
    await waitForWorkspaceControls();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const importText = deferred<string>();
    const candidate = structuredClone(currentOwnerRegistry()) as Partial<QualityHubRegistry>;
    delete candidate.changeLog;
    candidate.findings = [
      makeFinding("phase-7-delayed-import", "Delayed import must not cross owners"),
      ...(candidate.findings ?? []),
    ];
    const file = new File(["delayed"], "delayed-owner-import.json", {
      type: "application/json",
    });
    const fileText = vi.fn(() => importText.promise);
    Object.defineProperty(file, "text", { configurable: true, value: fileText });
    fireEvent.change(hiddenImportInput(), { target: { files: [file] } });
    await waitFor(() => expect(fileText).toHaveBeenCalledTimes(1));

    mocks.authState.user = { id: SECOND_OWNER_ID };
    mocks.authState.session = { user: { id: SECOND_OWNER_ID } };
    rendered.rerender(
      <MemoryRouter
        initialEntries={["/style-guide/ui-audit"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <UiAuditPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.readMaybeSingle).toHaveBeenCalledWith(SECOND_OWNER_ID));
    importText.resolve(JSON.stringify(candidate));

    expect(
      await screen.findByText(/Import cancelled because the active owner changed while the file was being read/i),
    ).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(OWNER_ID))).toBeNull();
    expect(window.localStorage.getItem(pendingOwnerSaveKey(SECOND_OWNER_ID))).toBeNull();
    expect(mocks.ownerRow?.registry.changeLog).toEqual(protectedLegacyHistory());
    expect(mocks.secondOwnerRow).toBeNull();
  }, ASYNC_SAVE_TIMEOUT_MS);

  it("directs active work to Current Work and accepted history to guarded closeout", async () => {
    mocks.authState.user = null;
    mocks.authState.session = null;
    mocks.authState.isAuthenticated = false;
    mocks.ownerRow = null;

    renderQualityHub();
    await waitFor(() => {
      expect(document.querySelectorAll("[data-changelog-id]")).toHaveLength(5);
    });
    fireEvent.click(screen.getByRole("button", { name: "How to Use" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(
      /Track active implementation in the applicable capability's Current Work tab in Chronicle Knowledge Base\./,
    );
    expect(dialog).toHaveTextContent(
      /After evidence and human acceptance, the guarded closeout workflow creates the repository Changelog record\./,
    );
    expect(dialog).toHaveTextContent(
      /Changelog: read-only accepted history created by guarded closeout, never by a manual Quality Hub edit or import\./,
    );
    expect(dialog).not.toHaveTextContent(/Document implementation in Change Log/);
    expect(dialog).not.toHaveTextContent(/add a Change Log entry/i);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
