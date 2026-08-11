import { useState } from "react";
import { ArrowLeft, Clock, MapPin, Phone } from "lucide-react";
import { BreezeBackdrop } from "./BreezeBackdrop";
import { Photo } from "./Photo";
import { Reveal } from "./shared/Reveal";
import { SECTIONS } from "./shared/menu";

const NAV = [
  { href: "#menu", label: "القائمة" },
  { href: "#place", label: "المكان" },
  { href: "#story", label: "حكايتنا" },
  { href: "#visit", label: "الزيارة" },
];

const PAD = "px-5 sm:px-8 lg:px-14";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-block border-e-2 border-sage pe-3 font-mono text-[0.68rem] tracking-[0.2em] text-sage">
      {children}
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ground/70 backdrop-blur-lg">
      <div className={`flex items-center justify-between py-4 ${PAD}`}>
        <a href="#top" className="display text-2xl text-cream">
          النسمة
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm text-cream/70 transition-colors duration-300 hover:text-sage"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#visit"
            className="rounded-full bg-sage px-5 py-2 text-xs font-semibold text-[#14180f] transition-opacity duration-300 hover:opacity-85 sm:text-sm"
          >
            احجز طاولة
          </a>
          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
          >
            <span
              className={`h-px w-5 bg-cream transition-transform duration-300 ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span className={`h-px w-5 bg-cream transition-opacity ${open ? "opacity-0" : ""}`} />
            <span
              className={`h-px w-5 bg-cream transition-transform duration-300 ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <nav
        className={`grid overflow-hidden border-t border-line transition-[grid-template-rows] duration-400 md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent"
        }`}
      >
        <div className="min-h-0">
          <div className={`flex flex-col gap-1 py-3 ${PAD}`}>
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-cream/80 transition-colors hover:bg-raised hover:text-sage"
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="top"
      className={`flex min-h-screen flex-col justify-end gap-14 pb-16 pt-32 supports-[height:100svh]:min-h-[100svh] ${PAD}`}
    >
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <Reveal delay={80}>
            <Eyebrow>محمصة وكوفي · منذ ٢٠١٨</Eyebrow>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="display max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] text-cream">
              نسمة تمرّ، وفنجان يبقى
            </h1>
          </Reveal>

          <Reveal delay={340}>
            <p className="mt-6 max-w-[46ch] text-cream/65 sm:text-lg">
              نحمّص على دفعات صغيرة ونحضّر أمامك. قائمة قصيرة نتقنها، وركن هادئ يستحق أن تجلس فيه
              أطول مما نويت.
            </p>
          </Reveal>

          <Reveal delay={460}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-[#17170f] transition-opacity duration-300 hover:opacity-85"
              >
                تصفّح القائمة
                <ArrowLeft size={16} />
              </a>
              <a
                href="#story"
                className="rounded-full border border-line px-6 py-3 text-sm text-cream/85 transition-colors duration-300 hover:border-sage hover:text-sage"
              >
                حكايتنا
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={560}>
          <div className="overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: "4 / 3" }}>
            <Photo slot="hero" priority />
          </div>
        </Reveal>
      </div>

      <Reveal delay={680}>
        <dl className="grid grid-cols-2 gap-6 border-t border-line pt-7 sm:grid-cols-4">
          {[
            ["٧ ص", "نفتح كل يوم"],
            ["١٢", "صنفاً في القائمة"],
            ["٤٨ س", "أقصى عمر للتحميص"],
            ["٣٢", "مقعداً في الصالة"],
          ].map(([big, small]) => (
            <div key={small}>
              <dt className="display text-3xl text-sage">{big}</dt>
              <dd className="mt-1 text-xs text-cream/50">{small}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

function Menu() {
  const [tab, setTab] = useState<(typeof SECTIONS)[number]["id"]>(SECTIONS[0].id);
  const active = SECTIONS.find((s) => s.id === tab) ?? SECTIONS[0];

  return (
    <section id="menu" className={`py-24 sm:py-32 ${PAD}`}>
      <Reveal>
        <Eyebrow>القائمة</Eyebrow>
        <h2 className="display max-w-[18ch] text-[clamp(2rem,4.4vw,3.2rem)] text-cream">
          كل صنف نقدّمه، نشربه بأنفسنا أولاً
        </h2>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-9 flex flex-wrap gap-2" role="tablist" aria-label="أقسام القائمة">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === tab}
              onClick={() => setTab(s.id)}
              className={`rounded-full border px-5 py-2 text-sm transition-colors duration-300 ${
                s.id === tab
                  ? "border-sage bg-sage text-[#14180f]"
                  : "border-line text-cream/70 hover:border-sage hover:text-sage"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {active.items.map((item, i) => (
          <Reveal key={item.id} delay={100 + i * 90}>
            <article className="group h-full overflow-hidden rounded-2xl border border-line bg-raised/60 transition-colors duration-300 hover:border-sage/45">
              <div className="overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
                <Photo slot={item.photo} alt={item.ar} />
              </div>
              <div className="flex flex-col gap-2 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold text-cream">{item.ar}</h3>
                  <span className="shrink-0 font-mono text-sm text-sage">{item.price} ر.س</span>
                </div>
                <p className="font-mono text-[0.66rem] tracking-[0.14em] text-cream/35">
                  {item.en}
                </p>
                <p className="text-sm leading-relaxed text-cream/60">{item.desc}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="story" className={`py-24 sm:py-32 ${PAD}`}>
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: "3 / 4" }}>
            <Photo slot="barista" />
          </div>
        </Reveal>

        <Reveal delay={140}>
          <Eyebrow>حكايتنا</Eyebrow>
          <h2 className="display max-w-[17ch] text-[clamp(2rem,4.4vw,3.2rem)] text-cream">
            بدأنا بمحمصة صغيرة وطاولتين
          </h2>
          <p className="mt-6 max-w-[52ch] text-cream/65">
            في ٢٠١٨ كان المكان غرفة واحدة، ومحمصة تكفي خمسة كيلو في اليوم. لم تتغير الفكرة منذ ذلك
            الحين: حبة نعرف مصدرها، تحميص قريب من يوم التقديم، وتحضير أمام الضيف لا خلف جدار.
          </p>
          <p className="mt-4 max-w-[52ch] text-cream/65">
            كبرت الصالة، وبقيت القائمة قصيرة عن قصد. ما لا نتقنه، لا نقدّمه.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-line" style={{ aspectRatio: "3 / 2" }}>
              <Photo slot="beans" />
            </div>
            <div className="overflow-hidden rounded-xl border border-line" style={{ aspectRatio: "3 / 2" }}>
              <Photo slot="bar" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Place() {
  return (
    <section id="place" className={`py-24 sm:py-32 ${PAD}`}>
      <Reveal>
        <Eyebrow>المكان</Eyebrow>
        <h2 className="display max-w-[16ch] text-[clamp(2rem,4.4vw,3.2rem)] text-cream">
          ضوء طبيعي، وصوت مطحنة بعيد
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Reveal delay={100} className="md:col-span-2">
          <div className="h-full overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: "16 / 10" }}>
            <Photo slot="interior" />
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="h-full overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: "4 / 5" }}>
            <Photo slot="overview" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Visit() {
  const rows = [
    { icon: MapPin, title: "العنوان", body: "شارع الأمير سلطان، حي النخيل، الرياض" },
    { icon: Phone, title: "الهاتف", body: "+966 5X XXX XXXX", ltr: true },
    { icon: Clock, title: "الدوام", body: "السبت إلى الخميس ٧ ص - ١١ م · الجمعة ١ م - ١٢ ص" },
  ];

  return (
    <section id="visit" className={`py-24 sm:py-32 ${PAD}`}>
      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <Eyebrow>الزيارة</Eyebrow>
          <h2 className="display max-w-[14ch] text-[clamp(2rem,4.4vw,3.2rem)] text-cream">
            مرّ علينا، الفنجان الأول علينا
          </h2>

          <ul className="mt-9 flex flex-col gap-6">
            {rows.map(({ icon: Icon, title, body, ltr }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sage/35 text-sage">
                  <Icon size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-cream">{title}</h3>
                  <p className="text-sm text-cream/60" dir={ltr ? "ltr" : undefined}>
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={140}>
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-line bg-raised/50 p-8 text-center text-sm text-cream/40">
            مكان مخصص لخريطة Google Maps التفاعلية
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="relative">
      <BreezeBackdrop />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Menu />
          <Story />
          <Place />
          <Visit />
        </main>
        <footer className={`border-t border-line py-10 ${PAD}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="display text-xl text-cream">النسمة</span>
            <div className="flex gap-6 text-sm text-cream/55">
              <a href="#" className="transition-colors hover:text-sage">
                انستغرام
              </a>
              <a href="#" className="transition-colors hover:text-sage">
                تويتر
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-cream/35">© ٢٠٢٦ مقهى النسمة. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    </div>
  );
}
