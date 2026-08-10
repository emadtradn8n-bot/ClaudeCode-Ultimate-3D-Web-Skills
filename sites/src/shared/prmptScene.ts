// prmpt hero backdrops. Two variants of a draped-cloth study, scrubbed by
// cursor position rather than played. Variant 0 is cool bone, variant 1 is warm
// ash, so crossing the centre of the screen reads as a cut between two takes.

import { applyGrain, clamp01, drawMist, hash, lerp, vignette } from "./field";

const FOLDS = 22;
const SAMPLES = 54;

interface Fold {
  x: number;
  drift: number;
  width: number;
  bow: number;
  phase: number;
  freq: number;
  bright: number;
  depth: number;
}

const cache: Record<number, Fold[]> = {};

function folds(variant: number): Fold[] {
  if (cache[variant]) return cache[variant];
  const base = variant * 137.7;
  const out: Fold[] = [];
  for (let i = 0; i < FOLDS; i++) {
    const s = base + i * 2.9;
    out.push({
      x: 0.06 + (i / (FOLDS - 1)) * 0.88,
      drift: (hash(s + 1.4) - 0.5) * 0.34,
      width: 0.02 + hash(s + 2.2) * 0.075,
      bow: (hash(s + 3.7) - 0.5) * 0.3,
      phase: hash(s + 4.9) * Math.PI * 2,
      freq: 1.1 + hash(s + 5.3) * 2.4,
      bright: 0.3 + hash(s + 6.8) * 0.7,
      depth: hash(s + 7.5),
    });
  }
  cache[variant] = out;
  return out;
}

export function drawPrmptFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  variant: number
): void {
  const t = clamp01(progress);
  const warm = variant === 1;

  drawMist(
    ctx,
    w,
    h,
    warm ? "rgb(46, 41, 38)" : "rgb(38, 41, 47)",
    warm ? "rgb(12, 10, 9)" : "rgb(9, 10, 12)",
    0.5 + Math.sin(t * Math.PI * 2) * 0.1,
    0.36,
    warm ? "rgba(214, 178, 142, 0.16)" : "rgba(168, 190, 216, 0.16)",
    0.9
  );

  const ordered = folds(variant)
    .map((f) => f)
    .sort((a, b) => a.depth - b.depth);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const f of ordered) {
    // Scrubbing shifts each fold laterally and re-phases its ripple, so the
    // cloth appears to turn rather than merely slide.
    const shift = f.drift * t;
    const phase = f.phase + t * Math.PI * 2 * 0.6;
    const front = 0.35 + f.depth * 0.65;

    ctx.beginPath();
    for (let j = 0; j <= SAMPLES; j++) {
      const u = j / SAMPLES;
      const x =
        (f.x + shift) * w +
        Math.sin(u * Math.PI * f.freq + phase) * f.bow * w * 0.35 +
        Math.sin(u * Math.PI * 3.1 + phase * 1.4) * w * 0.012;
      ctx.lineTo(x, u * h);
    }
    for (let j = SAMPLES; j >= 0; j--) {
      const u = j / SAMPLES;
      const taper = 0.35 + 0.65 * Math.sin(u * Math.PI);
      const x =
        (f.x + shift) * w +
        Math.sin(u * Math.PI * f.freq + phase) * f.bow * w * 0.35 +
        Math.sin(u * Math.PI * 3.1 + phase * 1.4) * w * 0.012 +
        f.width * w * taper;
      ctx.lineTo(x, u * h);
    }
    ctx.closePath();

    const cx = (f.x + shift) * w;
    const g = ctx.createLinearGradient(cx, 0, cx + f.width * w, 0);
    const tone = warm ? "244, 232, 216" : "232, 238, 246";
    const a = f.bright * front * 0.5;
    g.addColorStop(0, `rgba(${tone}, 0)`);
    g.addColorStop(0.4, `rgba(${tone}, ${a})`);
    g.addColorStop(0.72, `rgba(${tone}, ${a * 0.55})`);
    g.addColorStop(1, `rgba(${tone}, 0)`);
    ctx.fillStyle = g;
    ctx.fill();
  }

  ctx.restore();

  // Sweeping key light tied to the scrub position.
  const lx = lerp(0.15, 0.85, warm ? 1 - t : t) * w;
  const key = ctx.createRadialGradient(lx, h * 0.4, 0, lx, h * 0.4, Math.max(w, h) * 0.5);
  key.addColorStop(0, warm ? "rgba(255, 214, 168, 0.14)" : "rgba(198, 220, 248, 0.14)");
  key.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  vignette(ctx, w, h, 0.6);
  applyGrain(ctx, w, h, 0.07);
}
