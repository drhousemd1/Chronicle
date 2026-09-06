// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoryOpeningScreenPreview } from "./StoryOpeningScreenPreview";

describe("StoryOpeningScreenPreview", () => {
  beforeEach(() => {
    let objectUrlIndex = 0;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => `blob:story-opening-${++objectUrlIndex}`),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("preserves the complete opening-scene control surface without legacy persistence controls", () => {
    render(<StoryOpeningScreenPreview />);

    expect(screen.getByTestId("story-opening-stage")).toHaveAttribute("data-placement", "left");
    expect(screen.getByTestId("story-opening-stage")).toHaveAttribute("data-style", "noir");
    expect(screen.queryByLabelText("Chronicle chat arrival preview")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Presentation placement" }).querySelectorAll("button"))
      .toHaveLength(3);
    expect(screen.getByRole("group", { name: "Visual style" }).querySelectorAll("button"))
      .toHaveLength(8);
    expect(screen.getByRole("group", { name: "Image treatments" }).querySelectorAll("button"))
      .toHaveLength(7);
    expect(screen.getByRole("group", { name: "Transition into chat" }).querySelectorAll("button"))
      .toHaveLength(8);
    expect(screen.queryByRole("button", { name: /save setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear saved setup/i })).not.toBeInTheDocument();
  });

  it("updates copy, placement, style, and stackable image treatments", () => {
    render(<StoryOpeningScreenPreview />);
    const stage = screen.getByTestId("story-opening-stage");

    fireEvent.change(screen.getByLabelText("Opening text"), {
      target: { value: "The city waits below the storm." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lower third" }));
    fireEvent.click(screen.getByRole("button", { name: "Gothic romance" }));
    fireEvent.click(screen.getByRole("button", { name: "Soft dark" }));
    fireEvent.click(screen.getByRole("button", { name: "Warm light" }));

    expect(stage.querySelector(".story-opening-copy__text")).toHaveTextContent(
      "The city waits below the storm.",
    );
    expect(stage).toHaveAttribute("data-placement", "lower");
    expect(stage).toHaveAttribute("data-style", "gothic");
    expect(stage).toHaveAttribute("data-overlays", "soft-dark warm-light");
    expect(stage.querySelectorAll(".story-opening-overlay")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(stage).toHaveAttribute("data-overlays", "");
    expect(stage.querySelectorAll(".story-opening-overlay")).toHaveLength(0);
  });

  it("fits maximum-length copy as static prologue text without a scrollbar", () => {
    render(<StoryOpeningScreenPreview />);
    const maximumCopy = `${"A story opening with deliberate detail. ".repeat(12).slice(0, 359)}X`;

    fireEvent.change(screen.getByLabelText("Opening text"), {
      target: { value: maximumCopy },
    });

    const renderedCopy = screen
      .getByTestId("story-opening-stage")
      .querySelector(".story-opening-copy__text");
    expect(renderedCopy).toHaveTextContent(maximumCopy);
    expect(renderedCopy).toHaveAttribute("data-density", "dense");

    const styles = readFileSync(
      resolve(
        process.cwd(),
        "src/components/admin/research-development/prototypes/story-opening-screen/story-opening-screen.css",
      ),
      "utf8",
    );
    expect(styles).toMatch(/story-opening-copy__title[^}]*font-size:\s*clamp\(13px,\s*3\.2cqw,\s*40px\)/);
    expect(styles).toMatch(/story-opening-copy__text[^}]*overflow:\s*visible/);
    expect(styles).not.toMatch(/story-opening-copy__text[^}]*overflow-y:\s*auto/);
    expect(styles).toMatch(/aspect-ratio:\s*16\s*\/\s*9/);
    expect(styles).not.toMatch(/\.story-opening-frame\s*\{[^}]*min-height/);
  });

  it("preserves authored paragraph breaks in the opening preview", () => {
    render(<StoryOpeningScreenPreview />);
    const formattedCopy = "First paragraph.\n\nSecond paragraph.";

    fireEvent.change(screen.getByLabelText("Opening text"), {
      target: { value: formattedCopy },
    });

    const renderedCopy = screen
      .getByTestId("story-opening-stage")
      .querySelector(".story-opening-copy__text");
    expect(renderedCopy?.textContent).toBe(formattedCopy);
    expect(renderedCopy).toHaveAttribute("data-density", "standard");

    fireEvent.change(screen.getByLabelText("Opening text"), {
      target: { value: "One.\n\nTwo.\n\nThree.\n\nFour." },
    });
    expect(renderedCopy).toHaveAttribute("data-density", "medium");

    const styles = readFileSync(
      resolve(
        process.cwd(),
        "src/components/admin/research-development/prototypes/story-opening-screen/story-opening-screen.css",
      ),
      "utf8",
    );
    expect(styles).toMatch(/story-opening-copy__text[^}]*white-space:\s*pre-wrap/);
  });

  it("keeps placement authoritative over visual-style composition", () => {
    render(<StoryOpeningScreenPreview />);
    const stage = screen.getByTestId("story-opening-stage");

    fireEvent.click(screen.getByRole("button", { name: "Centered" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark academia" }));
    expect(stage).toHaveAttribute("data-placement", "center");
    expect(stage).toHaveAttribute("data-style", "academia");

    fireEvent.click(screen.getByRole("button", { name: "Lower third" }));
    expect(stage).toHaveAttribute("data-placement", "lower");

    const styles = readFileSync(
      resolve(
        process.cwd(),
        "src/components/admin/research-development/prototypes/story-opening-screen/story-opening-screen.css",
      ),
      "utf8",
    );
    expect(styles).toContain('[data-placement="center"] .story-opening-copy');
    expect(styles).toContain('[data-placement="lower"] .story-opening-copy');
  });

  it("accepts an opening image through both selection and drag-and-drop", () => {
    const { unmount } = render(<StoryOpeningScreenPreview />);
    const selectedImage = new File(["image"], "opening-scene.png", { type: "image/png" });

    fireEvent.change(screen.getByLabelText("Opening image file"), {
      target: { files: [selectedImage] },
    });
    expect(screen.getByAltText("Selected opening scene")).toHaveAttribute(
      "src",
      "blob:story-opening-1",
    );
    expect(screen.getByText("opening-scene.png")).toBeInTheDocument();

    const replacement = new File(["replacement"], "replacement.webp", { type: "image/webp" });
    fireEvent.drop(screen.getByText("Replace image").closest("div") as HTMLElement, {
      dataTransfer: { files: [replacement] },
    });
    expect(screen.getByAltText("Selected opening scene")).toHaveAttribute(
      "src",
      "blob:story-opening-2",
    );

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:story-opening-1");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:story-opening-2");
  });

  it("previews optional audio and runs the selected transition into coded chat", async () => {
    vi.useFakeTimers();
    render(<StoryOpeningScreenPreview />);
    const audio = new File(["audio"], "opening-theme.m4a", { type: "audio/mp4" });

    fireEvent.change(screen.getByLabelText("Opening audio file"), {
      target: { files: [audio] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview opening" }));
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Begin" }));
    expect(screen.getByTestId("story-opening-stage")).toHaveAttribute(
      "data-phase",
      "transitioning",
    );
    act(() => vi.advanceTimersByTime(1700));
    expect(screen.getByTestId("story-opening-stage")).toHaveAttribute("data-phase", "chat");
    expect(screen.getByLabelText("Chronicle chat arrival preview")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Begin" })).not.toBeInTheDocument();
  });

  it("renders color-separated polygon plates for the print transition", () => {
    render(<StoryOpeningScreenPreview />);
    fireEvent.click(screen.getByRole("button", { name: "Print-plate disassembly" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));

    expect(document.querySelectorAll(".story-opening-print-plate")).toHaveLength(3);
    const styles = readFileSync(
      resolve(
        process.cwd(),
        "src/components/admin/research-development/prototypes/story-opening-screen/story-opening-screen.css",
      ),
      "utf8",
    );
    expect(styles).toContain("background-blend-mode: color, normal");
    for (const plate of ["cyan", "magenta", "yellow"]) {
      expect(styles).toMatch(
        new RegExp(`story-opening-print-plate--${plate}[^}]*clip-path:\\s*polygon`),
      );
    }
  });

  it("surfaces rejected playback and media decode failures", async () => {
    vi.useFakeTimers();
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error("blocked"));
    render(<StoryOpeningScreenPreview />);
    const audio = new File(["audio"], "opening-theme.m4a", { type: "audio/mp4" });

    fireEvent.change(screen.getByLabelText("Opening audio file"), {
      target: { files: [audio] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview opening" }));
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Opening audio could not be played");

    fireEvent.error(document.querySelector("audio") as HTMLAudioElement);
    expect(screen.getByRole("alert")).toHaveTextContent("Opening audio could not be loaded");
  });

  it("cancels queued audio playback when Begin is selected immediately", () => {
    vi.useFakeTimers();
    render(<StoryOpeningScreenPreview />);
    const audio = new File(["audio"], "opening-theme.m4a", { type: "audio/mp4" });

    fireEvent.change(screen.getByLabelText("Opening audio file"), {
      target: { files: [audio] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview opening" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin" }));
    act(() => vi.advanceTimersByTime(1));

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByTestId("story-opening-stage")).toHaveAttribute(
      "data-phase",
      "transitioning",
    );
  });

  it("rejects media in the wrong field without replacing the current preview", () => {
    render(<StoryOpeningScreenPreview />);
    const wrongFile = new File(["audio"], "opening-theme.m4a", { type: "audio/mp4" });

    fireEvent.change(screen.getByLabelText("Opening image file"), {
      target: { files: [wrongFile] },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an image file for the opening scene.",
    );
    expect(screen.queryByAltText("Selected opening scene")).not.toBeInTheDocument();
  });
});
