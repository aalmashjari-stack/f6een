import { describe, expect, it } from 'vitest'
import { reducer } from './reducer'
import { CATEGORIES, familyOf } from './bank'
import { STAGE1_QUESTIONS, createSession } from './session'
import type { GameState } from './session'
import type { Question } from './types'

/** كم سؤالاً يُعرض فعلاً في دور الحق ما تلحق الواحد (٣٠ ثانية ≈ ١٠–١٤). */
const S3_PER_TURN = 12

const INPUT = {
  teamNames: ['النحل', 'الصقور'] as [string, string],
  players: [
    ['علي', 'سارة'],
    ['خالد', 'منى'],
  ] as [string[], string[]],
  startingTeam: 0 as const,
}

const step = (s: GameState, a: Parameters<typeof reducer>[1]) => reducer(s, a)!
const freeCategory = (s: GameState) => {
  const left = CATEGORIES.filter((c) => !s.spentCategories.includes(c))
  return left[Math.floor(Math.random() * left.length)]
}

/**
 * يلعب جلسة كاملة عبر المحرك نفسه — لا محاكاة تعيد كتابة منطقه — ويعيد
 * كل سؤال عُرض على الشاشة بالترتيب: ٦ في الجولة الجماعية، ٤ في راس براس،
 * و١٢ لكل فريق في الحق ما تلحق.
 */
function playSession(): Question[] {
  const shown: Question[] = []
  let s = createSession(INPUT)

  for (let i = 0; i < STAGE1_QUESTIONS; i++) {
    s = step(s, { t: 'SPIN_DONE', category: freeCategory(s) })
    shown.push(s.currentQuestion!)
    s = step(s, { t: 'S1_TO_REVEAL' })
    s = step(s, { t: 'S1_SCORE', outcome: 'owner' })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })

  while (s.phase === 'stage2-selection') {
    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
    s = step(s, { t: 'SPIN_DONE', category: freeCategory(s) })
    shown.push(s.currentQuestion!)
    s = step(s, { t: 'S2_TO_REVEAL' })
    s = step(s, { t: 'S2_NEXT_ROUND' })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })

  for (const turn of [0, 1]) {
    for (let k = 0; k < S3_PER_TURN; k++) {
      shown.push(s.s3Queue[s.s3Pos])
      s = step(s, { t: 'S3_REVEAL' })
      s = step(s, { t: 'S3_JUDGE', verdict: k % 3 === 0 ? 'wrong' : 'correct' })
    }
    if (turn === 0) s = step(s, { t: 'S3_END_TURN' })
  }

  return shown
}

/**
 * الضمانة الأصلية التي كُتب المحرك من أجلها. حارس انحدار لخللين وقعا فعلاً:
 * طابور الحق ما تلحق كان يُسحب بلا حجز فيظهر سؤاله مرّتين في الجلسة (١٤٪
 * من الجلسات)، والقوالب المتشابهة كانت تتلاحق فتُحسّ اللعبة مكرّرة.
 */
describe('الجلسة الكاملة عبر المحرك', () => {
  const SESSIONS = 300

  it('لا سؤال يظهر مرّتين في الجلسة الواحدة', () => {
    for (let n = 0; n < SESSIONS; n++) {
      const ids = playSession().map((q) => q.id)
      expect(new Set(ids).size, `الجلسة ${n}`).toBe(ids.length)
    }
  })

  it('لا قالبان من عائلة واحدة في الجلسة الواحدة', () => {
    for (let n = 0; n < SESSIONS; n++) {
      const fams = playSession()
        .map(familyOf)
        .filter((f): f is string => f !== null)
      expect(new Set(fams).size, `الجلسة ${n}`).toBe(fams.length)
    }
  })

  it('كل سؤال عُرض احترق — ولا شيء غيره', () => {
    let s = createSession(INPUT)
    const shown: string[] = []
    for (let i = 0; i < STAGE1_QUESTIONS; i++) {
      s = step(s, { t: 'SPIN_DONE', category: freeCategory(s) })
      shown.push(s.currentQuestion!.id)
      s = step(s, { t: 'S1_SCORE', outcome: 'none' })
    }
    expect([...s.usedQuestionIds].sort()).toEqual([...shown].sort())
  })
})

/**
 * حارس انحدار للنقاء: React يستدعي الـ reducer مرّتين على الحالة نفسها في
 * التطوير (StrictMode). لو حمل السحبُ أثراً جانبياً لاحترق سؤالان مقابل
 * سؤال معروض واحد — وهو ما كان يقع فعلاً.
 */
describe('نقاء المحرك', () => {
  it('استدعاء مرّتين على الحالة نفسها يحرق سؤالاً واحداً لا اثنين', () => {
    const s = createSession(INPUT)
    const a = step(s, { t: 'SPIN_DONE', category: CATEGORIES[0] })
    const b = step(s, { t: 'SPIN_DONE', category: CATEGORIES[0] })

    expect(s.usedQuestionIds.size).toBe(0) // الحالة الأصلية لم تُمسّ
    expect(a.usedQuestionIds.size).toBe(1)
    expect(b.usedQuestionIds.size).toBe(1)
  })

  it('لا يعدّل مصفوفات الحالة الواردة في مكانها', () => {
    const s = createSession(INPUT)
    const categoriesBefore = [...s.spentCategories]
    const familiesBefore = [...s.spentFamilies]
    step(s, { t: 'SPIN_DONE', category: CATEGORIES[0] })
    expect(s.spentCategories).toEqual(categoriesBefore)
    expect(s.spentFamilies).toEqual(familiesBefore)
  })
})
