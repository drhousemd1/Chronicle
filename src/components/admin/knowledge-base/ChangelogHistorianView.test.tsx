// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type {
  AcceptedUpdateChangelogRecord,
  ChangelogRecordRegistry,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";

import { ChangelogHistorianView } from "./ChangelogHistorianView";

const acceptedUpdate: AcceptedUpdateChangelogRecord = {
  kind: "changelog",
  variant: "accepted_update",
  id: "CG-UPDATE-001",
  title: "Gallery wording clarified",
  changeDate: "2026-08-29",
  outcome: "The Gallery now explains the empty state in ordinary language.",
  provenance: "accepted-update",
  affectedCapabilities: ["community-gallery"],
  sourcePath: "docs/architecture-knowledge/changelog/entries/CG-UPDATE-001.md",
  body: "Accepted update body",
  rawSource: "Accepted update source",
  whyChangeWasNeeded: "The earlier wording was ambiguous.",
  changes: "The empty-state explanation was rewritten.",
  acceptedEvidenceSummary: "The affected page and focused renderer check passed.",
  acceptedEvidenceLimits: "No unrelated Gallery workflow was reviewed.",
  owningCapability: "community-gallery",
  acceptedOn: "2026-08-29",
  acceptedBy: "Chronicle owner",
  reviewMethod: "Visible review of the affected local page.",
  sourceRevision: `sha256:${"a".repeat(64)}`,
  workflowRecordContext: "no_issue_current_work_archive_or_proof_matrix",
};

const registry: ChangelogRecordRegistry = {
  records: [acceptedUpdate],
  roots: [acceptedUpdate],
  corrections: [],
  effectiveEntries: [{
    id: acceptedUpdate.id,
    variant: acceptedUpdate.variant,
    title: acceptedUpdate.title,
    changeDate: acceptedUpdate.changeDate,
    outcome: acceptedUpdate.outcome,
    provenance: acceptedUpdate.provenance,
    affectedCapabilities: acceptedUpdate.affectedCapabilities,
    sourcePath: acceptedUpdate.sourcePath,
    body: acceptedUpdate.body,
    rootRecord: acceptedUpdate,
    effectiveRecord: acceptedUpdate,
    appliedCorrections: [],
  }],
};

describe("ChangelogHistorianView", () => {
  it("renders the complete canonical narrative and links to the canonical record", async () => {
    const loader = vi.fn().mockResolvedValue({ status: "ready", registry });
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ChangelogHistorianView
          capabilityId="community-gallery"
          capabilityLabel="Community Gallery"
          loader={loader}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: acceptedUpdate.title })).toBeInTheDocument();
    expect(screen.getByText(acceptedUpdate.whyChangeWasNeeded)).toBeInTheDocument();
    expect(screen.getByText(acceptedUpdate.changes)).toBeInTheDocument();
    expect(screen.getByText(acceptedUpdate.acceptedEvidenceSummary)).toBeInTheDocument();
    expect(screen.getByText(acceptedUpdate.acceptedEvidenceLimits)).toBeInTheDocument();
    expect(screen.getByText(/accepted by Chronicle owner on 2026-08-29/)).toHaveTextContent(acceptedUpdate.reviewMethod);
    expect(screen.getByText("Canonical record source:").parentElement).toHaveTextContent(acceptedUpdate.sourcePath);
    expect(screen.getByRole("link", { name: "Read the complete canonical Changelog record" })).toHaveAttribute(
      "href",
      expect.stringContaining(acceptedUpdate.id),
    );
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("distinguishes a canonical Changelog loading failure from empty history", async () => {
    const loader = vi.fn().mockResolvedValue({ status: "error", errors: ["Source record did not validate."] });
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ChangelogHistorianView capabilityId={null} capabilityLabel="Chronicle" loader={loader} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Source record did not validate.");
    expect(screen.queryByText(/0 of 0 records shown/)).not.toBeInTheDocument();
  });
});
