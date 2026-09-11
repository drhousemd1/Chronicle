// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={["/style-guide/chronicle-knowledge-base"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/style-guide/chronicle-knowledge-base"
          element={<ChronicleKnowledgeBasePage />}
        />
        <Route path="/" element={<div />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Chronicle Knowledge Base Story Builder manual", () => {
  it("renders the Overview gate from the Story Builder source", () => {
    renderPage();
    const section = document.getElementById("story-builder")!;

    expect(within(section).getAllByRole("tab")).toHaveLength(6);
    expect(
      within(section).getByRole("heading", { name: "Story Builder at a Glance" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Complete Authoring Workflows",
      }),
    ).toBeInTheDocument();
  }, 30_000);

  it("isolates Story Builder Issues and verified history without an active-work tab", async () => {
    renderPage();
    const section = document.getElementById("story-builder")!;
    fireEvent.click(within(section).getByRole("tab", { name: /Issues/ }));
    expect(within(section).getByText("SB-ISSUE-001")).toBeInTheDocument();
    expect(within(section).getByText("SB-ISSUE-002")).toBeInTheDocument();
    expect(within(section).queryByText("MI-ISSUE-001")).not.toBeInTheDocument();
    expect(within(section).queryByRole("tab", { name: "Current Work" })).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole("tab", { name: "Changelog" }));
    expect(await within(section).findByText("8 records")).toBeInTheDocument();
    expect(within(section).getByText("Restore reliable auto-expanding behavior for Story Builder Custom AI Rules textarea")).toBeInTheDocument();
    expect(within(section).getByText("Start Phase 2 builder decomposition by extracting Story Builder media ownership")).toBeInTheDocument();
    expect(within(section).queryByText("Fix loadFolders ReferenceError causing white screen")).not.toBeInTheDocument();
  }, 30_000);

  it("renders the UI Elements and Functions gate", () => {
    renderPage();
    const section = document.getElementById("story-builder")!;

    fireEvent.click(
      within(section).getByRole("tab", {
        name: "UI Elements and Functions",
      }),
    );
    expect(
      within(section).getByRole("heading", { name: "Character Roster and Character Creation" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Scene Gallery" }),
    ).toBeInTheDocument();
    expect(within(section).getAllByText("Finalize and Close").length).toBeGreaterThan(0);
    expect(within(section).getAllByText("Generate Scene Image").length).toBeGreaterThan(0);
  }, 30_000);

  it("renders the App Architecture gate and current limitations", () => {
    renderPage();
    const section = document.getElementById("story-builder")!;

    fireEvent.click(
      within(section).getByRole("tab", { name: "App Architecture" }),
    );
    expect(
      within(section).getByRole("heading", {
        name: "Ordered Runtime and Data Flows",
      }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Current Implementation Limitations",
      }),
    ).toBeInTheDocument();
    expect(
      within(section).getAllByText("save_scenario_atomic", {
        selector: "code",
      }).length,
    ).toBeGreaterThan(0);
  }, 30_000);

  it("renders the shared Supabase Tables gate", () => {
    renderPage();
    const section = document.getElementById("story-builder")!;

    fireEvent.click(
      within(section).getByRole("tab", { name: "Supabase Tables" }),
    );
    expect(
      within(section).getByRole("heading", { name: "Supabase Tables" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("link", {
        name: "/style-guide/supabase-schema-reference",
      }),
    ).toHaveAttribute("href", "/style-guide/supabase-schema-reference");
    expect(
      within(section).getByText(/last synchronized documented structure/),
    ).toHaveTextContent(
      "not proof that every live database detail is represented or unchanged",
    );
  }, 30_000);

  it("renders the Story Builder application-map gate", () => {
    renderPage();
    const applicationMap = document.getElementById("chronicle-overview")!;

    fireEvent.click(
      within(applicationMap).getByRole("tab", { name: "Story Builder" }),
    );
    expect(
      within(applicationMap).getByRole("heading", {
        name: "Story Builder is Chronicle's story-source authoring owner",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByRole("heading", {
        name: "What Story Builder produces",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByText(/Chat Interface becomes the next-stage owner/),
    ).toHaveTextContent("live roleplay");
  }, 30_000);
});
