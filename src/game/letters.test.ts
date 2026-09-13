import { describe, expect, it } from 'vitest'
import { ALPHABET, firstLetter } from './letters'

/**
 * قاعدة الحرف الأوّل كما قرّرها علي في ١٣ سبتمبر ٢٠٢٦ — كلُّ حالةٍ هنا
 * جوابُه على مثالٍ بعينه، لا استنتاجٌ منّي.
 */
describe('firstLetter', () => {
  it('«ال» تسقط: الرياض → ر', () => {
    expect(firstLetter('الرياض')).toBe('ر')
    expect(firstLetter('القاهرة')).toBe('ق')
    expect(firstLetter('الحج')).toBe('ح')
  })

  it('الهمزة تُطبَّع ألفاً: أحمد وإبراهيم وآسيا → ا', () => {
    expect(firstLetter('أحمد')).toBe('ا')
    expect(firstLetter('إبراهيم')).toBe('ا')
    expect(firstLetter('آسيا')).toBe('ا')
    /* و«ألم» ليست معرَّفة فتبقى على ألفها */
    expect(firstLetter('ألم')).toBe('ا')
    /* والهمزة قبل اللام ليست «ال»: ألمانيا وإلياس وألماتي على ألفها */
    expect(firstLetter('ألمانيا')).toBe('ا')
    expect(firstLetter('إلياس')).toBe('ا')
    expect(firstLetter('ألماتي')).toBe('ا')
  })

  it('المركّب يأخذ حرف كلمته الأولى بلا استثناء: ابن سينا → ا', () => {
    expect(firstLetter('ابن سينا')).toBe('ا')
    expect(firstLetter('عبد الله')).toBe('ع')
    expect(firstLetter('أبو بكر')).toBe('ا')
    expect(firstLetter('البحر الميت')).toBe('ب')
  })

  it('ما بين القوسين لا يدخل، والحركات والاقتباس تُتجاوز', () => {
    expect(firstLetter('يعفور (وقيل عُفير)')).toBe('ي')
    expect(firstLetter('(الملك) فيصل')).toBe('ف')
    expect(firstLetter('«كليلة ودمنة»')).toBe('ك')
    expect(firstLetter('  مُحَمَّد ')).toBe('م')
  })

  it('جوابٌ لا يبدأ بحرفٍ عربيّ لا حرفَ له', () => {
    expect(firstLetter('1969')).toBeNull()
    expect(firstLetter('NASA')).toBeNull()
    expect(firstLetter('')).toBeNull()
  })

  it('الأبجديّة ثمانيةٌ وعشرون حرفاً بلا تكرار، وكلُّ حرفٍ مشتقٍّ منها', () => {
    expect(new Set(ALPHABET).size).toBe(28)
    for (const l of ALPHABET) expect(firstLetter(l + 'ب')).toBe(l)
  })
})
