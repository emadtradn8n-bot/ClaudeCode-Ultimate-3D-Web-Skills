// الرصيف backdrop: a pavement seen as light and shadow rather than objects.
// Two takes — variant 0 is a morning of long hard shadow bars, variant 1 an
// evening of soft blown highlights. Cursor position scrubs between them, so the
// frame is a pure function of `progress`.

import { applyGrain, clamp01, hash, lerp, vignette } from "../shared/field";

const BARS = 16;
const MOTES = 40;

interface Bar {
  x: number;
  w: number;
  skew: number;
  alpha: number;
  drift: number;
}

const cache: Record<number, Bar[]> = {};

function bars(variant: number): Bar[] {
  if (cache[variant]) return cache[variant];
  const base = variant * 91.3;
  const out: Bar[] = [];
  for (let i = 0; i < BARS; i++) {
    const s = base + i * 5.3;
    out.push({
      x: (i / BARS) * 1.35 - 0.2 + (hash(s + 1.4) - 0.5) * 0.05,
      w: 0.02 + hash(s + 2.7) * 0.075,
      skew: 0.25 + hash(s + 3.9) * 0.55,
      alpha: 0.05 + hash(s + 4.6) * 0.3,
      drift: 0.06 + hash(s + 5.8) * 0.22,
    });
  }
  cache[variant] = out;
  return out;
}

export function drawStreetFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  variant: number
): void {
  const t = clamp01(progress);
  const evening = variant === 1;

  // Concrete carries the whole image, so the tonal range is pushed wide: the
  // overlay chrome blends with `exclusion`, which turns invisible against a
  // uniformly mid-grey frame.
  const base = ctx.createLinearGradient(0, 0, 0, h);
  if (evening) {
    base.addColorStop(0, `rgb(${lerp(88, 62, t)}, ${lerp(84, 59, t)}, ${lerp(80, 56, t)})`);
    base.addColorStop(0.55, `rgb(${lerp(40, 30, t)}, ${lerp(38, 28, t)}, ${lerp(36, 27, t)})`);
    base.addColorStop(1, "rgb(10, 10, 9)");
  } else {
    base.addColorStop(0, `rgb(${lerp(236, 214, t)}, ${lerp(234, 212, t)}, ${lerp(229, 207, t)})`);
    base.addColorStop(0.62, `rgb(${lerp(150, 124, t)}, ${lerp(148, 122, t)}, ${lerp(144, 119, t)})`);
    base.addColorStop(1, `rgb(${lerp(46, 34, t)}, ${lerp(45, 33, t)}, ${lerp(44, 32, t)})`);
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Shadow bars cast across the pavement. They lean further as the take runs.
  for (const b of bars(variant)) {
    const lean = (b.skew + t * 0.7) * h;
    const x = (b.x + t * b.drift) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + b.w * w, 0);
    ctx.lineTo(x + b.w * w + lean, h);
    ctx.lineTo(x + lean, h);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, 0, 0, h);
    const a = b.alpha * (evening ? 0.7 : 1.5);
    g.addColorStop(0, `rgba(10, 9, 8, ${Math.min(0.72, a)})`);
    g.addColorStop(0.75, `rgba(10, 9, 8, ${Math.min(0.4, a * 0.5)})`);
    g.addColorStop(1, "rgba(10, 9, 8, 0)");
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Low sun raking in from the side the take is travelling toward.
  const sx = lerp(evening ? 0.9 : 0.1, evening ? 0.35 : 0.72, t) * w;
  const sy = lerp(0.1, 0.42, t) * h;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * (evening ? 0.7 : 0.5));
  sun.addColorStop(0, evening ? "rgba(255, 186, 122, 0.3)" : "rgba(255, 250, 236, 0.34)");
  sun.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Dust caught in the beam.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < MOTES; i++) {
    const s = variant * 13.7 + i * 3.1;
    const mx = (((hash(s + 1.1) + t * (0.1 + hash(s + 2.2) * 0.3)) % 1) + 1) % 1;
    const my = hash(s + 3.3);
    const r = (0.8 + hash(s + 4.4) * 2.6) * (Math.min(w, h) / 900);
    ctx.beginPath();
    ctx.arc(mx * w, my * h, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 248, 232, ${0.1 + hash(s + 5.5) * 0.3})`;
    ctx.fill();
  }
  ctx.restore();

  vignette(ctx, w, h, evening ? 0.62 : 0.4);
  applyGrain(ctx, w, h, 0.085);
}
