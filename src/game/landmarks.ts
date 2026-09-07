/**
 * صور أسئلة المعالم. المفتاح في البنك (حقل `image`) يُحلّ هنا إلى ملفٍّ
 * مُجمَّع بواسطة Vite — النمط ثابت وقت البناء، فيضمّ كلّ ما في المجلّد بلا
 * قائمة استيراداتٍ يدويّة، كما يفعل `celebs.ts` لصور المشاهير.
 *
 * لإضافة معلم: ضع صورته في `assets/landmarks/` باسم يبدأ بـ`landmark-`،
 * وأضف سؤالاً حقلُه `image` يساوي اسم الملفّ بلا امتداد. والصورة المفضّلة
 * أفقيّةٌ يملأ المعلمُ إطارَها — تُعرض داخل إطارها بلا قصّ، فالمنظرُ العريض
 * الذي يصير فيه المعلم نقطةً في الأفق لا يُعرَف من آخر المجلس.
 *
 * **ورخصةُ كلّ صورة مسجّلة** في `assets/landmarks/attribution.json` ومعها
 * مؤلّفُها وصفحتُها. الصور من ويكيميديا كومنز برخصٍ تسمح بالاستعمال
 * التجاريّ (ملكيّة عامّة، أو CC0، أو CC BY وBY-SA). ومن حذف صورةً فليحذف
 * سطرَها هناك، ومن أضاف فليضف سطرَه — الملفّ هو ما يُثبت الحقّ.
 */
const modules = import.meta.glob('../../assets/landmarks/landmark-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const LANDMARK_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
)

/** ملفُّ المفتاح المشحون، أو `null` إن لم يكن في التطبيق. */
export function landmarkImage(key: string): string | null {
  return LANDMARK_IMAGES[key] ?? null
}

/** كم صورةَ معلمٍ يحملها هذا الإصدار — يقرؤها اختبار البنك. */
export function landmarkImageCount(): number {
  return Object.keys(LANDMARK_IMAGES).length
}
