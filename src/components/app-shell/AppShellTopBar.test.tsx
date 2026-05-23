// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});
