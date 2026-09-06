// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { getCapabilityOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

import { OperationalRecordContent } from "./OperationalRecordContent";

const sourcePath =
  "docs/current-work/active/community-gallery/CG-WORK-900.md";
const source = `---
record_type: current_work
current_work_version: 2
workflow_route: local-interaction
project_id: CG-WORK-900
title: Bounded Gallery interaction
origin: approved_enhancement
owner_capability: community-gallery
related_capabilities: []
linked_issue_ids: []
approved_objective_ref: approved:bounded-gallery-interaction
started: 2026-07-30
source_record: ${sourcePath}
---
# CG-WORK-900: Bounded Gallery interaction

Current Work is an operational companion. Stable capability behavior remains in the Chronicle Knowledge Base manual.

## Current State / Resume Here

- Purpose: Preserve a bounded interaction change long enough for another reader to resume it.
- Objective and scope: Authorized: update and verify one Gallery interaction under implementation authorization granted on 2026-07-30 by Chronicle owner. Outside: Supabase, deployment, and unrelated Gallery behavior.
- Current status and coordinator: Implementing since 2026-07-30; last activity 2026-07-30; coordinator Main Work; resume priority Primary.
- Latest verified result: Source inspection established the exact bounded interaction path.
- Exact next action: Implement the bounded change and run its focused deterministic checks.
- Blocker or decision: None.
- Strongest evidence and limits: Source inspection identifies the current path; product behavior is not yet accepted.
- Source state and reading order: Re-read this record, then inspect the named interaction source before changing it.
`;

describe("OperationalRecordContent", () => {
  it("renders the eight stored core fields that preserve the seven Current Work meanings", () => {
    const registry = buildOperationalRecordRegistry(
      { [sourcePath]: source },
      { asOf: "2026-08-21" },
    );

    render(
      <OperationalRecordContent
        kind="current-work"
        capabilityId="community-gallery"
        capabilityLabel="Community Gallery"
        registry={registry}
        renderMarkdown={(value) => <p>{value}</p>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Core resumable summary" })).toBeInTheDocument();
    for (const label of [
      "Purpose",
      "Objective and scope",
      "Current status and coordinator",
      "Latest verified result",
      "Exact next action",
      "Blocker or decision",
      "Strongest evidence and limits",
      "Source state and reading order",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("heading", { name: "Attempt and Decision Log" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the deep Route 4 modules visible after the version 2 core summary", () => {
    const baseRegistry = buildOperationalRecordRegistry(
      { [sourcePath]: source },
      { asOf: "2026-08-21" },
    );
    const project = baseRegistry.activeProjects[0];
    const deepHeadings = [
      "Versioned Outcome and Success Contract",
      "Current Verified State",
      "Scope and Decisions",
      "Traceability Chain",
      "Work Steps",
      "Proof Claims",
      "Attempt and Decision Log",
    ];
    const registry = {
      ...baseRegistry,
      activeProjects: [
        {
          ...project,
          workflowRoute: "system-critical" as const,
          presentModules: deepHeadings,
          body: `${project.body}\n${deepHeadings
            .map((heading) => `## ${heading}\n\nComplete ${heading} content.`)
            .join("\n\n")}`,
        },
      ],
    };

    render(
      <OperationalRecordContent
        kind="current-work"
        capabilityId="community-gallery"
        capabilityLabel="Community Gallery"
        registry={registry}
        renderMarkdown={(value) => (
          <>
            {value.split("\n").map((line, index) =>
              line.startsWith("## ") ? (
                <h3 key={`${line}-${index}`}>{line.slice(3)}</h3>
              ) : line.trim() ? (
                <p key={`${line}-${index}`}>{line}</p>
              ) : null,
            )}
          </>
        )}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Core resumable summary" }),
    ).toBeInTheDocument();
    for (const heading of deepHeadings) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
  });

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
  });
});
