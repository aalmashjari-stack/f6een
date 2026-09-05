import placeholder from '../../assets/celebrities/_placeholder.svg'

/**
 * صور أسئلة «من صاحب الصورة؟». المفتاح في البنك (حقل image) يُحلّ هنا إلى ملفٍ
 * مُجمَّع بواسطة Vite. النمط ثابت وقت البناء، فيضمّ كل صور المشاهير المسماة
 * celeb-*.jpg من غير قائمة استيرادات يدوية طويلة.
 *
 * لإضافة مشهور: ضع صورته في assets/celebrities/ باسم يبدأ celeb-، وأضف سؤالاً
 * في data/questions-extra.json حقلُه image يساوي اسم الملف من دون الامتداد.
 * الصورة المفضّلة عمودية أو مربّعة وواضحة الوجه — تُعرض داخل إطارها بلا قصّ.
 */
const modules = import.meta.glob('../../assets/celebrities/celeb-*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const CELEB_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
)

/** هل المفتاح رابطٌ كامل (صورةٌ رُفعت من اللوحة) لا مفتاحَ ملفٍّ مشحون؟ */
export const isImageUrl = (key: string): boolean => /^https?:\/\//.test(key)

/**
 * ملفُّ المفتاح المشحون، أو `null` إن لم يكن في التطبيق.
 *
 * منفصلةٌ عن `celebSrc` لأنّ الفرق بين «لا صورة» و«صورةٌ بديلة» يهمّ من
 * يعرض معاينةً للمدير: الشاشة تريد صورةً دائماً ولو مؤقّتة، واللوحة تريد
 * أن تعرف أنّ المفتاح لا يقابله ملفّ.
 */
export function celebImage(key: string): string | null {
  return CELEB_IMAGES[key] ?? null
}

/**
 * مصدر صورة المفتاح، أو الصورة المؤقتة إن لم يُسجَّل بعد.
 *
 * والرابط الكامل يمرّ كما هو: صورةٌ رفعها المدير من اللوحة تُحفظ في حقل
 * `image` رابطاً لا مفتاحاً — فمنفذٌ واحد يخدم المشحون والمرفوع، ولا تحتاج
 * كل شاشةٍ تعرض صورةً أن تعرف الفرق.
 */
export function celebSrc(key?: string): string {
  if (key && isImageUrl(key)) return key
  return (key && celebImage(key)) || placeholder
}
