// Background for مقهى النسمة. The brand name means "the breeze", so the scene
// is a field of air currents: long silk-thin streamlines drifting across a warm
// dark room, with a pool of morning light that travels as the page scrolls.
// Deterministic in `progress`, so scroll position alone decides the frame.

import {
  applyGrain,
  clamp01,
  drawMist,
  easeInOut,
  hash,
  lerp,
  vignette,
} from "./field";

const LINES = 46;
const SAMPLES = 64;

interface Line {
  y: number;
  amp: number;
  freq: number;
  phase: number;
  drift: number;
  weight: number;
  bright: number;
  warm: number;
  curl: number;
}

let cache: Line[] | null = null;

function lines(): Line[] {
  if (cache) return cache;
  const out: Line[] = [];
  for (let i = 0; i < LINES; i++) {
    const s = i * 4.7;
    out.push({
      y: 0.04 + (i / (LINES - 1)) * 0.92 + (hash(s + 1.1) - 0.5) * 0.02,
      amp: 0.012 + hash(s + 2.3) * 0.07,
      freq: 0.5 + hash(s + 3.1) * 1.3,
      phase: hash(s + 4.9) * Math.PI * 2,
      drift: 0.3 + hash(s + 5.7) * 1.4,
      weight: 0.35 + hash(s + 6.2) * 1.15,
      bright: 0.25 + hash(s + 7.8) * 0.75,
      warm: hash(s + 8.4),
      curl: 0.4 + hash(s + 9.6) * 1.8,
    });
  }
  cache = out;
  return out;
}

export function drawBreezeFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number
): void {
  const t = clamp01(progress);
  const e = easeInOut(t);

  // Warm room that deepens slightly as the page descends.
  drawMist(
    ctx,
    w,
    h,
    `rgb(${lerp(28, 23, e)}, ${lerp(28, 23, e)}, ${lerp(26, 21, e)})`,
    `rgb(${lerp(14, 11, e)}, ${lerp(14, 11, e)}, ${lerp(13, 10, e)})`,
    lerp(0.72, 0.28, e),
    lerp(0.26, 0.62, e),
    `rgba(196, 172, 128, ${lerp(0.09, 0.06, e)})`,
    lerp(0.7, 0.85, e)
  );

  ctx.lineCap = "round";

  for (const l of lines()) {
    // Turbulence swells through the middle of the page then settles again,
    // so the breeze reads as something passing rather than looping.
    const gust = Math.sin(e * Math.PI) * l.curl;
    const shift = e * l.drift;

    ctx.beginPath();
    for (let j = 0; j <= SAMPLES; j++) {
      const u = j / SAMPLES;
      const x = u * w;
      const y =
        l.y * h +
        Math.sin(u * Math.PI * 2 * l.freq + l.phase + shift * 2.2) * l.amp * h * (1 + gust) +
        Math.sin(u * Math.PI * 4.7 + l.phase * 1.7 + shift) * l.amp * h * 0.35 * gust;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Sage for most currents, warm cream for a few, faded at both ends so the
    // lines read as air rather than as drawn strokes.
    const sage = "168, 214, 172";
    const cream = "244, 234, 216";
    const col = l.warm > 0.8 ? cream : sage;
    const a = l.bright * lerp(0.2, 0.32, Math.sin(e * Math.PI));

    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, `rgba(${col}, 0)`);
    g.addColorStop(0.22, `rgba(${col}, ${a})`);
    g.addColorStop(0.68, `rgba(${col}, ${a * 0.8})`);
    g.addColorStop(1, `rgba(${col}, 0)`);

    ctx.strokeStyle = g;
    ctx.lineWidth = l.weight * (Math.min(w, h) / 900) * 1.6;
    ctx.stroke();
  }

  // Morning light travelling across the room with the scroll.
  const lx = lerp(0.82, 0.12, e) * w;
  const ly = lerp(0.2, 0.66, e) * h;
  const beam = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.42);
  beam.addColorStop(0, `rgba(255, 208, 146, ${lerp(0.16, 0.11, e)})`);
  beam.addColorStop(0.4, "rgba(228, 172, 104, 0.035)");
  beam.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  vignette(ctx, w, h, 0.55);
  applyGrain(ctx, w, h, 0.05);
}
