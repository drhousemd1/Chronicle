import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RndPrototypeShell } from "./RndPrototypeShell";
import {
  RND_SCHEMA_VERSION,
  type RndMockupRecord,
  type RndPrototypeDefinition,
} from "./rnd-types";

const mockup: RndMockupRecord = {
  schemaVersion: RND_SCHEMA_VERSION,
  id: "mockup-shell-test",
  displayTitle: "Registered Study",
  purpose: "Verify the shared protected shell.",
  documentBlocks: [{ id: "text-block", type: "text", text: "Editable notes" }],
  notes: "Editable notes",
  createdAt: "2026-08-15T12:00:00.000Z",
  contentUpdatedAt: "2026-08-15T12:30:00.000Z",
  previewBackground: "paper",
  assetIds: [],
};

const definition: RndPrototypeDefinition = {
  id: mockup.id,
  defaultTitle: "Registered Study",
  defaultPurpose: "Verify the shared protected shell.",
  createdAt: "2026-08-15T12:00:00.000Z",
  sourceUpdatedAt: "2026-08-15T12:30:00.000Z",
  sourcePath: "src/components/admin/research-development/prototypes/registered-study/",
  uiPrecedents: [
    {
      element: "Protected preview shell",
      sourcePath: "src/components/admin/research-development/RndPrototypeShell.tsx",
      reuseMethod: "direct",
    },
  ],
  Preview: () => <div>Coded preview content</div>,
  details: <p>Registered factual details</p>,
  additionalSections: [
    {
      id: "second-study",
      title: "Second Protected Study",
      createdAt: "2026-08-15T13:00:00.000Z",
      sourceUpdatedAt: "2026-08-15T13:30:00.000Z",
      sourcePath: "src/components/admin/research-development/prototypes/registered-study/SecondStudy.tsx",
      uiPrecedents: [
        {
          element: "Protected preview shell",
          sourcePath: "src/components/admin/research-development/RndPrototypeShell.tsx",
          reuseMethod: "direct",
        },
      ],
      Preview: () => <div>Second coded preview</div>,
      details: <p>Second factual details</p>,
    },
  ],
};

describe("RndPrototypeShell", () => {
  it("renders a registered preview and keeps its factual record collapsed by default", () => {
    const onBackgroundChange = vi.fn();
    render(
      <RndPrototypeShell
        mockup={mockup}
        definition={definition}
        onBackgroundChange={onBackgroundChange}
      />,
    );

    expect(screen.getByRole("heading", { name: "Registered Study" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Protected mock-up preview" })).toHaveTextContent(
      "Coded preview content",
    );
    expect(screen.getByText(definition.sourcePath)).toBeInTheDocument();
    expect(screen.queryByText("Registered factual details")).not.toBeInTheDocument();
    const backgroundGroup = screen.getByRole("group", { name: "Preview background" });
    expect(backgroundGroup).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use white preview background" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(backgroundGroup.querySelectorAll("button")).toHaveLength(4);
    fireEvent.keyDown(screen.getByRole("button", { name: "Use light gray preview background" }), {
      key: "Enter",
      code: "Enter",
    });
    expect(onBackgroundChange).toHaveBeenCalledWith("light");
    fireEvent.click(screen.getByRole("button", { name: "Use charcoal preview background" }));
    expect(onBackgroundChange).toHaveBeenCalledWith("charcoal");

    const detailsButton = screen.getByRole("button", { name: "Component Details" });
    expect(detailsButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(detailsButton, { key: "Enter", code: "Enter" });

    expect(detailsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Mock-up ID")).toBeInTheDocument();
    expect(screen.getByText(mockup.id)).toBeInTheDocument();
    expect(screen.getByText("UI precedents")).toBeInTheDocument();
    expect(screen.getByText("Protected preview shell").closest("li")).toHaveTextContent(
      "direct",
    );
    expect(screen.getByText("Registered factual details")).toBeInTheDocument();

    fireEvent.keyDown(detailsButton, { key: " ", code: "Space" });
    expect(detailsButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders an additional definition through the same protected shell", () => {
    const section = definition.additionalSections?.[0];
    expect(section).toBeDefined();
    render(
      <RndPrototypeShell
        mockup={mockup}
        definition={definition}
        section={section}
        onBackgroundChange={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: "Second Protected Study" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Second Protected Study protected mock-up preview" }),
    ).toHaveTextContent("Second coded preview");
    expect(screen.getByText(section!.sourcePath)).toBeInTheDocument();
    expect(screen.queryByText("Second factual details")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Component Details" }));
    expect(screen.getByText("Second factual details")).toBeInTheDocument();
  });
});
