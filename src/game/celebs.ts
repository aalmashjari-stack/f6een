import placeholder from '../../assets/celebrities/_placeholder.svg'
import { shippedImage } from './shippedImage'

/** هل المفتاح رابطٌ كامل (صورةٌ رُفعت من اللوحة) لا مفتاحَ ملفٍّ مشحون؟ */
export const isImageUrl = (key: string): boolean => /^https?:\/\//.test(key)

/**
 * مصدر صورة المفتاح، أو الصورة المؤقتة إن لم يُسجَّل بعد.
 *
 * والرابط الكامل يمرّ كما هو: صورةٌ رفعها المدير من اللوحة تُحفظ في حقل
 * `image` رابطاً لا مفتاحاً — فمنفذٌ واحد يخدم المشحون والمرفوع، ولا تحتاج
 * كل شاشةٍ تعرض صورةً أن تعرف الفرق.
 */
export function celebSrc(key?: string): string {
  if (key && isImageUrl(key)) return key
  /* المفتاح من أيّ مجلّدٍ مشحون — فشاشةُ السؤال لا تعرف نوع الفئة ولا
     يلزمها أن تعرفه. */
  return (key && shippedImage(key)) || placeholder
}
