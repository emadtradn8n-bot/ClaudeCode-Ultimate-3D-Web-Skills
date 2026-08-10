import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CursorGlyph, Hamburger, Wordmark } from "./Marks";
import { Stage } from "./Stage";

gsap.registerPlugin(ScrollTrigger);

const IMAGES = Array.from({ length: 10 }, (_, i) => `/prmpt/archive-${String(i + 1).padStart(2, "0")}.svg`);

const SYMBOLS = ["8", "$", "^^", "%", "/"];

const EASE = [0.25, 0.1, 0.25, 1] as const;

/** Scatters `count` images across `cols` columns, leaving deliberate gaps. */
function buildLayout(count: number, cols: number): number[][] {
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

function useViewport() {
  const [v, setV] = useState({ w: 1280, mobile: false, tablet: false, touch: false });
  useEffect(() => {
    const read = () => {
      const w = window.innerWidth;
      setV({
        w,
        mobile: w < 640,
        tablet: w >= 640 && w < 1024,
        touch: window.matchMedia("(hover: none), (pointer: coarse)").matches || w < 1024,
      });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return v;
}

function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 hidden lg:block"
      style={{ transform: "translate(-50%, -50%)", mixBlendMode: "exclusion" }}
    >
      <CursorGlyph />
    </div>
  );
}

export default function App() {
  const { mobile, tablet, touch } = useViewport();
  const desktop = !mobile && !tablet;

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const cols = mobile ? 2 : tablet ? 3 : 4;
  const layout = buildLayout(IMAGES.length, cols);
  const outroOffset = desktop ? 166 : 132;

  // Panel slide-up is the one piece driven by ScrollTrigger; everything else
  // reads scroll position directly each frame.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel,
        { y: () => window.innerHeight },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${window.innerHeight}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, [cols]);

  // Spacer height has to cover the hero, the full gallery run and the outro.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner) return;

    const measure = () => {
      const vh = window.innerHeight;
      const maxScroll = Math.max(0, inner.scrollHeight - vh);
      root.style.height = `${vh + maxScroll + 2 * vh}px`;
      ScrollTrigger.refresh();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cols]);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    let raf = 0;
    let lastSymbol = 0;
    const cards = () => Array.from(document.querySelectorAll<HTMLElement>(".bp-card"));
    let list = cards();

    const frame = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const maxScroll = Math.max(0, inner.scrollHeight - vh);

      // Phase 2: once the panel is seated, scroll drives the grid upward.
      inner.style.transform = `translateY(${-Math.max(0, Math.min(y - vh, maxScroll))}px)`;

      if (list.length !== IMAGES.length) list = cards();
      for (const card of list) {
        const r = card.getBoundingClientRect();
        let s = 0;
        if (r.bottom > 0 && r.top < vh) {
          const enter = Math.min(1, (vh - r.top) / (vh * 0.6));
          const exit = Math.min(1, r.bottom / (vh * 0.4));
          s = Math.max(0, Math.min(enter, exit));
        }
        card.style.transform = `scale(${s.toFixed(3)})`;
      }

      // Outro: white sheet in, info lifts, buy button scales up, footer appears.
      const p = Math.max(0, Math.min(1, (y - vh - maxScroll) / Math.max(1, vh - 100)));
      if (overlayRef.current) overlayRef.current.style.opacity = String(p);
      if (infoRef.current) infoRef.current.style.transform = `translateY(${-p * outroOffset}px)`;
      if (buyRef.current) buyRef.current.style.transform = `scale(${p})`;
      if (footerRef.current) footerRef.current.style.opacity = String(p);
      if (stageRef.current) {
        stageRef.current.style.visibility = y > vh ? "hidden" : "visible";
      }

      const now = performance.now();
      if (symbolRef.current && now - lastSymbol > 80 && y > 0) {
        lastSymbol = now;
        symbolRef.current.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [outroOffset]);

  const blend = { mixBlendMode: "exclusion" as const };

  return (
    <div
      id="scroll-spacer"
      ref={rootRef}
      className="relative select-none bg-white"
      style={{ height: "500vh", cursor: desktop ? "none" : "auto" }}
    >
      <Cursor />

      <div ref={stageRef}>
        <Stage isTouch={touch} />
      </div>

      {/* Black gallery panel, parked below the fold until scroll lifts it. */}
      <div ref={panelRef} className="fixed inset-0 z-10 overflow-hidden bg-black">
        <div ref={innerRef} className="w-full" style={{ paddingTop: "min(400px, 40vh)" }}>
          {layout.map((row, ri) => (
            <div key={ri} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {row.map((idx, ci) =>
                idx === -1 ? (
                  <div key={ci} style={{ aspectRatio: "2 / 3" }} />
                ) : (
                  <div
                    key={ci}
                    className="bp-card"
                    style={{
                      aspectRatio: "2 / 3",
                      transform: "scale(0)",
                      transformOrigin: ci < cols / 2 ? "right bottom" : "left bottom",
                    }}
                  >
                    <img
                      src={IMAGES[idx]}
                      alt={`Archive study ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        id="outro-overlay"
        ref={overlayRef}
        className="pointer-events-none fixed inset-0 z-[12] bg-white"
        style={{ opacity: 0 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0 }}
        className="pointer-events-none fixed left-4 top-4 z-20 lg:left-8 lg:top-8"
        style={blend}
      >
        <Wordmark className="w-[124px] sm:w-[266px] lg:w-[355px]" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
        className="pointer-events-none fixed left-4 top-[118px] z-20 w-[calc(100vw-32px)] sm:top-[180px] sm:w-[calc(50vw-48px)] lg:left-8 lg:top-[244px] lg:w-[692px]"
        style={{
          ...blend,
          fontSize: 12,
          fontWeight: 500,
          lineHeight: "140%",
          letterSpacing: "-0.04em",
          color: "#FFFFFF",
        }}
      >
        When switching between videos near the center, do not reset currentTime to 0 abruptly. Add a
        small dead zone: if cursor is within +/-50px of center, keep both videos at currentTime = 0
        and show whichever was last active.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
        className="pointer-events-none fixed right-4 top-4 z-20 flex h-[30px] items-center justify-between lg:right-8 lg:top-8 lg:w-[330px]"
        style={blend}
      >
        <span className="hidden text-[15px] font-medium uppercase text-white lg:inline">About</span>
        <div className="flex items-center gap-5 lg:gap-[50px]">
          <Hamburger size={desktop ? 30 : 24} />
          <span className="text-[13px] font-medium text-white lg:text-[15px]">[ CART ]</span>
        </div>
      </motion.div>

      <motion.div
        id="outro-info"
        ref={infoRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
        data-outro-offset={outroOffset}
        className="pointer-events-none fixed inset-x-0 bottom-12 z-20 flex flex-col items-center lg:inset-x-auto lg:right-8 lg:bottom-20 lg:w-[330px]"
        style={blend}
      >
        <div className="mb-3 flex w-[252px] flex-col items-start lg:mb-8 lg:w-full">
          <div className="relative h-5 w-5 lg:h-[30px] lg:w-[30px]">
            <svg viewBox="0 0 40 40" className="h-full w-full">
              <circle
                cx="20"
                cy="20"
                r="18.75"
                fill="none"
                stroke="#fff"
                strokeWidth={desktop ? 2.5 : 2}
              />
            </svg>
            <span
              id="circle-symbol"
              ref={symbolRef}
              className="absolute inset-0 flex items-center justify-center text-[10px] font-medium uppercase text-white lg:text-[15px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              8
            </span>
          </div>
          <span
            className="w-full text-center text-[20px] font-medium uppercase leading-none text-white lg:text-[30px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            ARCHIVE COLLECTION
            <br />
            "PROMPT"
          </span>
        </div>
        <span
          className="text-center text-[60px] font-medium leading-none text-white lg:text-[80px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          $97,33
        </span>
      </motion.div>

      <div
        id="outro-buy"
        ref={buyRef}
        className="pointer-events-none fixed inset-x-4 bottom-[60px] z-20 flex h-[100px] items-center justify-center lg:inset-x-auto lg:right-8 lg:bottom-8 lg:h-[174px] lg:w-[330px]"
        style={{
          ...blend,
          background: "#fff",
          borderRadius: 1335,
          transform: "scale(0)",
          transformOrigin: "right bottom",
        }}
      >
        <span
          className="text-[72px] font-medium leading-none lg:text-[110px]"
          style={{ letterSpacing: "-0.04em", color: "#fff", mixBlendMode: "exclusion" }}
        >
          view
        </span>
      </div>

      <div
        id="outro-footer"
        ref={footerRef}
        className="pointer-events-none fixed bottom-6 left-4 right-4 z-20 flex justify-between lg:bottom-8 lg:right-auto lg:justify-start lg:gap-20"
        style={{ ...blend, opacity: 0 }}
      >
        <span
          className="text-[11px] font-medium uppercase text-white lg:text-[13px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          PRMPT (R) 2026
        </span>
        <span
          className="text-[11px] font-medium uppercase text-white lg:text-[13px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          PRIVACY POLICY
        </span>
      </div>
    </div>
  );
}
