import { describe, expect, it } from 'vitest'
import { reducer } from './reducer'
import { CATEGORIES, familyOf, playableCategories } from './bank'
import { STAGE1_CATEGORIES, STAGE1_LEVELS, createSession } from './session'
import type { GameState } from './session'
import type { Level, Question } from './types'
import { shuffle } from './draw'

/** كم سؤالاً يُعرض فعلاً في دور الحق ما تلحق الواحد (٣٠ ثانية ≈ ١٠–١٤). */
const S3_PER_TURN = 12

/* ستّ فئات من المكتملة المستويات — اللوح يسحب من كل فئة مستوياتها الثلاثة،
   فلا يصلح له ما نقصه مستوى (انظر playableCategories). */
const BOARD = playableCategories().slice(0, STAGE1_CATEGORIES)

const INPUT = {
  teamNames: ['النحل', 'الصقور'] as [string, string],
  players: [
    ['علي', 'سارة'],
    ['خالد', 'منى'],
  ] as [string[], string[]],
  startingTeam: 0 as const,
  categories: [BOARD.slice(0, 3), BOARD.slice(3)] as [string[], string[]],
}

/** خلايا اللوح الثماني عشرة بترتيبٍ مخلوط — كما يختارها فريقٌ لا كما تُصفّ. */
const boardCells = (s: GameState): { category: string; level: Level }[] =>
  shuffle(s.s1Categories.flatMap((c) => STAGE1_LEVELS.map((level) => ({ category: c.name, level }))))

const step = (s: GameState, a: Parameters<typeof reducer>[1]) => reducer(s, a)!
const freeCategory = (s: GameState) => {
  const left = CATEGORIES.filter((c) => !s.spentCategories.includes(c))
  return left[Math.floor(Math.random() * left.length)]
}

/**
 * يلعب جلسة كاملة عبر المحرك نفسه — لا محاكاة تعيد كتابة منطقه — ويعيد
 * كل سؤال عُرض على الشاشة بالترتيب: ١٨ في الجولة الجماعية (لوح ستّ فئات
 * بثلاثة مستويات)، و٤ في الديربي، و١٢ لكل فريق في الحق ما تلحق، ومعها
 * الحالة الأخيرة.
 */
function playSession(): { shown: Question[]; state: GameState } {
  const shown: Question[] = []
  let s = createSession(INPUT)

  for (const cell of boardCells(s)) {
    s = step(s, { t: 'S1_PICK', ...cell })
    shown.push(s.currentQuestion!)
    s = step(s, { t: 'S1_TO_REVEAL' })
    s = step(s, { t: 'S1_SCORE', correct: true })
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
    /* السؤال المعروض لحظة انتهاء الوقت ظهر على الشاشة أيضاً، والمحرك يحرقه
       عند إنهاء الدور — فيُحسب فيما عُرض. */
    if (turn === 0) {
      shown.push(s.s3Queue[s.s3Pos])
      s = step(s, { t: 'S3_END_TURN' })
    }
  }

  return { shown, state: s }
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
      const ids = playSession().shown.map((q) => q.id)
      expect(new Set(ids).size, `الجلسة ${n}`).toBe(ids.length)
    }
  })

  it('لا قالبان من عائلة واحدة في الجلسة الواحدة', () => {
    for (let n = 0; n < SESSIONS; n++) {
      const fams = playSession()
        .shown.map(familyOf)
        .filter((f): f is string => f !== null)
      expect(new Set(fams).size, `الجلسة ${n}`).toBe(fams.length)
    }
  })

  it('كل سؤال عُرض احترق — ولا شيء غيره', () => {
    let s = createSession(INPUT)
    const shown: string[] = []
    for (const cell of boardCells(s)) {
      s = step(s, { t: 'S1_PICK', ...cell })
      shown.push(s.currentQuestion!.id)
      s = step(s, { t: 'S1_SCORE', correct: false })
    }
    expect([...s.usedQuestionIds].sort()).toEqual([...shown].sort())
  })

  /**
   * سجلّ الجلسة هو ما تعرضه لوحة التبليغ في الختام. `usedQuestionIds`
   * تراكميّة عبر الجلسات فلا تصلح: من لعب عشر جلسات يجد فيها مئتي سؤال لم
   * يُسأل عنها الليلة.
   */
  it('سجلّ أسئلة الجلسة هو ما عُرض فيها، بترتيبه', () => {
    const { shown, state } = playSession()
    expect(state.askedQuestionIds).toEqual(shown.map((q) => q.id))
  })

  it('التبليغ يسجّل مرّة واحدة مهما تكرّرت الضغطة', () => {
    const { shown, state } = playSession()
    const id = shown[0].id
    const once = reducer(state, { t: 'REPORT_QUESTION', id })!
    const twice = reducer(once, { t: 'REPORT_QUESTION', id })!
    expect(once.reportedQuestionIds).toEqual([id])
    expect(twice.reportedQuestionIds).toEqual([id])
    /* الحالة نفسها تُعاد لا نسخة جديدة — فلا تُعاد الشاشة رسماً بلا تغيير. */
    expect(twice).toBe(once)
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
    const cell = { category: BOARD[0], level: 'سهل' as const }
    const a = step(s, { t: 'S1_PICK', ...cell })
    const b = step(s, { t: 'S1_PICK', ...cell })

    expect(s.usedQuestionIds.size).toBe(0) // الحالة الأصلية لم تُمسّ
    expect(a.usedQuestionIds.size).toBe(1)
    expect(b.usedQuestionIds.size).toBe(1)
  })

  it('لا يعدّل مصفوفات الحالة الواردة في مكانها', () => {
    const s = createSession(INPUT)
    const playedBefore = [...s.s1Played]
    const familiesBefore = [...s.spentFamilies]
    step(s, { t: 'S1_PICK', category: BOARD[0], level: 'سهل' })
    expect(s.s1Played).toEqual(playedBefore)
    expect(s.spentFamilies).toEqual(familiesBefore)
  })
})

