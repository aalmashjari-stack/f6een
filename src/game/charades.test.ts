import { describe, expect, it } from 'vitest'
import { BOARD_LEVELS } from './levels'
import { CHARADE_PAGE_PATH, charadePageOrigin, charadeUrl, decodeCharade, encodeCharade } from './charades'

/**
 * ترميز كلمة «ولا كلمة» في الرابط — يُفكّ كما رُمّز، وقصيرٌ بما يكفي ليُمسح
 * الرمز من آخر المجلس.
 */
describe('ترميز ولا كلمة', () => {
  const samples = [
    'طاش ما طاش',
    'باب الحارة',
    'درب الزلق',
    'خرج ولم يعد',
    'اللي ما يعرف الصقر يشويه',
    'مدرسة المشاغبين',
    'الطير اللي يطير ٣ مرات',
    'عائلة 2000؟',
    'شباب البومب – الجزء 2',
    'يا ليل يا عين!',
    'A ب',
    '«الأصدقاء» ؟ ؞ 😀',
  ]

  it('يعود كلُّ عنوان كما دخل، بمستواه — والأرقام لاتينيّة دائماً', () => {
    for (const level of BOARD_LEVELS)
      for (const text of samples) {
        const got = decodeCharade('#' + encodeCharade(level, text))
        expect(got).not.toBeNull()
        expect(got!.level).toBe(level)
        expect(got!.text).toBe(text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))))
      }
  })

  it('الحرف الواحد بايتٌ واحد: عشرون حرفاً عربيّاً ≤ 30 رمزاً في الرابط', () => {
    const frag = encodeCharade('سهل', 'ابتثجحخدذرزسشصضطظعغف')
    expect(frag.length).toBeLessThanOrEqual(30)
  })

  it('الكلمة لا تُقرأ بالعين من الرابط', () => {
    const url = charadeUrl('سهل', 'باب الحارة')
    expect(url).not.toContain('باب')
    expect(url).toMatch(/^https:\/\/f6een\.com\/k#a[A-Za-z0-9_-]+$/)
  })

  it('جزءٌ فاسد أو فارغ أو بصيغةٍ أخرى يعود null لا نصّاً مشوّهاً', () => {
    expect(decodeCharade('')).toBeNull()
    expect(decodeCharade('#')).toBeNull()
    expect(decodeCharade('#a')).toBeNull()
    expect(decodeCharade('#b' + encodeCharade('سهل', 'باب الحارة').slice(1))).toBeNull()
    expect(decodeCharade('#a!!!')).toBeNull()
    expect(decodeCharade('#aAA')).toBeNull() // مستوىً بلا نصّ
  })

  it('الأصل الموقعُ دائماً إلّا في المعاينة المحلّية', () => {
    expect(charadePageOrigin('capacitor://localhost')).toBe('https://f6een.com')
    expect(charadePageOrigin('https://f6een.com')).toBe('https://f6een.com')
    expect(charadePageOrigin('http://localhost:4173')).toBe('http://localhost:4173')
    expect(charadePageOrigin('http://192.168.1.7:4173')).toBe('http://192.168.1.7:4173')
    expect(CHARADE_PAGE_PATH).toBe('/k')
  })
})
