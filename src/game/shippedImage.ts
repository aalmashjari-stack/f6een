/**
 * حلُّ مفتاح الصورة المشحونة — **موضعٌ واحد لا موضعان**.
 *
 * كانت السلسلة مكتوبةً مرّتين: في `celebSrc` لشاشة اللعب، وفي
 * `resolveImage` باللوحة. فكلّ مجلّد صورٍ جديد كان يحتاج إضافتين، وفي ٨
 * سبتمبر ٢٠٢٦ نُسيت الثانية مرّتين في يومٍ واحد: غابت صور المعالم عن
 * اللوحة وهي سليمة في اللعب، ثمّ غابت صور «الزمن الجميل» كذلك.
 *
 * **فمن أضاف مجلّداً رابعاً يضيفه هنا وحده**، ويناله الاثنان معاً.
 */
import { celebImage } from './celebs'
import { landmarkImage } from './landmarks'
import { zamanImage } from './zaman'
import { picImage } from './pics'

/** ملفُّ المفتاح في أيّ من مجلّدات الصور المشحونة، أو `null`. */
export function shippedImage(key: string): string | null {
  return celebImage(key) ?? landmarkImage(key) ?? zamanImage(key) ?? picImage(key)
}
