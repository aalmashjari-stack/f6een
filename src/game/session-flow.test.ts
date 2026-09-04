import { describe, expect, it } from 'vitest'
import { reducer } from './reducer'
import { ALL_QUESTIONS, familyOf, playableCategories, setQuestionOverlay } from './bank'
import { STAGE1_CATEGORIES, STAGE1_LEVELS, createSession, stage1Owner } from './session'
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
  categories: BOARD,
}

/** خلايا اللوح الثماني عشرة بترتيبٍ مخلوط — كما يختارها فريقٌ لا كما تُصفّ. */
const boardCells = (s: GameState): { category: string; level: Level }[] =>
  shuffle(s.s1Categories.flatMap((c) => STAGE1_LEVELS.map((level) => ({ category: c.name, level }))))

const step = (s: GameState, a: Parameters<typeof reducer>[1]) => reducer(s, a)!

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
    s = step(s, { t: 'S1_SCORE', team: stage1Owner(s.s1Index, s.startingTeam) })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })

  while (s.phase === 'stage2-selection') {
    /* الديربي بلا تصنيفات: السؤال يُسحب مع اختيار اللاعبين، بلا شاشة بينهما. */
    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
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
      s = step(s, { t: 'S1_SCORE', team: null })
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
    s = step(s, { t: 'S1_SCORE', team: stage1Owner(s.s1Index, s.startingTeam) })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })
  while (s.phase === 'stage2-selection') {
    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
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


/**
 * حرّاس المرحلة: الفعل الذي يصل خارج شاشته لا يُنفَّذ — مؤقّتُ تشويقٍ يطلق
 * اختياراً بعد أن ذهبت الشاشة، أو ضغطةٌ مزدوجة تحكم على سؤالٍ لم يُكشف.
 * الحالة نفسها تُعاد لا نسخة، فلا تُعاد الشاشة رسماً ولا يُحرق سؤال.
 */
describe('حرّاس المرحلة', () => {
  it('لا خليّة تُسحب خارج لوح الجولة الجماعية', () => {
    let s = createSession(INPUT)
    const [a, b] = boardCells(s)
    s = step(s, { t: 'S1_PICK', ...a })
    expect(s.phase).toBe('stage1-question')
    expect(reducer(s, { t: 'S1_PICK', ...b })).toBe(s)
  })

  it('لا اختيار لاعبَين خارج شاشة الاختيار', () => {
    const s = createSession(INPUT)
    expect(reducer(s, { t: 'S2_SELECT', sel: [0, 0] })).toBe(s)
  })

  it('لا حكم في الحق ما تلحق قبل الكشف', () => {
    const s = driveToStage3()
    expect(reducer(s, { t: 'S3_JUDGE', verdict: 'correct' })).toBe(s)
  })

  it('سؤال الحسم لا يُسحب مرّتين وسؤالٌ معروض', () => {
    const s = { ...driveToStage3(), phase: 'tiebreak' as const }
    const once = step(s, { t: 'TIEBREAK_SPIN', category: BOARD[0] })
    expect(once.currentQuestion).not.toBeNull()
    expect(reducer(once, { t: 'TIEBREAK_SPIN', category: BOARD[1] })).toBe(once)
  })

  it('سؤال الحسم بلا فئة يُسحب صعباً من البنك كلّه', () => {
    const s = { ...driveToStage3(), phase: 'tiebreak' as const }
    const spun = step(s, { t: 'TIEBREAK_SPIN', category: '' })
    expect(spun.currentQuestion?.level).toBe('صعب')
    expect(spun.currentCategory).toBeNull()
  })
})

/**
 * الطابور لا ينفد: الأربعون تكفي دورين عاديّين، لكنّ حكماً سريعاً مع فريقٍ
 * يعرف الإجابات يستهلكها — فكان الفريق الثاني يقف على «نفد الطابور» وزرٍّ
 * معطَّل. الآن تُسحب دفعةٌ جديدة عند آخر ورقة، بلا تكرارٍ ولا قالبٍ مطروق.
 */
describe('الحق ما تلحق — الطابور لا ينفد', () => {
  it('يُمدَّد حين تُستهلك آخر ورقة، بلا تكرار سؤال', () => {
    let s = driveToStage3()
    const before = new Set([...s.usedQuestionIds])
    const shown: string[] = []
    const total = s.s3Queue.length + 15
    for (let k = 0; k < total; k++) {
      const q = s.s3Queue[s.s3Pos]
      expect(q, `الورقة ${k}`).toBeDefined()
      shown.push(q.id)
      s = step(s, { t: 'S3_REVEAL' })
      s = step(s, { t: 'S3_JUDGE', verdict: 'correct' })
    }
    expect(new Set(shown).size).toBe(shown.length)
    for (const id of shown) expect(before.has(id), id).toBe(false)
    expect(s.s3Queue[s.s3Pos]).toBeDefined()
    /* ولا قالبان من عائلة واحدة بين ما عُرض في الجلسة كلّها */
    const fams = s.askedQuestionIds
      .map((id) => familyOf(s.s3Queue.find((q) => q.id === id) ?? ALL_QUESTIONS.find((q) => q.id === id)!))
      .filter((f): f is string => f !== null)
    expect(new Set(fams).size).toBe(fams.length)
  })

  it('انتهاء الدور عند آخر ورقة يترك للفريق التالي ورقةً جاهزة', () => {
    let s = driveToStage3()
    while (s.s3Pos < s.s3Queue.length - 1) {
      s = step(s, { t: 'S3_REVEAL' })
      s = step(s, { t: 'S3_JUDGE', verdict: 'wrong' })
    }
    s = step(s, { t: 'S3_END_TURN' })
    expect(s.s3Team).toBe(1)
    expect(s.s3Queue[s.s3Pos]).toBeDefined()
  })
})

/**
 * قوانين ٤ سبتمبر ٢٠٢٦: الديربي **بلا تصنيفات**، والديربي والحق ما تلحق
 * **من البنك المشحون وحده** لا مما أضافته اللوحة. والمضافُ يدخل اللعبة من
 * باب لوح الجولة الجماعية — الباب الذي يختاره الفريقان بأنفسهما.
 *
 * وقانونُ البنك لا يكشفه تصفّحٌ يدويّ: لوحةٌ فارغة من الإضافات تُخفيه
 * تماماً، ولا يظهر إلّا على حسابٍ رُفعت فيه دفعةُ أسئلة — ثمّ يظهر سؤالٌ
 * مضاف بعد أن تكون الجلسة قد بدأت أمام المجلس.
 */
describe('الديربي والحق ما تلحق — من البنك المشحون', () => {
  const SHIPPED = new Set(ALL_QUESTIONS.map((q) => q.id))

  it('لا يمرّ بشاشة تصنيف: السؤال جاهز مع اختيار اللاعبين', () => {
    let s = createSession(INPUT)
    for (const cell of boardCells(s)) {
      s = step(s, { t: 'S1_PICK', ...cell })
      s = step(s, { t: 'S1_SCORE', team: null })
    }
    s = step(s, { t: 'INTERVAL_CONTINUE' })
    expect(s.phase).toBe('stage2-selection')

    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
    expect(s.phase).toBe('stage2-question')
    expect(s.currentQuestion).not.toBeNull()
    expect(s.currentQuestion!.level).toBe('متوسط')
    /* ولا تصنيفَ معروضاً — الشريط يقول «متوسط · لا تشاور» لا اسمَ فئة. */
    expect(s.currentCategory).toBeNull()
  })

  it('لا الديربي ولا الحق ما تلحق يسحب مضافاً مهما امتلأت الطبقة', () => {
    /* طبقةٌ ضخمة من المضاف في المستوى نفسه: لو كان السحب من `effective`
       لغلبت احتمالاً كلَّ جلسةٍ من الجلسات المئة أدناه. */
    setQuestionOverlay(
      Array.from({ length: 400 }, (_, i) => ({
        id: `ADM${9000 + i}`,
        category: 'أكلات',
        /* ثلثٌ في كل مستوى: «متوسط» يمسّ الديربي، و«سهل» و«متوسط» يمسّان
           طابور الحق ما تلحق. */
        level: (['سهل', 'متوسط', 'صعب'] as const)[i % 3],
        topic: '',
        question: `سؤال مضاف رقم ${i}؟`,
        answer: `جواب ${i}`,
      })),
    )
    try {
      for (let n = 0; n < 100; n++) {
        let s = createSession(INPUT)
        /* طابور الحق ما تلحق يُسحب عند الإنشاء — فيُفحص كاملاً لا ما عُرض منه. */
        for (const q of s.s3Queue) expect(SHIPPED.has(q.id), `الطابور، الجلسة ${n}`).toBe(true)
        for (const cell of boardCells(s)) {
          s = step(s, { t: 'S1_PICK', ...cell })
          s = step(s, { t: 'S1_SCORE', team: null })
        }
        s = step(s, { t: 'INTERVAL_CONTINUE' })
        while (s.phase === 'stage2-selection') {
          s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
          expect(SHIPPED.has(s.currentQuestion!.id), `الديربي، الجلسة ${n}`).toBe(true)
          s = step(s, { t: 'S2_TO_REVEAL' })
          s = step(s, { t: 'S2_NEXT_ROUND' })
        }
      }
    } finally {
      setQuestionOverlay([])
    }
  })
})
