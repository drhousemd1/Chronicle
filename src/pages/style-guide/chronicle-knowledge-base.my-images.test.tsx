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

describe("Chronicle Knowledge Base My Images manual", () => {
  it("renders the Overview gate from the My Images source", () => {
    renderPage();
    const section = document.getElementById("my-images")!;

    expect(within(section).getAllByRole("tab")).toHaveLength(7);
    expect(
      within(section).getByRole("heading", { name: "My Images at a Glance" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", {
        name: "Ownership and Media Lifecycle",
      }),
    ).toBeInTheDocument();
  }, 30_000);

  it("isolates My Images Issues, empty work, and verified history", async () => {
    renderPage();
    const section = document.getElementById("my-images")!;
    fireEvent.click(within(section).getByRole("tab", { name: /Issues/ }));
    expect(within(section).getByText("MI-ISSUE-001")).toBeInTheDocument();
    expect(within(section).getByText("MI-ISSUE-002")).toBeInTheDocument();
    expect(within(section).queryByText("CL-ISSUE-001")).not.toBeInTheDocument();
    fireEvent.click(within(section).getByRole("tab", { name: "Current Work" }));
    expect(within(section).getByRole("tabpanel")).toHaveTextContent(
      /recorded for Image Library/,
    );
    fireEvent.click(within(section).getByRole("tab", { name: "Changelog" }));
    expect(await within(section).findByText("3 records")).toBeInTheDocument();
    expect(within(section).getByText("Fix loadFolders ReferenceError causing white screen")).toBeInTheDocument();
    expect(within(section).getByText("Align style-guide tile specs to code truth and standardize character role badge wording")).toBeInTheDocument();
    expect(within(section).getByText("Complete Phase 1 shell slice 9 by extracting Index background workspace state and actions")).toBeInTheDocument();
    expect(within(section).queryByText("Restore reliable auto-expanding behavior for Story Builder Custom AI Rules textarea")).not.toBeInTheDocument();
  }, 30_000);

  it("renders the UI Elements and Functions gate", () => {
    renderPage();
    const section = document.getElementById("my-images")!;

    fireEvent.click(
      within(section).getByRole("tab", {
        name: "UI Elements and Functions",
      }),
    );
    expect(
      within(section).getByRole("heading", { name: "Folder Library" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByRole("heading", { name: "Image Details Editor" }),
    ).toBeInTheDocument();
    expect(
      within(section).getByText(/Migration pending — re-upload required/),
    ).toBeInTheDocument();
    expect(within(section).getAllByText("Copying…").length).toBeGreaterThan(0);
  }, 30_000);

  it("renders the App Architecture gate and current limitations", () => {
    renderPage();
    const section = document.getElementById("my-images")!;

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
      within(section).getAllByText("get_folders_with_details", {
        selector: "code",
      }).length,
    ).toBeGreaterThan(0);
  }, 30_000);

  it("renders the shared Supabase Tables gate", () => {
    renderPage();
    const section = document.getElementById("my-images")!;

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

  it("renders the My Images application-map gate", () => {
    renderPage();
    const applicationMap = document.getElementById("chronicle-overview")!;

    fireEvent.click(
      within(applicationMap).getByRole("tab", { name: "Image Library" }),
    );
    expect(
      within(applicationMap).getByRole("heading", {
        name: "Image Library is the account's private reusable media source",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByRole("heading", {
        name: "What Image Library produces",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByText(/Story Builder is the immediate next-stage owner/),
    ).toHaveTextContent("covers and scenes");
  }, 30_000);
});
