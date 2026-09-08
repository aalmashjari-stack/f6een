import { describe, expect, it } from 'vitest'
import { shippedImage } from './shippedImage'

/**
 * حارسُ المجلّد المنسيّ.
 *
 * غابت صورُ المعالم عن اللوحة وهي سليمة في اللعب، ثمّ غابت صورُ «الزمن
 * الجميل» كذلك — في يومٍ واحد (٨ سبتمبر ٢٠٢٦)، والسبب في المرّتين أنّ
 * السلسلة كانت مكتوبةً في موضعين فنُسي أحدهما فيهما. فصارت في
 * `shippedImage` موضعاً واحداً، وهذا الفحص يحرس أنّ كلّ مجلّدٍ يمرّ منه.
 *
 * **والمفاتيح تُقرأ من المجلّدات نفسها لا تُكتب هنا**: ملفٌّ يُسمّى في
 * الاختبار يجعل حذفَ صورةٍ واحدة يُسقطه، والمقصودُ وصلُ المجلّد لا بقاءُ
 * صورةٍ بعينها.
 */
const FOLDERS = {
  'المشاهير': import.meta.glob('../../assets/celebrities/celeb-*.jpg'),
  'المعالم': import.meta.glob('../../assets/landmarks/landmark-*.jpg'),
  'الزمن الجميل': import.meta.glob('../../assets/zaman/zaman-*.jpg'),
}

const keyOf = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '')

describe('shippedImage', () => {
  for (const [name, mods] of Object.entries(FOLDERS)) {
    it(`يحلّ مفتاحاً من مجلّد ${name}`, () => {
      const paths = Object.keys(mods)
      expect(paths.length, `مجلّد ${name} فارغ`).toBeGreaterThan(0)
      expect(shippedImage(keyOf(paths[0])), `مجلّد ${name} غير موصولٍ بالسلسلة`).not.toBeNull()
    })
  }

  it('يردّ null لمفتاحٍ لا ملفَّ له', () => {
    expect(shippedImage('zaman-nope-999')).toBeNull()
    expect(shippedImage('')).toBeNull()
  })
})
