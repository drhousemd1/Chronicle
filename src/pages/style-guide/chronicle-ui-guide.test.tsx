// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import catalog from "../../../docs/ui-guide/catalog.json";
import ChronicleUiGuidePage from "./chronicle-ui-guide";

afterEach(cleanup);
beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname}{location.search}</output>; }
function open(address = "/style-guide/chronicle-ui-guide") {
  render(<MemoryRouter initialEntries={[address]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/style-guide/chronicle-ui-guide/:pageId?" element={<ChronicleUiGuidePage />} /><Route path="/" element={<p>Admin hub</p>} /></Routes><Location /></MemoryRouter>);
}
function region(title: string) { return within(screen.getByRole("region", { name: title })); }

describe("Chronicle UI Guide page", () => {
  it("stacks every published reference on one page under the Chronicle header, with no region selector", () => {
    open();
    expect(screen.getByRole("heading", { name: "Chronicle UI Guide" })).toBeInTheDocument();
    expect(screen.getAllByRole("region").map(section => within(section).getByRole("heading", { level: 2 }).textContent)).toEqual(catalog.map(guide => guide.title));
    for (const guide of catalog) {
      expect(region(guide.title).getAllByRole("tab")).toHaveLength(7);
      expect(region(guide.title).getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
      expect(region(guide.title).getByRole("tabpanel")).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /Choose UI reference/ })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    const ids = Array.from(document.querySelectorAll("[id]")).map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/?tab=admin");
  });

  it("keeps each region's tabs independent, including keyboard navigation and panel associations", () => {
    open();
    const story = region("Story Builder UI Reference");
    const character = region("Character Builder UI Reference");
    const fields = story.getByRole("tab", { name: "Fields & Controls" });
    fireEvent.click(fields);
    expect(story.getByRole("tabpanel")).toHaveTextContent("Focused invalid field");
    expect(within(story.getByRole("tabpanel")).getAllByRole("img").length).toBeGreaterThan(0);
    expect(story.getByRole("tabpanel").querySelector("details.implementation summary")).not.toBeNull();
    fireEvent.click(character.getByRole("tab", { name: "Composition Examples" }));
    expect(character.getByRole("tabpanel")).toHaveTextContent("New Voice Notes Dialog");
    expect(fields).toHaveAttribute("aria-selected", "true");
    expect(story.getByRole("tabpanel")).toHaveTextContent("Focused invalid field");
    fireEvent.keyDown(fields, { key: "End" });
    expect(story.getByRole("tab", { name: "Composition Examples" })).toHaveFocus();
    expect(story.getByRole("tabpanel")).toHaveTextContent("New Composition: Authoring Note Modal");
    expect(character.getByRole("tab", { name: "Composition Examples" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("location")).toHaveTextContent("/style-guide/chronicle-ui-guide?section=story-builder&tab=mockups");
    fireEvent.keyDown(story.getByRole("tab", { name: "Composition Examples" }), { key: "ArrowRight" });
    expect(story.getByRole("tab", { name: "Overview" })).toHaveFocus();
    for (const tab of screen.getAllByRole("tab", { selected: true })) {
      expect(document.getElementById(tab.getAttribute("aria-controls")!)).toHaveAttribute("aria-labelledby", tab.id);
    }
  });

  it("opens older region addresses on the complete page and restores only the requested region's tab", () => {
    open("/style-guide/chronicle-ui-guide/character-builder?tab=fields");
    expect(screen.getAllByRole("region")).toHaveLength(catalog.length);
    expect(region("Character Builder UI Reference").getByRole("tab", { name: "Fields & Controls" })).toHaveAttribute("aria-selected", "true");
    expect(region("Story Builder UI Reference").getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    cleanup();
    open("/style-guide/chronicle-ui-guide?section=character-builder&tab=colors");
    expect(region("Character Builder UI Reference").getByRole("tab", { name: "Color Palette" })).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the complete guide for unknown regions or tabs", () => {
    open("/style-guide/chronicle-ui-guide/unknown?tab=missing");
    expect(screen.getAllByRole("region")).toHaveLength(catalog.length);
    for (const guide of catalog) expect(region(guide.title).getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  });
});
