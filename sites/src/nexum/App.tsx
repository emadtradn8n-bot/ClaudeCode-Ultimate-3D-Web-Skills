import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AmbientScene } from "./AmbientScene";

const LINKS = ["Modules", "Clientele", "Solutions", "Billing"];

const CTA_GRADIENT = { backgroundImage: "linear-gradient(to bottom, #2B2B2B, #101010)" };

/** Near-black on small screens, white from lg up, where the backdrop darkens. */
const FLIP = "text-[#010101] lg:text-white";

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2">
      <svg
        width="24"
        height="24"
        viewBox="0 0 256 256"
        aria-hidden
        className="fill-[#010101] lg:fill-white"
      >
        <path d="M 128 128 C 128 198.692 70.692 256 0 256 C 0 185.308 57.308 128 128 128 Z M 128 128 C 198.692 128 256 185.308 256 256 C 185.308 256 128 198.692 128 128 Z M 0 0 C 70.692 0 128 57.308 128 128 C 57.308 128 0 70.692 0 0 Z M 256 0 C 256 70.692 198.692 128 128 128 C 128 57.308 185.308 0 256 0 Z" />
      </svg>
      <span className={`text-lg font-semibold ${FLIP}`}>nexum</span>
    </a>
  );
}

function GetStarted({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      style={CTA_GRADIENT}
      className={`rounded-full text-sm font-medium text-white transition-opacity duration-300 hover:opacity-90 ${className}`}
    >
      Get started
    </button>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AmbientScene />

      <div className="relative z-10 flex h-full flex-col">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <Logo />

          <div className="hidden items-stretch gap-3 md:flex">
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg">
              {LINKS.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                >
                  {l}
                  {l === "Solutions" && <ChevronDown className="h-3.5 w-3.5" />}
                </a>
              ))}
            </div>
            <GetStarted className="self-stretch px-5" />
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-lg md:hidden"
          >
            <Menu
              className={`absolute h-5 w-5 transition-all duration-300 ${FLIP} ${
                open ? "rotate-90 scale-0 opacity-0" : ""
              }`}
            />
            <X
              className={`absolute h-5 w-5 transition-all duration-300 ${FLIP} ${
                open ? "" : "-rotate-90 scale-0 opacity-0"
              }`}
            />
          </button>
        </nav>

        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col gap-2 px-6 pt-24">
            {LINKS.map((l, i) => (
              <a
                key={l}
                href="#"
                onClick={() => setOpen(false)}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(24px)",
                  transition: `opacity 400ms ease ${(i + 1) * 60}ms, transform 400ms ease ${
                    (i + 1) * 60
                  }ms`,
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {l}
                {l === "Solutions" && <ChevronDown className="h-4 w-4" />}
              </a>
            ))}
          </div>

          <div
            className="mt-auto px-6 pb-10"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 400ms ease 300ms, transform 400ms ease 300ms",
            }}
          >
            <GetStarted className="w-full py-3" />
          </div>
        </aside>

        <div className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <h1
              className={`text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-[3.5rem] ${FLIP}`}
            >
              Ship AI workers that grind while you rest
            </h1>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 flex flex-col gap-3 sm:mt-8 sm:inline-flex sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:bg-white sm:p-1.5"
            >
              <input
                type="email"
                placeholder="Type your email"
                aria-label="Email address"
                className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2"
              />
              <GetStarted className="px-6 py-3 sm:py-2.5" />
            </form>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
            <div className="flex flex-col justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
              <span
                style={{ fontFamily: "'Silkscreen', cursive" }}
                className={`text-3xl font-normal tracking-tight sm:text-4xl ${FLIP}`}
              >
                42,500+
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[#010101]/70 sm:mt-4 lg:text-white/70">
                Teams run Nexum to handle recurring ops daily.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-black text-xs font-bold text-white">
                  S
                </span>
                <span className={`text-sm font-semibold ${FLIP}`}>Stratify</span>
              </div>

              <p className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80">
                "With Nexum we went from managing tedious operational work to having AI agents that
                handle everything."
              </p>

              <div className="mt-4 flex items-center gap-3 sm:mt-5">
                <img
                  src="/nexum/avatar.svg"
                  alt="Sara Klein"
                  className="h-9 w-9 rounded-full bg-white/20 object-cover"
                />
                <div>
                  <div className={`text-sm font-semibold ${FLIP}`}>Sara Klein</div>
                  <div className="text-xs text-[#010101]/60 lg:text-white/60">Dir of Operations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
