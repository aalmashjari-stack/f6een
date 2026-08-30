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

/**
 * مصدر صورة المفتاح، أو الصورة المؤقتة إن لم يُسجَّل بعد.
 *
 * والرابط الكامل يمرّ كما هو: صورةٌ رفعها المدير من اللوحة تُحفظ في حقل
 * `image` رابطاً لا مفتاحاً — فمنفذٌ واحد يخدم المشحون والمرفوع، ولا تحتاج
 * كل شاشةٍ تعرض صورةً أن تعرف الفرق.
 */
export function celebSrc(key?: string): string {
  if (key && /^https?:\/\//.test(key)) return key
  return (key && CELEB_IMAGES[key]) || placeholder
}
