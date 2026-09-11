// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCapabilityOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

import { OperationalRecordContent } from "./OperationalRecordContent";

describe("OperationalRecordContent", () => {
  it("namespaces Issue group identities when two capability tabs stay mounted", () => {
    render(
      <>
        <OperationalRecordContent
          kind="issues"
          capabilityId="my-stories"
          capabilityLabel="My Stories"
          registry={getCapabilityOperationalRecordRegistry("my-stories")}
          renderMarkdown={(value) => <p>{value}</p>}
        />
        <OperationalRecordContent
          kind="issues"
          capabilityId="character-library"
          capabilityLabel="Character Library"
          registry={getCapabilityOperationalRecordRegistry("character-library")}
          renderMarkdown={(value) => <p>{value}</p>}
        />
      </>,
    );

    expect(document.querySelectorAll("#my-stories-open-issues-heading")).toHaveLength(1);
    expect(document.querySelectorAll("#character-library-open-issues-heading")).toHaveLength(1);
    expect(document.querySelectorAll("#open-issues-heading")).toHaveLength(0);
    expect(screen.queryByText("No Current Work record is linked.")).not.toBeInTheDocument();
    expect(screen.queryByText("Related history")).not.toBeInTheDocument();
    expect(document.querySelector("[data-current-work-id]")).toBeNull();
  });
});
