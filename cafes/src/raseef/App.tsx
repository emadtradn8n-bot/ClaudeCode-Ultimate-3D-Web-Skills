import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { makePhoto } from "../shared/photo";
import { clamp01, fitCanvas } from "../shared/field";
import { MANIFEST, SLOTS } from "./assets";
import { drawStreetFrame } from "./streetScene";

const Photo = makePhoto(SLOTS, MANIFEST, {
  plate: "border border-white/20 bg-neutral-900",
  icon: "text-white/35",
  label: "text-white/70",
  note: "text-white/30",
});

const ITEMS = Object.keys(SLOTS);

/** Scatters the contact sheet across `cols`, leaving deliberate gaps. */
function layout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let placed = 0;
  for (let r = 0; placed < count; r++) {
    const row: number[] = new Array(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    row[a] = placed++;
    if (r % 3 === 0 && placed < count) {
      let b = (a + 2) % cols;
      if (b === a) b = (a + 1) % cols;
      row[b] = placed++;
    }
    rows.push(row);
  }
  return rows;
}

/** Two takes of the pavement, scrubbed by how far the cursor is from centre. */
function Stage({ touch }: { touch: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const morning = useRef<HTMLCanvasElement>(null);
  const evening = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const a = morning.current;
    const b = evening.current;
    if (!box || !a || !b) return;
    const ac = a.getContext("2d");
    const bc = b.getContext("2d");
    if (!ac || !bc) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let active = 0;
    const drawn = [-1, -1];
    let pointerX = window.innerWidth / 2;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = box.getBoundingClientRect();
      w = r.width;
      h = r.height;
      for (const c of [a, b]) {
        const dpr = fitCanvas(c, w, h);
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawn[0] = drawn[1] = -1;
    };

    const paint = (side: number, p: number) => {
      if (Math.abs(p - drawn[side]) < 0.003) return;
      drawStreetFrame(side === 0 ? ac : bc, w, h, p, side);
      drawn[side] = p;
    };

    const show = (side: number) => {
      active = side;
      a.style.display = side === 0 ? "block" : "none";
      b.style.display = side === 1 ? "block" : "none";
    };

    let onMove: ((e: PointerEvent) => void) | null = null;

    if (touch || still) {
      const start = performance.now();
      const loop = (now: number) => {
        const el = (now - start) / 1000;
        const p = still ? 0.4 : (el % 7) / 7;
        const side = Math.floor(el / 7) % 2;
        if (side !== active) show(side);
        paint(side, p);
        raf = requestAnimationFrame(loop);
      };
      show(0);
      resize();
      raf = requestAnimationFrame(loop);
    } else {
      onMove = (e: PointerEvent) => {
        pointerX = e.clientX;
      };
      window.addEventListener("pointermove", onMove);
      const loop = () => {
        const centre = w / 2;
        const dead = Math.max(30, w * 0.05);
        const dx = pointerX - centre;
        if (Math.abs(dx) <= dead) {
          // Dead zone: hold whichever take was last shown at its first frame.
          paint(active, 0);
        } else {
          const side = dx < 0 ? 1 : 0;
          if (side !== active) show(side);
          paint(side, clamp01((Math.abs(dx) - dead) / Math.max(1, centre - dead)));
        }
        raf = requestAnimationFrame(loop);
      };
      show(0);
      resize();
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (onMove) window.removeEventListener("pointermove", onMove);
    };
  }, [touch]);

  return (
    <div ref={wrap} className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-neutral-800">
      <canvas ref={morning} className="absolute inset-0 h-full w-full" />
      <canvas ref={evening} className="absolute inset-0 h-full w-full" style={{ display: "none" }} />
    </div>
  );
}