/** يقود جلسةً عبر المحرك إلى بداية دور الحق ما تلحق (الفريق الأول). */
function driveToStage3(): GameState {
  let s = createSession(INPUT)
  for (const cell of boardCells(s)) {
    s = step(s, { t: 'S1_PICK', ...cell })
    s = step(s, { t: 'S1_TO_REVEAL' })
    s = step(s, { t: 'S1_SCORE', correct: true })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })
  while (s.phase === 'stage2-selection') {
    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
    s = step(s, { t: 'SPIN_DONE', category: freeCategory(s) })
    s = step(s, { t: 'S2_TO_REVEAL' })
    s = step(s, { t: 'S2_NEXT_ROUND' })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })
  return s
}

/**
 * حارس انحدار لخللٍ لُوحظ في جلسة حقيقية: الساعة لا تتوقف، فحين ينتهي وقت
 * الفريق الأول وسؤالٌ ما زال معروضاً، كان طابور الأسئلة يبقى عند موضعه فيبدأ
 * الفريق الثاني بالسؤال نفسه. الآن يُحرق السؤال المعروض ويُتجاوز عند انتهاء الدور.
 */
describe('الحق ما تلحق — انتهاء الوقت لا يكرّر السؤال', () => {
  it('السؤال المعروض لحظة انتهاء وقت الفريق الأول لا يبدأ به الفريق الثاني', () => {
    let s = driveToStage3()
    expect(s.phase).toBe('stage3-play')
    expect(s.s3Team).toBe(0)

    // الفريق الأول يعرض ويحكم بضعة أسئلة، ثم ينتهي الوقت وسؤالٌ ما زال معروضاً
    for (let k = 0; k < 3; k++) {
      s = step(s, { t: 'S3_REVEAL' })
      s = step(s, { t: 'S3_JUDGE', verdict: 'correct' })
    }
    const onScreenAtTimeout = s.s3Queue[s.s3Pos]
    s = step(s, { t: 'S3_END_TURN' })

    expect(s.s3Team).toBe(1)
    expect(s.s3Queue[s.s3Pos].id).not.toBe(onScreenAtTimeout.id)
    expect(s.usedQuestionIds.has(onScreenAtTimeout.id)).toBe(true) // احترق فلا يعود
  })
})
