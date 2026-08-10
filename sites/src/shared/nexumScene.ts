// Nexum hero backdrop. A continuously looping field of light ribbons drifting
// over cool steel haze. Time-driven rather than scrubbed. Kept mid-toned in the
// upper half so dark mobile type reads, and shaded down toward the bottom where
// the desktop layout anchors its white type.

import { applyGrain, drawBokeh, drawMist, hash, makeBokeh, vignette, type Bokeh } from "./field";

const RIBBONS = 9;
const SAMPLES = 66;

interface Ribbon {
  y: number;
  amp: number;
  freq: number;
  phase: number;
  speed: number;
  thick: number;
  warm: number;
  alpha: number;
}

let cache: Ribbon[] | null = null;

function ribbons(): Ribbon[] {
  if (cache) return cache;
  const out: Ribbon[] = [];
  for (let i = 0; i < RIBBONS; i++) {
    const s = i * 3.3;
    out.push({
      y: 0.08 + (i / (RIBBONS - 1)) * 0.84 + (hash(s + 1.2) - 0.5) * 0.05,
      amp: 0.02 + hash(s + 2.5) * 0.055,
      // Low frequency keeps each band a long sweeping trail, not a wave train.
      freq: 0.28 + hash(s + 3.9) * 0.6,
      phase: hash(s + 4.4) * Math.PI * 2,
      speed: 0.16 + hash(s + 5.8) * 0.5,
      thick: 0.014 + hash(s + 6.6) * 0.07,
      warm: hash(s + 7.1),
      alpha: 0.12 + hash(s + 8.2) * 0.26,
    });
  }
  cache = out;
  return out;
}

let dots: Bokeh[] | null = null;

export function drawNexumFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
): void {
  if (!dots) dots = makeBokeh(30, 44.2);

  drawMist(
    ctx,
    w,
    h,
    "rgb(112, 124, 143)",
    "rgb(16, 18, 24)",
    0.42 + Math.sin(time * 0.11) * 0.07,
    0.3,
    "rgba(178, 198, 224, 0.2)",
    0.95
  );

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const r of ribbons()) {
    const drift = time * r.speed;
    ctx.beginPath();

    for (let j = 0; j <= SAMPLES; j++) {
      const u = j / SAMPLES;
      const y =
        r.y * h +
        Math.sin(u * Math.PI * 2 * r.freq + r.phase + drift) * r.amp * h +
        Math.sin(u * Math.PI * 1.7 + drift * 0.8) * r.amp * h * 0.3;
      if (j === 0) ctx.moveTo(u * w, y);
      else ctx.lineTo(u * w, y);
    }
    // Trace the underside back to close the band into a filled ribbon.
    for (let j = SAMPLES; j >= 0; j--) {
      const u = j / SAMPLES;
      const y =
        r.y * h +
        Math.sin(u * Math.PI * 2 * r.freq + r.phase + drift) * r.amp * h +
        Math.sin(u * Math.PI * 1.7 + drift * 0.8) * r.amp * h * 0.3 +
        r.thick * h * (0.35 + 0.65 * Math.sin(u * Math.PI));
      ctx.lineTo(u * w, y);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(0, r.y * h - r.amp * h, 0, r.y * h + r.thick * h);
    const cool = "182, 206, 236";
    const warm = "236, 206, 168";
    const col = r.warm > 0.68 ? warm : cool;
    g.addColorStop(0, `rgba(${col}, 0)`);
    g.addColorStop(0.45, `rgba(${col}, ${r.alpha})`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = g;
    ctx.fill();
  }

  ctx.restore();

  drawBokeh(ctx, w, h, dots, time * 0.9, 0.2);

  // Extra floor shading so bottom-anchored white type stays legible.
  const floor = ctx.createLinearGradient(0, h * 0.34, 0, h);
  floor.addColorStop(0, "rgba(6,7,10,0)");
  floor.addColorStop(1, "rgba(6,7,10,0.88)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, w, h);

  vignette(ctx, w, h, 0.42);
  applyGrain(ctx, w, h, 0.045);
}
