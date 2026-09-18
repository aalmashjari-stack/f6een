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
export async function uploadArt(file: File, folder: ArtFolder): Promise<string> {
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

export type ArtFolder = 'categories' | 'questions'

export interface ArtFile {
  /** المسار داخل الدلو — `questions/1789…-abc.jpg`. */
  path: string
  url: string
  bytes: number
  createdAt: string
}

/**
 * ما في مجلّدٍ من الدلو، الأحدث أوّلاً.
 *
 * **لماذا تُعرض المرفوعات أصلاً:** الصورة تُرفع من نموذج السؤال، لكنّ
 * إزالتها منه تمسح الحقل وتترك الملفّ في التخزين، وحذفُ السؤال كذلك.
 * فتتراكم ملفّاتٌ لا يشير إليها شيء، وحذفُها لا يمرّ إلّا من هنا: القاعدة
 * ترفض المسح المباشر من `storage.objects` (`protect_delete`) — وقع فعلاً
 * ١٩ سبتمبر ٢٠٢٦ — ولا طريق غير Storage API بجلسة مدير.
 */
export async function listArt(folder: ArtFolder): Promise<ArtFile[]> {
  const { data, error } = await supabase.storage.from('art').list(folder, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  })
  if (error) throw new Error(error.message)
  return (data ?? [])
    .filter((f) => f.id)
    .map((f) => {
      const path = `${folder}/${f.name}`
      return {
        path,
        url: supabase.storage.from('art').getPublicUrl(path).data.publicUrl,
        bytes: Number((f.metadata as { size?: number } | null)?.size ?? 0),
        createdAt: f.created_at ?? '',
      }
    })
}

/** يمسح ملفّاً واحداً؛ الحراسة في سياسة `art: admin deletes`. */
export async function deleteArt(path: string): Promise<void> {
  const { data, error } = await supabase.storage.from('art').remove([path])
  if (error) throw new Error(error.message)
  /* الحذف بلا صلاحية لا يُخطئ — يعيد قائمةً فارغة. فالقياس بالعدد لا
     بغياب الخطأ (الفخّ نفسه في `profiles`، انظر ذاكرة Supabase). */
  if (!data || data.length === 0) throw new Error('لم يُحذف — لا صلاحية أو الملفّ غير موجود')
}
