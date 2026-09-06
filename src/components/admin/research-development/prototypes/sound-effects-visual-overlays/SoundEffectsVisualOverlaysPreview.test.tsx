import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SoundEffectsVisualOverlaysPreview } from "./SoundEffectsVisualOverlaysPreview";
import { soundEffectsVisualOverlaysDocument } from "./sound-effects-visual-overlays-document";

describe("SoundEffectsVisualOverlaysPreview", () => {
  it("renders the preserved first-section mock-up inside the shared R&D preview", () => {
    render(<SoundEffectsVisualOverlaysPreview />);

    const frame = screen.getByTitle("Sound Effects & Visual Overlays interactive mock-up");
    expect(frame).toHaveAttribute("srcdoc", soundEffectsVisualOverlaysDocument);
    expect(frame).toHaveStyle({ height: "960px" });
  });

  it("keeps the complete character-card control and audio contract without the later section", () => {
    const visualControls = [
      "rain-btn",
      "snow-btn",
      "heavy-snow-btn",
      "lightning-btn",
      "sunny-btn",
      "cloudy-btn",
      "night-btn",
      "sunrise-btn",
      "sunset-btn",
      "wind-btn",
      "frost-btn",
      "hot-btn",
      "wet-btn",
      "bleed-btn",
      "freeze-btn",
      "bones-btn",
      "toxic-btn",
      "dead-btn",
      "drown-btn",
      "health-100-btn",
      "health-75-btn",
      "health-50-btn",
      "health-25-btn",
      "health-off-btn",
    ];
    visualControls.forEach((id) => {
      expect(soundEffectsVisualOverlaysDocument).toContain(`id="${id}"`);
    });

    const audioFiles = [
      "rain-without-thunder.wav",
      "fracture.wav",
      "wind-gust.wav",
      "thunder.wav",
      "night-crickets.wav",
      "sunrise-birds.wav",
      "heartbeat-50.wav",
      "heartbeat-25.wav",
      "toxic-cough-male.wav",
      "toxic-cough-female.wav",
      "bleeding.wav",
      "freezing.wav",
      "heavy-snow.wav",
    ];
    audioFiles.forEach((fileName) => {
      expect(soundEffectsVisualOverlaysDocument).toContain(
        `/rnd/sound-effects-visual-overlays/${fileName}`,
      );
    });

    expect(soundEffectsVisualOverlaysDocument).toContain("function toggleExpand()");
    expect(soundEffectsVisualOverlaysDocument).toContain("function toggleRain()");
    expect(soundEffectsVisualOverlaysDocument).toContain("function toggleWet()");
    expect(soundEffectsVisualOverlaysDocument).toContain('grid-template-rows: 378px auto');
    expect(soundEffectsVisualOverlaysDocument).toContain('justify-self: end');
    expect(soundEffectsVisualOverlaysDocument).toContain(
      'data-rnd-ui-pattern="effect-control-panel"',
    );
    expect(soundEffectsVisualOverlaysDocument).toContain(
      'data-rnd-ui-precedent="character-builder-section-chat-settings-controls"',
    );
    expect(soundEffectsVisualOverlaysDocument.match(/class="effects-panel-header"/g)).toHaveLength(1);
    expect(soundEffectsVisualOverlaysDocument).toContain('class="effects-panel-tray"');
    expect(soundEffectsVisualOverlaysDocument).toContain('class="effects-grid"');
    expect(soundEffectsVisualOverlaysDocument).toContain("background: #2a2a2f");
    expect(soundEffectsVisualOverlaysDocument).toContain(
      "linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%)",
    );
    expect(soundEffectsVisualOverlaysDocument).toContain("background: #3b82f6");
    expect(soundEffectsVisualOverlaysDocument).not.toContain("[aria-pressed='false']::after");
    expect(soundEffectsVisualOverlaysDocument).not.toContain("Chat Interface Reference");
    expect(soundEffectsVisualOverlaysDocument).not.toContain("scene-transition-test");
    expect(soundEffectsVisualOverlaysDocument).not.toContain("id=\"chat-rain-audio\"");
  });
});
