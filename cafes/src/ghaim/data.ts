/** قائمة غَيْم — كل صنف مربوط بجسم ثلاثي الأبعاد يُضاء عند المرور على البطاقة */

export type Focus = "cup" | "ice" | "beans" | "cloud";

export interface Item {
  id: string;
  ar: string;
  en: string;
  note: string;
  price: number;
  /** أي جسم في المشهد يُبرز عند تمرير المؤشر على هذه البطاقة */
  focus: Focus;
}

export const MENU: Item[] = [
  {
    id: "salted-caramel",
    ar: "لاتيه غَيْم بالكراميل المملّح",
    en: "Ghaim Salted Caramel Latte",
    note: "إسبريسو مزدوج، حليب مخملي، وكراميل مملّح يُسكب طبقةً فوق طبقة",
    price: 26,
    focus: "cup",
  },
  {
    id: "cloud-cold-brew",
    ar: "كولد برو غَيْم",
    en: "Cloud Cold Brew",
    note: "تخمير بارد ثمانَ عشرة ساعة، يُقدَّم على ثلج صافٍ",
    price: 24,
    focus: "ice",
  },
  {
    id: "v60-ethiopian",
    ar: "V60 إثيوبيا ريزيرف",
    en: "V60 Ethiopian Reserve",
    note: "حبة مفردة المصدر من يرغاتشيفي، نكهات ياسمين وحمضيات",
    price: 32,
    focus: "beans",
  },
  {
    id: "vanilla-cheesecake",
    ar: "تشيز كيك الفانيليا السحابي",
    en: "Vanilla Cloud Cheesecake",
    note: "قوام خفيف كالغيمة على قاعدة زبدة مقرمشة",
    price: 28,
    focus: "cloud",
  },
];

export const NAV = [
  { href: "#top", label: "الرئيسية" },
  { href: "#menu", label: "القائمة" },
  { href: "#about", label: "عن غيم" },
  { href: "#branches", label: "الفروع" },
];
