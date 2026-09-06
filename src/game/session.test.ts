import { describe, expect, it } from 'vitest'
import {
  createSession,
  encodeState,
  isStoredState,
  loadUsedIds,
  persistUsedIds,
  setStorageOwner,
  STAGE1_CATEGORIES,
} from './session'
import { playableCategories } from './bank'

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
