// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readMetadata: vi.fn(), updateMetadata: vi.fn(), insertMetadata: vi.fn(), getUser: vi.fn(), upload: vi.fn(),
  storageFrom: vi.fn(), changeTool: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    storage: { from: mocks.storageFrom },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.readMetadata }) }),
      update: (payload: unknown) => ({ eq: () => ({ select: () => mocks.updateMetadata(payload) }) }),
      insert: mocks.insertMetadata,
    }),
  },
}));
vi.mock("@/components/chronicle/ModelSettingsTab", () => ({ ModelSettingsTab: () => null }));
import AdminPage from "./Admin";

type Overrides = Record<string, { title?: string; description?: string; thumbnailUrl?: string }>;
let stored: Overrides | null;
const previousImage = "https://example.test/previous-tile.png";
const publicUrl = (bucket: string, path: string) => `https://example.test/storage/v1/object/public/${bucket}/${path}`;

beforeEach(() => {
  vi.clearAllMocks();
  stored = null;
  mocks.readMetadata.mockImplementation(async () => ({ data: stored ? { setting_value: structuredClone(stored) } : null }));
  mocks.updateMetadata.mockImplementation(async (payload: { setting_value: Overrides }) => {
    if (!stored) return { data: [], error: null };
    stored = structuredClone(payload.setting_value);
    return { data: [{ id: "admin-tool-metadata" }], error: null };
  });
  mocks.insertMetadata.mockImplementation(async (payload: { setting_value: Overrides }) => {
    stored = structuredClone(payload.setting_value);
    return { error: null };
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-user" } }, error: null });
  mocks.upload.mockImplementation(async (bucket: string) => ({
    error: bucket === "guide_images" ? null : new Error("new row violates row-level security policy"),
  }));
  mocks.storageFrom.mockImplementation((bucket: string) => ({
    upload: (path: string, file: File, options: unknown) => mocks.upload(bucket, path, file, options),
    getPublicUrl: (path: string) => ({ data: { publicUrl: publicUrl(bucket, path) } }),
  }));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function tile(title: string) {
  return screen.getByRole("heading", { name: title, hidden: true }).closest(".group") as HTMLElement;
}
async function open() {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminPage activeTool="hub" onSetActiveTool={mocks.changeTool} /></MemoryRouter>);
  await waitFor(() => expect(mocks.readMetadata).toHaveBeenCalled());
}
function edit(title: string) {
  fireEvent.click(within(tile(title)).getByRole("button", { name: "Edit" }));
  return screen.getByRole("dialog", { name: "Edit Admin Tile" });
}
function attach(dialog: HTMLElement) {
  const file = new File(["valid mocked image contents"], "tile-image.png", { type: "image/png" });
  const input = dialog.querySelector('input[type="file"]') as HTMLInputElement;
  expect(input).not.toBeNull();
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe("Admin tile image upload integration", () => {
  it.each([
    ["research_development", "Research & Development", undefined],
    ["image_generation", "Image Generation", "/images/styles/cinematic-2-5d.png"],
    ["roadmap", "Roadmap", undefined],
  ] as const)("uploads, previews, saves, and reloads the %s tile image", async (id, title, originalImage) => {
    await open();
    if (originalImage) expect(within(tile(title)).getByRole("img", { name: title })).toHaveAttribute("src", originalImage);
    const dialog = edit(title);
    const file = attach(dialog);
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledOnce());
    expect(mocks.upload).toHaveBeenCalledWith("guide_images", expect.stringContaining(`${id}-`), file, expect.objectContaining({ contentType: "image/png" }));
    expect(mocks.storageFrom).not.toHaveBeenCalledWith("avatars");
    const [, path] = mocks.upload.mock.calls[0] as [string, string];
    const uploadedImage = publicUrl("guide_images", path);
    expect(await within(dialog).findByRole("img", { name: `${title} thumbnail preview` })).toHaveAttribute("src", uploadedImage);
    expect(mocks.updateMetadata).not.toHaveBeenCalled();
    expect(mocks.insertMetadata).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Tile" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(tile(title)).getByRole("img", { name: title })).toHaveAttribute("src", uploadedImage);
    expect(stored?.[id].thumbnailUrl).toBe(uploadedImage);
    cleanup();
    await open();
    await waitFor(() => expect(within(tile(title)).getByRole("img", { name: title })).toHaveAttribute("src", uploadedImage));
    expect(mocks.changeTool).not.toHaveBeenCalled();
  });

  it("retains the previous image and visible error after storage rejects an upload", async () => {
    stored = { research_development: { thumbnailUrl: previousImage } };
    await open();
    await screen.findByRole("img", { name: "Research & Development" });
    mocks.upload.mockResolvedValueOnce({ error: new Error("Image storage unavailable") });
    const dialog = edit("Research & Development");
    attach(dialog);
    expect(await within(dialog).findByText("Image storage unavailable")).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" })).toHaveAttribute("src", previousImage);
    expect(within(tile("Research & Development")).getByRole("img", { name: "Research & Development", hidden: true })).toHaveAttribute("src", previousImage);
    expect(mocks.updateMetadata).not.toHaveBeenCalled();
    expect(mocks.insertMetadata).not.toHaveBeenCalled();
  });

  it("retains the previous image and skips storage when authentication fails", async () => {
    stored = { research_development: { thumbnailUrl: previousImage } };
    await open();
    await screen.findByRole("img", { name: "Research & Development" });
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("Sign in again") });
    const dialog = edit("Research & Development");
    attach(dialog);
    expect(await within(dialog).findByText("Sign in again")).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" })).toHaveAttribute("src", previousImage);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.updateMetadata).not.toHaveBeenCalled();
  });

  it("leaves the hub unchanged when an uploaded preview is cancelled", async () => {
    stored = { research_development: { thumbnailUrl: previousImage } };
    await open();
    await screen.findByRole("img", { name: "Research & Development" });
    const dialog = edit("Research & Development");
    attach(dialog);
    await waitFor(() => expect(within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" }).getAttribute("src")).not.toBe(previousImage));
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(tile("Research & Development")).getByRole("img", { name: "Research & Development" })).toHaveAttribute("src", previousImage);
    expect(stored.research_development.thumbnailUrl).toBe(previousImage);
    expect(mocks.updateMetadata).not.toHaveBeenCalled();
    expect(mocks.insertMetadata).not.toHaveBeenCalled();
  });

  it("keeps the new preview for retry but restores the hub image when metadata saving fails", async () => {
    stored = { research_development: { thumbnailUrl: previousImage } };
    await open();
    await screen.findByRole("img", { name: "Research & Development" });
    const dialog = edit("Research & Development");
    attach(dialog);
    await waitFor(() => expect(within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" }).getAttribute("src")).not.toBe(previousImage));
    const uploadedImage = within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" }).getAttribute("src");
    mocks.updateMetadata.mockResolvedValueOnce({ data: null, error: new Error("Metadata save unavailable") });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Tile" }));
    expect(await within(dialog).findByText("Metadata save unavailable")).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "Research & Development thumbnail preview" })).toHaveAttribute("src", uploadedImage);
    expect(within(tile("Research & Development")).getByRole("img", { name: "Research & Development", hidden: true })).toHaveAttribute("src", previousImage);
    expect(stored.research_development.thumbnailUrl).toBe(previousImage);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Tile" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(tile("Research & Development")).getByRole("img", { name: "Research & Development" })).toHaveAttribute("src", uploadedImage);
    expect(stored.research_development.thumbnailUrl).toBe(uploadedImage);
  });
});
