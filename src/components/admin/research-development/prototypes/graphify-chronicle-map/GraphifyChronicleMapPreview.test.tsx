// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphifyChronicleMapPreview } from "./GraphifyChronicleMapPreview";

describe("GraphifyChronicleMapPreview", () => {
  it("opens the Chronicle-organized map by default inside a script-only sandbox", () => {
    render(<GraphifyChronicleMapPreview />);

    const frame = screen.getByTestId("graphify-chronicle-frame");
    expect(frame).toHaveAttribute(
      "src",
      "/__rnd-repository/generated/graphify-chronicle-map/chronicle-areas.html",
    );
    expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    expect(frame).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(screen.getByRole("button", { name: "Chronicle Areas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("preserves the repository tree, full graph, and aggregated community exports", () => {
    render(<GraphifyChronicleMapPreview />);

    fireEvent.click(screen.getByRole("button", { name: "Repository Tree" }));
    expect(screen.getByTestId("graphify-chronicle-frame")).toHaveAttribute(
      "src",
      "/__rnd-repository/generated/graphify-chronicle-map/graph-tree.html",
    );

    fireEvent.click(screen.getByRole("button", { name: "Dependency Graph" }));
    expect(screen.getByTestId("graphify-chronicle-frame")).toHaveAttribute(
      "src",
      "/__rnd-repository/generated/graphify-chronicle-map/graph-full.html",
    );

    fireEvent.click(screen.getByRole("button", { name: "Community Overview" }));
    expect(screen.getByTestId("graphify-chronicle-frame")).toHaveAttribute(
      "src",
      "/__rnd-repository/generated/graphify-chronicle-map/graph-communities.html",
    );
    expect(screen.getByRole("button", { name: "Community Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
