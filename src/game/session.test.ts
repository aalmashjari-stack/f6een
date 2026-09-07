import { describe, expect, it } from 'vitest'
import {
  createSession,
  encodeState,
  isStoredState,
  loadUsedIds,
  persistUsedIds,
  notReadyMessage,
  sessionNotReady,
  setStorageOwner,
  STAGE1_CATEGORIES,
} from './session'
import { playableCategories, poolByCatLevel, poolShippedByLevels, setBlockedQuestionIds } from './bank'

const BOARD = playableCategories().slice(0, STAGE1_CATEGORIES)
const INPUT = {
  teamNames: ['النحل', 'الصقور'] as [string, string],
  players: [['علي', 'سارة'], ['خالد', 'منى']] as [string[], string[]],
  startingTeam: 0 as const,
  categories: BOARD,
}

/**
 * حارسُ الاستئناف: الخادم يحفظ اللقطة بلا رقم نسخة، وجلسةٌ فُتحت قبل أن
 * يتبدّل شكل الحالة تعود «مفتوحة» في كلّ بدء فتُستأنف ويسقط التطبيق — في
 * كلّ تشغيل. الفحص بنيويّ فلا يُنسى كما يُنسى رقمٌ يُرفع باليد.
 */
describe('isStoredState', () => {
  it('يقبل لقطة النسخة الحالية، وبعد رحلة JSON', () => {
    const stored = encodeState(createSession(INPUT))
    expect(isStoredState(stored)).toBe(true)
    expect(isStoredState(JSON.parse(JSON.stringify(stored)))).toBe(true)
  })

  it('يردّ ما ليس لقطة', () => {
    expect(isStoredState(null)).toBe(false)
    expect(isStoredState({})).toBe(false)
    expect(isStoredState('x')).toBe(false)
  })

  it('يردّ لقطةً بشكل العجلة القديم — بلا لوح الجولة الجماعية', () => {
    const stored = encodeState(createSession(INPUT)) as Record<string, unknown>
    delete stored.s1Categories
    delete stored.s1Played
    expect(isStoredState(stored)).toBe(false)
  })

  it('يردّ مرحلةً لا يعرفها هذا الإصدار وفريقاً ناقصاً', () => {
    const base = encodeState(createSession(INPUT))
    expect(isStoredState({ ...base, phase: 'wheel' })).toBe(false)
    expect(isStoredState({ ...base, teams: [base.teams[0]] })).toBe(false)
    expect(isStoredState({ ...base, usedQuestionIds: {} })).toBe(false)
  })
})

/**
 * التخزين باسم الحساب: ذاكرةُ حسابٍ لا يرثها حسابٌ آخر على الجهاز نفسه.
 * والمفتاح القديم بلا اسم يرثه أوّلُ حسابٍ حقيقيّ ثمّ يُمحى.
 */
describe('التخزين المحلّي باسم الحساب', () => {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  })

  it('ذاكرة حسابٍ لا تظهر لحسابٍ آخر', () => {
    store.clear()
    setStorageOwner('A')
    persistUsedIds(new Set(['E001', 'M002']))
    setStorageOwner('B')
    expect(loadUsedIds().size).toBe(0)
    setStorageOwner('A')
    expect([...loadUsedIds()]).toEqual(['E001', 'M002'])
  })

  it('المفتاح القديم يرثه أوّل حساب ثمّ يُمحى', () => {
    store.clear()
    store.set('f6een.usedQuestionIds', JSON.stringify(['H001']))
    setStorageOwner('A')
    expect([...loadUsedIds()]).toEqual(['H001'])
    expect(store.has('f6een.usedQuestionIds')).toBe(false)
    setStorageOwner('B')
    expect(loadUsedIds().size).toBe(0)
  })

  it('اللاعب بلا حساب لا يرث المفتاح القديم', () => {
    store.clear()
    store.set('f6een.usedQuestionIds', JSON.stringify(['H001']))
    setStorageOwner(null)
    expect(loadUsedIds().size).toBe(0)
    expect(store.has('f6een.usedQuestionIds')).toBe(true)
  })

  /* الترتيب هو ترتيب الاستعمال — عليه تقوم قاعدة «الأقدم استخداماً». */
  it('يحفظ الترتيب كما هو', () => {
    store.clear()
    setStorageOwner('A')
    const ids = ['M009', 'E001', 'H004', 'M001']
    persistUsedIds(new Set(ids))
    expect([...loadUsedIds()]).toEqual(ids)
  })
})

