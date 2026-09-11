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

describe("Chronicle Knowledge Base Character Library manual", () => {
  it("renders the Overview gate from the Character Library source", () => {
    renderPage();
    const section = document.getElementById("character-library")!;

    expect(within(section).getAllByRole("tab")).toHaveLength(6);
    expect(
      within(section).getByRole("heading", {
        name: "Character Library at a Glance",
      }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Ownership, Reuse, and Lifecycle",
      }),
    ).toBeInTheDocument();
  }, 30_000);

  it("isolates Character Library Issues and verified history without an active-work tab", async () => {
    renderPage();
    const section = document.getElementById("character-library")!;
    fireEvent.click(within(section).getByRole("tab", { name: /Issues/ }));
    expect(within(section).getByText("CL-ISSUE-001")).toBeInTheDocument();
    expect(within(section).getByText("CL-ISSUE-002")).toBeInTheDocument();
    expect(within(section).queryByText("MS-ISSUE-001")).not.toBeInTheDocument();
    expect(within(section).queryByRole("tab", { name: "Current Work" })).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole("tab", { name: "Changelog" }));
    expect(await within(section).findByText("1 record")).toBeInTheDocument();
    expect(within(section).getByText("Align style-guide tile specs to code truth and standardize character role badge wording")).toBeInTheDocument();
    expect(within(section).queryByText("Fix loadFolders ReferenceError causing white screen")).not.toBeInTheDocument();
  }, 30_000);

  it("renders the UI Elements and Functions gate from its heading", () => {
    renderPage();
    const section = document.getElementById("character-library")!;

    fireEvent.click(
      within(section).getByRole("tab", {
        name: "UI Elements and Functions",
      }),
    );
    expect(
      within(section).getByRole("heading", {
        name: "Workspace Entry and Page Header",
      }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Collection Grid and Character Cards",
      }),
    ).toBeInTheDocument();
    expect(
      within(section).getByText(/Use all details currently in character card/),
    ).toBeInTheDocument();
    expect(
      within(section).getAllByText("Generate Avatar").length,
    ).toBeGreaterThan(0);
  }, 30_000);

  it("renders the App Architecture gate and implementation limits", () => {
    renderPage();
    const section = document.getElementById("character-library")!;

    fireEvent.click(
      within(section).getByRole("tab", { name: "App Architecture" }),
    );
    expect(
      within(section).getByRole("heading", {
        name: "Coverage and Delivery Boundary",
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

  it("renders the shared Supabase Tables gate with truthful metadata source", () => {
    renderPage();
    const section = document.getElementById("character-library")!;

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

  it("renders the Character Library application-map gate", () => {
    renderPage();
    const applicationMap = document.getElementById("chronicle-overview")!;

    fireEvent.click(
      within(applicationMap).getByRole("tab", { name: "Character Library" }),
    );
    expect(
      within(applicationMap).getByRole("heading", {
        name: "Character Library is the account's reusable character source",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByRole("heading", {
        name: "What Character Library produces",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByText(/immediate next-stage owner/),
    ).toHaveTextContent("Story Builder");
  }, 30_000);
});
