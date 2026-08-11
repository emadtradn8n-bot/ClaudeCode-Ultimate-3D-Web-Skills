# مقهى النسمة

موقع كوفي عربي (RTL) — React + TypeScript + Vite + Tailwind v4.

```bash
npm install
npm run dev      # http://localhost:5210
npm run build
```

## الهوية

الاسم "النسمة" هو أساس التصميم البصري: الخلفية حقل تيارات هواء رفيعة
(`src/shared/breezeScene.ts`) تُرسم على canvas ويقودها **موضع السكرول** وحده —
لا تتحرك من نفسها. تشتد الاضطراب في منتصف الصفحة ثم تهدأ، فتُقرأ كنسمة تمرّ.

| العنصر | القيمة |
|---|---|
| الأرضية | `#131311` أسود دافئ |
| التمييز | `#a8d6ac` أخضر مريمية (الهواء البارد) |
| خط العناوين | Aref Ruqaa (خط عربي كاليغرافي) |
| خط النصوص | IBM Plex Sans Arabic |

الخطوط محمّلة ذاتياً في `public/fonts/arabic.css` (base64 woff2) لأن
fonts.googleapis.com محجوب عن المتصفح في بيئة التطوير هذه.

## الصور

**لا توجد صور وهمية في هذا الموقع.** كل صورة تشير إلى "خانة" (slot) معرّفة في
`src/shared/assets.ts`. طالما ما في ملف حقيقي للخانة، يرسم `<Photo>` لوحة
مؤطّرة تسمّي اللقطة المطلوبة بالضبط وتكتب "بانتظار الصورة" — بحيث لا يُسلَّم
مربع رمادي على أنه تصوير.

### لتعبئة الصور

1. ضع الملفات في `public/photos/` بأسماء تطابق معرّفات الخانات:

   ```
   cappuccino.jpg          latte-art.jpg        americano.jpg
   espresso.jpg            iced-spanish-latte.jpg
   iced-americano.jpg      orange-juice.jpg
   cheesecake.jpg          chocolate-cake.jpg   blueberry-muffin.jpg
   hero.jpg                interior.jpg         bar.jpg
   barista.jpg             beans.jpg            overview.jpg
   ```

2. شغّل:

   ```bash
   python3 scripts/sync_photos.py
   ```

السكربت يربط الموجود، ويطبع قائمة بما ينقص. الامتداد وحالة الأحرف لا تفرق.

## المحتوى

القائمة في `src/shared/menu.ts` مأخوذة من جدول أصناف العميل: كابتشينو كلاسيك،
لاتيه آرت، أمريكانو أسود، إسبريسو، أيس سبانش لاتيه، أيس أمريكانو، عصير برتقال،
تشيز كيك نيويورك، كعكة الشوكولاتة، مافن التوت الأزرق.

## إمكانية الوصول

الحركة كلها تحترم `prefers-reduced-motion` — الخلفية ترسم إطاراً ثابتاً واحداً
وتتوقف عن الاستماع للسكرول.
