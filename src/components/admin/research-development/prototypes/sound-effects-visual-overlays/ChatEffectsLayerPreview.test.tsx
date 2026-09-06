// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChatEffectsLayerPreview } from "./ChatEffectsLayerPreview";

const audioInstances: MockAudio[] = [];

class MockAudio {
  src: string;
  preload = "";
  loop = false;
  volume = 1;
  currentTime = 0;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();

  constructor(src: string) {
    this.src = src;
    audioInstances.push(this);
  }
}

describe("ChatEffectsLayerPreview", () => {
  beforeEach(() => {
    audioInstances.length = 0;
    vi.stubGlobal("Audio", MockAudio);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 900,
      height: 540,
      top: 0,
      right: 900,
      bottom: 540,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a code-built chat shell with the effect layer between the scene and transcript", () => {
    const { container } = render(<ChatEffectsLayerPreview />);

    expect(screen.getByTestId("coded-chat-shell")).toBeInTheDocument();
    expect(screen.getByText(/Exit Scenario/)).toBeInTheDocument();
    expect(screen.getByText("Chat Settings")).toBeInTheDocument();
    expect(screen.getByText("Describe your action or dialogue...")).toBeInTheDocument();
    expect(screen.getByTestId("coded-chat-stage")).toHaveStyle({
      width: "1536px",
      height: "1152px",
      transformOrigin: "top left",
    });
    expect(screen.getAllByTestId("chat-transcript-bubble")).toHaveLength(1);
    expect(screen.getAllByTestId("chat-speaker-segment")).toHaveLength(2);
    const transcriptBubble = screen.getByTestId("chat-transcript-bubble");
    expect(transcriptBubble.parentElement).toHaveClass("w-full", "max-w-4xl", "mx-auto");
    expect(transcriptBubble).toHaveClass(
      "p-8",
      "pt-14",
      "pb-12",
      "rounded-[2rem]",
    );
    expect(container.querySelector('[data-rnd-ui-pattern="effect-control-panel"]')).toHaveAttribute(
      "data-rnd-ui-precedent",
      "character-builder-section-chat-settings-controls",
    );
    expect(container.querySelectorAll('[data-rnd-ui-role="section-header"]')).toHaveLength(1);
    expect(container.querySelector('img[src*="chat-reference-left-rail"]')).not.toBeInTheDocument();
    expect(container.querySelector('img[src*="chat-reference-composer"]')).not.toBeInTheDocument();

    const scene = container.querySelector('[data-layer="scene"]');
    const effects = container.querySelector('[data-layer="effects"]');
    const transcript = container.querySelector('[data-layer="transcript"]');
    const composer = container.querySelector('[data-layer="composer"]');
    expect(scene).toBeInTheDocument();
    expect(scene).toHaveAttribute(
      "src",
      "/rnd/sound-effects-visual-overlays/chat-reference-bedroom-clean.png",
    );
    expect(container.querySelector('[data-layer="rain-video"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="light-rain-video"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="heavy-snow-video"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="bleeding-video"]')).toBeInTheDocument();
    expect(container.querySelector('[data-layer="bleeding-video-keyed"]')).toBeInTheDocument();
    expect(effects).toBeInTheDocument();
    expect(transcript).toBeInTheDocument();
    expect(composer).toBeInTheDocument();
    expect(scene!.compareDocumentPosition(effects!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(effects!.compareDocumentPosition(transcript!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(effects!.parentElement).not.toContainElement(composer as HTMLElement);
  });

  it("adds a silent generated-rain comparison directly below the original Rain control", () => {
    const { container } = render(<ChatEffectsLayerPreview />);
    const originalRain = container.querySelector('[data-chat-effect="rain"]') as HTMLButtonElement;
    const videoRain = screen.getByRole("button", { name: "Toggle video rain" }) as HTMLButtonElement;
    const videoRainAudio = screen.getByRole("button", { name: "Enable chat video rain audio" });
    const weatherGroup = originalRain.closest('[data-rnd-ui-role="control-group"]')!;
    const weatherButtons = [...weatherGroup.querySelectorAll("button")];
    const video = container.querySelector('[data-layer="rain-video"]') as HTMLVideoElement;

    expect(weatherButtons.indexOf(videoRain)).toBeGreaterThan(weatherButtons.indexOf(originalRain));
    expect(video).toHaveAttribute(
      "src",
      "/rnd/sound-effects-visual-overlays/rain-seedance-video.mp4",
    );
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);

    fireEvent.click(videoRainAudio);
    expect(videoRainAudio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(videoRain);
    expect(videoRain).toHaveAttribute("aria-pressed", "true");
    expect(video).toHaveClass("opacity-100");
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    const videoRainMedia = audioInstances.find((audio) =>
      audio.src.endsWith("rain-without-thunder.wav"),
    );
    expect(videoRainMedia).toBeDefined();
    expect(videoRainMedia!.loop).toBe(true);
    expect(videoRainMedia!.play).toHaveBeenCalledOnce();

    fireEvent.click(videoRain);
    expect(videoRain).toHaveAttribute("aria-pressed", "false");
    expect(video).not.toHaveClass("opacity-100");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("adds the accelerated light-rain plate below Rain while preserving the original rain options", () => {
    const { container } = render(<ChatEffectsLayerPreview />);
    const originalRain = container.querySelector('[data-chat-effect="rain"]') as HTMLButtonElement;
    const videoRain = screen.getByRole("button", { name: "Toggle video rain" }) as HTMLButtonElement;
    const lightRainVideo = screen.getByRole("button", { name: "Toggle light rain video" }) as HTMLButtonElement;
    const lightRainAudio = screen.getByRole("button", { name: "Enable chat light rain video audio" });
    const lightSnow = container.querySelector('[data-chat-effect="light-snow"]') as HTMLButtonElement;
    const weatherGroup = originalRain.closest('[data-rnd-ui-role="control-group"]')!;
    const weatherButtons = [...weatherGroup.querySelectorAll("button")];
    const video = container.querySelector('[data-layer="light-rain-video"]') as HTMLVideoElement;

    expect(weatherButtons.indexOf(originalRain)).toBeLessThan(weatherButtons.indexOf(videoRain));
    expect(weatherButtons.indexOf(videoRain)).toBeLessThan(weatherButtons.indexOf(lightRainVideo));
    expect(weatherButtons.indexOf(lightRainVideo)).toBeLessThan(weatherButtons.indexOf(lightSnow));
    expect(video).toHaveAttribute(
      "src",
      "/rnd/sound-effects-visual-overlays/light-rain-attempt-2.m4v",
    );
    expect(video).toHaveClass("mix-blend-screen");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);

    fireEvent.click(lightRainAudio);
    expect(lightRainAudio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(lightRainVideo);
    expect(lightRainVideo).toHaveAttribute("aria-pressed", "true");
    expect(video).toHaveClass("opacity-100");
    expect(video.playbackRate).toBe(3);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    const lightRainMedia = audioInstances.find((audio) =>
      audio.src.endsWith("rain-without-thunder.wav"),
    );
    expect(lightRainMedia).toBeDefined();
    expect(lightRainMedia!.loop).toBe(true);
    expect(lightRainMedia!.play).toHaveBeenCalledOnce();

    fireEvent.click(lightRainVideo);
    expect(lightRainVideo).toHaveAttribute("aria-pressed", "false");
    expect(video).not.toHaveClass("opacity-100");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("adds the generated heavy-snow plate directly below the original Heavy Snow control", () => {
    const { container } = render(<ChatEffectsLayerPreview />);
    const originalHeavySnow = container.querySelector('[data-chat-effect="heavy-snow"]') as HTMLButtonElement;
    const heavySnowVideo = screen.getByRole("button", { name: "Toggle heavy snow video" }) as HTMLButtonElement;
    const heavySnowAudio = screen.getByRole("button", { name: "Enable chat heavy snow video audio" });
    const lightning = container.querySelector('[data-chat-effect="lightning"]') as HTMLButtonElement;
    const weatherGroup = originalHeavySnow.closest('[data-rnd-ui-role="control-group"]')!;
    const weatherButtons = [...weatherGroup.querySelectorAll("button")];
    const video = container.querySelector('[data-layer="heavy-snow-video"]') as HTMLVideoElement;

    expect(weatherButtons.indexOf(originalHeavySnow)).toBeLessThan(weatherButtons.indexOf(heavySnowVideo));
    expect(weatherButtons.indexOf(heavySnowVideo)).toBeLessThan(weatherButtons.indexOf(lightning));
    expect(video).toHaveAttribute(
      "src",
      "/rnd/sound-effects-visual-overlays/heavy-snow-seedance-video.m4v",
    );
    expect(video).toHaveClass("mix-blend-screen");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);

    fireEvent.click(heavySnowAudio);
    expect(heavySnowAudio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(heavySnowVideo);
    expect(heavySnowVideo).toHaveAttribute("aria-pressed", "true");
    expect(video).toHaveClass("opacity-100");
    expect(video.playbackRate).toBe(1);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    const heavySnowMedia = audioInstances.find((audio) =>
      audio.src.endsWith("heavy-snow.wav"),
    );
    expect(heavySnowMedia).toBeDefined();
    expect(heavySnowMedia!.loop).toBe(false);
    expect(heavySnowMedia!.play).toHaveBeenCalledOnce();

    fireEvent.click(heavySnowVideo);
    expect(heavySnowVideo).toHaveAttribute("aria-pressed", "false");
    expect(video).not.toHaveClass("opacity-100");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("adds the generated bleeding plate directly below the original Bleeding control", () => {
    const { container } = render(<ChatEffectsLayerPreview />);
    const originalBleeding = container.querySelector('[data-chat-effect="bleeding"]') as HTMLButtonElement;
    const bleedingVideo = screen.getByRole("button", { name: "Toggle bleeding video" }) as HTMLButtonElement;
    const bleedingAudio = screen.getByRole("button", { name: "Enable chat bleeding video audio" });
    const freezing = container.querySelector('[data-chat-effect="freezing"]') as HTMLButtonElement;
    const conditionGroup = originalBleeding.closest('[data-rnd-ui-role="control-group"]')!;
    const conditionButtons = [...conditionGroup.querySelectorAll("button")];
    const video = container.querySelector('[data-layer="bleeding-video"]') as HTMLVideoElement;
    const keyedCanvas = container.querySelector('[data-layer="bleeding-video-keyed"]') as HTMLCanvasElement;

    expect(conditionButtons.indexOf(originalBleeding)).toBeLessThan(conditionButtons.indexOf(bleedingVideo));
    expect(conditionButtons.indexOf(bleedingVideo)).toBeLessThan(conditionButtons.indexOf(freezing));
    expect(video).toHaveAttribute(
      "src",
      "/rnd/sound-effects-visual-overlays/bleeding-seedance-video.m4v",
    );
    expect(video).not.toHaveClass("mix-blend-screen", "mix-blend-lighten");
    expect(keyedCanvas).not.toHaveClass("mix-blend-screen", "mix-blend-lighten");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);

    fireEvent.click(bleedingAudio);
    expect(bleedingAudio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(bleedingVideo);
    expect(bleedingVideo).toHaveAttribute("aria-pressed", "true");
    expect(keyedCanvas).toHaveClass("opacity-100");
    expect(video.playbackRate).toBe(1);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    const bleedingMedia = audioInstances.find((audio) =>
      audio.src.endsWith("bleeding.wav"),
    );
    expect(bleedingMedia).toBeDefined();
    expect(bleedingMedia!.loop).toBe(false);
    expect(bleedingMedia!.play).toHaveBeenCalledOnce();

    fireEvent.click(bleedingVideo);
    expect(bleedingVideo).toHaveAttribute("aria-pressed", "false");
    expect(keyedCanvas).not.toHaveClass("opacity-100");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("preserves every mapped visual and audio control from the legacy chat experiment", () => {
    const { container } = render(<ChatEffectsLayerPreview />);

    expect(new Set(
      [...container.querySelectorAll("[data-chat-effect]")].map((control) =>
        control.getAttribute("data-chat-effect"),
      ),
    )).toEqual(new Set([
      "rain",
      "light-snow",
      "heavy-snow",
      "lightning",
      "sunny",
      "cloudy",
      "night",
      "sunrise",
      "sunset",
      "windy",
      "cold",
      "hot",
      "wet",
      "bleeding",
      "freezing",
      "fractures",
      "toxic",
      "drowning",
    ]));
    expect(container.querySelectorAll("[data-chat-audio]")).toHaveLength(9);
    expect(container.querySelectorAll("[data-chat-toxic-cough]")).toHaveLength(2);
    expect(container.querySelectorAll('[data-rnd-ui-pattern="effect-control-panel"]')).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^Dead/ })).toBeDisabled();
    expect(screen.getByText("Not yet mapped")).toBeInTheDocument();

    const rain = container.querySelector('[data-chat-effect="rain"]') as HTMLButtonElement;
    const rainAudio = screen.getByRole("button", { name: "Enable chat rain audio" });
    fireEvent.click(rainAudio);
    expect(rainAudio).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(rain);
    expect(rain).toHaveAttribute("aria-pressed", "true");

    const toxic = container.querySelector('[data-chat-effect="toxic"]') as HTMLButtonElement;
    const maleCough = screen.getByRole("button", { name: "Select male cough for chat Toxic" });
    fireEvent.click(maleCough);
    expect(maleCough).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toxic);
    expect(toxic).toHaveAttribute("aria-pressed", "true");
  });

  it("uses the preserved audio mapping and releases created media on unmount", () => {
    const { container, unmount } = render(<ChatEffectsLayerPreview />);
    const rain = container.querySelector('[data-chat-effect="rain"]') as HTMLButtonElement;
    const rainAudio = screen.getByRole("button", { name: "Enable chat rain audio" });

    fireEvent.click(rainAudio);
    fireEvent.click(rain);

    const rainMedia = audioInstances.find((audio) => audio.src.endsWith("rain-without-thunder.wav"));
    expect(rainMedia).toBeDefined();
    expect(rainMedia!.loop).toBe(true);
    expect(rainMedia!.play).toHaveBeenCalledOnce();

    const heavySnow = container.querySelector('[data-chat-effect="heavy-snow"]') as HTMLButtonElement;
    fireEvent.click(screen.getByRole("button", { name: "Enable chat heavy snow audio" }));
    fireEvent.click(heavySnow);
    const heavySnowMedia = audioInstances.find((audio) => audio.src.endsWith("heavy-snow.wav"));
    expect(heavySnowMedia).toBeDefined();
    expect(heavySnowMedia!.loop).toBe(false);
    expect(heavySnowMedia!.play).toHaveBeenCalledOnce();

    unmount();
    expect(rainMedia!.pause).toHaveBeenCalled();
    expect(rainMedia!.src).toBe("");
    expect(heavySnowMedia!.pause).toHaveBeenCalled();
    expect(heavySnowMedia!.src).toBe("");
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("switches the active Toxic cough voice without leaving the previous clip playing", () => {
    const { container } = render(<ChatEffectsLayerPreview />);
    const toxic = container.querySelector('[data-chat-effect="toxic"]') as HTMLButtonElement;
    fireEvent.click(toxic);

    const male = screen.getByRole("button", { name: "Select male cough for chat Toxic" });
    fireEvent.click(male);
    const maleMedia = audioInstances.find((audio) => audio.src.endsWith("toxic-cough-male.wav"));
    expect(maleMedia!.play).toHaveBeenCalledOnce();

    const female = screen.getByRole("button", { name: "Select female cough for chat Toxic" });
    fireEvent.click(female);
    const femaleMedia = audioInstances.find((audio) => audio.src.endsWith("toxic-cough-female.wav"));
    expect(maleMedia!.pause).toHaveBeenCalled();
    expect(femaleMedia!.play).toHaveBeenCalledOnce();
    expect(male).toHaveAttribute("aria-pressed", "false");
    expect(female).toHaveAttribute("aria-pressed", "true");
  });
});
