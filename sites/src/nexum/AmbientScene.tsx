import { useEffect, useRef } from "react";
import { fitCanvas } from "../shared/field";
import { drawNexumFrame } from "../shared/nexumScene";

/** Continuously looping full-bleed backdrop. Pauses under reduced-motion. */
export function AmbientScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const start = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = fitCanvas(canvas, w, h);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still) drawNexumFrame(ctx, w, h, 0);
    };

    const tick = (now: number) => {
      drawNexumFrame(ctx, w, h, (now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (still) drawNexumFrame(ctx, w, h, 0);
    else raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />;
}
