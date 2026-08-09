// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  KnowledgeSection,
  KnowledgeTab,
} from "@/data/chronicle-knowledge-base/manifest";

import { KnowledgeSwitcher } from "./KnowledgeSwitcher";

const section: KnowledgeSection = {
  id: "fixture",
  label: "Fixture Capability",
  description: "Fixture description.",
  tabs: [
    { id: "overview", label: "Overview", contentKind: "blank" },
    {
      id: "architecture",
      label: "Architecture",
      contentKind: "blank",
      reviewed: "07/25/2026",
      updated: "07/26/2026",
    },
    {
      id: "issues",
      label: "Issues",
      contentKind: "issue-records",
      openIssueCount: 2,
    },
  ],
};

function renderTab(tab: KnowledgeTab) {
  return <p>{tab.label} content</p>;
}

describe("KnowledgeSwitcher", () => {
  it("uses roving tabs with wrapping arrows and Home/End navigation", () => {
    render(<KnowledgeSwitcher section={section} renderContent={renderTab} />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    const architecture = screen.getByRole("tab", { name: "Architecture" });
    const issues = screen.getByRole("tab", { name: "Issues, 2 open" });

    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveAttribute("tabindex", "0");
    expect(architecture).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(overview, { key: "ArrowLeft" });
    expect(issues).toHaveAttribute("aria-selected", "true");
    expect(issues).toHaveFocus();

    fireEvent.keyDown(issues, { key: "Home" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(overview).toHaveFocus();

    fireEvent.keyDown(overview, { key: "End" });
    expect(issues).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(issues, { key: "ArrowRight" });
    expect(overview).toHaveAttribute("aria-selected", "true");
  });

  it("derives the issue badge and resets panel scroll when content changes", () => {
    render(<KnowledgeSwitcher section={section} renderContent={renderTab} />);

    const panel = screen.getByRole("tabpanel");
    panel.scrollTop = 160;
    fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));

    expect(panel.scrollTop).toBe(0);
    expect(
      within(screen.getByRole("tab", { name: "Issues, 2 open" })).getByText("2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Last Reviewed: 07/25/2026")).toBeInTheDocument();
    expect(screen.getByText("Last Updated: 07/26/2026")).toBeInTheDocument();
  });

  it("keeps an empty Issues tab white and badge-free", () => {
    const emptySection: KnowledgeSection = {
      ...section,
      id: "empty-fixture",
      tabs: section.tabs.map((tab) =>
        tab.id === "issues" ? { ...tab, openIssueCount: 0 } : tab,
      ),
    };

    render(
      <KnowledgeSwitcher
        section={emptySection}
        renderContent={renderTab}
      />,
    );

    const issues = screen.getByRole("tab", { name: "Issues" });
    expect(issues).not.toHaveClass("knowledge-tab--issues-active");
    expect(within(issues).queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it("does not reuse stable-document review metadata on operational tabs", () => {
    render(<KnowledgeSwitcher section={section} renderContent={renderTab} />);

    fireEvent.click(screen.getByRole("tab", { name: "Issues, 2 open" }));

    expect(screen.queryByText(/Last Reviewed:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last Updated:/)).not.toBeInTheDocument();
  });

  it("honors a valid requested tab and reports later user selections", () => {
    const onTabSelected = vi.fn();

    render(
      <KnowledgeSwitcher
        section={section}
        renderContent={renderTab}
        requestedTabId="architecture"
        onTabSelected={onTabSelected}
      />,
    );

    expect(
      screen.getByRole("tab", { name: "Architecture" }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));

    expect(onTabSelected).toHaveBeenCalledWith(section.tabs[0]);
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
