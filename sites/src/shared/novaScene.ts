// NovaAI hero scene. Progress 0 -> 1 morphs hanging white cables with glowing
// gold tips into an organic spherical fold mass around a warm orange core.
// Fully deterministic so the scroll position alone decides the frame.

import {
  applyGrain,
  clamp01,
  drawBokeh,
  drawMist,
  easeInOut,
  hash,
  lerp,
  makeBokeh,
  vignette,
  type Bokeh,
} from "./field";

const STRANDS = 30;
const SAMPLES = 58;

interface Strand {
  x0: number;
  sway: number;
  phase: number;
  angle: number;
  arc: number;
  radius: number;
  squash: number;
  fold: number;
  foldFreq: number;
  width: number;
  bright: number;
  lag: number;
}

let cache: Strand[] | null = null;

function strands(): Strand[] {
  if (cache) return cache;
  const out: Strand[] = [];
  for (let i = 0; i < STRANDS; i++) {
    const s = i * 1.7;
    out.push({
      x0: 0.1 + (i / (STRANDS - 1)) * 0.8 + (hash(s + 0.3) - 0.5) * 0.03,
      sway: 0.6 + hash(s + 1.1) * 1.8,
      phase: hash(s + 2.4) * Math.PI * 2,
      angle: (i / STRANDS) * Math.PI * 2 + hash(s + 3.6) * 0.35,
      arc: Math.PI * (0.85 + hash(s + 4.2) * 1.5),
      radius: 0.2 + hash(s + 5.5) * 0.16,
      squash: 0.7 + hash(s + 6.1) * 0.22,
      fold: 0.03 + hash(s + 7.3) * 0.07,
      foldFreq: 3 + Math.floor(hash(s + 8.8) * 5),
      width: 0.9 + hash(s + 9.4) * 2.4,
      bright: 0.55 + hash(s + 10.2) * 0.45,
      lag: hash(s + 11.9) * 0.22,
    });
  }
  cache = out;
  return out;
}

let dots: Bokeh[] | null = null;

export function drawNovaFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number
): void {
  const t = clamp01(progress);
  if (!dots) dots = makeBokeh(34, 91.7);

  // Background stays a cool blue-grey mist end to end; only the core is warm.
  drawMist(
    ctx,
    w,
    h,
    `rgb(${lerp(25, 27, t)}, ${lerp(29, 30, t)}, ${lerp(37, 38, t)})`,
    `rgb(${lerp(11, 12, t)}, ${lerp(13, 14, t)}, ${lerp(17, 18, t)})`,
    0.5,
    lerp(0.2, 0.46, t),
    `rgba(150, 172, 202, ${lerp(0.1, 0.13, t)})`,
    lerp(0.75, 0.9, t)
  );

  const cx = w * 0.5;
  const cy = h * lerp(0.42, 0.5, t);
  const span = Math.min(w, h);
  const m = easeInOut(t);

  // Core bloom behind the mass, grows as strands gather.
  if (t > 0.02) {
    const coreR = span * lerp(0.06, 0.36, m);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    const a = m * 0.85;
    g.addColorStop(0, `rgba(255, 176, 74, ${a})`);
    g.addColorStop(0.35, `rgba(238, 122, 38, ${a * 0.5})`);
    g.addColorStop(1, "rgba(180, 70, 20, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Strands are drawn back-to-front so the fold reads as a solid volume.
  const list = strands();
  const ordered = list
    .map((s, i) => ({ s, i, depth: Math.sin(s.angle + m * 1.4) }))
    .sort((a, b) => a.depth - b.depth);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const { s, i, depth } of ordered) {
    // Each strand eases at its own pace so the collapse feels organic.
    const local = easeInOut(clamp01((t - s.lag * 0.5) / (1 - s.lag * 0.5)));
    const front = (depth + 1) * 0.5;
    const shade = lerp(1, 0.28 + front * 0.72, m);

    ctx.beginPath();
    let tipX = 0;
    let tipY = 0;

    for (let j = 0; j <= SAMPLES; j++) {
      const u = j / SAMPLES;

      // Hanging cable: descends from above the frame with a slow sway.
      const hx = s.x0 * w + Math.sin(u * Math.PI * 1.15 + s.phase) * s.sway * span * 0.02;
      const hy = -0.2 * h + u * (1.05 + hash(i * 1.7 + 12.5) * 0.12) * h;

      // Folded strand: an arc that bulges mid-span and ripples like a gyrus.
      const a = s.angle + u * s.arc;
      const bulge = 0.5 + 0.5 * Math.sin(u * Math.PI);
      const ripple = 1 + Math.sin(u * s.foldFreq * Math.PI * 2 + s.phase) * s.fold;
      const rr = s.radius * span * (0.42 + 0.58 * bulge) * ripple;
      const fx = cx + Math.cos(a) * rr;
      const fy = cy + Math.sin(a) * rr * s.squash;

      const x = lerp(hx, fx, local);
      const y = lerp(hy, fy, local);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      tipX = x;
      tipY = y;
    }

    ctx.strokeStyle = `rgba(${lerp(246, 252, front)}, ${lerp(246, 248, front)}, ${lerp(242, 238, front)}, ${
      s.bright * shade * 0.9
    })`;
    ctx.lineWidth = s.width * (span / 900) * lerp(1, 1.5, m) * lerp(0.7, 1.15, front);
    ctx.stroke();

    // Gold tip: bright while hanging, folded into the core as it converges.
    const tipA = lerp(1, 0.35, m) * (0.5 + s.bright * 0.5);
    const tipR = span * lerp(0.016, 0.03, m);
    const tg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, tipR);
    tg.addColorStop(0, `rgba(255, 214, 138, ${tipA})`);
    tg.addColorStop(0.4, `rgba(240, 158, 58, ${tipA * 0.55})`);
    tg.addColorStop(1, "rgba(210, 110, 30, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    void i;
  }

  drawBokeh(ctx, w, h, dots, t * 2.2, t * 0.5);
  vignette(ctx, w, h, 0.5);
  applyGrain(ctx, w, h, 0.055);
}
