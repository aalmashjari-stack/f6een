/**
 * صور أسئلة «بصورة» الموزَّعة على الفئات — لا فئةٌ بعينها.
 *
 * المجلّدات الثلاثة قبله كلٌّ لفئة: المشاهير، والمعالم، والزمن الجميل.
 * وطلبُ علي في ١٢ سبتمبر ٢٠٢٦ كان صوراً **داخل** الفئات القائمة — قطعةٌ
 * أثريّة في «حضارات قديمة»، ومسجدٌ في «السيرة النبويّة»، وخطٌّ في «لغة
 * عربيّة»، ووجهُ لاعبٍ في «كأس العالم». فمجلّدٌ لكلّ فئةٍ كان سيعني أحد
 * عشر مجلّداً وأحد عشر سطراً في `shippedImage` وأحد عشر اسماً في حارس
 * القاعدة — والمجلّدُ المنسيّ يفشل صامتاً (انظر `shippedImage.test.ts`).
 * فمجلّدٌ واحد، والفئةُ في اسم المفتاح: `pic-anc-…` للحضارات،
 * و`pic-seerah-…` للسيرة، و`pic-hajj-…` للمناسك، و`pic-wc-…` لكأس العالم.
 *
 * المفتاح في البنك (حقل `image`) يُحلّ هنا إلى ملفٍّ مُجمَّع بواسطة Vite —
 * النمط ثابت وقت البناء كما في `celebs.ts` و`landmarks.ts` و`zaman.ts`.
 *
 * لإضافة صورة: ضعها في `assets/pics/` باسم يبدأ بـ`pic-`، وسجّل رخصتَها
 * ومؤلّفَها في `assets/pics/attribution.json` — الصور من ويكيميديا كومنز
 * برخصٍ تسمح بالاستعمال التجاريّ (ملكيّة عامّة، أو CC0، أو CC BY وBY-SA)،
 * والملفّ هو ما يُثبت الحقّ. ومن حذف صورةً فليحذف سطرَها.
 */
const modules = import.meta.glob('../../assets/pics/pic-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const PIC_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
)

/** ملفُّ المفتاح المشحون، أو `null` إن لم يكن في التطبيق. */
export function picImage(key: string): string | null {
  return PIC_IMAGES[key] ?? null
}

/** كم صورةً يحملها هذا الإصدار — يقرؤها اختبار البنك. */
export function picImageCount(): number {
  return Object.keys(PIC_IMAGES).length
}