export default function App() {
  const [cols, setCols] = useState(4);
  const [touch, setTouch] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => {
      const w = window.innerWidth;
      setCols(w < 640 ? 2 : w < 1024 ? 3 : 4);
      setTouch(window.matchMedia("(hover: none), (pointer: coarse)").matches || w < 1024);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  // Page height has to cover the hero, the whole gallery run, and the outro.
  useLayoutEffect(() => {
    const el = root.current;
    const grid = inner.current;
    if (!el || !grid) return;
    const measure = () => {
      const vh = window.innerHeight;
      el.style.height = `${vh + Math.max(0, grid.scrollHeight - vh) + 2 * vh}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cols]);

  // One loop drives the panel lift, the grid travel, the card scaling and the
  // outro. Reading rects each frame keeps the cards honest about where they are.
  useEffect(() => {
    const grid = inner.current;
    if (!grid) return;
    let raf = 0;
    let cards: HTMLElement[] = [];

    const frame = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const run = Math.max(0, grid.scrollHeight - vh);

      if (panel.current) {
        const lift = Math.max(0, vh - y);
        panel.current.style.transform = `translateY(${lift}px)`;
      }
      grid.style.transform = `translateY(${-Math.max(0, Math.min(y - vh, run))}px)`;

      if (cards.length !== ITEMS.length) {
        cards = Array.from(document.querySelectorAll<HTMLElement>(".card"));
      }
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        let s = 0;
        if (r.bottom > 0 && r.top < vh) {
          s = Math.max(0, Math.min(Math.min(1, (vh - r.top) / (vh * 0.6)), Math.min(1, r.bottom / (vh * 0.4))));
        }
        card.style.transform = `scale(${s.toFixed(3)})`;
      }

      const p = clamp01((y - vh - run) / Math.max(1, vh - 100));
      if (sheet.current) sheet.current.style.opacity = String(p);
      if (cta.current) cta.current.style.transform = `scale(${p})`;
      // Lift the price clear of the CTA as it grows, and retire the hero
      // caption, which has no job once the white sheet is in.
      if (info.current) info.current.style.transform = `translateY(${-p * 150}px)`;
      if (caption.current) caption.current.style.opacity = String(1 - p);
      if (stage.current) stage.current.style.visibility = y > vh ? "hidden" : "visible";

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cols]);

  const rows = layout(ITEMS.length, cols);

  return (
    <div ref={root} className="relative bg-white" style={{ height: "400vh" }}>
      <div ref={stage}>
        <Stage touch={touch} />
      </div>

      {/* Contact sheet, parked below the fold until scroll lifts it. */}
      <div
        ref={panel}
        className="fixed inset-0 z-10 overflow-hidden bg-black"
        style={{ transform: "translateY(100vh)" }}
      >
        <div ref={inner} className="w-full" style={{ paddingTop: "min(360px, 38vh)" }}>
          {rows.map((row, ri) => (
            <div key={ri} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {row.map((idx, ci) =>
                idx === -1 ? (
                  <div key={ci} style={{ aspectRatio: "2 / 3" }} />
                ) : (
                  <figure
                    key={ci}
                    className="card m-0"
                    style={{
                      aspectRatio: "2 / 3",
                      transform: "scale(0)",
                      transformOrigin: ci < cols / 2 ? "right bottom" : "left bottom",
                    }}
                  >
                    <Photo slot={ITEMS[idx]} />
                  </figure>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* White sheet for the outro. */}
      <div
        ref={sheet}
        className="pointer-events-none fixed inset-0 z-[12] bg-white"
        style={{ opacity: 0 }}
      />

      {/* Overlay chrome, exclusion-blended so it survives any frame beneath. */}
      <header className="punch pointer-events-none fixed inset-x-4 top-5 z-20 flex items-start justify-between lg:inset-x-8 lg:top-8">
        <span className="display text-3xl lg:text-5xl">الرصيف</span>
        <nav className="flex items-center gap-5 text-[0.8rem] lg:gap-8 lg:text-sm">
          <span>القائمة</span>
          <span>الفروع</span>
          <span>[ الطلب ]</span>
        </nav>
      </header>

      {/* Plain white with a scrim rather than `punch`: exclusion blending is
          striking at display size but unreadable at body size, where it matches
          whatever tone happens to sit behind each word. */}
      <p
        ref={caption}
        className="pointer-events-none fixed start-4 top-24 z-20 w-[calc(100vw-2rem)] text-[0.82rem] leading-relaxed text-white lg:start-8 lg:top-40 lg:w-[46ch]"
        style={{ textShadow: "0 1px 12px rgb(0 0 0 / 0.75), 0 0 2px rgb(0 0 0 / 0.6)" }}
      >
        مقهى على الرصيف منذ ٢٠١٤. لا طاولات محجوزة ولا قائمة طويلة — قهوة تُشرب واقفاً، وكرسي
        إن وجدت. حرّك المؤشر يميناً ويساراً لتتنقّل بين لقطتَي الصباح والمساء.
      </p>

      <div
        ref={info}
        className="punch pointer-events-none fixed inset-x-0 bottom-10 z-20 flex flex-col items-center gap-1 lg:inset-x-auto lg:bottom-24 lg:start-8 lg:w-[330px]"
      >
        <span className="display text-lg lg:text-2xl">فنجان اليوم</span>
        <span className="display text-[3.4rem] leading-none lg:text-[5rem]">١٤ ر.س</span>
      </div>

      <div
        ref={cta}
        className="pointer-events-none fixed inset-x-4 bottom-4 z-20 flex h-[92px] items-center justify-center lg:inset-x-auto lg:bottom-8 lg:h-[150px] lg:start-8 lg:w-[330px]"
        style={{ background: "#fff", borderRadius: 999, transform: "scale(0)", transformOrigin: "right bottom" }}
      >
        <span className="display punch text-[3rem] leading-none lg:text-[4.2rem]">اطلب</span>
      </div>

      <footer className="punch pointer-events-none fixed bottom-5 end-4 z-20 flex gap-8 text-[0.7rem] lg:bottom-8 lg:end-8 lg:text-xs">
        <span>الرصيف ٢٠٢٦</span>
        <span>سياسة الخصوصية</span>
      </footer>
    </div>
  );
}
