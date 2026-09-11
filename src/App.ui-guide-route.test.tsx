// @vitest-environment jsdom
import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { user: null as { id: string } | null, loading: false, isAuthenticated: false },
  checkIsAdmin: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/services/app-settings", () => ({ checkIsAdmin: mocks.checkIsAdmin, writeCachedAdminState: vi.fn() }));
vi.mock("@/contexts/ArtStylesContext", () => ({ ArtStylesProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("./pages/Index", () => ({ default: () => <p>Application home</p> }));
vi.mock("./pages/CreatorProfile", () => ({ default: () => null }));
vi.mock("./pages/NotFound", () => ({ default: () => <p>Not found</p> }));
import App from "./App";

afterEach(cleanup);
beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  window.history.replaceState({}, "", "/style-guide/chronicle-ui-guide/story-builder?tab=fields");
  mocks.auth.user = null;
  mocks.auth.loading = false;
  mocks.auth.isAuthenticated = false;
  mocks.checkIsAdmin.mockReset().mockResolvedValue(false);
});

describe("UI Guide registered application route", () => {
  it("redirects a signed-out direct visit to authentication", async () => {
    render(<App />);
    await screen.findByText("Application home");
    expect(window.location.search).toBe("?auth=1");
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("withholds the actual guide while checking permissions and redirects a non-admin", async () => {
    mocks.auth.user = { id: "non-admin" };
    mocks.auth.isAuthenticated = true;
    let resolveRole!: (allowed: boolean) => void;
    mocks.checkIsAdmin.mockReturnValue(new Promise<boolean>(resolve => { resolveRole = resolve; }));
    render(<App />);
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
    resolveRole(false);
    await screen.findByText("Application home");
    expect(window.location.pathname).toBe("/");
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
  });

  it("loads the real guide and requested section after confirming an administrator", async () => {
    mocks.auth.user = { id: "administrator" };
    mocks.auth.isAuthenticated = true;
    mocks.checkIsAdmin.mockResolvedValue(true);
    render(<App />);
    await waitFor(() => expect(within(screen.getByRole("region", { name: "Story Builder UI Reference" })).getByRole("tabpanel")).toHaveTextContent("Focused invalid field"));
    expect(within(screen.getByRole("region", { name: "Story Builder UI Reference" })).getByRole("tab", { name: "Fields & Controls" })).toHaveAttribute("aria-selected", "true");
    expect(mocks.checkIsAdmin).toHaveBeenCalledWith("administrator");
  });
});
