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

describe("Chronicle Knowledge Base My Stories manual", () => {
  it("renders the Overview gate from the My Stories source document", () => {
    renderPage();
    const myStories = document.getElementById("my-stories")!;
    expect(within(myStories).getAllByRole("tab")).toHaveLength(6);
    expect(
      within(myStories).getByRole("heading", { name: "My Stories at a Glance" }),
    ).toBeInTheDocument();
  }, 30_000);

  it("isolates My Stories Issues and verified shared history without an active-work tab", async () => {
    renderPage();
    const myStories = document.getElementById("my-stories")!;

    fireEvent.click(within(myStories).getByRole("tab", { name: /Issues/ }));
    expect(within(myStories).getByText("MS-ISSUE-001")).toBeInTheDocument();
    expect(within(myStories).getByText("MS-ISSUE-002")).toBeInTheDocument();
    expect(within(myStories).queryByText("CG-ISSUE-001")).not.toBeInTheDocument();

    expect(within(myStories).queryByRole("tab", { name: "Current Work" })).not.toBeInTheDocument();

    fireEvent.click(within(myStories).getByRole("tab", { name: "Changelog" }));
    expect(await within(myStories).findByText("2 records")).toBeInTheDocument();
    expect(within(myStories).getByText("Polish shared story detail modal scrolling, review CTA, and editable badge guidance")).toBeInTheDocument();
    expect(within(myStories).getByText("Simplify scenario reviews into Chronicle quick-rating flow")).toBeInTheDocument();
    expect(within(myStories).queryByText("CG-CHANGE-001 accepted")).not.toBeInTheDocument();
  }, 30_000);

  it("renders the UI Elements and Functions gate from its intended heading", () => {
    renderPage();
    const myStories = document.getElementById("my-stories")!;

    fireEvent.click(
      within(myStories).getByRole("tab", {
        name: "UI Elements and Functions",
      }),
    );
    expect(
      within(myStories).getByRole("heading", {
        name: "Workspace Entry and Header",
      }),
    ).toBeInTheDocument();
    expect(
      within(myStories).getByText(/From Library opens a nested dialog titled/),
    ).toHaveTextContent("Select from Image Library");
    expect(
      within(myStories).getByText(/The confirming action must be labelled according to bookmark removal/),
    ).toHaveTextContent("rather than source deletion");
    expect(
      within(myStories).getByText(/Success must clear the published state/),
    ).toHaveTextContent("card badge, and Published collection");
  }, 30_000);

  it("renders the App Architecture gate from its intended heading", () => {
    renderPage();
    const myStories = document.getElementById("my-stories")!;

    fireEvent.click(
      within(myStories).getByRole("tab", { name: "App Architecture" }),
    );
    expect(
      within(myStories).getByRole("heading", {
        name: "What This Architecture Account Covers",
      }),
    ).toBeInTheDocument();
    expect(
      within(myStories).getAllByText("content_themes", { selector: "code" }).length,
    ).toBeGreaterThan(0);
    expect(
      within(myStories).getByRole("heading", {
        name: "Chat History resume depends on the current source",
      }),
    ).toBeInTheDocument();
  }, 30_000);

  it("renders the Supabase Tables gate through the shared reference", () => {
    renderPage();
    const myStories = document.getElementById("my-stories")!;

    fireEvent.click(
      within(myStories).getByRole("tab", { name: "Supabase Tables" }),
    );
    expect(
      within(myStories).getByRole("heading", { name: "Supabase Tables" }),
    ).toBeInTheDocument();
    expect(
      within(myStories).getByRole("link", {
        name: "/style-guide/supabase-schema-reference",
      }),
    ).toHaveAttribute("href", "/style-guide/supabase-schema-reference");
    expect(
      within(myStories).getByText(/last synchronized documented structure/),
    ).toHaveTextContent("not proof that every live database detail is represented or unchanged");
  }, 30_000);

  it("renders the application-map gate from the Chronicle Overview source", () => {
    renderPage();
    const applicationMap = document.getElementById("chronicle-overview")!;

    fireEvent.click(
      within(applicationMap).getByRole("tab", { name: "My Stories" }),
    );
    expect(
      within(applicationMap).getByRole("heading", {
        name: "My Stories is the account-centered story workspace",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByRole("heading", {
        name: "What My Stories receives",
      }),
    ).toBeInTheDocument();
    expect(
      within(applicationMap).getByText(/marks the owned publication inactive/),
    ).toHaveTextContent("without a separate confirmation");
  }, 30_000);
});
