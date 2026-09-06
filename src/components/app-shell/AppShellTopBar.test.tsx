// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShellTopBar } from "@/components/app-shell/AppShellTopBar";

describe("AppShellTopBar", () => {
  it("opens the Story Builder settings menu", async () => {
    render(
      <AppShellTopBar
        tab="world"
        builder={{
          activeTab: "world",
          onBack: () => {},
        }}
        storyBuilder={{
          canInteract: true,
          isSaving: false,
          isSavingAndClosing: false,
          isAdminState: true,
          apiUsageTrackingStatusText: "Off",
          isApiUsageTrackingCurrentStory: false,
          isApiUsageToggleBusy: false,
          storyTransferNotice: null,
          onOpenImport: () => {},
          onOpenExport: () => {},
          onFinalizeAndClose: () => {},
          onSaveDraft: () => {},
          onToggleApiUsageTracking: () => {},
        }}
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: /story builder settings/i }), {
      button: 0,
      ctrlKey: false,
    });

    expect(await screen.findByText("Track API Usage")).toBeInTheDocument();
  });

  it("uses the standard Admin back control and the R&D tool title", () => {
    const onBackToHub = vi.fn();
    const onRndAddMockup = vi.fn();
    const onRndRepositorySave = vi.fn();
    render(
      <AppShellTopBar
        tab="admin"
        admin={{
          activeTool: "research_development",
          guideTheme: "dark",
          styleGuideEditsCount: 0,
          rndRepositorySaveState: "idle",
          rndRepositorySaveAvailable: true,
          rndAddMockupAvailable: true,
          onBackToHub,
          onToggleGuideTheme: () => {},
          onGuideSave: () => {},
          onGuideSyncAll: () => {},
          onOpenStyleGuideEdits: () => {},
          onDownloadStyleGuide: () => {},
          onRndAddMockup,
          onRndRepositorySave,
        }}
      />,
    );

    expect(screen.getByText("Research & Development")).toBeInTheDocument();
    const addButton = screen.getByRole("button", { name: "Add New Mock-up" });
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(addButton).toHaveClass("h-10", "rounded-xl", "bg-[#303035]", "px-5");
    expect(saveButton).toHaveClass("h-10", "rounded-xl", "bg-[#303035]", "px-6");
    expect(saveButton).not.toHaveClass("bg-gradient-to-b");
    fireEvent.click(addButton);
    expect(onRndAddMockup).toHaveBeenCalledTimes(1);
    fireEvent.click(saveButton);
    expect(onRndRepositorySave).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBackToHub).toHaveBeenCalledTimes(1);
  });

  it("returns the R&D repository action to Save after a successful write", () => {
    render(
      <AppShellTopBar
        tab="admin"
        admin={{
          activeTool: "research_development",
          guideTheme: "dark",
          styleGuideEditsCount: 0,
          rndRepositorySaveState: "saved",
          rndRepositorySaveAvailable: true,
          rndAddMockupAvailable: true,
          onBackToHub: () => {},
          onToggleGuideTheme: () => {},
          onGuideSave: () => {},
          onGuideSyncAll: () => {},
          onOpenStyleGuideEdits: () => {},
          onDownloadStyleGuide: () => {},
          onRndAddMockup: () => {},
          onRndRepositorySave: () => {},
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saved" })).not.toBeInTheDocument();
  });
});
