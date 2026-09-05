import { describe, expect, it } from 'vitest'
import { ALL_QUESTIONS } from './bank'
import { celebImage, celebSrc, isImageUrl } from './celebs'

/**
 * صور المشاهير تُجمَّع بـ`import.meta.glob` لا باستيرادٍ مكتوب، فلا يكشف
 * `tsc` انقطاعَ الوصل بينها وبين مفاتيح البنك: يبني ويمرّ، ثمّ تظهر صورةٌ
 * مؤقّتة مكان الوجه في المجلس.
 *
 * وقد قرُب أن يقع: نقلُ `celebs.ts` بين حزمتين (٥ سبتمبر ٢٠٢٦) غيّر ٢٨
 * كيلوبايت من مكانها، ولم يكن في المشروع ما يقول إنّ الوصل سليم.
 */
describe('صور المشاهير', () => {
  const withImage = ALL_QUESTIONS.filter((q) => q.image)

  it('كل مفتاح في البنك يقابله ملفٌّ مشحون', () => {
    expect(withImage.length).toBeGreaterThan(100)
    const missing = withImage.filter((q) => celebImage(q.image!) === null)
    expect(missing.map((q) => `${q.id}: ${q.image}`)).toEqual([])
  })

  it('الرابط المرفوع من اللوحة يمرّ كما هو', () => {
    const url = 'https://example.supabase.co/storage/v1/object/public/art/questions/1.jpg'
    expect(isImageUrl(url)).toBe(true)
    expect(celebSrc(url)).toBe(url)
    /* ولا يُبحث عنه في الملفّات المشحونة — فليس مفتاحاً. */
    expect(celebImage(url)).toBeNull()
  })

  it('المفتاح المجهول يعطي صورةً مؤقّتة لا فراغاً', () => {
    expect(isImageUrl('celeb-999-nope')).toBe(false)
    expect(celebImage('celeb-999-nope')).toBeNull()
    expect(celebSrc('celeb-999-nope')).toBe(celebSrc(undefined))
  })
})
