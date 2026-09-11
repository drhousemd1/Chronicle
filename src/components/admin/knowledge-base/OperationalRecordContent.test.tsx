// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCapabilityOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

import { OperationalRecordContent } from "./OperationalRecordContent";

describe("OperationalRecordContent", () => {
  it("keeps open Issues isolated when two capability tabs stay mounted without duplicate headings", () => {
    render(
      <>
        <section data-testid="my-stories-issues">
          <OperationalRecordContent
            kind="issues"
            capabilityId="my-stories"
            capabilityLabel="My Stories"
            registry={getCapabilityOperationalRecordRegistry("my-stories")}
            renderMarkdown={(value) => <p>{value}</p>}
          />
        </section>
        <section data-testid="character-library-issues">
          <OperationalRecordContent
            kind="issues"
            capabilityId="character-library"
            capabilityLabel="Character Library"
            registry={getCapabilityOperationalRecordRegistry("character-library")}
            renderMarkdown={(value) => <p>{value}</p>}
          />
        </section>
      </>,
    );

    const myStories = screen.getByTestId("my-stories-issues");
    const characterLibrary = screen.getByTestId("character-library-issues");
    for (const section of [myStories, characterLibrary]) {
      expect(within(section).getAllByRole("heading", { name: "Identified Issues" })).toHaveLength(1);
      expect(within(section).queryByRole("heading", { name: "Open Issues" })).not.toBeInTheDocument();
      expect(within(section).queryByRole("heading", { name: "Resolved Issues" })).not.toBeInTheDocument();
    }
    expect(within(myStories).getByText("MS-ISSUE-001")).toBeInTheDocument();
    expect(within(myStories).queryByText("CL-ISSUE-001")).not.toBeInTheDocument();
    expect(within(characterLibrary).getByText("CL-ISSUE-001")).toBeInTheDocument();
    expect(within(characterLibrary).queryByText("MS-ISSUE-001")).not.toBeInTheDocument();
    expect(screen.queryByText("No Current Work record is linked.")).not.toBeInTheDocument();
    expect(screen.queryByText("Related history")).not.toBeInTheDocument();
    expect(document.querySelector("[data-current-work-id]")).toBeNull();
  });

  it.each(["all resolved", "no records"])("renders no content for %s without changing retained history", (state) => {
    const sourceRegistry = getCapabilityOperationalRecordRegistry("community-gallery");
    const registry = state === "no records"
      ? { ...sourceRegistry, issues: [], openIssueCount: 0 }
      : sourceRegistry;
    const retainedIssues = [...registry.issues];
    expect(registry.issues.every((issue) => issue.status === "resolved")).toBe(true);
    if (state === "all resolved") expect(registry.issues.length).toBeGreaterThan(0);

    const { container } = render(
      <OperationalRecordContent
        kind="issues"
        capabilityId="community-gallery"
        capabilityLabel="Community Gallery"
        registry={registry}
        renderMarkdown={(value) => <p>{value}</p>}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(registry.issues).toEqual(retainedIssues);
    expect(registry.archivedProjects).toBe(sourceRegistry.archivedProjects);
    expect(registry.changelogRegistry).toBe(sourceRegistry.changelogRegistry);
  });
});
