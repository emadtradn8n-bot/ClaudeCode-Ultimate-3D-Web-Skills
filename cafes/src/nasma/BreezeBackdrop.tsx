import { useEffect, useRef } from "react";
import { clamp01, fitCanvas } from "../shared/field";
import { drawBreezeFrame } from "./breezeScene";

/**
 * Fixed full-bleed backdrop driven only by scroll position, lerped so the
 * currents ease rather than snap. Under reduced-motion it paints one still
 * frame and stops listening.
 */
export function BreezeBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let smoothed = 0;
    let last = -1;
    let w = 0;
    let h = 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = fitCanvas(canvas, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      last = -1;
      if (still) drawBreezeFrame(ctx, w, h, 0.35);
    };

    const target = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      return range > 0 ? clamp01(window.scrollY / range) : 0;
    };

    const tick = () => {
      smoothed += (target() - smoothed) * 0.09;
      if (Math.abs(smoothed - last) > 0.0007) {
        drawBreezeFrame(ctx, w, h, smoothed);
        last = smoothed;
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);

    if (still) {
      drawBreezeFrame(ctx, w, h, 0.35);
    } else {
      smoothed = target();
      drawBreezeFrame(ctx, w, h, smoothed);
      last = smoothed;
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ground">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
