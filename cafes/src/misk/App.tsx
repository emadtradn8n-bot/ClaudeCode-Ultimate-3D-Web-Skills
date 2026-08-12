import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { makePhoto } from "../shared/photo";
import { MANIFEST, SLOTS } from "./assets";

const Photo = makePhoto(SLOTS, MANIFEST, {
  plate: "border border-dashed border-ink/20 bg-plaster-2",
  icon: "text-ink/30",
  label: "text-ink/60",
  note: "text-ink/35",
});

const LINKS = ["القائمة", "المحمصة", "الفروع", "الطلبات"];

/** Single dark control colour; the page is otherwise light. */
const CTA = { backgroundImage: "linear-gradient(to bottom, #3A332B, #201C17)" };

export default function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="relative h-screen w-full overflow-hidden supports-[height:100svh]:h-[100svh]">
      {/* Full-bleed room photograph. */}
      <div className="absolute inset-0">
        <Photo slot="hero" priority />
      </div>

      {/* Warm scrim so the bottom-anchored copy stays legible over any photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgb(243 239 232 / 0.96) 0%, rgb(243 239 232 / 0.72) 34%, rgb(243 239 232 / 0.15) 68%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <a href="#" className="display text-2xl text-ink">
            مِسك
          </a>

          <div className="hidden items-stretch gap-3 md:flex">
            <div className="flex items-center gap-1 rounded-full border border-hair bg-white/45 px-1.5 py-1.5 backdrop-blur-lg">
              {LINKS.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm text-ink-soft transition-colors duration-300 hover:bg-white/70 hover:text-ink"
                >
                  {l}
                  {l === "الفروع" && <ChevronDown className="h-3.5 w-3.5" />}
                </a>
              ))}
            </div>
            <button
              type="button"
              style={CTA}
              className="self-stretch rounded-full px-5 text-sm font-medium text-plaster transition-opacity duration-300 hover:opacity-90"
            >
              اطلب الآن
            </button>
          </div>

          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-hair bg-white/50 backdrop-blur-lg md:hidden"
          >
            <Menu
              className={`absolute h-5 w-5 text-ink transition-all duration-300 ${
                open ? "rotate-90 scale-0 opacity-0" : ""
              }`}
            />
            <X
              className={`absolute h-5 w-5 text-ink transition-all duration-300 ${
                open ? "" : "-rotate-90 scale-0 opacity-0"
              }`}
            />
          </button>
        </nav>

        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-ink/25 backdrop-blur-md transition-opacity duration-300 md:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <aside
          className={`fixed inset-y-0 start-0 z-40 flex w-72 flex-col bg-plaster/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
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
                  transform: open ? "translateX(0)" : "translateX(-24px)",
                  transition: `opacity 400ms ease ${(i + 1) * 60}ms, transform 400ms ease ${
                    (i + 1) * 60
                  }ms`,
                }}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base text-ink-soft transition-colors hover:bg-white/60 hover:text-ink"
              >
                {l}
                {l === "الفروع" && <ChevronDown className="h-4 w-4" />}
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
            <button
              type="button"
              style={CTA}
              className="w-full rounded-full py-3 text-sm font-medium text-plaster"
            >
              اطلب الآن
            </button>
          </div>
        </aside>

        {/* Bottom-anchored content */}
        <div className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <h1 className="display text-[clamp(2.1rem,5.2vw,3.6rem)] text-ink">
              قهوة تُشرب على مهل، في ضوء النهار
            </h1>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 flex flex-col gap-3 sm:mt-8 sm:inline-flex sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:border sm:border-hair sm:bg-white sm:p-1.5"
            >
              <label htmlFor="misk-email" className="sr-only">
                البريد الإلكتروني
              </label>
              <input
                id="misk-email"
                type="email"
                placeholder="بريدك الإلكتروني"
                className="rounded-full border border-hair bg-white px-5 py-3 text-sm text-ink placeholder-ink/40 outline-none sm:w-60 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-4 sm:py-2"
              />
              <button
                type="submit"
                style={CTA}
                className="rounded-full px-6 py-3 text-sm font-medium text-plaster transition-opacity duration-300 hover:opacity-90 sm:py-2.5"
              >
                اشترك
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
            <div className="flex flex-col justify-between rounded-2xl border border-hair bg-white/55 p-5 backdrop-blur-lg sm:w-60 sm:p-6">
              <span className="display text-4xl text-rose">١٢ ألف</span>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:mt-4">
                فنجان نقدّمه شهرياً من محمصتنا في نفس المبنى.
              </p>
            </div>

            <div className="rounded-2xl border border-hair bg-white/55 p-5 backdrop-blur-lg sm:w-60 sm:p-6">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-ink text-[0.7rem] font-bold text-plaster">
                  ن
                </span>
                <span className="text-sm font-bold text-ink">نورة الحربي</span>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">
                «أفضل مكان أشتغل منه في الرياض. الإضاءة طبيعية والقهوة ثابتة المستوى كل مرة.»
              </p>
              <div className="mt-4 flex items-center gap-3 sm:mt-5">
                {/* A monogram, not a photo slot: the pending plate is unreadable
                    at 36px, and a portrait is not needed to make the point. */}
                <span
                  aria-hidden
                  className="display flex h-9 w-9 items-center justify-center rounded-full bg-rose/15 text-base text-rose"
                >
                  ن
                </span>
                <div>
                  <div className="text-sm font-bold text-ink">زبونة دائمة</div>
                  <div className="text-xs text-ink-soft">منذ ٢٠٢١</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
