// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHRONICLE_SURFACE_BUTTON_CLASS } from "@/components/chronicle/chronicle-dark-ui";
import { KnowledgeDownloadMenu } from "./KnowledgeDownloadMenu";

const { prepare, errorToast, successToast } = vi.hoisted(() => ({ prepare: vi.fn(), errorToast: vi.fn(), successToast: vi.fn() }));
vi.mock("@/data/chronicle-knowledge-base/knowledge-export", () => ({ prepareKnowledgeDownload: prepare }));
vi.mock("sonner", () => ({ toast: { error: errorToast, success: successToast } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

function useNativePicker() {
  const write = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const abort = vi.fn().mockResolvedValue(undefined);
  const handle = { name: "my-reference.html", createWritable: vi.fn().mockResolvedValue({ write, close, abort }) };
  const picker = vi.fn().mockResolvedValue(handle);
  vi.stubGlobal("showSaveFilePicker", picker);
  return { picker, handle, write, close, abort };
}

function openMenu() {
  fireEvent.keyDown(screen.getByRole("button", { name: "Download Knowledge Base" }), { key: "ArrowDown" });
}

describe("Knowledge Base Download menu", () => {
  it.each([['HTML', 'html'], ['Markdown', 'markdown']])("asks where to save %s before generating, using the shared header button", async (label, format) => {
    const { picker, write, close } = useNativePicker();
    const blob = new Blob(["complete reference"]);
    prepare.mockResolvedValueOnce({ name: "reference", blob });
    render(<KnowledgeDownloadMenu />);
    const button = screen.getByRole("button", { name: "Download Knowledge Base" });
    for (const token of CHRONICLE_SURFACE_BUTTON_CLASS.split(" ")) expect(button).toHaveClass(token);
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: label }));
    // The picker is called synchronously inside the click, not after an import.
    expect(picker).toHaveBeenCalledOnce();
    expect(prepare).not.toHaveBeenCalled();
    expect(picker.mock.calls[0][0]).toMatchObject({ startIn: "desktop", types: [{ description: label }] });
    await waitFor(() => expect(prepare).toHaveBeenCalledWith(format, expect.any(Date)));
    await waitFor(() => expect(successToast).toHaveBeenCalledWith("Knowledge Base saved", { description: "my-reference.html" }));
    expect(write).toHaveBeenCalledWith(blob);
    expect(close).toHaveBeenCalledOnce();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("disables repeated export while preparing and restores the control after a failure", async () => {
    useNativePicker();
    let reject!: (error: Error) => void;
    prepare.mockImplementationOnce(() => new Promise((_, no) => { reject = no; }));
    render(<KnowledgeDownloadMenu />);
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "HTML" }));
    await waitFor(() => expect(prepare).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Preparing Knowledge Base download" })).toBeDisabled();
    reject(new Error("Reference image unavailable"));
    await waitFor(() => expect(errorToast).toHaveBeenCalledWith("Could not download the Knowledge Base", { description: "Reference image unavailable" }));
    expect(screen.getByRole("button", { name: "Download Knowledge Base" })).not.toBeDisabled();
  });

  it("treats cancellation as a stop, without generating, downloading, or reporting failure", async () => {
    const { picker } = useNativePicker();
    picker.mockRejectedValueOnce(new DOMException("Canceled", "AbortError"));
    render(<KnowledgeDownloadMenu />);
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "HTML" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Knowledge Base" })).not.toBeDisabled());
    expect(prepare).not.toHaveBeenCalled();
    expect(errorToast).not.toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
  });

  it("reports write failures and aborts the stream instead of claiming success", async () => {
    const { write, close, abort } = useNativePicker();
    write.mockRejectedValueOnce(new Error("Disk full"));
    prepare.mockResolvedValueOnce({ name: "reference.html", blob: new Blob(["reference"]) });
    render(<KnowledgeDownloadMenu />);
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "HTML" }));
    await waitFor(() => expect(errorToast).toHaveBeenCalledWith("Could not download the Knowledge Base", { description: "Disk full" }));
    expect(abort).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
    expect(successToast).not.toHaveBeenCalled();
  });

  it.each(["missing", "blocked"])("keeps a real file link available when the native picker is %s", async mode => {
    vi.stubGlobal("showSaveFilePicker", mode === "missing" ? undefined : vi.fn().mockRejectedValue(new DOMException("Blocked", "SecurityError")));
    const create = vi.fn().mockReturnValue("blob:export-file");
    const revoke = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
    prepare.mockResolvedValueOnce({ name: "reference.html", blob: new Blob(["reference"]) });
    render(<KnowledgeDownloadMenu />);
    openMenu();
    fireEvent.click(await screen.findByRole("menuitem", { name: "HTML" }));
    const dialog = await screen.findByRole("dialog", { name: "Save Knowledge Base" });
    expect(dialog).toHaveTextContent("cannot open a system Save As dialog");
    const link = screen.getByRole("link", { name: "Download file" });
    expect(link).toHaveAttribute("download", "reference.html");
    expect(link).toHaveAttribute("href", "blob:export-file");
    expect(screen.getByRole("link", { name: "Open file" })).toHaveAttribute("href", "blob:export-file");
    link.addEventListener("click", event => event.preventDefault());
    fireEvent.click(link);
    expect(screen.getByRole("status")).toHaveTextContent("Download requested");
    expect(successToast).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:export-file"));
  });
});
