import { useEffect, useRef } from "react";
import { clamp01, fitCanvas } from "../shared/field";
import { drawNovaFrame } from "../shared/novaScene";

/**
 * Full-bleed background driven purely by scroll position. Page progress maps to
 * the scene's morph parameter and is lerped so scrubbing stays smooth; nothing
 * animates on its own.
 */
export function ScrollScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let smoothed = 0;
    let w = 0;
    let h = 0;
    let last = -1;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = fitCanvas(canvas, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      last = -1;
    };

    const target = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      return range > 0 ? clamp01(window.scrollY / range) : 0;
    };

    const tick = () => {
      smoothed += (target() - smoothed) * 0.12;
      // Redraw only when the eased value actually moved a visible amount.
      if (Math.abs(smoothed - last) > 0.0006) {
        drawNovaFrame(ctx, w, h, smoothed);
        last = smoothed;
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    smoothed = target();
    drawNovaFrame(ctx, w, h, smoothed);
    last = smoothed;
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
