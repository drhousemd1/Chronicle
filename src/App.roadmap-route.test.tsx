// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false, isAuthenticated: false },
  checkIsAdmin: vi.fn(),
  load: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/services/app-settings", () => ({ checkIsAdmin: mocks.checkIsAdmin, writeCachedAdminState: vi.fn() }));
vi.mock("@/contexts/ArtStylesContext", () => ({ ArtStylesProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("./pages/Index", () => ({ default: () => <p>Application home</p> }));
vi.mock("./pages/CreatorProfile", () => ({ default: () => null }));
vi.mock("./pages/NotFound", () => ({ default: () => <p>Not found</p> }));
vi.mock("@/services/chronicle-roadmap", () => ({
  loadRoadmap: mocks.load,
  saveRoadmap: vi.fn(),
  exportRoadmapMarkdown: vi.fn(),
  RoadmapConflictError: class extends Error {},
  uploadRoadmapAttachment: vi.fn(),
  getRoadmapAttachmentUrl: vi.fn(),
  removeRoadmapAttachments: vi.fn(),
  ROADMAP_MAX_ATTACHMENTS: 5,
  ROADMAP_MAX_ATTACHMENT_BYTES: 8 * 1024 * 1024,
}));
import App from "./App";

afterEach(cleanup);
beforeEach(() => {
  window.history.replaceState({}, "", "/admin/roadmap");
  mocks.auth.user = null;
  mocks.auth.isAuthenticated = false;
  mocks.checkIsAdmin.mockReset().mockResolvedValue(false);
  mocks.load.mockReset().mockResolvedValue({ version: 1, revision: null, items: [] });
});

describe("Roadmap registered application route", () => {
  it("redirects signed-out visits without reading the roadmap", async () => {
    render(<App />);
    await screen.findByText("Application home");
    expect(window.location.search).toBe("?auth=1");
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("redirects a non-admin without reading the roadmap", async () => {
    mocks.auth.user = { id: "non-admin" };
    mocks.auth.isAuthenticated = true;
    render(<App />);
    await screen.findByText("Application home");
    expect(window.location.pathname).toBe("/");
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("opens the real Roadmap page at its direct URL for an administrator", async () => {
    mocks.auth.user = { id: "administrator" };
    mocks.auth.isAuthenticated = true;
    mocks.checkIsAdmin.mockResolvedValue(true);
    render(<App />);
    await screen.findByRole("heading", { name: "Critical" });
    expect(screen.getByRole("heading", { name: "Roadmap" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Important" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Non-critical" })).toBeInTheDocument();
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(mocks.load).toHaveBeenCalledOnce();
  });
});
