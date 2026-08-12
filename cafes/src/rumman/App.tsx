import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { makePhoto } from "../shared/photo";
import { MANIFEST, SLOTS } from "./assets";
import { DRINKS } from "./drinks";

// Plates need real presence here: in a carousel the product image *is* the
// composition, so a faint outline would read as empty space.
const Photo = makePhoto(SLOTS, MANIFEST, {
  plate: "rounded-3xl border-2 border-dashed border-white/45 bg-black/25 backdrop-blur-[2px]",
  icon: "text-white/60",
  label: "text-white",
  note: "text-white/55",
});

const TURN = 650;
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

type Role = "center" | "right" | "left" | "back";

/** Where each carousel slot sits, as a share of the viewport. */
function placement(role: Role, mobile: boolean) {
  switch (role) {
    case "center":
      // Sized by height alone. An extra scale() would push the card past the
      // viewport, since unlike a contained photo it has no transparent margin.
      return {
        insetInlineStart: "50%",
        translate: "50%",
        scale: 1,
        height: mobile ? "44%" : "66%",
        bottom: mobile ? "28%" : "13%",
        blur: 0,
        opacity: 1,
        z: 20,
      };
    case "right":
      return {
        insetInlineStart: mobile ? "18%" : "27%",
        translate: "50%",
        scale: 1,
        height: mobile ? "15%" : "26%",
        bottom: mobile ? "34%" : "16%",
        blur: 2,
        opacity: 0.85,
        z: 10,
      };
    case "left":
      return {
        insetInlineStart: mobile ? "82%" : "73%",
        translate: "50%",
        scale: 1,
        height: mobile ? "15%" : "26%",
        bottom: mobile ? "34%" : "16%",
        blur: 2,
        opacity: 0.85,
        z: 10,
      };
    default:
      return {
        insetInlineStart: "50%",
        translate: "50%",
        scale: 1,
        height: mobile ? "12%" : "20%",
        bottom: mobile ? "34%" : "16%",
        blur: 4,
        opacity: 1,
        z: 5,
      };
  }
}

export default function App() {
  const [index, setIndex] = useState(0);
  const [mobile, setMobile] = useState(false);
  const locked = useRef(false);

  useEffect(() => {
    const read = () => setMobile(window.innerWidth < 640);
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const turn = useCallback((dir: 1 | -1) => {
    if (locked.current) return;
    locked.current = true;
    setIndex((p) => (p + dir + DRINKS.length) % DRINKS.length);
    window.setTimeout(() => {
      locked.current = false;
    }, TURN);
  }, []);

  // Arrow keys drive the carousel too; in RTL, left means "next".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") turn(1);
      if (e.key === "ArrowRight") turn(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  const active = DRINKS[index];
  const roleOf = (i: number): Role => {
    if (i === index) return "center";
    if (i === (index + 1) % DRINKS.length) return "left";
    if (i === (index + DRINKS.length - 1) % DRINKS.length) return "right";
    return "back";
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: active.bg,
        color: active.ink,
        transition: `background-color ${TURN}ms ${EASE}, color ${TURN}ms ${EASE}`,
      }}
    >
      <div className="relative h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh]">
        <div className="grain pointer-events-none absolute inset-0 z-50" aria-hidden />

        {/* Brand mark, anchored to the reading edge. */}
        <span className="display absolute end-5 top-6 z-40 text-xl opacity-95 sm:end-9">
          رمّان
        </span>

        {/* Oversized ghost wordmark sitting behind the drinks. */}
        <span
          aria-hidden
          className="display pointer-events-none absolute inset-x-0 z-[2] select-none text-center leading-none opacity-100"
          style={{ top: "16%", fontSize: "clamp(84px, 22vw, 300px)" }}
        >
          رمّان
        </span>

        {/* Soft colour wash that follows the active drink. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3"
          style={{
            background: `radial-gradient(60% 70% at 50% 100%, ${active.panel} 0%, transparent 72%)`,
            transition: `background ${TURN}ms ${EASE}`,
          }}
        />

        {/* Carousel */}
        <div className="absolute inset-0 z-[3]">
          {DRINKS.map((d, i) => {
            const role = roleOf(i);
            const p = placement(role, mobile);
            return (
              <div
                key={d.id}
                aria-hidden={role !== "center"}
                style={{
                  position: "absolute",
                  aspectRatio: "0.6 / 1",
                  insetInlineStart: p.insetInlineStart,
                  bottom: p.bottom,
                  height: p.height,
                  zIndex: p.z,
                  opacity: p.opacity,
                  filter: p.blur ? `blur(${p.blur}px)` : "none",
                  transform: `translateX(${p.translate}) scale(${p.scale})`,
                  transition: `transform ${TURN}ms ${EASE}, filter ${TURN}ms ${EASE}, opacity ${TURN}ms ${EASE}, inset-inline-start ${TURN}ms ${EASE}, height ${TURN}ms ${EASE}, bottom ${TURN}ms ${EASE}`,
                  willChange: "transform, filter, opacity",
                }}
              >
                <Photo slot={d.photo} alt={d.ar} priority={i === 0} />
              </div>
            );
          })}
        </div>

        {/* Copy + controls */}
        <div className="absolute bottom-6 end-5 z-40 max-w-[330px] sm:bottom-16 sm:end-14">
          <p className="display text-2xl leading-tight sm:text-[30px]">{active.ar}</p>
          <p className="mt-1 text-[0.7rem] tracking-[0.18em] opacity-70">{active.en}</p>
          <p className="mt-3 hidden text-sm leading-relaxed opacity-85 sm:block">{active.note}</p>
          <p className="mt-3 text-lg font-bold">{active.price} ر.س</p>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              aria-label="المشروب السابق"
              onClick={() => turn(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-current transition-[transform,background-color] duration-150 hover:scale-105 hover:bg-white/15 sm:h-14 sm:w-14"
            >
              <ArrowRight size={24} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="المشروب التالي"
              onClick={() => turn(1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-current transition-[transform,background-color] duration-150 hover:scale-105 hover:bg-white/15 sm:h-14 sm:w-14"
            >
              <ArrowLeft size={24} strokeWidth={2.25} />
            </button>

            {/* ltr so the counter does not read back-to-front in an RTL page */}
            <span dir="ltr" className="ms-2 text-xs tabular-nums opacity-60">
              {index + 1} / {DRINKS.length}
            </span>
          </div>
        </div>

        {/* Order call to action on the opposite corner. */}
        <a
          href="#order"
          className="display absolute bottom-6 start-5 z-40 flex items-center gap-2 leading-none opacity-95 transition-opacity duration-200 hover:opacity-100 sm:bottom-16 sm:start-10"
          style={{ fontSize: "clamp(22px, 4vw, 52px)" }}
        >
          اطلب الآن
          <ArrowLeft className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={2.25} />
        </a>
      </div>
    </div>
  );
}
