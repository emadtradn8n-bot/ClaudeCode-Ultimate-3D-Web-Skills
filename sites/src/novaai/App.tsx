import { ChevronRight, Hexagon } from "lucide-react";
import { Reveal } from "../shared/Reveal";
import { ScrollScene } from "./ScrollScene";

const NAV = ["Projects", "About", "Blog", "Contact"];

const SERVICES = ["/ AI AUTOMATION", "/ AI INTEGRATION", "/ AI AGENT DEVELOPMENT"];

const CAPABILITIES = [
  {
    n: "01",
    title: "Real-time vision",
    body: "Reads context as it happens and surfaces what matters before you ask.",
  },
  {
    n: "02",
    title: "Layered insight",
    body: "Moves from rough outline to sharp output without losing the thread.",
  },
  {
    n: "03",
    title: "Adaptive speed",
    body: "Learns your cadence and tightens every pass as you work.",
  },
];

const BADGE =
  "inline-block border-l-2 border-white bg-white/15 px-3 py-1.5 backdrop-blur-md font-mono text-[11px] uppercase tracking-[0.15em] text-white";

const HEADLINE =
  "text-5xl font-normal leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl";

const SHELL =
  "relative flex min-h-screen flex-col justify-between px-5 pt-24 pb-12 supports-[height:100svh]:min-h-[100svh] sm:px-8 sm:pt-28 md:px-12 md:pb-16";

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15">
      <div className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-12">
        <Reveal delay={0}>
          <a href="#" className="flex items-center gap-2 text-lg font-medium tracking-tight sm:text-xl">
            <Hexagon size={24} strokeWidth={1.5} />
            novaai
          </a>
        </Reveal>

        <nav className="hidden items-center gap-8 md:flex lg:gap-10">
          {NAV.map((item, i) => (
            <Reveal key={item} delay={100 + i * 100}>
              <a
                href="#"
                className="text-sm text-white/85 transition-colors duration-300 hover:text-white"
              >
                {item}
                {item === "Projects" && (
                  <sup className="ml-0.5 font-mono text-[10px] text-white/60">6</sup>
                )}
              </a>
            </Reveal>
          ))}
        </nav>

        <Reveal delay={500}>
          <button
            type="button"
            className="rounded-md border border-white/20 bg-white/15 px-4 py-2 text-xs backdrop-blur-md transition-colors duration-300 hover:bg-white/25 sm:px-5 sm:text-sm"
          >
            Get Free Consultation
          </button>
        </Reveal>
      </div>
    </header>
  );
}

function SectionOne() {
  return (
    <section className={SHELL}>
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <ul className="flex flex-col gap-2">
          {SERVICES.map((s, i) => (
            <Reveal as="li" key={s} delay={150 + i * 120}>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/90 drop-shadow-md">
                {s}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={300} className="max-w-xs sm:text-right">
          <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">
            We design automation that brings clarity, precision, and efficiency to the way your
            company operates.
          </p>
        </Reveal>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal delay={150} className="mb-5">
            <span className={BADGE}>We Automate 100+ Businesses</span>
          </Reveal>
          <Reveal delay={280}>
            <h1 className={HEADLINE}>
              Clear. Precise.
              <br />
              Automated.
            </h1>
          </Reveal>
        </div>

        <Reveal delay={420}>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-3 backdrop-blur-md">
            <img
              src="/novaai/portrait.svg"
              alt="Mitha, co-founder of NovaAI"
              className="h-24 w-20 rounded-lg object-cover"
            />
            <div className="flex flex-col gap-1.5 pr-2">
              <span className="text-sm font-medium text-white">Talk with Mitha</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
                Co-founder of NovaAI
              </span>
              <button
                type="button"
                className="mt-1.5 inline-flex items-center gap-1 self-start rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85"
              >
                Book 15-mins call
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SectionTwo() {
  return (
    <section className={SHELL}>
      <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
        <Reveal delay={120}>
          <span className={BADGE}>Insight On Demand</span>
        </Reveal>

        <Reveal delay={220} className="max-w-sm sm:text-right">
          <p className="text-lg leading-relaxed text-white drop-shadow-md sm:text-xl">
            Our AI doesn't just respond — it interprets, sharpens, and delivers the signal you need.
          </p>
        </Reveal>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
        <div className="max-w-xl">
          <Reveal delay={180}>
            <h2 className={HEADLINE}>
              Learn to see
              <br />
              brilliantly.
            </h2>
          </Reveal>

          <Reveal delay={320}>
            <p className="mt-6 max-w-md text-sm text-white/80 drop-shadow-md sm:text-base">
              From the first sketch to the final render, Nova turns raw intent into decisions your
              team can act on — quietly, precisely, at speed.
            </p>
          </Reveal>

          <Reveal delay={420}>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-black transition-colors duration-300 hover:bg-white/85 sm:text-sm"
              >
                Run the demo
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-xs backdrop-blur-md transition-colors duration-300 hover:bg-white/20 sm:text-sm"
              >
                Free consultation
              </button>
            </div>
          </Reveal>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 px-5 backdrop-blur-md sm:px-6">
          {CAPABILITIES.map((c, i) => (
            <Reveal
              key={c.n}
              delay={300 + i * 110}
              className={i < CAPABILITIES.length - 1 ? "border-b border-white/15" : ""}
            >
              <div className="group flex gap-5 py-5">
                <span className="font-mono text-[11px] tracking-[0.15em] text-white/55">{c.n}</span>
                <div>
                  <h3 className="flex items-center gap-2 text-base font-medium text-white sm:text-lg">
                    {c.title}
                    <ChevronRight
                      size={16}
                      className="text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{c.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="relative">
      <ScrollScene />
      <div className="relative z-10">
        <Navbar />
        <main>
          <SectionOne />
          {/* Gives the scroll scrub room to travel between the two sections. */}
          <div aria-hidden className="h-[80vh]" />
          <SectionTwo />
        </main>
      </div>
    </div>
  );
}
