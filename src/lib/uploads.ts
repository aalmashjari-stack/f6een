import { supabase } from './supabase'

/**
 * رفع الصور إلى دلو `art` — صور الفئات وصور أسئلة المشاهير.
 *
 * الكتابة محروسة في القاعدة لا هنا: سياسات `storage.objects` تشترط
 * `is_admin()`، فمن نادى هذه الدالّة بلا صلاحية رُدّ من الخادم.
 *
 * والقراءة عامّة: الرابط يُعرض بوسم `img` على شاشة المجلس، ورمزٌ موقّت
 * ينتهي في منتصف جلسة يترك صورة مكسورة.
 */

/** حدٌّ فوق حاجة الشاشة بكثير — البطاقة أعرضها ٣٤٠ بكسلاً، والسؤال ٧٢٠. */
const MAX_BYTES = 4 * 1024 * 1024

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * يرفع ويُرجع الرابط العامّ.
 *
 * الاسم يحمل ختماً زمنياً: الاستبدال باسمٍ ثابت يُبقي الصورة القديمة في
 * ذاكرة المتصفّحات والوسطاء، فيرى اللاعب القديمة أياماً بعد التبديل.
 */
export async function uploadArt(file: File, folder: 'categories' | 'questions'): Promise<string> {
  const ext = EXT[file.type]
  if (!ext) throw new Error('الصورة JPG أو PNG أو WebP')
  if (file.size > MAX_BYTES) throw new Error('حجم الصورة فوق أربعة ميغابايت')

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('art').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })
  if (error) throw new Error(error.message)

  return supabase.storage.from('art').getPublicUrl(path).data.publicUrl
}
