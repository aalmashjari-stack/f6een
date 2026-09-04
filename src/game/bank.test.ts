import { afterEach, describe, expect, it } from 'vitest'
import {
  ALL_QUESTIONS,
  CATEGORIES,
  EXCLUDED_OBSCURE_CELEBRITY_IDS,
  EXCLUDED_POLITICAL_CELEBRITY_IDS,
  allCategories,
  allQuestions,
  familyOf,
  familiesOf,
  playableCategories,
  poolByCatLevel,
  setBlockedQuestionIds,
  setExtraCategories,
  setQuestionOverlay,
  subscribeBank,
} from './bank'
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

  it('لا نصّ سؤال مكرّر (نصّاً) ولا صورة مكرّرة (صورةً)', () => {
    // أسئلة النصّ تُميَّز بنصّها. أسئلة الصور («من صاحب الصورة؟») نصّها واحد
    // عمداً، فتمييزها بمفتاح صورتها — ولكلٍّ مفتاح فريد.
    const texts = ALL_QUESTIONS.filter((q) => !q.image).map((q) => norm(q.question))
    expect(new Set(texts).size).toBe(texts.length)

    const images = ALL_QUESTIONS.filter((q) => q.image).map((q) => q.image)
    expect(new Set(images).size).toBe(images.length)
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

  it('لا تصنيف مكرّر — وشبكة البطاقات تتكيّف مع عددها', () => {
    // كان الحدّ اثني عشر (٤×٣ ثابتة)؛ صارت الشبكة تحسب صفوفها من عدد الفئات،
    // فلم يعد العدد مقيَّداً — يبقى الشرط أن تكون الفئات فريدة وألا تقلّ عن الأصل.
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length)
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(12)
  })

  it('لا تدخل الشخصيات السياسية المستبعدة في سحب فئة مشاهير', () => {
    const playableIds = new Set(ALL_QUESTIONS.map((q) => q.id))
    for (const id of EXCLUDED_POLITICAL_CELEBRITY_IDS) expect(playableIds.has(id), id).toBe(false)
  })

  it('لا تدخل أسماء المشاهير شديدة الغموض في السحب', () => {
    const playableIds = new Set(ALL_QUESTIONS.map((q) => q.id))
    for (const id of EXCLUDED_OBSCURE_CELEBRITY_IDS) expect(playableIds.has(id), id).toBe(false)
  })

  /**
   * الجلسة تسحب من خلية (تصنيف × مستوى) مرّة أو مرّتين. عشرون حدٌّ يحفظ
   * عشر جلسات على الأقل بلا أن تنزل الخوارزمية إلى التنازل عن عدم التكرار.
   * فئات الصور محتواها يُزوَّد تدريجياً (صور من علي)، فيكفيها واحد لكل خلية
   * الآن — والسحب يتنازل بلطف لو ضاقت؛ تكبر لاحقاً إلى الحدّ نفسه.
   */
  it('لكل خلية نصّية عشرون سؤالاً، ولكل خلية صور واحد على الأقل', () => {
    for (const c of CATEGORIES) {
      const isImageCat = ALL_QUESTIONS.some((q) => q.category === c && q.image)
      for (const l of LEVELS) {
        const n = poolByCatLevel(c, l).length
        expect(n, `${c} · ${l}`).toBeGreaterThanOrEqual(isImageCat ? 1 : 20)
      }
    }
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

  /**
   * التصريح في البيانات (`Question.family`) يمسك ما لا يمسكه الاستنتاج: سؤالان
   * جوابهما واحد وصيغتاهما مختلفتان. وهو يسري على أسئلة الصور — وهي المستثناة
   * من الاستنتاج لأنّ نصّها «من صاحب الصورة؟» واحد.
   */
  it('الموضوع المصرَّح به يجمع الصورة والنصّ، والقالب المستنتَج يبقى معه', () => {
    const declared = ALL_QUESTIONS.filter((q) => q.family)
    expect(declared.length).toBeGreaterThan(0)

    // صورةٌ مصرَّح بموضوعها: لا قالب لها، ولها عائلةٌ واحدة هي الموضوع.
    const photo = declared.find((q) => q.image)
    expect(photo, 'سؤال صورة مصرَّح بموضوعه').toBeDefined()
    expect(familyOf(photo!)).toBeNull()
    expect(familiesOf(photo!)).toHaveLength(1)

    // نصٌّ له قالبٌ مستنتَج وموضوعٌ مصرَّح به: ينتمي إليهما معاً لا إلى أحدهما.
    const both = declared.find((q) => !q.image && familyOf(q) !== null)
    if (both) {
      expect(familiesOf(both)).toHaveLength(2)
      expect(familiesOf(both)).toContain(familyOf(both)!)
    }

    // ومن صُرِّح بموضوعه يشارك فيه غيرَه — التصريح قصدٌ لا وسمٌ منفرد.
    const byKey = new Map<string, number>()
    for (const q of declared) byKey.set(q.family!, (byKey.get(q.family!) ?? 0) + 1)
    for (const [k, n] of byKey) expect(n, k).toBeGreaterThanOrEqual(2)
  })

  it('السؤال المنفرد بلا عائلة', () => {
    const lone = ALL_QUESTIONS.find((q) => q.question.startsWith('ما أطول نهر في أفريقيا'))
    expect(lone).toBeDefined()
    // ينتمي لعائلة «ما أطول نهر في» — نتحقّق أن سؤالاً بصيغة فريدة لا ينتمي لشيء
    const unique = ALL_QUESTIONS.filter((q) => familyOf(q) === null)
    expect(unique.length).toBeGreaterThan(ALL_QUESTIONS.length / 2)
  })
})

/**
 * طبقة اللوحة: تعديل سؤال أو إضافة سؤال بلا مسّ الملفّ المشحون.
 *
 * الضمانة التي تحرسها هذه الاختبارات أنّ **الأصل يعود** — لو أفسد تعديلٌ
 * سؤالاً، حذفُ صفّه في القاعدة يرجع السؤال المشحون كما كان. ولو كانت
 * الطبقة تكتب فوق البنك في الذاكرة لضاع الأصل حتى يُعاد تحميل الصفحة.
 */
describe('طبقة التعديل والإضافة', () => {
  const base = ALL_QUESTIONS[0]

  afterEach(() => setQuestionOverlay([]))

  it('التعديل يحلّ محلّ سؤال البنك في مجموعته، والأصل باقٍ', () => {
    setQuestionOverlay([{ ...base, question: 'نصّ معدَّل', answer: 'إجابة معدَّلة' }])
    const pool = poolByCatLevel(base.category, base.level)
    const found = pool.find((q) => q.id === base.id)!
    expect(found.question).toBe('نصّ معدَّل')
    expect(ALL_QUESTIONS[0].question).toBe(base.question)
    expect(allQuestions().filter((q) => q.id === base.id)).toHaveLength(1)
  })

  it('التراجع يعيد السؤال المشحون', () => {
    setQuestionOverlay([{ ...base, question: 'نصّ معدَّل' }])
    setQuestionOverlay([])
    expect(poolByCatLevel(base.category, base.level).find((q) => q.id === base.id)!.question).toBe(
      base.question,
    )
  })

  it('السؤال المضاف يدخل مجموعة تصنيفه ومستواه', () => {
    const added = {
      id: 'ADM0001',
      category: base.category,
      level: base.level,
      topic: '',
      question: 'سؤال أضافته اللوحة',
      answer: 'إجابته',
    }
    setQuestionOverlay([added])
    expect(poolByCatLevel(base.category, base.level).some((q) => q.id === 'ADM0001')).toBe(true)
    expect(allQuestions()).toHaveLength(ALL_QUESTIONS.length + 1)
  })

  it('تعديل التصنيف ينقل السؤال بين المجموعتين', () => {
    const other = CATEGORIES.find((c) => c !== base.category)!
    setQuestionOverlay([{ ...base, category: other }])
    expect(poolByCatLevel(base.category, base.level).some((q) => q.id === base.id)).toBe(false)
    expect(poolByCatLevel(other, base.level).some((q) => q.id === base.id)).toBe(true)
  })
})

/**
 * فئة جديدة لا تدخل العجلة ولا لوحَ الجولة الجماعية حتى تكتمل مستوياتها الثلاثة.
 *
 * الخطر الذي تحرسه: السحب يقع على (فئة، مستوى)، واللوح يأخذ من كل فئةٍ
 * مختارة مستوياتِها الثلاثة — ففئةٌ بلا «صعب» تُسقط اللعبة عند خليّتها
 * الصعبة، بعد عشر دقائق من اللعب أمام المجلس.
 */
describe('الفئات المضافة', () => {
  const NEW = 'فئة تجريبيّة'

  afterEach(() => {
    setExtraCategories([])
    setQuestionOverlay([])
  })

  it('تظهر في قائمة الفئات ولا تدخل العجلة وهي فارغة', () => {
    setExtraCategories([NEW])
    expect(allCategories()).toContain(NEW)
    expect(playableCategories()).not.toContain(NEW)
  })

  it('تنقص مستوى واحد فلا تدخل', () => {
    setExtraCategories([NEW])
    setQuestionOverlay(
      (['سهل', 'متوسط'] as Level[]).map((level, i) => ({
        id: `ADM900${i}`,
        category: NEW,
        level,
        topic: '',
        question: `سؤال ${i}`,
        answer: 'إجابة',
      })),
    )
    expect(playableCategories()).not.toContain(NEW)
  })

  it('تكتمل المستويات الثلاثة فتدخل', () => {
    setExtraCategories([NEW])
    setQuestionOverlay(
      LEVELS.map((level, i) => ({
        id: `ADM910${i}`,
        category: NEW,
        level,
        topic: '',
        question: `سؤال ${i}`,
        answer: 'إجابة',
      })),
    )
    expect(playableCategories()).toContain(NEW)
    expect(poolByCatLevel(NEW, 'صعب')).toHaveLength(1)
  })

  it('كل فئات البنك المشحون صالحة للّعب', () => {
    expect(playableCategories()).toEqual(CATEGORIES)
  })
})


/**
 * حارس انحدار لعطلٍ وقع فعلاً وبلّغ عنه علي: فئةٌ أُضيفت من اللوحة لا تظهر
 * في شاشة الإعداد.
 *
 * السبب لم يكن في القاعدة ولا في الشرط، بل في التوقيت: الشاشة تقرأ
 * `playableCategories` عند فتحها، و`syncCategories` تبدأ في اللحظة نفسها
 * وتصل بعدها — فتُحسب القائمة قبل وصول الفئة. والعلاج إخطارٌ تشترك فيه
 * الشاشة فتعيد القراءة.
 *
 * والاختبار يمسك الإخطار لا الشاشة: لو حُذف النداء من أيّ من الثلاثة، لم
 * تعلم شاشةٌ بوصول المزامنة أبداً.
 */
describe('الإخطار عند وصول المزامنة', () => {
  it('يُنبّه المشتركين عند تبدّل الفئات والطبقة والمحجوز', () => {
    let hits = 0
    const off = subscribeBank(() => hits++)

    setExtraCategories(['فئة إخطار'])
    expect(hits, 'الفئات').toBe(1)

    setQuestionOverlay([])
    expect(hits, 'طبقة الأسئلة').toBe(2)

    setBlockedQuestionIds([])
    expect(hits, 'المحجوز').toBe(3)

    off()
    setExtraCategories([])
    expect(hits, 'بعد إلغاء الاشتراك لا إخطار').toBe(3)
  })

  it('الفئة الواصلة بعد القراءة الأولى تدخل القائمة عند إعادة القراءة', () => {
    const before = playableCategories()
    /* فئة بمستوىً واحد فقط: تصل ولا تصير صالحة — الإخطار يقع والشرط يبقى. */
    setExtraCategories(['فئة ناقصة'])
    setQuestionOverlay([
      { id: 'ADM9001', category: 'فئة ناقصة', level: 'سهل', topic: '', question: 'س؟', answer: 'ج' },
    ])
    expect(playableCategories()).not.toContain('فئة ناقصة')

    /* وباكتمال المستويات الثلاثة تدخل — وهي القراءة الثانية التي أتاحها الإخطار. */
    setQuestionOverlay([
      { id: 'ADM9001', category: 'فئة ناقصة', level: 'سهل', topic: '', question: 'س١؟', answer: 'ج' },
      { id: 'ADM9002', category: 'فئة ناقصة', level: 'متوسط', topic: '', question: 'س٢؟', answer: 'ج' },
      { id: 'ADM9003', category: 'فئة ناقصة', level: 'صعب', topic: '', question: 'س٣؟', answer: 'ج' },
    ])
    expect(playableCategories()).toContain('فئة ناقصة')
    expect(playableCategories().length).toBe(before.length + 1)

    setExtraCategories([])
    setQuestionOverlay([])
  })
})
