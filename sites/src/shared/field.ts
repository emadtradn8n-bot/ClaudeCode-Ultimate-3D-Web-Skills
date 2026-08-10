// Deterministic helpers shared by every procedural scene. Same inputs always
// produce the same frame, which is what makes scroll- and cursor-scrubbing work.

export function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

let grainTile: HTMLCanvasElement | null = null;

/** 128px monochrome noise tile, built once and reused as a repeating pattern. */
export function getGrain(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (Math.random() - 0.5) * 255;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

export function applyGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha = 0.05
): void {
  const pattern = ctx.createPattern(getGrain(), "repeat");
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export interface Bokeh {
  x: number;
  y: number;
  r: number;
  a: number;
  drift: number;
  hue: number;
}

export function makeBokeh(count: number, seed: number): Bokeh[] {
  const out: Bokeh[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: hash(seed + i * 3.1),
      y: hash(seed + i * 7.7),
      r: 0.004 + hash(seed + i * 11.3) * 0.03,
      a: 0.06 + hash(seed + i * 5.9) * 0.22,
      drift: 0.4 + hash(seed + i * 2.3) * 1.6,
      hue: hash(seed + i * 13.7),
    });
  }
  return out;
}

/** Soft out-of-focus discs. `flow` scrolls them; `warm` tints toward amber. */
export function drawBokeh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dots: Bokeh[],
  flow: number,
  warm = 0
): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const span = Math.max(w, h);
  for (const d of dots) {
    const y = (((d.y - flow * d.drift * 0.08) % 1) + 1) % 1;
    const px = d.x * w;
    const py = y * h;
    const pr = d.r * span;
    const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
    const amber = d.hue < 0.35 + warm * 0.4;
    const col = amber ? `255, ${190 + d.hue * 40}, ${120 + d.hue * 60}` : "196, 214, 232";
    g.addColorStop(0, `rgba(${col}, ${d.a})`);
    g.addColorStop(0.5, `rgba(${col}, ${d.a * 0.35})`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Vertical wash plus a drifting radial haze; the base of every scene. */
export function drawMist(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  top: string,
  bottom: string,
  hazeX: number,
  hazeY: number,
  hazeColor: string,
  hazeSize = 0.9
): void {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const span = Math.max(w, h) * hazeSize;
  const hz = ctx.createRadialGradient(hazeX * w, hazeY * h, 0, hazeX * w, hazeY * h, span);
  hz.addColorStop(0, hazeColor);
  hz.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hz;
  ctx.fillRect(0, 0, w, h);
}

export function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.55): void {
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.25,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.78
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Sets canvas backing store to CSS size * DPR (capped at 2) and returns the scale. */
export function fitCanvas(canvas: HTMLCanvasElement, w: number, h: number): number {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  return dpr;
}
