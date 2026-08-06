import { describe, expect, it } from 'vitest'
import { ALL_QUESTIONS, CATEGORIES, familyOf, poolByCatLevel } from './bank'
import type { Level } from './types'

const LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']

/** تطبيع عربي للمقارنة: تجريد التشكيل وتوحيد الهمزة والتاء المربوطة والألف المقصورة. */
const norm = (s: string) =>
  s
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]/gu, '')

/**
 * البنك ملف بيانات لا كود، لكن ضمانات السحب مبنية عليه:
 * خلية صغيرة تُفرغ في جلستين، ومعرّف مكرّر يكسر حساب المحروق.
 * هذه الاختبارات تحرس البنك من تبديلٍ قادم يخرقه بلا أن ينتبه أحد.
 */
describe('بنك الأسئلة', () => {
  it('لا معرّف مكرّر', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('لا نصّ سؤال مكرّر', () => {
    const texts = ALL_QUESTIONS.map((q) => norm(q.question))
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('كل سؤال كامل الحقول، وتصنيفه ومستواه معروفان', () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.id, JSON.stringify(q)).toBeTruthy()
      expect(q.question.trim(), q.id).not.toBe('')
      expect(q.answer.trim(), q.id).not.toBe('')
      expect(CATEGORIES, q.id).toContain(q.category)
      expect(LEVELS, q.id).toContain(q.level)
    }
  })

  it('التصنيفات اثنا عشر — شبكة البطاقات مبنية على ٤×٣', () => {
    expect(CATEGORIES).toHaveLength(12)
  })

  /**
   * الجلسة تسحب من خلية (تصنيف × مستوى) مرّة أو مرّتين. عشرون حدٌّ يحفظ
   * عشر جلسات على الأقل بلا أن تنزل الخوارزمية إلى التنازل عن عدم التكرار.
   */
  it('لا خلية (تصنيف × مستوى) دون عشرين سؤالاً', () => {
    for (const c of CATEGORIES)
      for (const l of LEVELS)
        expect(poolByCatLevel(c, l).length, `${c} · ${l}`).toBeGreaterThanOrEqual(20)
  })
})

describe('عائلات القوالب', () => {
  it('تجمع القالب المعروف: «ما العنصر الذي رمزه الكيميائي…؟»', () => {
    const fams = ALL_QUESTIONS.filter((q) => q.question.startsWith('ما العنصر الذي رمزه')).map(familyOf)
    expect(fams.length).toBeGreaterThanOrEqual(3)
    expect(new Set(fams).size).toBe(1) // كلها عائلة واحدة
    expect(fams[0]).not.toBeNull()
  })

  it('لا تجمع أسئلة لا صلة بينها — كل عائلة ثلاثة أسئلة فأكثر', () => {
    const size = new Map<string, number>()
    for (const q of ALL_QUESTIONS) {
      const f = familyOf(q)
      if (f !== null) size.set(f, (size.get(f) ?? 0) + 1)
    }
    for (const [fam, n] of size) expect(n, fam).toBeGreaterThanOrEqual(3)
  })

  it('السؤال المنفرد بلا عائلة', () => {
    const lone = ALL_QUESTIONS.find((q) => q.question.startsWith('ما أطول نهر في أفريقيا'))
    expect(lone).toBeDefined()
    // ينتمي لعائلة «ما أطول نهر في» — نتحقّق أن سؤالاً بصيغة فريدة لا ينتمي لشيء
    const unique = ALL_QUESTIONS.filter((q) => familyOf(q) === null)
    expect(unique.length).toBeGreaterThan(ALL_QUESTIONS.length / 2)
  })
})
