import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, MapPin, Plus, Search, ShoppingBag } from "lucide-react";
import { Scene, scrollRef } from "./scene/Scene";
import { MENU, NAV, type Focus } from "./data";

gsap.registerPlugin(ScrollTrigger);

const PAD = "px-5 sm:px-8 lg:px-14";

/*
  العمود التحريري: كل المحتوى بعد قسم البطل يلتصق ببداية السطر (اليمين في RTL)
  ويترك الممرّ الأيسر فارغاً — وهو الممرّ الذي ينزلق فيه الكوب أثناء التمرير.

  الهامش التلقائي على النهاية (me-auto) لا البداية: الهامش التلقائي يدفع العنصر
  بعيداً عن الجهة التي وُضع عليها، فـ ms-auto كان يرميه إلى اليسار فوق الكوب.
*/
const COL = "me-auto w-full max-w-[34rem] lg:ms-[4vw]";

export default function App() {
  const [focus, setFocus] = useState<Focus | null>(null);
  const [cart, setCart] = useState(2);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  /* ===== ربط التمرير: يغذّي حركة الكاميرا ويحرّك البطاقات الزجاجية ===== */
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      // تقدّم عام ٠→١ يقرأه المشهد ثلاثي الأبعاد
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollRef.current = self.progress;
        },
      });

      // البطاقات تنزلق من جهة العمود نفسه (اليمين) فتبدو كأنها تُرصّ فوق بعضها
      const cards = gsap.utils.toArray<HTMLElement>(".ghaim-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, x: 38, y: 26 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={root} className="relative">
      {/* ===== المشهد ثلاثي الأبعاد — طبقة ثابتة خلف كل شيء ===== */}
      <Scene focus={focus} reduced={reduced} />

      {/* ===== شريط التنقّل الزجاجي ===== */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className={`flex items-center justify-between gap-4 py-3.5 ${PAD}`}>
          <a href="#top" className="glass flex items-center gap-2.5 rounded-full px-5 py-2">
            <span className="display text-2xl leading-none text-espresso">غَيْم</span>
            <span className="latin hidden text-[0.62rem] uppercase text-espresso/58 sm:inline">
              Ghaim
            </span>
          </a>

          <nav className="glass hidden items-center gap-1 rounded-full px-1.5 py-1.5 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-full px-4 py-1.5 text-sm text-espresso/78 transition-colors duration-300 hover:bg-white/60 hover:text-espresso"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="بحث"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-espresso/78 transition-colors hover:text-espresso"
            >
              <Search size={17} />
            </button>
            <button
              type="button"
              aria-label={`سلّة التسوّق، ${cart} أصناف`}
              className="glass relative flex h-10 w-10 items-center justify-center rounded-full text-espresso/78 transition-colors hover:text-espresso"
            >
              <ShoppingBag size={17} />
              <span
                dir="ltr"
                className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel px-1 text-[0.62rem] font-medium text-white"
              >
                {cart}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ===== ودجة ساعات العمل ===== */}
      <motion.aside
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="glass fixed bottom-5 start-5 z-40 hidden items-center gap-3 rounded-2xl px-4 py-3 lg:flex"
      >
        <Clock size={16} className="text-caramel" />
        <div>
          <div className="text-[0.7rem] text-espresso/74">ساعات العمل</div>
          <div dir="ltr" className="latin text-sm text-espresso">
            6:00 AM — 1:00 AM
          </div>
        </div>
      </motion.aside>

      {/* ===== القسم الأول: البطل ===== */}
      <section
        id="top"
        className={`relative z-10 flex min-h-screen flex-col items-center pt-[13vh] text-center supports-[height:100svh]:min-h-[100svh] ${PAD}`}
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="latin mb-5 text-[0.7rem] uppercase text-espresso/74"
        >
          Cloud Specialty Coffee
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="display max-w-[16ch] text-[clamp(2.2rem,6vw,4.6rem)] text-espresso"
        >
          تحليق في سماء القهوة المختصة
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-[42ch] text-espresso/72 sm:text-lg"
        >
          رشفة تحلّق بك فوق الغمام — حبّة مختارة، تحميص خفيف، وطبقات تُبنى أمامك.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#menu"
            className="rounded-full bg-espresso px-7 py-3.5 text-sm font-medium text-cream transition-opacity duration-300 hover:opacity-88"
          >
            اطلب الآن
          </a>
          <a
            href="#menu"
            className="glass latin rounded-full px-7 py-3.5 text-sm text-espresso transition-colors duration-300 hover:bg-white/70"
          >
            Order Online
          </a>
        </motion.div>
      </section>

      {/* ===== مساحة تسمح للكاميرا بالتحرّك قبل ظهور البطاقات ===== */}
      <div aria-hidden className="h-[46vh]" />

      {/* ===== القائمة: بطاقات زجاجية عائمة في العمود التحريري ===== */}
      <section id="menu" ref={cardsRef} className={`relative z-10 py-24 ${PAD}`}>
        <div className={COL}>
          <div className="mb-10 text-center lg:text-start">
            <span className="latin text-[0.7rem] uppercase text-espresso/58">Selected Menu</span>
            <h2 className="display mt-2 text-[clamp(1.7rem,3.6vw,2.7rem)] text-espresso">
              مختارات من فوق الغيم
            </h2>
          </div>

          <div className="grid gap-5">
          {MENU.map((item) => (
            <article
              key={item.id}
              onMouseEnter={() => setFocus(item.focus)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(item.focus)}
              onBlur={() => setFocus(null)}
              tabIndex={0}
              className="ghaim-card glass-strong group rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="display text-xl text-espresso">{item.ar}</h3>
                  <p className="latin mt-0.5 text-[0.72rem] uppercase text-espresso/58">{item.en}</p>
                </div>
                <span dir="ltr" className="latin shrink-0 text-lg text-caramel-deep">
                  {item.price} SAR
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-espresso/72">{item.note}</p>

              <button
                type="button"
                onClick={() => setCart((c) => c + 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-espresso/92 px-5 py-2.5 text-xs font-medium text-cream transition-transform duration-200 active:scale-[0.97]"
              >
                <Plus size={14} />
                إضافة سريعة
              </button>
            </article>
          ))}
          </div>
        </div>
      </section>

      {/* ===== عن غيم ===== */}
      <section id="about" className={`relative z-10 py-24 ${PAD}`}>
        <div className={`${COL} glass-strong ghaim-card rounded-[2rem] p-8 text-center sm:p-12`}>
          <span className="latin text-[0.7rem] uppercase text-espresso/58">Our Craft</span>
          <h2 className="display mt-2 text-[clamp(1.6rem,3.4vw,2.4rem)] text-espresso">
            نحمّص خفيفاً لتبقى الحبّة صادقة
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-espresso/74">
            نختار دفعات صغيرة من مزارع نعرف أسماء أصحابها، ونحمّصها تحميصاً فاتحاً يُبقي حموضة
            الفاكهة وعطر الزهر. لا نضيف شيئاً يخفي أصل القهوة.
          </p>

          <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-hair pt-7">
            {[
              ["٤٨ س", "أقصى عمر للتحميص"],
              ["٣", "مزارع شريكة"],
              ["٩٢", "نقطة تحكيم"],
            ].map(([big, small]) => (
              <div key={small}>
                <dt className="display text-2xl text-caramel-deep">{big}</dt>
                <dd className="mt-1 text-[0.7rem] text-espresso/74">{small}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===== الفروع ===== */}
      <section id="branches" className={`relative z-10 pb-28 pt-4 ${PAD}`}>
        <div className={`${COL} grid gap-4`}>
          {[
            { ar: "غَيْم — الملقا", en: "Al Malqa", addr: "طريق الأمير محمد بن سلمان، الرياض" },
            { ar: "غَيْم — الخبر", en: "Al Khobar", addr: "شارع الأمير فيصل بن فهد، الخبر" },
          ].map((b) => (
            <div key={b.en} className="ghaim-card glass-strong flex items-start gap-4 rounded-3xl p-6">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caramel/15 text-caramel-deep">
                <MapPin size={17} />
              </span>
              <div>
                <h3 className="display text-lg text-espresso">{b.ar}</h3>
                <p className="latin text-[0.7rem] uppercase text-espresso/58">{b.en}</p>
                <p className="mt-1.5 text-sm text-espresso/72">{b.addr}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="mx-auto mt-14 max-w-4xl border-t border-hair pt-7 text-center">
          <span className="display text-xl text-espresso">غَيْم</span>
          <p className="mt-2 text-[0.75rem] text-espresso/55">
            © ٢٠٢٦ غَيْم للقهوة المختصة. جميع الحقوق محفوظة.
          </p>
        </footer>
      </section>
    </div>
  );
}
