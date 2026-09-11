// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readMetadata: vi.fn(), changeTool: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.readMetadata }) }) }) } }));
vi.mock("@/components/chronicle/ModelSettingsTab", () => ({ ModelSettingsTab: () => null }));
import AdminPage from "./Admin";
import ChronicleUiGuidePage from "./style-guide/chronicle-ui-guide";

afterEach(cleanup);
beforeEach(() => {
  mocks.readMetadata.mockReset().mockResolvedValue({ data: null });
  mocks.changeTool.mockReset();
  HTMLElement.prototype.scrollTo = vi.fn();
});
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function open() {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/" element={<AdminPage activeTool="hub" onSetActiveTool={mocks.changeTool} />} /><Route path="/style-guide/chronicle-ui-guide" element={<ChronicleUiGuidePage />} /></Routes><Location /></MemoryRouter>);
}
function tile(title: string) { return screen.getByRole("heading", { name: title }).closest(".group") as HTMLElement; }

describe("Admin UI Guide tile integration", () => {
  it("uses the same card and actions as its neighbors and opens the guide with a working return path", async () => {
    open();
    await waitFor(() => expect(mocks.readMetadata).toHaveBeenCalled());
    const guide = tile("Chronicle UI Guide");
    const neighbor = tile("Finance Dashboard");
    expect(guide.firstElementChild?.className).toBe(neighbor.firstElementChild?.className);
    for (const name of ["Edit", "Open"]) {
      expect(within(guide).getByRole("button", { name }).className).toBe(within(neighbor).getByRole("button", { name }).className);
    }
    fireEvent.click(within(guide).getByRole("button", { name: "Open" }));
    expect(screen.getByRole("heading", { name: "Story Builder UI Reference" })).toBeInTheDocument();
    expect(mocks.changeTool).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/?tab=admin");
    expect(tile("Chronicle UI Guide")).toBeInTheDocument();
    fireEvent.click(tile("Chronicle UI Guide"));
    expect(within(screen.getByRole("region", { name: "Story Builder UI Reference" })).getByRole("tabpanel")).toBeInTheDocument();
  });

  it("opens the existing metadata editor without navigating and discards a cancelled edit", async () => {
    open();
    await waitFor(() => expect(mocks.readMetadata).toHaveBeenCalled());
    fireEvent.click(within(tile("Chronicle UI Guide")).getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit Admin Tile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tile Name")).toHaveValue("Chronicle UI Guide");
    fireEvent.change(screen.getByLabelText("Tile Name"), { target: { value: "Unsaved name" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tile("Chronicle UI Guide")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("keeps the default tile on metadata failure and preserves its destination with a custom title", async () => {
    mocks.readMetadata.mockRejectedValueOnce(new Error("Offline"));
    open();
    await waitFor(() => expect(mocks.readMetadata).toHaveBeenCalled());
    expect(tile("Chronicle UI Guide")).toBeInTheDocument();
    cleanup();
    mocks.readMetadata.mockResolvedValue({ data: { setting_value: { chronicle_ui_guide: { title: "App Style Reference" } } } });
    open();
    await screen.findByRole("heading", { name: "App Style Reference" });
    fireEvent.click(tile("App Style Reference"));
    expect(screen.getByRole("heading", { name: "Story Builder UI Reference" })).toBeInTheDocument();
  });
});
