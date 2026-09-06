// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { describe, expect, it } from "vitest";

import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <output data-testid="location">
        {location.pathname}
        {location.search}
        {location.hash}
      </output>
      <button type="button" onClick={() => navigate(-1)}>
        Browser back
      </button>
    </div>
  );
}

function renderManual(initialEntry: string) {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <LocationProbe />
      <Routes>
        <Route
          path="/style-guide/chronicle-knowledge-base"
          element={<ChronicleKnowledgeBasePage />}
        />
        <Route
          path="/style-guide/chronicle-knowledge-base/work-manual"
          element={<ChronicleKnowledgeBasePage />}
        />
        <Route
          path="/style-guide/chronicle-knowledge-base/work-manual/:chapterId"
          element={<ChronicleKnowledgeBasePage />}
        />
        <Route path="/" element={<div />} />
      </Routes>
    </MemoryRouter>,
  );
}

function workManualSection() {
  const section = document.getElementById("chronicle-work-manual");
  expect(section).not.toBeNull();
  return section as HTMLElement;
}

describe("Chronicle Work Manual delivery", () => {
  it("renders the Work Manual followed by the blank Chronicle skills section", () => {
    renderManual("/style-guide/chronicle-knowledge-base");

    const section = workManualSection();
    expect(section.previousElementSibling).toHaveAttribute(
      "id",
      "chronicle-overview",
    );
    expect(section.nextElementSibling).toHaveAttribute(
      "id",
      "codex-skills-for-chronicle",
    );
    const skillsSection = section.nextElementSibling as HTMLElement;
    expect(skillsSection).toHaveClass("knowledge-switcher");
    expect(within(skillsSection).getByRole("heading", {
      name: "Codex Skills for Chronicle",
    })).toBeInTheDocument();
    expect(within(skillsSection).getByText(
      "Approved Codex skills to be used in the Chronicle project.",
    )).toBeInTheDocument();
    expect(skillsSection.querySelector(".knowledge-tab-rail")).toBeEmptyDOMElement();
    expect(skillsSection.querySelector(".knowledge-content-panel")).toBeEmptyDOMElement();
    expect(within(skillsSection).queryByRole("tab")).not.toBeInTheDocument();
    expect(skillsSection.nextElementSibling).toHaveAttribute(
      "id",
      "community-gallery",
    );
    expect(section).toHaveClass("knowledge-switcher");
    expect(
      within(section).getByRole("heading", { name: "Chronicle Work Manual" }),
    ).toBeInTheDocument();

    const tablist = within(section).getByRole("tablist", {
      name: "Chronicle Work Manual knowledge views",
    });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(6);
    expect(
      within(tablist).getAllByRole("tab").map((tab) => tab.textContent),
    ).toEqual([
      "Overview",
      "Start Here",
      "Work Types",
      "Tests, Tools, and Audits",
      "Safeguards and Systems",
      "Evidence, Records, and Stopping",
    ]);
    expect(
      within(tablist).getByRole("tab", { name: "Overview" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(within(section).getByRole("tabpanel")).toHaveClass(
      "knowledge-content-panel",
    );
    expect(within(section).getByRole("heading", {
      name: "What the Chronicle Work Manual Is",
    })).toBeInTheDocument();
    expect(within(section).getByRole("heading", {
      name: "How the Manual Is Organized",
    })).toBeInTheDocument();
    expect(
      within(section).queryByRole("heading", { name: "1. Start Here" }),
    ).not.toBeInTheDocument();
    expect(
      within(section).queryByRole("heading", {
        name: "1.4 Choose the lowest base scope that covers the complete consequence",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(section).queryByRole("columnheader", { name: "Not automatic" }),
    ).not.toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Manual status" }),
    ).toBeInTheDocument();
    expect(section.querySelector(".knowledge-work-manual-entry")).toBeNull();
    expect(section.querySelector(".knowledge-work-manual-view")).toBeNull();
    expect(
      within(section).queryByRole("link", {
        name: /Open the Work Manual at Start Here/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("opens the assignment procedure from the explanatory Overview", async () => {
    renderManual("/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=overview");
    const section = workManualSection();
    fireEvent.click(within(section).getByRole("link", { name: "Start Here" }));

    await waitFor(() => expect(
      within(section).getByRole("tab", { name: "Start Here" }),
    ).toHaveAttribute("aria-selected", "true"));
    expect(within(section).getByRole("heading", { name: "1. Start Here" })).toBeInTheDocument();
    expect(within(section).getByRole("columnheader", { name: "Not automatic" })).toBeInTheDocument();
    expect(within(section).getByRole("heading", {
      name: "1.6.1 Broad activity must be declared before it begins",
    })).toBeInTheDocument();
    expect(within(section).queryByRole("heading", {
      name: "What the Chronicle Work Manual Is",
    })).not.toBeInTheDocument();
  });

  it("opens integrated chapter links and keeps browser Back history", async () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=start-here#chronicle-work-manual",
    );
    const section = workManualSection();

    fireEvent.click(within(section).getByRole("tab", { name: "Work Types" }));
    expect(
      within(section).getByRole("heading", { name: "2. Routine Local Work" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "3. Connected Feature Work" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "4. Multi-System Program Work" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "section=chronicle-work-manual&tab=work-types#chronicle-work-manual",
    );

    fireEvent.click(screen.getByRole("button", { name: "Browser back" }));
    await waitFor(() =>
      expect(
        within(section).getByRole("heading", { name: "1. Start Here" }),
      ).toBeInTheDocument(),
    );
  });

  it("routes a subsection cross-reference to its integrated chapter and exact heading", async () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=subagents-research-review#chronicle-work-manual",
    );
    const section = workManualSection();

    fireEvent.click(within(section).getByRole("link", { name: "Section 8.2" }));

    await waitFor(() =>
      expect(
        within(section).getByRole("heading", { name: "8.2 Issues" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "section=chronicle-work-manual&tab=evidence-records-stopping#82-issues",
    );
  });

  it("redirects old Manual addresses into the integrated section", async () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base/work-manual/routine-local-work",
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=work-types#2-routine-local-work",
      ),
    );
    expect(
      within(workManualSection()).getByRole("heading", {
        name: "2. Routine Local Work",
      }),
    ).toBeInTheDocument();
  });

  it("preserves legacy subsection anchors when redirecting", async () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base/work-manual/records-and-continuity#82-issues",
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=evidence-records-stopping#82-issues",
      ),
    );
    expect(
      within(workManualSection()).getByRole("heading", { name: "8.2 Issues" }),
    ).toBeInTheDocument();
  });

  it("normalizes invalid integrated and legacy chapters to Overview", async () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base/work-manual/not-a-chapter",
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "section=chronicle-work-manual&tab=overview#chronicle-work-manual",
      ),
    );
    expect(
      within(workManualSection()).getByRole("heading", { name: "What the Chronicle Work Manual Is" }),
    ).toBeInTheDocument();
  });

  it("retains the shared tab keyboard behavior", () => {
    renderManual("/style-guide/chronicle-knowledge-base");
    const section = workManualSection();
    const overview = within(section).getByRole("tab", { name: "Overview" });

    overview.focus();
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(
      within(section).getByRole("tab", { name: "Start Here" }),
    ).toHaveFocus();
    expect(
      within(section).getByRole("heading", { name: "1. Start Here" }),
    ).toBeInTheDocument();
  });

  it("puts exact broad checks and their authorization limits in one visible tab", () => {
    renderManual(
      "/style-guide/chronicle-knowledge-base?section=chronicle-work-manual&tab=tests-tools-audits#chronicle-work-manual",
    );
    const section = workManualSection();

    expect(
      within(section).getByRole("heading", {
        name: "11. Checks, Delivery, and Reporting",
      }),
    ).toBeInTheDocument();
    expect(within(section).getByText("WM-TEST-FULL")).toBeInTheDocument();
    expect(within(section).getByText("WM-CERT-QUALITY")).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "10. Subagents, Research, and Independent Review",
      }),
    ).toBeInTheDocument();
  });
});
