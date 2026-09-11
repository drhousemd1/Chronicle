// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoadmapAttachment, RoadmapDocument, RoadmapItem } from "@/services/chronicle-roadmap";

const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), metadata: vi.fn(), exported: vi.fn(), upload: vi.fn(), attachmentUrl: vi.fn(), removeAttachments: vi.fn(), toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() }));
vi.mock("@/services/chronicle-roadmap", async importOriginal => {
  const actual = await importOriginal<typeof import("@/services/chronicle-roadmap")>();
  return { ...actual, loadRoadmap: mocks.load, saveRoadmap: mocks.save, exportRoadmapMarkdown: mocks.exported, uploadRoadmapAttachment: mocks.upload, getRoadmapAttachmentUrl: mocks.attachmentUrl, removeRoadmapAttachments: mocks.removeAttachments };
});
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError, info: mocks.toastInfo } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.metadata }) }) }) } }));
vi.mock("@/components/chronicle/ModelSettingsTab", () => ({ ModelSettingsTab: () => null }));
import { RoadmapConflictError } from "@/services/chronicle-roadmap";
import RoadmapPage from "./roadmap";
import AdminPage from "../Admin";

const stamp = "2026-09-11T00:00:00.000Z";
const attachment = (overrides: Partial<RoadmapAttachment> = {}): RoadmapAttachment => ({ id: "image-one", name: "problem.png", path: "chronicle-roadmap/item-one/image-one.png", contentType: "image/png", size: 128, ...overrides });
const item = (overrides: Partial<RoadmapItem> = {}): RoadmapItem => ({ id: "item-one", title: "Fix a save", description: "Keep every note.\nIncluding the second line.", priority: "critical", status: "Not yet started", createdAt: stamp, updatedAt: stamp, ...overrides });
let stored: RoadmapDocument;
beforeEach(() => {
  stored = { version: 1, revision: "original", items: [] };
  vi.clearAllMocks();
  mocks.load.mockImplementation(async () => structuredClone(stored));
  mocks.save.mockImplementation(async (_previous, items) => { stored = { version: 1, revision: crypto.randomUUID(), items: structuredClone(items) }; return structuredClone(stored); });
  mocks.metadata.mockResolvedValue({ data: null });
  mocks.exported.mockReturnValue("# Chronicle Roadmap\n");
  mocks.attachmentUrl.mockResolvedValue("https://example.test/screenshot.png");
  mocks.removeAttachments.mockResolvedValue(undefined);
  mocks.upload.mockImplementation(async (_itemId: string, file: File) => attachment({ name: file.name, contentType: file.type, size: file.size }));
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:screenshot-preview"), revokeObjectURL: vi.fn() }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function open(path = "/admin/roadmap") {
  render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/" element={<AdminPage activeTool="hub" onSetActiveTool={vi.fn()} />} /><Route path="/admin/roadmap" element={<RoadmapPage />} /></Routes><Location /></MemoryRouter>);
}
async function ready() { await screen.findByRole("heading", { name: "Critical" }); }
async function add() {
  fireEvent.click(screen.getByRole("button", { name: "Add item to Critical" }));
  fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Fix a save" } });
  fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Keep every note." } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

describe("Chronicle Roadmap", () => {
  it("opens from its matching Admin tile and returns through the standard back control", async () => {
    open("/");
    const tile = screen.getByRole("heading", { name: "Roadmap" }).closest(".group") as HTMLElement;
    fireEvent.click(within(tile).getByRole("button", { name: "Open" }));
    await ready();
    expect(screen.getByTestId("location")).toHaveTextContent("/admin/roadmap");
    expect(document.querySelector(".roadmap-header header")).toBeInTheDocument();
    expect(document.querySelector("aside")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to Admin Panel" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/?tab=admin");
  });

  it("starts empty in three ordered sections and saves an addition that survives remount", async () => {
    open(); await ready();
    expect([...document.querySelectorAll("main h2")].map(node => node.textContent)).toEqual(["Critical", "Important", "Non-critical"]);
    expect(screen.getAllByText("No items yet.")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    await add();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ duration: 2500 }));
    expect(document.querySelector(".roadmap-header")?.textContent).not.toContain("Saved");
    expect(stored.items[0]).toMatchObject({ title: "Fix a save", description: "Keep every note.", status: "Not yet started", priority: "critical" });
    cleanup(); open(); await ready();
    expect(screen.getByRole("heading", { name: "Fix a save" })).toBeInTheDocument();
  });

  it("edits the title and full description, preserves identity, and moves an item between sections", async () => {
    stored.items = [item()]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Refine saving" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Long notes\non two lines." } });
    fireEvent.change(screen.getByLabelText("Section", { exact: true }), { target: { value: "important" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stored.items[0]).toMatchObject({ id: "item-one", createdAt: stamp, title: "Refine saving", description: "Long notes\non two lines.", priority: "important" });
    const important = screen.getByRole("region", { name: "Important" });
    expect(within(important).getByRole("heading", { name: "Refine saving" })).toBeInTheDocument();
  });

  it("saves both progress and completion without hiding, moving, or deleting the item", async () => {
    stored.items = [item()]; open(); await ready();
    const status = screen.getByLabelText("Status for Fix a save");
    fireEvent.change(status, { target: { value: "In progress" } });
    await waitFor(() => expect(status).toHaveValue("In progress"));
    fireEvent.change(status, { target: { value: "Complete" } });
    await waitFor(() => expect(status).toHaveValue("Complete"));
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].priority).toBe("critical");
    expect(within(screen.getByRole("region", { name: "Critical" })).getByRole("heading", { name: "Fix a save" })).toBeInTheDocument();
    expect(document.querySelector(".roadmap-description")?.textContent).toContain("Including the second line.");
  });

  it("deletes only after confirmation and permits cancellation", async () => {
    stored.items = [item(), item({ id: "item-two", title: "Keep this" })]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Delete Fix a save" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete Fix a save" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stored.items.map(entry => entry.id)).toEqual(["item-two"]);
  });

  it("retains unsaved text on network failure and retries the same item", async () => {
    open(); await ready(); mocks.save.mockRejectedValueOnce(new Error("Network unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Add item to Critical" }));
    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Keep my draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Heading")).toHaveValue("Keep my draft");
    expect(stored.items).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stored.items).toHaveLength(1);
  });

  it("blocks stale writes, retains the draft, and automatically reads the latest list when the editor closes", async () => {
    stored.items = [item()]; open(); await ready();
    mocks.save.mockRejectedValueOnce(new RoadmapConflictError());
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "My unsaved change" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Heading")).toHaveValue("My unsaved change");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    stored = { ...stored, revision: "changed-elsewhere", items: [item({ title: "Changed elsewhere" })] };
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await screen.findByRole("heading", { name: "Changed elsewhere" });
    expect(screen.getByRole("button", { name: "Edit Changed elsewhere" })).toBeEnabled();
  });

  it("never shows a failed load as an empty saved list", async () => {
    mocks.load.mockRejectedValueOnce(new Error("Unable to load")); open();
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load");
    expect(screen.queryByText("No items yet.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Markdown" })).toBeDisabled();
    fireEvent(window, new Event("focus")); await ready();
  });

  it("refreshes on window focus without hiding the current list", async () => {
    stored.items = [item()]; open(); await ready();
    let finish!: (doc: RoadmapDocument) => void;
    mocks.load.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    fireEvent(window, new Event("focus"));
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("heading", { name: "Fix a save" })).toBeInTheDocument();
    expect(screen.queryByText("Loading roadmap…")).not.toBeInTheDocument();
    await act(async () => finish({ ...stored, revision: "external", items: [item({ title: "Updated elsewhere" })] }));
    expect(screen.getByRole("heading", { name: "Updated elsewhere" })).toBeInTheDocument();
  });

  it("saves while a background read is pending and never replaces the acknowledged save with its late result", async () => {
    stored.items = [item()]; open(); await ready();
    const staleRead = structuredClone(stored);
    let finishRead!: (doc: RoadmapDocument) => void;
    mocks.load.mockReturnValueOnce(new Promise(resolve => { finishRead = resolve; }));
    fireEvent(window, new Event("focus"));
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "Saved while refreshing" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Saved while refreshing" })).toBeInTheDocument();
    await act(async () => finishRead(staleRead));
    expect(screen.getByRole("heading", { name: "Saved while refreshing" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Fix a save" })).not.toBeInTheDocument();
    expect(stored.items[0].title).toBe("Saved while refreshing");
  });

  it("does not interrupt an open draft or delete confirmation with background refresh", async () => {
    stored.items = [item()]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "My draft stays" } });
    const readsBeforeDraft = mocks.load.mock.calls.length;
    fireEvent(window, new Event("focus"));
    fireEvent(document, new Event("visibilitychange"));
    expect(mocks.load).toHaveBeenCalledTimes(readsBeforeDraft);
    expect(screen.getByLabelText("Heading")).toHaveValue("My draft stays");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Fix a save" }));
    const readsBeforeDelete = mocks.load.mock.calls.length;
    fireEvent(window, new Event("focus"));
    expect(mocks.load).toHaveBeenCalledTimes(readsBeforeDelete);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("checks for changes every twenty seconds only while idle and visible", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    stored.items = [item()]; open(); await ready();
    stored = { ...stored, revision: "changed-between-visits", items: [item({ title: "Changed between visits" })] };
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(screen.getByRole("heading", { name: "Changed between visits" })).toBeInTheDocument();
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const reads = mocks.load.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000); });
    expect(mocks.load).toHaveBeenCalledTimes(reads);
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(reads + 1));
  });

  it("stages a screenshot until Save, then keeps its saved reference and renders it", async () => {
    stored.items = [item()]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    const file = new File(["screenshot data"], "problem.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [file] } });
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(screen.getByText("problem.png")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.upload).toHaveBeenCalledWith("item-one", file);
    expect(stored.items[0].attachments).toEqual([attachment({ size: file.size })]);
    expect(await screen.findByRole("img", { name: "problem.png" })).toBeInTheDocument();
    expect(mocks.attachmentUrl).toHaveBeenCalledWith(attachment({ size: file.size }));
  });

  it.each([
    ["reference.pdf", "application/pdf", "%PDF-1.7\nReference document"],
    ["layout.html", "text/html", "<!doctype html><html><body>Layout reference</body></html>"],
  ])("saves %s as a downloadable document alongside the original screenshot and reloads both", async (name, contentType, contents) => {
    const screenshot = attachment();
    stored.items = [item({ attachments: [screenshot] })];
    const file = new File([contents], name, { type: contentType });
    const documentFile = attachment({ id: "document-one", name, contentType, size: file.size, path: `chronicle-roadmap/item-one/document-one.${name.split(".").pop()}` });
    const linkUrl = `https://example.test/${name}?token=current`;
    mocks.upload.mockResolvedValueOnce(documentFile);
    mocks.attachmentUrl.mockImplementation(async (file: RoadmapAttachment) => file.id === documentFile.id ? linkUrl : "https://example.test/screenshot.png");
    open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [file] } });
    expect(mocks.upload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.upload).toHaveBeenCalledWith("item-one", file);
    expect(stored.items[0].attachments).toEqual([screenshot, documentFile]);
    expect(await screen.findByRole("link", { name: `Download ${name}` })).toHaveAttribute("href", linkUrl);
    expect(screen.getByRole("link", { name: `Download ${name}` })).toHaveAttribute("download", name);
    expect(screen.queryByRole("img", { name })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "problem.png" })).toBeInTheDocument();
    expect(document.querySelector("iframe, embed, object")).toBeNull();
    expect(mocks.exported).not.toHaveBeenCalled();
    cleanup();
    open(); await ready();
    expect(await screen.findByRole("link", { name: `Download ${name}` })).toHaveAttribute("download", name);
    expect(screen.getByRole("img", { name: "problem.png" })).toBeInTheDocument();
    expect(document.querySelector("iframe, embed, object")).toBeNull();
  });

  it("renews the document access link and keeps its saved attachment through status changes", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const file = attachment({ id: "document-one", name: "instructions.md", contentType: "text/markdown", path: "chronicle-roadmap/item-one/document-one.md" });
    stored.items = [item({ attachments: [file] })];
    mocks.attachmentUrl.mockResolvedValueOnce("https://example.test/instructions.md?token=first").mockResolvedValue("https://example.test/instructions.md?token=renewed");
    open(); await ready();
    expect(await screen.findByRole("link", { name: "Download instructions.md" })).toHaveAttribute("href", "https://example.test/instructions.md?token=first");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await act(async () => { await vi.advanceTimersByTimeAsync(50 * 60_000); });
    expect(screen.getByRole("link", { name: "Download instructions.md" })).toHaveAttribute("href", "https://example.test/instructions.md?token=renewed");
    const status = screen.getByLabelText("Status for Fix a save");
    fireEvent.change(status, { target: { value: "In progress" } });
    await waitFor(() => expect(status).toHaveValue("In progress"));
    fireEvent.change(status, { target: { value: "Complete" } });
    await waitFor(() => expect(status).toHaveValue("Complete"));
    expect(stored.items[0].attachments).toEqual([file]);
    expect(screen.getByRole("link", { name: "Download instructions.md" })).toHaveAttribute("download", "instructions.md");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
    expect(mocks.exported).not.toHaveBeenCalled();
  });

  it("retains an uploaded attachment for retry when saving the list fails", async () => {
    stored.items = [item()]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    const file = new File(["screenshot data"], "problem.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [file] } });
    mocks.save.mockRejectedValueOnce(new Error("Save unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect(stored.items[0].attachments).toHaveLength(1);
  });

  it("does not remove an uploaded screenshot on cancel when the server saved it but its response was lost", async () => {
    stored.items = [item()]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [new File(["image"], "problem.png", { type: "image/png" })] } });
    mocks.save.mockImplementationOnce(async (_previous, items) => {
      stored = { version: 1, revision: "saved-with-lost-response", items: structuredClone(items) };
      throw new Error("The response was lost");
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    const loadsBeforeCancel = mocks.load.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(loadsBeforeCancel + 1));
    expect(stored.items[0].attachments).toHaveLength(1);
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
  });

  it("does not delete a saved screenshot before its removal is successfully saved", async () => {
    stored.items = [item({ attachments: [attachment()] })]; open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.click(screen.getByRole("button", { name: /Remove.*problem\.png/i }));
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
    mocks.save.mockRejectedValueOnce(new Error("Save unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
    expect(stored.items[0].attachments).toEqual([attachment()]);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stored.items[0].attachments ?? []).toHaveLength(0);
    expect(mocks.removeAttachments).toHaveBeenCalledWith([attachment()]);
  });

  it("rejects unsupported and oversized files before upload", async () => {
    open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Add item to Critical" }));
    const files = screen.getByLabelText("Attach files");
    fireEvent.change(files, { target: { files: [new File(["not a supported document"], "application.exe", { type: "application/octet-stream" })] } });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocks.upload).not.toHaveBeenCalled();
    const oversized = new File(["small body"], "large.png", { type: "image/png" });
    Object.defineProperty(oversized, "size", { value: 8 * 1024 * 1024 + 1 });
    fireEvent.change(files, { target: { files: [oversized] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/8.*MB|8.*MiB/i);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("does not exceed five attached screenshots", async () => {
    stored.items = [item({ attachments: Array.from({ length: 5 }, (_, i) => attachment({ id: `image-${i}`, name: `image-${i}.png`, path: `chronicle-roadmap/item-one/image-${i}.png` })) })];
    open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Edit Fix a save" }));
    fireEvent.change(screen.getByLabelText("Attach files"), { target: { files: [new File(["new image"], "sixth.png", { type: "image/png" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/5|five/i);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(stored.items[0].attachments).toHaveLength(5);
  });

  it("cleans up screenshots only after the user confirms deletion and the list save succeeds", async () => {
    stored.items = [item({ attachments: [attachment()] }), item({ id: "item-two", title: "Keep this" })];
    open(); await ready();
    fireEvent.click(screen.getByRole("button", { name: "Delete Fix a save" }));
    expect(mocks.removeAttachments).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(stored.items.map(entry => entry.id)).toEqual(["item-two"]);
    expect(mocks.removeAttachments).toHaveBeenCalledWith([attachment()]);
  });

  it("holds controls while a save is pending and does not optimistically show Complete", async () => {
    stored.items = [item()]; open(); await ready();
    let finish!: (doc: RoadmapDocument) => void;
    mocks.save.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    fireEvent.change(screen.getByLabelText("Status for Fix a save"), { target: { value: "Complete" } });
    expect(screen.getByLabelText("Status for Fix a save")).toHaveValue("Not yet started");
    expect(screen.getByLabelText("Status for Fix a save")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to Admin Panel" })).toBeDisabled();
    await act(async () => finish({ ...stored, revision: "next", items: [item({ status: "Complete" })] }));
    expect(screen.getByLabelText("Status for Fix a save")).toHaveValue("Complete");
  });

  it("exports the saved list, including completed items, without changing it", async () => {
    stored.items = [item({ status: "Complete" })]; open(); await ready();
    const createUrl = vi.fn(() => "blob:roadmap");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    expect(mocks.exported).toHaveBeenCalledWith(stored);
    expect(createUrl).toHaveBeenCalled(); expect(click).toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled(); click.mockRestore();
  });

  it("uses the native Markdown chooser with a Roadmap filename and writes and closes the export", async () => {
    stored.items = [item({ status: "Complete" })]; open(); await ready();
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const abort = vi.fn().mockResolvedValue(undefined);
    const picker = vi.fn().mockResolvedValue({ name: "saved-roadmap.md", createWritable: async () => ({ write, close, abort }) });
    vi.stubGlobal("showSaveFilePicker", picker);
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    expect(picker).toHaveBeenCalledWith({
      id: "chronicle-roadmap", suggestedName: expect.stringMatching(/^chronicle-roadmap-\d{4}-\d{2}-\d{2}\.md$/), startIn: "desktop",
      types: [{ description: "Markdown", accept: { "text/markdown": [".md"] } }],
    });
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    const blob = write.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/markdown;charset=utf-8");
    expect(blob.size).toBe(new Blob(["# Chronicle Roadmap\n"]).size);
    expect(mocks.exported).toHaveBeenCalledWith(stored);
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Roadmap exported", { duration: 2500 });
    expect(abort).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("leaves a cancelled Markdown chooser quiet without generating or saving an export", async () => {
    open(); await ready();
    const picker = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    vi.stubGlobal("showSaveFilePicker", picker);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Markdown" })); });
    expect(picker).toHaveBeenCalledOnce();
    expect(mocks.exported).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.toastInfo).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("reports a failed Markdown write and aborts the file without claiming export success", async () => {
    open(); await ready();
    const close = vi.fn().mockResolvedValue(undefined);
    const abort = vi.fn().mockResolvedValue(undefined);
    const picker = vi.fn().mockResolvedValue({ name: "roadmap.md", createWritable: async () => ({ write: vi.fn().mockRejectedValue(new Error("Disk full")), close, abort }) });
    vi.stubGlobal("showSaveFilePicker", picker);
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(expect.stringContaining("Disk full")));
    expect(abort).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
