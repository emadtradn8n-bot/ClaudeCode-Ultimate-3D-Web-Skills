import { useEffect, useRef } from "react";
import { clamp01, fitCanvas } from "../shared/field";
import { drawPrmptFrame } from "../shared/prmptScene";

const DURATION = 6; // seconds, used only for the touch auto-play path

/**
 * Two draped-cloth takes stacked in one frame. On pointer devices the cursor's
 * horizontal distance from centre scrubs whichever take is showing; a dead zone
 * around the centre stops the two from flickering against each other. On touch
 * the takes simply alternate.
 */
export function Stage({ isTouch }: { isTouch: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!wrap || !left || !right) return;

    const lc = left.getContext("2d");
    const rc = right.getContext("2d");
    if (!lc || !rc) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    // 0 = right take visible, 1 = left take visible (matches the spec's sides)
    let active = 0;
    const drawn = [-1, -1];
    let pointerX = window.innerWidth / 2;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      for (const c of [left, right]) {
        const dpr = fitCanvas(c, w, h);
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      drawn[0] = -1;
      drawn[1] = -1;
    };

    const paint = (side: number, p: number) => {
      if (Math.abs(p - drawn[side]) < 0.002) return;
      drawPrmptFrame(side === 0 ? rc : lc, w, h, p, side === 0 ? 0 : 1);
      drawn[side] = p;
    };

    const show = (side: number) => {
      active = side;
      right.style.display = side === 0 ? "block" : "none";
      left.style.display = side === 1 ? "block" : "none";
    };

    let onMove: ((e: PointerEvent) => void) | null = null;

    if (isTouch || still) {
      // Touch: alternate takes, each playing through once.
      const start = performance.now();
      const loop = (now: number) => {
        const elapsed = (now - start) / 1000;
        const cycle = Math.floor(elapsed / DURATION);
        const p = still ? 0.5 : (elapsed % DURATION) / DURATION;
        const side = cycle % 2 === 0 ? 1 : 0;
        if (side !== active) show(side);
        paint(side, p);
        raf = requestAnimationFrame(loop);
      };
      show(1);
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
          // Inside the dead zone both takes rest at the head of the clip.
          paint(active, 0);
        } else if (dx < 0) {
          if (active !== 0) show(0);
          const range = Math.max(1, centre - dead);
          paint(0, clamp01((-dx - dead) / range));
        } else {
          if (active !== 1) show(1);
          const range = Math.max(1, centre - dead);
          paint(1, clamp01((dx - dead) / range));
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
  }, [isTouch]);

  return (
    <div
      id="main-canvas"
      ref={wrapRef}
      className="pointer-events-none fixed left-0 top-[220px] z-0 h-[calc(100vh-220px)] w-screen overflow-hidden lg:inset-0 lg:top-0 lg:h-full lg:w-full"
    >
      <canvas ref={leftRef} className="absolute inset-0 h-full w-full" style={{ display: "none" }} />
      <canvas ref={rightRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
