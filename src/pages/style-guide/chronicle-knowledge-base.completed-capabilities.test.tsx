// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ChronicleKnowledgeBasePage from "./chronicle-knowledge-base";

const completedCapabilities = [
  {
    id: "chat-interface",
    label: "Chat Interface",
    overview: "Chat Interface at a Glance",
    ui: "Active Session Layout",
  },
  {
    id: "chat-history",
    label: "Chat History",
    overview: "Chat History at a Glance",
    ui: "Saved Session List",
  },
  {
    id: "public-profile",
    label: "Public Profile",
    overview: "Public Profile at a Glance",
    ui: "Editable Profile",
  },
  {
    id: "account",
    label: "Account & Subscription",
    overview: "Account & Subscription at a Glance",
    ui: "Account Navigation",
  },
  {
    id: "admin",
    label: "Admin Panel",
    overview: "Admin Panel at a Glance",
    ui: "Admin Hub Cards",
  },
  {
    id: "shared-systems",
    label: "Shared Application Systems",
    overview: "Shared Application Systems at a Glance",
    ui: "Application Shell",
  },
] as const;

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
      </Routes>
    </MemoryRouter>,
  );
}

describe("completed Chronicle Knowledge Base capabilities", () => {
  it("renders direct Overview and UI manuals for every completed section", () => {
    renderPage();

    for (const capability of completedCapabilities) {
      const section = document.getElementById(capability.id)!;
      expect(section, capability.id).not.toBeNull();
      expect(within(section).getAllByRole("tab"), capability.id).toHaveLength(7);
      expect(
        within(section).getByRole("heading", { name: capability.overview }),
        capability.id,
      ).toBeInTheDocument();

      fireEvent.click(
        within(section).getByRole("tab", {
          name: "UI Elements and Functions",
        }),
      );
      expect(
        within(section).getByRole("heading", { name: capability.ui }),
        capability.id,
      ).toBeInTheDocument();
    }
  }, 30_000);

  it("renders owner-isolated empty Issues, Current Work, and Changelog states", async () => {
    renderPage();

    for (const capability of completedCapabilities) {
      const section = document.getElementById(capability.id)!;

      fireEvent.click(within(section).getByRole("tab", { name: /Issues/ }));
      expect(within(section).getByRole("tabpanel"), capability.id).toHaveTextContent(
        `No verified ${capability.label} Issue records are currently loaded.`,
      );

      fireEvent.click(
        within(section).getByRole("tab", { name: "Current Work" }),
      );
      expect(within(section).getByRole("tabpanel"), capability.id).toHaveTextContent(
        `No active, paused, blocked, deferred, or closeout-pending work is recorded for ${capability.label}`,
      );

      fireEvent.click(within(section).getByRole("tab", { name: "Changelog" }));
      expect(
        await within(section).findByRole("tabpanel"),
        capability.id,
      ).toHaveTextContent(
        `No canonical Changelog records are currently verified as affecting ${capability.label}.`,
      );
    }
  }, 30_000);

  it("renders the one canonical shared Supabase source in every completed section", () => {
    renderPage();

    for (const capability of completedCapabilities) {
      const section = document.getElementById(capability.id)!;
      fireEvent.click(
        within(section).getByRole("tab", { name: "Supabase Tables" }),
      );
      expect(
        within(section).getByRole("link", {
          name: "/style-guide/supabase-schema-reference",
        }),
        capability.id,
      ).toHaveAttribute("href", "/style-guide/supabase-schema-reference");
    }
  }, 30_000);
});
