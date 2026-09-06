export type ChatEffectId =
  | "rain"
  | "light-snow"
  | "heavy-snow"
  | "lightning"
  | "sunny"
  | "cloudy"
  | "night"
  | "sunrise"
  | "sunset"
  | "windy"
  | "cold"
  | "hot"
  | "wet"
  | "bleeding"
  | "freezing"
  | "fractures"
  | "toxic"
  | "drowning";

type Particle = Record<string, number>;

export interface ChatEffectsCanvasRuntime {
  refresh: (changedEffect?: ChatEffectId) => void;
  destroy: () => void;
}

export function createChatEffectsCanvasRuntime(
  canvas: HTMLCanvasElement,
  getActiveEffects: () => ReadonlySet<ChatEffectId>,
): ChatEffectsCanvasRuntime {
  const maybeContext = canvas.getContext("2d");
  if (!maybeContext) {
    return { refresh: () => {}, destroy: () => {} };
  }
  const context: CanvasRenderingContext2D = maybeContext;

  const pools = new Map<string, Particle[]>();
  const effectState = new Map<string, unknown>();
  let frameId: number | null = null;
  let elapsedFrames = 0;
  let destroyed = false;
  let knownEffects = new Set<ChatEffectId>();

  function bounds() {
    const rect = canvas.getBoundingClientRect();
    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height),
    };
  }

  function resizeCanvas() {
    const { width, height } = bounds();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    pools.clear();
    effectState.clear();
  }

  function pool(name: string, count: number, factory: () => Particle) {
    const current = pools.get(name);
    if (current?.length === count) return current;
    const created = Array.from({ length: count }, factory);
    pools.set(name, created);
    return created;
  }

  function state<T>(name: string, factory: () => T): T {
    const current = effectState.get(name);
    if (current !== undefined) return current as T;
    const created = factory();
    effectState.set(name, created);
    return created;
  }

  function fillWash(width: number, height: number, color: string) {
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
  }

  function edgeGradient(
    width: number,
    height: number,
    side: "top" | "bottom" | "left" | "right",
    color: string,
    reach = 0.34,
  ) {
    let gradient: CanvasGradient;
    if (side === "top") gradient = context.createLinearGradient(0, 0, 0, height * reach);
    else if (side === "bottom") gradient = context.createLinearGradient(0, height, 0, height * (1 - reach));
    else if (side === "left") gradient = context.createLinearGradient(0, 0, width * reach, 0);
    else gradient = context.createLinearGradient(width, 0, width * (1 - reach), 0);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color.replace(/,\s*[\d.]+\)$/, ", 0)"));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function cornerGlow(
    width: number,
    height: number,
    x: number,
    y: number,
    radius: number,
    inner: string,
    outer: string,
  ) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawRain(width: number, height: number) {
    pool("rain", Math.max(120, Math.round(width / 7)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 8 + Math.random() * 8,
      length: 10 + Math.random() * 16,
      alpha: 0.2 + Math.random() * 0.44,
      lineWidth: 0.4 + Math.random() * 0.8,
    })).forEach((drop) => {
      context.beginPath();
      context.moveTo(drop.x, drop.y);
      context.lineTo(drop.x - 3, drop.y + drop.length);
      context.strokeStyle = `rgba(174, 214, 241, ${drop.alpha})`;
      context.lineWidth = drop.lineWidth;
      context.stroke();
      drop.x -= 1.4;
      drop.y += drop.speed;
      if (drop.y > height + 24 || drop.x < -24) {
        drop.x = Math.random() * width;
        drop.y = -24;
      }
    });
  }

  function drawSnow(width: number, height: number, heavy: boolean) {
    const key = heavy ? "heavy-snow" : "light-snow";
    pool(key, heavy ? 180 : 85, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: (heavy ? 3 : 0.4) + Math.random() * (heavy ? 4 : 1.2),
      radius: (heavy ? 1.5 : 0.8) + Math.random() * (heavy ? 3.3 : 2.2),
      drift: -0.6 + Math.random() * 1.2,
      alpha: 0.36 + Math.random() * 0.54,
    })).forEach((flake) => {
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
      context.fill();
      flake.x += flake.drift + Math.sin((elapsedFrames + flake.y) * (heavy ? 0.008 : 0.015)) * (heavy ? 0.15 : 0.4);
      flake.y += flake.speed;
      if (flake.y > height + 12) {
        flake.x = Math.random() * width;
        flake.y = -12;
      }
    });
  }

  function drawLightning(width: number, height: number, now: number) {
    const flash = state("lightning", () => ({
      next: now + 500 + Math.random() * 1500,
      remaining: 0,
      alpha: 0,
    }));
    if (now >= flash.next) {
      if (flash.remaining === 0) flash.remaining = 1 + Math.floor(Math.random() * 4);
      flash.alpha = (0.1 + Math.random() * 0.15) * (0.55 + Math.random() * 0.45);
      flash.remaining -= 1;
      flash.next = now + (flash.remaining > 0
        ? 40 + Math.random() * 140
        : 2000 + Math.random() * 5000);
    }
    if (flash.alpha > 0.004) {
      fillWash(width, height, `rgba(238, 245, 255, ${flash.alpha})`);
      flash.alpha *= 0.72;
    }
  }

  function drawWind(width: number, height: number) {
    const gustCycle = state("windy-cycle", () => ({
      strength: 0,
      target: 1,
      hold: 90 + Math.random() * 100,
    }));
    gustCycle.hold -= 1;
    if (gustCycle.hold <= 0) {
      gustCycle.target = gustCycle.target > 0.5 ? 0.12 : 1;
      gustCycle.hold = gustCycle.target > 0.5
        ? 80 + Math.random() * 120
        : 45 + Math.random() * 80;
    }
    gustCycle.strength += (gustCycle.target - gustCycle.strength) * 0.018;
    pool("windy", 25, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 5 + Math.random() * 8,
      length: 45 + Math.random() * 110,
      alpha: 0.1 + Math.random() * 0.28,
      curve: (Math.random() - 0.5) * 16,
    })).forEach((gust) => {
      context.beginPath();
      context.moveTo(gust.x, gust.y);
      context.quadraticCurveTo(gust.x + gust.length * 0.52, gust.y + gust.curve, gust.x + gust.length, gust.y - 2);
      const line = context.createLinearGradient(gust.x, 0, gust.x + gust.length, 0);
      line.addColorStop(0, "rgba(225, 236, 245, 0)");
      line.addColorStop(0.45, `rgba(225, 236, 245, ${gust.alpha * gustCycle.strength})`);
      line.addColorStop(1, "rgba(225, 236, 245, 0)");
      context.strokeStyle = line;
      context.lineWidth = 0.7 + gustCycle.strength;
      context.stroke();
      gust.x += gust.speed * (0.55 + gustCycle.strength * 1.7);
      if (gust.x > width + gust.length) {
        gust.x = -gust.length;
        gust.y = Math.random() * height;
      }
    });
    pool("windy-dust", 25, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 1.8,
      speed: 1 + Math.random() * 3,
      alpha: 0.12 + Math.random() * 0.25,
    })).forEach((dust) => {
      dust.x += dust.speed * (0.7 + gustCycle.strength * 2.4);
      dust.y += Math.sin(elapsedFrames * 0.025 + dust.x * 0.01) * 0.35;
      if (dust.x > width + 5) {
        dust.x = -5;
        dust.y = Math.random() * height;
      }
      context.beginPath();
      context.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(216, 203, 169, ${dust.alpha * gustCycle.strength})`;
      context.fill();
    });
  }

  function drawBleeding(width: number, height: number) {
    const wash = context.createLinearGradient(0, 0, 0, height * 0.22);
    wash.addColorStop(0, "rgba(105, 0, 10, 0.76)");
    wash.addColorStop(0.18, "rgba(125, 2, 15, 0.50)");
    wash.addColorStop(1, "rgba(80, 0, 8, 0)");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height * 0.24);
    edgeGradient(width, height, "left", "rgba(105, 0, 12, 0.48)", 0.26);
    edgeGradient(width, height, "right", "rgba(105, 0, 12, 0.48)", 0.26);
    edgeGradient(width, height, "bottom", "rgba(85, 0, 8, 0.34)", 0.22);
    cornerGlow(width, height, 0, 0, height * 0.55, "rgba(130, 0, 15, 0.52)", "rgba(80, 0, 10, 0)");
    cornerGlow(width, height, width, 0, height * 0.55, "rgba(130, 0, 15, 0.52)", "rgba(80, 0, 10, 0)");
    pool("bleeding", Math.max(30, Math.round(width / 27)), () => ({
      x: Math.random() < 0.72
        ? (Math.random() < 0.5 ? Math.random() * width * 0.28 : width * (0.72 + Math.random() * 0.28))
        : Math.random() * width,
      length: 0,
      target: height * (0.1 + Math.random() * 0.75),
      speed: 0.35 + Math.random() * 1.15,
      width: 1.5 + Math.random() * 3,
      alpha: 0.42 + Math.random() * 0.38,
      red: 105 + Math.floor(Math.random() * 45),
      lean: (Math.random() - 0.5) * 0.06,
    })).forEach((drop) => {
      drop.length = Math.min(drop.target, drop.length + drop.speed);
      const gradient = context.createLinearGradient(drop.x, 0, drop.x, drop.length);
      gradient.addColorStop(0, `rgba(${drop.red}, 0, 13, ${drop.alpha})`);
      gradient.addColorStop(0.72, `rgba(${drop.red - 18}, 0, 10, ${drop.alpha * 0.88})`);
      gradient.addColorStop(1, `rgba(${drop.red - 30}, 0, 8, ${drop.alpha * 0.32})`);
      context.beginPath();
      context.moveTo(drop.x, 0);
      context.quadraticCurveTo(
        drop.x + drop.length * drop.lean,
        drop.length * 0.55,
        drop.x + drop.length * drop.lean * 0.5,
        drop.length,
      );
      context.strokeStyle = gradient;
      context.lineWidth = drop.width;
      context.lineCap = "round";
      context.stroke();
      context.beginPath();
      context.arc(
        drop.x + drop.length * drop.lean * 0.5,
        drop.length,
        drop.width * 0.85,
        0,
        Math.PI * 2,
      );
      context.fillStyle = `rgba(${drop.red - 15}, 0, 10, ${drop.alpha})`;
      context.fill();
    });
    context.lineCap = "butt";
  }

  function drawToxic(width: number, height: number) {
    edgeGradient(width, height, "top", "rgba(95, 170, 45, 0.20)", 0.3);
    edgeGradient(width, height, "bottom", "rgba(45, 110, 30, 0.25)", 0.32);
    edgeGradient(width, height, "left", "rgba(78, 145, 38, 0.22)", 0.24);
    edgeGradient(width, height, "right", "rgba(78, 145, 38, 0.22)", 0.24);
    pool("toxic", Math.max(30, Math.round(width / 32)), () => {
      const side = Math.floor(Math.random() * 4);
      return {
      x: side === 2
        ? Math.random() * width * 0.18
        : side === 3
          ? width * (0.82 + Math.random() * 0.18)
          : Math.random() * width,
      y: side === 0
        ? Math.random() * height * 0.22
        : side === 1
          ? height * (0.78 + Math.random() * 0.22)
          : Math.random() * height,
      radius: 28 + Math.random() * 76,
      phase: Math.random() * Math.PI * 2,
      hue: 82 + Math.random() * 30,
    };}).forEach((puff) => {
      const radius = puff.radius * (0.82 + Math.sin(elapsedFrames * 0.018 + puff.phase) * 0.18);
      const glow = context.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, radius);
      glow.addColorStop(0, `hsla(${puff.hue}, 72%, 58%, 0.22)`);
      glow.addColorStop(0.42, `hsla(${puff.hue - 8}, 62%, 42%, 0.14)`);
      glow.addColorStop(1, `hsla(${puff.hue - 15}, 55%, 30%, 0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(puff.x, puff.y, radius, 0, Math.PI * 2);
      context.fill();
      puff.x += Math.sin(elapsedFrames * 0.012 + puff.phase) * 0.12;
      puff.y -= 0.035;
    });
  }

  function drawDrowning(width: number, height: number) {
    const water = context.createLinearGradient(0, 0, 0, height);
    water.addColorStop(0, "rgba(35, 130, 170, 0.20)");
    water.addColorStop(0.45, "rgba(12, 80, 125, 0.28)");
    water.addColorStop(1, "rgba(2, 35, 75, 0.55)");
    context.fillStyle = water;
    context.fillRect(0, 0, width, height);
    const surface = context.createLinearGradient(0, 0, 0, height * 0.24);
    surface.addColorStop(0, `rgba(155, 225, 242, ${0.16 + Math.sin(elapsedFrames * 0.018) * 0.035})`);
    surface.addColorStop(1, "rgba(80, 175, 210, 0)");
    context.fillStyle = surface;
    context.fillRect(0, 0, width, height * 0.28);

    const beams = state("drowning-beams", () => Array.from({ length: 4 }, (_, index) => ({
      x: width * (0.12 + index * 0.25),
      sway: 24 + Math.random() * 55,
      phase: Math.random() * Math.PI * 2,
      width: 75 + Math.random() * 130,
    })));
    beams.forEach((beam) => {
      const x = beam.x + Math.sin(elapsedFrames * 0.006 + beam.phase) * beam.sway;
      const ray = context.createLinearGradient(x, 0, x + beam.width * 0.35, height);
      ray.addColorStop(0, "rgba(170, 235, 246, 0.20)");
      ray.addColorStop(1, "rgba(40, 135, 180, 0)");
      context.fillStyle = ray;
      context.beginPath();
      context.moveTo(x - beam.width * 0.28, 0);
      context.lineTo(x + beam.width * 0.28, 0);
      context.lineTo(x + beam.width, height);
      context.lineTo(x - beam.width * 0.3, height);
      context.closePath();
      context.fill();
    });

    pool("drowning-particles", 55, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.4 + Math.random() * 1.4,
      alpha: 0.08 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    })).forEach((particle) => {
      particle.y -= 0.08 + particle.radius * 0.04;
      particle.x += Math.sin(elapsedFrames * 0.01 + particle.phase) * 0.08;
      if (particle.y < -3) {
        particle.y = height + 3;
        particle.x = Math.random() * width;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(205, 242, 250, ${particle.alpha})`;
      context.fill();
    });

    pool("drowning", Math.max(18, Math.round(width / 55)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 6,
      speed: 0.35 + Math.random() * 1.1,
      alpha: 0.18 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
    })).forEach((bubble) => {
      context.beginPath();
      context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      context.strokeStyle = `rgba(210, 240, 255, ${bubble.alpha})`;
      context.lineWidth = 1.1;
      context.stroke();
      context.beginPath();
      context.arc(
        bubble.x - bubble.radius * 0.3,
        bubble.y - bubble.radius * 0.35,
        Math.max(0.6, bubble.radius * 0.18),
        0,
        Math.PI * 2,
      );
      context.fillStyle = `rgba(245, 255, 255, ${bubble.alpha * 0.8})`;
      context.fill();
      bubble.y -= bubble.speed;
      bubble.x += Math.sin(elapsedFrames * 0.025 + bubble.phase) * 0.18;
      if (bubble.y < -10) bubble.y = height + 10;
    });
  }

  function drawCloudy(width: number, height: number) {
    fillWash(width, height, "rgba(70, 76, 88, 0.24)");
    const fog = state("cloudy", () => {
      const layers = [
        { count: 5, speed: 0.035, alpha: 0.10, rx: [150, 260], ry: [45, 75], light: 125 },
        { count: 5, speed: 0.10, alpha: 0.25, rx: [115, 210], ry: [35, 62], light: 160 },
        { count: 4, speed: 0.22, alpha: 0.42, rx: [85, 165], ry: [28, 50], light: 190 },
      ];
      return layers.flatMap((layer, layerIndex) => Array.from({ length: layer.count }, (_, index) => ({
        x: ((index * 0.618 + layerIndex * 0.33) % 1) * (width + 360) - 180,
        y: height * (0.08 + ((index + layerIndex * 0.37) / layer.count) * 0.84),
        rx: layer.rx[0] + Math.random() * (layer.rx[1] - layer.rx[0]),
        ry: layer.ry[0] + Math.random() * (layer.ry[1] - layer.ry[0]),
        speed: layer.speed * (0.75 + Math.random() * 0.5),
        alpha: layer.alpha * (0.75 + Math.random() * 0.5),
        light: layer.light + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
      })));
    });
    fog.forEach((bank) => {
      bank.x += bank.speed;
      if (bank.x - bank.rx > width) bank.x = -bank.rx;
      const y = bank.y + Math.sin(elapsedFrames * 0.004 + bank.phase) * 13;
      context.save();
      context.translate(bank.x, y);
      context.scale(bank.rx / bank.ry, 1);
      const cloud = context.createRadialGradient(0, 0, 0, 0, 0, bank.ry);
      const channel = Math.round(bank.light);
      cloud.addColorStop(0, `rgba(${channel}, ${channel + 3}, ${channel + 8}, ${bank.alpha})`);
      cloud.addColorStop(0.42, `rgba(${channel - 6}, ${channel}, ${channel + 4}, ${bank.alpha * 0.62})`);
      cloud.addColorStop(1, `rgba(${channel - 20}, ${channel - 15}, ${channel - 10}, 0)`);
      context.fillStyle = cloud;
      context.beginPath();
      context.arc(0, 0, bank.ry, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });
  }

  function drawSunny(width: number, height: number) {
    const sun = state("sunny", () => ({
      rays: Array.from({ length: 5 }, (_, index) => ({
        angle: Math.PI / 6 + index * Math.PI / 14 + (Math.random() - 0.5) * 0.08,
        width: 42 + Math.random() * 70,
        alpha: 0.04 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      })),
    }));
    cornerGlow(width, height, 0, 0, width * 0.72, "rgba(255, 232, 160, 0.18)", "rgba(255, 190, 65, 0)");
    sun.rays.forEach((ray) => {
      const alpha = ray.alpha * (0.72 + Math.sin(elapsedFrames * 0.004 + ray.phase) * 0.28);
      const length = Math.hypot(width, height);
      context.save();
      context.rotate(ray.angle);
      const gradient = context.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, `rgba(255, 235, 165, ${alpha * 1.5})`);
      gradient.addColorStop(0.35, `rgba(255, 220, 125, ${alpha})`);
      gradient.addColorStop(1, "rgba(255, 205, 95, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, -ray.width / 2, length, ray.width);
      context.restore();
    });
    pool("sunny-motes", Math.max(25, Math.round(width / 42)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -0.1 - Math.random() * 0.2,
      alpha: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    })).forEach((mote) => {
      mote.x += mote.dx;
      mote.y += mote.dy;
      if (mote.y < -4) {
        mote.y = height + 4;
        mote.x = Math.random() * width;
      }
      const alpha = mote.alpha * (0.5 + Math.sin(elapsedFrames * 0.025 + mote.phase) * 0.5);
      context.beginPath();
      context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 247, 205, ${alpha})`;
      context.fill();
    });
  }

  function drawCold(width: number, height: number) {
    fillWash(width, height, "rgba(90, 155, 215, 0.10)");
    edgeGradient(width, height, "top", "rgba(190, 230, 250, 0.26)", 0.28);
    edgeGradient(width, height, "bottom", "rgba(180, 225, 248, 0.30)", 0.28);
    edgeGradient(width, height, "left", "rgba(194, 232, 250, 0.24)", 0.22);
    edgeGradient(width, height, "right", "rgba(194, 232, 250, 0.24)", 0.22);
    pool("cold-crystals", Math.max(90, Math.round(width / 10)), () => {
      const side = Math.floor(Math.random() * 4);
      const margin = Math.min(width, height) * 0.23;
      return {
        x: side < 2 ? Math.random() * width : side === 2 ? Math.random() * margin : width - Math.random() * margin,
        y: side === 0 ? Math.random() * margin : side === 1 ? height - Math.random() * margin : Math.random() * height,
        arms: 4 + Math.floor(Math.random() * 3),
        size: 2 + Math.random() * 7,
        angle: Math.random() * Math.PI,
        alpha: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };
    }).forEach((crystal) => {
      const alpha = crystal.alpha * (0.65 + Math.sin(elapsedFrames * 0.018 + crystal.phase) * 0.35);
      context.strokeStyle = `rgba(225, 247, 255, ${alpha})`;
      context.lineWidth = 0.7;
      for (let arm = 0; arm < crystal.arms; arm += 1) {
        const angle = crystal.angle + arm * Math.PI * 2 / crystal.arms;
        context.beginPath();
        context.moveTo(crystal.x, crystal.y);
        context.lineTo(
          crystal.x + Math.cos(angle) * crystal.size,
          crystal.y + Math.sin(angle) * crystal.size,
        );
        context.stroke();
      }
    });
  }

  function drawHot(width: number, height: number) {
    edgeGradient(width, height, "top", "rgba(235, 76, 20, 0.22)", 0.3);
    edgeGradient(width, height, "bottom", "rgba(245, 120, 25, 0.28)", 0.34);
    edgeGradient(width, height, "left", "rgba(225, 65, 20, 0.20)", 0.24);
    edgeGradient(width, height, "right", "rgba(225, 65, 20, 0.20)", 0.24);
    cornerGlow(
      width,
      height,
      0,
      height,
      height * 0.58,
      `rgba(255, 110, 20, ${0.18 + Math.sin(elapsedFrames * 0.012) * 0.04})`,
      "rgba(200, 35, 5, 0)",
    );
    pool("hot-embers", Math.max(40, Math.round(width / 24)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 2.2,
      speed: 0.2 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    })).forEach((ember) => {
      ember.y -= ember.speed;
      ember.x += ember.drift + Math.sin(elapsedFrames * 0.015 + ember.phase) * 0.12;
      if (ember.y < -5) {
        ember.y = height + 5;
        ember.x = Math.random() * width;
      }
      const alpha = ember.alpha * (0.55 + Math.sin(elapsedFrames * 0.045 + ember.phase) * 0.45);
      context.shadowColor = "#ff6a1a";
      context.shadowBlur = 5;
      context.beginPath();
      context.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, ${110 + Math.floor(ember.radius * 25)}, 35, ${alpha})`;
      context.fill();
      context.shadowBlur = 0;
    });
  }

  function drawNight(width: number, height: number) {
    const wash = context.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, "rgba(5, 10, 40, 0.58)");
    wash.addColorStop(0.6, "rgba(8, 20, 58, 0.38)");
    wash.addColorStop(1, "rgba(3, 8, 28, 0.52)");
    context.fillStyle = wash;
    context.fillRect(0, 0, width, height);
    cornerGlow(width, height, 0, 0, width * 0.48, "rgba(0, 5, 28, 0.44)", "rgba(0, 5, 28, 0)");
    cornerGlow(width, height, width, 0, width * 0.48, "rgba(0, 5, 28, 0.44)", "rgba(0, 5, 28, 0)");
    pool("night-motes", Math.max(25, Math.round(width / 42)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.4 + Math.random() * 1.5,
      alpha: 0.12 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
    })).forEach((mote) => {
      const alpha = mote.alpha * (0.35 + Math.sin(elapsedFrames * 0.022 + mote.phase) * 0.65);
      context.beginPath();
      context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(175, 208, 255, ${Math.max(0, alpha)})`;
      context.fill();
    });
  }

  function drawDawnOrDusk(width: number, height: number, sunrise: boolean) {
    const key = sunrise ? "sunrise" : "sunset";
    const palette = sunrise
      ? { edge: [241, 165, 127], mid: [218, 127, 125], far: [119, 110, 153], mote: [245, 175, 155] }
      : { edge: [255, 150, 50], mid: [230, 100, 28], far: [95, 35, 70], mote: [245, 135, 40] };
    const rays = state(`${key}-rays`, () => Array.from({ length: 9 }, (_, index) => ({
      angle: Math.PI / 2 + (index / 8 - 0.5) * Math.PI * 0.75 + (Math.random() - 0.5) * 0.10,
      width: 35 + Math.random() * 65,
      alpha: 0.06 + Math.random() * 0.08,
      phase: Math.random() * Math.PI * 2,
      side: index % 2 ? 0.85 : 0.15,
    })));
    cornerGlow(
      width,
      height,
      0,
      0,
      width * 0.72,
      `rgba(${palette.edge.join(",")}, 0.24)`,
      `rgba(${palette.far.join(",")}, 0)`,
    );
    cornerGlow(
      width,
      height,
      width,
      0,
      width * 0.72,
      `rgba(${palette.edge.join(",")}, 0.24)`,
      `rgba(${palette.far.join(",")}, 0)`,
    );
    rays.forEach((ray) => {
      const alpha = ray.alpha * (0.7 + Math.sin(elapsedFrames * 0.003 + ray.phase) * 0.3);
      const length = Math.hypot(width, height);
      context.save();
      context.translate(width * ray.side, -15);
      context.rotate(ray.angle);
      const gradient = context.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, `rgba(${palette.edge.join(",")}, ${alpha * 1.8})`);
      gradient.addColorStop(0.35, `rgba(${palette.mid.join(",")}, ${alpha * 0.75})`);
      gradient.addColorStop(1, `rgba(${palette.far.join(",")}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(0, -ray.width / 2, length, ray.width);
      context.restore();
    });
    if (!sunrise) {
      const dusk = context.createLinearGradient(0, 0, 0, height * 0.16);
      dusk.addColorStop(0, "rgba(60, 25, 50, 0.15)");
      dusk.addColorStop(1, "rgba(60, 25, 50, 0)");
      context.fillStyle = dusk;
      context.fillRect(0, 0, width, height * 0.18);
    }
    pool(`${key}-motes`, Math.max(sunrise ? 20 : 18, Math.round(width / 58)), () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 0.15,
      dy: -0.03 - Math.random() * 0.09,
      alpha: 0.18 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
    })).forEach((mote) => {
      mote.x += mote.dx;
      mote.y += mote.dy;
      if (mote.y < -4) {
        mote.y = height + 4;
        mote.x = Math.random() * width;
      }
      const alpha = mote.alpha * (0.5 + Math.sin(elapsedFrames * 0.024 + mote.phase) * 0.5);
      context.beginPath();
      context.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${palette.mote.join(",")}, ${alpha})`;
      context.fill();
    });
  }

  function drawFreezing(width: number, height: number) {
    fillWash(width, height, "rgba(116, 185, 232, 0.16)");
    edgeGradient(width, height, "top", "rgba(218, 244, 255, 0.56)", 0.25);
    edgeGradient(width, height, "bottom", "rgba(200, 238, 255, 0.52)", 0.25);
    edgeGradient(width, height, "left", "rgba(215, 244, 255, 0.50)", 0.20);
    edgeGradient(width, height, "right", "rgba(215, 244, 255, 0.50)", 0.20);
    const pulse = 0.72 + Math.sin(elapsedFrames * 0.025) * 0.15;
    pool("freezing-shards", Math.max(36, Math.round(width / 24)), () => ({
      x: Math.random() * width,
      length: 12 + Math.random() * 54,
      width: 2 + Math.random() * 6,
      alpha: 0.18 + Math.random() * 0.35,
    })).forEach((ice) => {
      context.beginPath();
      context.moveTo(ice.x, 0);
      context.lineTo(ice.x + ice.width, ice.length);
      context.lineTo(ice.x - ice.width, ice.length * 0.82);
      context.closePath();
      context.fillStyle = `rgba(232, 250, 255, ${ice.alpha * pulse})`;
      context.fill();
    });
  }

  function drawFractures(width: number, height: number) {
    edgeGradient(width, height, "top", "rgba(255, 244, 210, 0.24)", 0.24);
    edgeGradient(width, height, "bottom", "rgba(224, 206, 166, 0.28)", 0.24);
    edgeGradient(width, height, "left", "rgba(245, 228, 191, 0.22)", 0.18);
    edgeGradient(width, height, "right", "rgba(245, 228, 191, 0.22)", 0.18);
    cornerGlow(width, height, 0, 0, height * 0.48, "rgba(255, 241, 202, 0.18)", "rgba(255, 241, 202, 0)");
    cornerGlow(width, height, width, height, height * 0.48, "rgba(213, 191, 150, 0.18)", "rgba(213, 191, 150, 0)");
  }

  function drawWet(width: number, height: number) {
    edgeGradient(width, height, "top", "rgba(210, 235, 248, 0.10)", 0.22);
    edgeGradient(width, height, "bottom", "rgba(20, 55, 75, 0.13)", 0.26);
  }

  function draw(now = performance.now()) {
    frameId = null;
    const { width, height } = bounds();
    context.clearRect(0, 0, width, height);
    elapsedFrames += 1;
    const activeEffects = getActiveEffects();
    activeEffects.forEach((effect) => {
      if (effect === "rain") drawRain(width, height);
      else if (effect === "light-snow") drawSnow(width, height, false);
      else if (effect === "heavy-snow") drawSnow(width, height, true);
      else if (effect === "lightning") drawLightning(width, height, now);
      else if (effect === "sunny") drawSunny(width, height);
      else if (effect === "cloudy") drawCloudy(width, height);
      else if (effect === "night") drawNight(width, height);
      else if (effect === "sunrise") drawDawnOrDusk(width, height, true);
      else if (effect === "sunset") drawDawnOrDusk(width, height, false);
      else if (effect === "windy") drawWind(width, height);
      else if (effect === "cold") drawCold(width, height);
      else if (effect === "hot") drawHot(width, height);
      else if (effect === "wet") drawWet(width, height);
      else if (effect === "bleeding") drawBleeding(width, height);
      else if (effect === "freezing") drawFreezing(width, height);
      else if (effect === "fractures") drawFractures(width, height);
      else if (effect === "toxic") drawToxic(width, height);
      else if (effect === "drowning") drawDrowning(width, height);
    });
    if (!destroyed && activeEffects.size > 0) frameId = window.requestAnimationFrame(draw);
  }

  function clearEffectState(effect: ChatEffectId) {
    pools.forEach((_, key) => {
      if (key === effect || key.startsWith(`${effect}-`)) pools.delete(key);
    });
    effectState.forEach((_, key) => {
      if (key === effect || key.startsWith(`${effect}-`)) effectState.delete(key);
    });
  }

  function refresh(changedEffect?: ChatEffectId) {
    if (destroyed) return;
    const activeEffects = new Set(getActiveEffects());
    if (changedEffect) clearEffectState(changedEffect);
    else {
      new Set([...knownEffects, ...activeEffects]).forEach((effect) => {
        if (knownEffects.has(effect) !== activeEffects.has(effect)) clearEffectState(effect);
      });
    }
    knownEffects = activeEffects;
    if (activeEffects.size > 0) {
      if (frameId === null) frameId = window.requestAnimationFrame(draw);
    } else {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      const { width, height } = bounds();
      context.clearRect(0, 0, width, height);
      frameId = null;
    }
  }

  const observer = typeof ResizeObserver === "undefined"
    ? null
    : new ResizeObserver(() => {
        resizeCanvas();
        refresh();
      });
  observer?.observe(canvas);
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  return {
    refresh,
    destroy: () => {
      destroyed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      observer?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      pools.clear();
      effectState.clear();
      knownEffects.clear();
    },
  };
}
