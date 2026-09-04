import { describe, expect, it } from 'vitest'
import { createSession, encodeState, isStoredState, STAGE1_CATEGORIES } from './session'
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