/**
 * الفحص بحسب الطور: لقطةُ «سؤال» بلا سؤال كانت تمرّ من الفحص البنيويّ ثمّ
 * تسقط الشاشة على `null` — وفي كلّ إقلاع، لأنّ الخادم يعيدها.
 */
describe('isStoredState — ما يحتاجه الطور', () => {
  const base = () => encodeState(createSession(INPUT)) as Record<string, unknown>

  it('يردّ طور السؤال بلا سؤال أو بلا خليّة', () => {
    const q = { id: 'E001', category: 'x', level: 'سهل', topic: '', question: 'س؟', answer: 'ج' }
    expect(isStoredState({ ...base(), phase: 'stage1-question', currentQuestion: null })).toBe(false)
    expect(isStoredState({ ...base(), phase: 'stage1-question', currentQuestion: q, s1Cell: null })).toBe(false)
    expect(
      isStoredState({ ...base(), phase: 'stage1-question', currentQuestion: q, s1Cell: { category: 'x', level: 'سهل' } }),
    ).toBe(true)
    expect(isStoredState({ ...base(), phase: 'stage2-question', currentQuestion: q, s2Sel: null })).toBe(false)
    expect(isStoredState({ ...base(), phase: 'stage2-question', currentQuestion: q, s2Sel: [0, 0] })).toBe(true)
  })

  it('يردّ لاعباً بلا اسم وعموداً ناقصاً', () => {
    const b = base()
    const teams = b.teams as { players: unknown[] }[]
    expect(isStoredState({ ...b, teams: [{ ...teams[0], players: [{ id: 't0p0' }] }, teams[1]] })).toBe(false)
    expect(isStoredState({ ...b, stagePoints: { s1: [0], s2: [0, 0], s3: [0, 0], tie: [0, 0] } })).toBe(false)
    expect(isStoredState({ ...b, s3Queue: [null] })).toBe(false)
  })
})

/**
 * جاهزيّة الجلسة — تُفحص **قبل الخصم**. الخصم عند الإنشاء ولا يُردّ
 * (SPEC ٣)، وفئةٌ خرجت من الصالحة بين رسم شبكة الإعداد والضغط على «ابدأ»
 * تكلّف اللاعب لعبةً كاملة أمام مجلسه.
 */
describe('sessionNotReady', () => {
  it('يمرّ على مدخلات سليمة', () => {
    expect(sessionNotReady(INPUT)).toBeNull()
  })

  it('يردّ عدداً ناقصاً من الفئات', () => {
    const r = sessionNotReady({ ...INPUT, categories: BOARD.slice(0, 3) })
    expect(r?.kind).toBe('count')
    expect(notReadyMessage(r!)).toContain(String(STAGE1_CATEGORIES))
  })

  /* الحالة التي بُني الفحص لأجلها: بلاغٌ يصل بعد رسم الشبكة فيحجز آخر سؤالٍ
     في خليّة، فتخرج الفئة من الصالحة والاختيارُ قائم. */
  it('يسمّي الفئة التي خرجت من الصالحة بعد الاختيار', () => {
    const cat = BOARD[0]
    const doomed = poolByCatLevel(cat, 'صعب').map((q) => q.id)
    setBlockedQuestionIds(doomed)
    try {
      const r = sessionNotReady(INPUT)
      expect(r?.kind).toBe('categories')
      expect(r?.kind === 'categories' && r.names).toContain(cat)
      expect(notReadyMessage(r!)).toContain(cat)
    } finally {
      setBlockedQuestionIds([])
    }
  })

  /* حجبُ مخزون الحق ما تلحق يُخرج الفئات من الصالحة قبل أن يُفحص الطابور —
     ولهذا حُذف فحصُ الطابور من الدالّة: شرطُه لا يُبلغ أبداً. */
  it('حجبُ المخزون كلّه يظهر فئاتٍ لا طابوراً', () => {
    setBlockedQuestionIds(poolShippedByLevels(['سهل', 'متوسط']).map((q) => q.id))
    try {
      expect(sessionNotReady(INPUT)?.kind).toBe('categories')
    } finally {
      setBlockedQuestionIds([])
    }
  })
})
