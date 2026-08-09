// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { id: string } | null,
    loading: false,
    isAuthenticated: false,
  },
  checkIsAdmin: vi.fn(),
  writeCachedAdminState: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mocks.authState,
}));

vi.mock("@/services/app-settings", () => ({
  checkIsAdmin: mocks.checkIsAdmin,
  writeCachedAdminState: mocks.writeCachedAdminState,
}));

vi.mock("./pages/Index", () => ({ default: () => null }));
vi.mock("./pages/CreatorProfile", () => ({ default: () => null }));
vi.mock("./pages/NotFound", () => ({ default: () => null }));

import { AdminOnlyRoute } from "./App";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

const PROTECTED_CHANGELOG_ADDRESS =
  "/style-guide/changelog/CG-CHANGE-900?scope=community-gallery&from=knowledge-base";

function renderProtectedRoute() {
  return render(
    <MemoryRouter
      initialEntries={[PROTECTED_CHANGELOG_ADDRESS]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/style-guide/changelog/:recordId"
          element={
            <AdminOnlyRoute>
              <p>Protected Changelog record content</p>
            </AdminOnlyRoute>
          }
        />
        <Route path="/" element={<p>Application home</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("AdminOnlyRoute behavior", () => {
  beforeEach(() => {
    mocks.authState.user = null;
    mocks.authState.loading = false;
    mocks.authState.isAuthenticated = false;
    mocks.checkIsAdmin.mockReset();
    mocks.checkIsAdmin.mockResolvedValue(false);
    mocks.writeCachedAdminState.mockReset();
  });

  it("redirects a logged-out visitor to Chronicle authentication", async () => {
    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/?auth=1");
    });
    expect(screen.queryByText("Protected Changelog record content")).not.toBeInTheDocument();
  });

  it("fails closed for an authenticated non-admin", async () => {
    mocks.authState.user = { id: "non-admin-user" };
    mocks.authState.isAuthenticated = true;
    mocks.checkIsAdmin.mockResolvedValue(false);

    renderProtectedRoute();

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/");
    });
    expect(mocks.checkIsAdmin).toHaveBeenCalledWith("non-admin-user");
    expect(screen.queryByText("Protected Changelog record content")).not.toBeInTheDocument();
  });

  it("withholds content while authentication is pending", () => {
    mocks.authState.loading = true;

    renderProtectedRoute();

    expect(screen.queryByText("Protected Changelog record content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      PROTECTED_CHANGELOG_ADDRESS,
    );
  });

  it("withholds content while the admin role check is pending", () => {
    mocks.authState.user = { id: "pending-admin-user" };
    mocks.authState.isAuthenticated = true;
    mocks.checkIsAdmin.mockReturnValue(new Promise(() => undefined));

    renderProtectedRoute();

    expect(mocks.checkIsAdmin).toHaveBeenCalledWith("pending-admin-user");
    expect(screen.queryByText("Protected Changelog record content")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      PROTECTED_CHANGELOG_ADDRESS,
    );
  });

  it("renders the protected route only after the admin role is confirmed", async () => {
    mocks.authState.user = { id: "admin-user" };
    mocks.authState.isAuthenticated = true;
    mocks.checkIsAdmin.mockResolvedValue(true);

    renderProtectedRoute();

    expect(await screen.findByText("Protected Changelog record content")).toBeInTheDocument();
    expect(mocks.checkIsAdmin).toHaveBeenCalledWith("admin-user");
    expect(screen.getByTestId("location")).toHaveTextContent(
      PROTECTED_CHANGELOG_ADDRESS,
    );
  });
});
