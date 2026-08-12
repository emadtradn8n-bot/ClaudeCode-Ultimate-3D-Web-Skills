/**
 * رمّان carousel data. Each drink owns a colour pair: `bg` fills the whole
 * viewport while that drink is centred, `panel` tints the softer shapes behind
 * it, so rotating the carousel repaints the entire page.
 */

export interface Drink {
  id: string;
  ar: string;
  en: string;
  note: string;
  price: number;
  photo: string;
  bg: string;
  panel: string;
  /** Ink used on top of `bg` — every pair is checked for contrast. */
  ink: string;
}

export const DRINKS: Drink[] = [
  {
    id: "spanish",
    ar: "أيس سبانش لاتيه",
    en: "Iced Spanish Latte",
    note: "حليب مكثّف محلّى، إسبريسو مزدوج، ثلج كثير",
    price: 22,
    photo: "iced-spanish-latte",
    bg: "#C2410C",
    panel: "#EA7A3C",
    ink: "#FFF7ED",
  },
  {
    id: "orange",
    ar: "عصير برتقال طازج",
    en: "Fresh Orange Juice",
    note: "يُعصر عند الطلب، بلا سكر مضاف",
    price: 18,
    photo: "orange-juice",
    bg: "#B45309",
    panel: "#E0A03C",
    ink: "#FFFBEB",
  },
  {
    id: "americano",
    ar: "أيس أمريكانو",
    en: "Iced Americano",
    note: "إسبريسو على ثلج وماء بارد، خفيف ومنعش",
    price: 16,
    photo: "iced-americano",
    bg: "#166534",
    panel: "#3F9B62",
    ink: "#F0FDF4",
  },
  {
    id: "latte",
    ar: "لاتيه آرت",
    en: "Latte Art",
    note: "حليب مصبوب باليد، نقش على السطح",
    price: 19,
    photo: "latte-art",
    bg: "#9D174D",
    panel: "#D6558C",
    ink: "#FFF1F5",
  },
];
