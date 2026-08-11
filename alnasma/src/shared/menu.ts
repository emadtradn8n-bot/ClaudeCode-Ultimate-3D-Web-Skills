/**
 * Menu for مقهى النسمة, taken from the client's delivered photo sheet.
 * `photo` is the slot id — see assets.ts for how a real file gets bound to it.
 */

export interface Item {
  id: string;
  ar: string;
  en: string;
  desc: string;
  price: number;
  photo: string;
}

export const HOT: Item[] = [
  {
    id: "cappuccino",
    ar: "كابتشينو كلاسيك",
    en: "Classic Cappuccino",
    desc: "ثلث إسبريسو، ثلث حليب مبخّر، ثلث رغوة كثيفة",
    price: 17,
    photo: "cappuccino",
  },
  {
    id: "latte-art",
    ar: "لاتيه آرت",
    en: "Latte Art",
    desc: "حليب مصبوب بيد الباريستا، نقش على السطح",
    price: 19,
    photo: "latte-art",
  },
  {
    id: "americano",
    ar: "أمريكانو أسود",
    en: "Black Americano",
    desc: "إسبريسو ممدود بالماء الساخن، بلا حليب",
    price: 14,
    photo: "americano",
  },
  {
    id: "espresso",
    ar: "إسبريسو",
    en: "Espresso",
    desc: "لقطة مركزة من مزيج البيت، تُقدّم مع ماء",
    price: 12,
    photo: "espresso",
  },
];

export const COLD: Item[] = [
  {
    id: "iced-spanish",
    ar: "أيس سبانش لاتيه",
    en: "Iced Spanish Latte",
    desc: "حليب مكثّف محلّى فوق ثلج، بإسبريسو مزدوج",
    price: 22,
    photo: "iced-spanish-latte",
  },
  {
    id: "iced-americano",
    ar: "أيس أمريكانو",
    en: "Iced Americano",
    desc: "إسبريسو على ثلج وماء بارد، منعش وخفيف",
    price: 16,
    photo: "iced-americano",
  },
  {
    id: "orange",
    ar: "عصير برتقال طازج",
    en: "Fresh Orange Juice",
    desc: "يُعصر عند الطلب، بلا سكر مضاف",
    price: 18,
    photo: "orange-juice",
  },
];

export const SWEETS: Item[] = [
  {
    id: "cheesecake",
    ar: "تشيز كيك نيويورك",
    en: "New York Cheesecake",
    desc: "قوام كثيف وقاعدة بسكويت، مع صلصة التوت",
    price: 26,
    photo: "cheesecake",
  },
  {
    id: "choco-cake",
    ar: "كعكة الشوكولاتة",
    en: "Chocolate Cake",
    desc: "طبقات إسفنجية داكنة بحشوة غانش",
    price: 24,
    photo: "chocolate-cake",
  },
  {
    id: "blueberry-muffin",
    ar: "مافن التوت الأزرق",
    en: "Blueberry Muffin",
    desc: "يُخبز كل صباح، بقشرة مقرمشة من السكر",
    price: 15,
    photo: "blueberry-muffin",
  },
];

export const SECTIONS = [
  { id: "hot", label: "قهوة ساخنة", items: HOT },
  { id: "cold", label: "بارد ومنعش", items: COLD },
  { id: "sweets", label: "حلا ومخبوزات", items: SWEETS },
] as const;
