/**
 * صور فئة «زمن جميل». المفتاح في البنك (حقل `image`) يُحلّ هنا إلى ملفٍّ
 * مُجمَّع بواسطة Vite — كما يفعل `celebs.ts` و`landmarks.ts` تماماً.
 *
 * لإضافة صورة: ضعها في `assets/zaman/` باسم يبدأ بـ`zaman-`، وأضف سؤالاً
 * حقلُه `image` يساوي اسم الملفّ بلا امتداد. والصورة المفضّلة يملأ فيها
 * الشيءُ إطارَه: هذه الفئة تُعرف بالنظر من آخر المجلس، فصورةٌ يضيع فيها
 * الجهاز بين أثاثٍ كثير لا تُقرأ.
 */
const modules = import.meta.glob('../../assets/zaman/zaman-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const ZAMAN_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
)

/** ملفُّ المفتاح المشحون، أو `null` إن لم يكن في التطبيق. */
export function zamanImage(key: string): string | null {
  return ZAMAN_IMAGES[key] ?? null
}

/** كم صورةً يحملها هذا الإصدار — يقرؤها اختبار البنك. */
export function zamanImageCount(): number {
  return Object.keys(ZAMAN_IMAGES).length
}
