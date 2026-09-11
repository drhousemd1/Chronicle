// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChronicleSkillsSection, type ChronicleSkillEntry } from "./ChronicleSkillsSection";

const entry: ChronicleSkillEntry = {
  id: "fixture", displayName: "Shared Fixture", classification: "Shared", identifier: "fixture", purpose: "Use the exact source.", usage: "Only when requested.", sourceVersion: null,
  source: { path: "/source/SKILL.md", relativePath: "SKILL.md", text: "---\nname: fixture\ndescription: Use the exact source.\n---\n# Complete instructions\nRead [the recovery rules](references/recovery.md).\n\nThis final paragraph must remain visible.", sha256: "source-hash", words: 25 },
  supportingFiles: [{ id: "recovery", path: "/source/references/recovery.md", relativePath: "references/recovery.md", text: "# Recovery\nReopen the current plan.", sha256: "support-hash", words: 7 }],
};

describe("Chronicle skills reading surface", () => {
  it("shows full skill text and opens its actual supporting instruction", () => {
    render(<ChronicleSkillsSection entries={[entry]} syncedAt="2026-09-06T00:00:00Z" />);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveClass("knowledge-content-panel");
    expect(within(panel).getByText("This final paragraph must remain visible.")).toBeVisible();
    expect(within(panel).getByText(/name: fixture/)).toBeVisible();
    const details = document.querySelector("details");
    expect(details).not.toHaveAttribute("open");
    fireEvent.click(within(panel).getByRole("link", { name: "the recovery rules" }));
    expect(details).toHaveAttribute("open");
    expect(within(details!).getByText("Reopen the current plan.")).toBeVisible();
  });

  it("uses the existing keyboard tab pattern and shows each selected source", () => {
    const second = { ...entry, id: "second", displayName: "Chronicle Second", source: { ...entry.source, text: "# Second complete source\nIts own ending.", sha256: "second-hash" } };
    render(<ChronicleSkillsSection entries={[entry, second]} />);
    const firstTab = screen.getByRole("tab", { name: "Shared Fixture" });
    firstTab.focus(); fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Chronicle Second" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Chronicle Second" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Its own ending.")).toBeVisible();
    expect(screen.queryByText("This final paragraph must remain visible.")).not.toBeInTheDocument();
  });

  it("preserves indentation and line breaks in configuration instructions", () => {
    const yaml = 'interface:\n  display_name: "Exact name"\n  default_prompt: |\n    Read the current plan.\n    Keep this next line.\n';
    const supportingFile = { id: "prompt", path: "/source/agents/openai.yaml", relativePath: "agents/openai.yaml", text: yaml, sha256: "yaml-hash", words: 17 };
    render(<ChronicleSkillsSection entries={[{ ...entry, supportingFiles: [supportingFile] }]} />);
    expect(document.querySelector("details pre code")?.textContent).toBe(yaml);
  });
});
