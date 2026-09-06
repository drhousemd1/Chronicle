// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createChatEffectsCanvasRuntime,
  type ChatEffectId,
} from "./chat-effects-canvas";

const ALL_EFFECTS: readonly ChatEffectId[] = [
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
];

function createContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    shadowColor: "",
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe("chat effects canvas runtime", () => {
  let callbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;
  let context: CanvasRenderingContext2D;
  let resizeObserver: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    callbacks = new Map();
    nextFrameId = 1;
    context = createContext();
    resizeObserver = { observe: vi.fn(), disconnect: vi.fn() };

    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      const id = nextFrameId;
      nextFrameId += 1;
      callbacks.set(id, callback);
      return id;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      callbacks.delete(id);
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
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
    vi.stubGlobal("ResizeObserver", class {
      observe = resizeObserver.observe;
      disconnect = resizeObserver.disconnect;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function runNextFrame(now = 1000) {
    const next = callbacks.entries().next().value as [number, FrameRequestCallback] | undefined;
    expect(next).toBeDefined();
    callbacks.delete(next![0]);
    next![1](now);
  }

  it("executes every preserved visual effect path and keeps the composer-independent runtime alive", () => {
    const canvas = document.createElement("canvas");
    const effects = new Set<ChatEffectId>(ALL_EFFECTS);
    const runtime = createChatEffectsCanvasRuntime(canvas, () => effects);

    runtime.refresh();
    expect(() => runNextFrame()).not.toThrow();
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.arc).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.createRadialGradient).toHaveBeenCalled();
    expect(context.save).toHaveBeenCalled();

    runtime.destroy();
    expect(resizeObserver.disconnect).toHaveBeenCalledOnce();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not recreate an existing particle pool when a second effect changes", () => {
    const canvas = document.createElement("canvas");
    const effects = new Set<ChatEffectId>(["rain"]);
    const runtime = createChatEffectsCanvasRuntime(canvas, () => effects);

    runtime.refresh();
    runNextFrame();
    const firstDropEnd = vi.mocked(context.lineTo).mock.calls[0];

    vi.mocked(context.lineTo).mockClear();
    effects.add("cold");
    runtime.refresh("cold");
    runNextFrame(1017);
    const secondDropEnd = vi.mocked(context.lineTo).mock.calls[0];

    expect(secondDropEnd).not.toEqual(firstDropEnd);
    expect(secondDropEnd[0]).toBeLessThan(firstDropEnd[0]);
    expect(secondDropEnd[1]).toBeGreaterThan(firstDropEnd[1]);

    runtime.destroy();
  });
});
