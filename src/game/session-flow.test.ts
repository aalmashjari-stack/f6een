import { describe, expect, it } from 'vitest'
import { reducer } from './reducer'
import { ALL_QUESTIONS, DERBY_LEVELS, familyOf, playableCategories, setDerbyCategories, setQuestionOverlay } from './bank'
import {
  SCORE_FIX_STEP,
  STAGE1_CATEGORIES,
  STAGE1_CONSULT_MS,
  STAGE1_LEVEL_POINTS,
  STAGE1_LEVELS,
  STAGE2_CORRECT,
  STAGE2_TIMER_MS,
  STAGE2_WRONG,
  STAGE3_POINTS,
  STAGE3_TIMER_MS,
  TIEBREAK_POINTS,
  cellKey,
  createSession,
  decodeState,
  encodeState,
  isStoredState,
  pickDerbyPair,
  stage1Owner,
} from './session'
import type { GameState } from './session'
import type { Level, Question } from './types'
import { shuffle } from './draw'
import { ALPHABET, LETTERS_CATEGORY, firstLetter } from './letters'
import { CHARADES_CATEGORY, STAGE1_CHARADE_MS } from './charades'

/** كم سؤالاً يُعرض فعلاً في دور الحق ما تلحق الواحد (٤٥ ثانية ≈ ١٥–٢١). */
const S3_PER_TURN = 18

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
      s = step(s, { t: 'S3_END_TURN', team: s.s3Team })
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
    s = step(s, { t: 'S3_END_TURN', team: s.s3Team })

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
 * الطابور لا ينفد: الستّون تكفي دورين عاديّين، لكنّ حكماً سريعاً مع فريقٍ
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
    s = step(s, { t: 'S3_END_TURN', team: s.s3Team })
    expect(s.s3Team).toBe(1)
    expect(s.s3Queue[s.s3Pos]).toBeDefined()
  })
})

/**
 * قوانين ٤ سبتمبر ٢٠٢٦: الديربي والحق ما تلحق **بلا اختيار تصنيف** و**من
 * البنك المشحون وحده** لا مما أضافته اللوحة. ثمّ في ١٥ سبتمبر فُتحا على
 * فئاتٍ بعينها من القاعدة بمستويي سهل ومتوسط (SPEC ٥ و٦) مشحونةً ومضافة —
 * والفئات تصل مع المزامنة، فبلا قائمة يبقى كلٌّ على قانونه القديم.
 *
 * وقانونُ البنك لا يكشفه تصفّحٌ يدويّ: لوحةٌ فارغة من الإضافات تُخفيه
 * تماماً، ولا يظهر إلّا على حسابٍ رُفعت فيه دفعةُ أسئلة — ثمّ يظهر سؤالٌ
 * مضاف بعد أن تكون الجلسة قد بدأت أمام المجلس.
 */
describe('الديربي والحق ما تلحق — مصدر الأسئلة', () => {
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
    /* بلا قائمة فئات: القانون القديم، متوسط من المشحون. */
    expect(s.currentQuestion!.level).toBe('متوسط')
    /* ولا تصنيفَ معروضاً — الشريط لا يعرض اسمَ فئة. */
    expect(s.currentCategory).toBeNull()
  })

  it('الديربي والحق ما تلحق بقائمة فئات: سهل ومتوسط من فئات الديربي وحدها — مشحونةً ومضافة', () => {
    /* فئتان: واحدة مشحونة، وأخرى مضافة كلُّها من اللوحة — كفئات إسلاميات
       الخمس التي لا معرّف مشحون فيها. */
    const DERBY = ['تاريخ وحضارات', 'قصص الأنبياء']
    setQuestionOverlay(
      Array.from({ length: 120 }, (_, i) => ({
        id: `ADM${8000 + i}`,
        category: i % 2 ? 'قصص الأنبياء' : 'أكلات',
        level: (['سهل', 'متوسط', 'صعب', 'تعجيزي'] as const)[i % 4],
        topic: '',
        question: `سؤال مضاف رقم ${i}؟`,
        answer: `جواب ${i}`,
      })),
    )
    setDerbyCategories(DERBY)
    try {
      const seen = new Set<string>()
      const seenS3 = new Set<string>()
      for (let n = 0; n < 60; n++) {
        let s = createSession(INPUT)
        /* طابور الحق ما تلحق يُسحب عند الإنشاء — القاعدة نفسها عليه كاملاً. */
        for (const q of s.s3Queue) {
          expect(DERBY, `طابور ${q.id} في الجلسة ${n}`).toContain(q.category)
          expect(DERBY_LEVELS, `مستوى الطابور ${q.id} في الجلسة ${n}`).toContain(q.level)
          seenS3.add(q.category)
        }
        for (const cell of boardCells(s)) {
          s = step(s, { t: 'S1_PICK', ...cell })
          s = step(s, { t: 'S1_SCORE', team: null })
        }
        s = step(s, { t: 'INTERVAL_CONTINUE' })
        while (s.phase === 'stage2-selection') {
          s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
          const q = s.currentQuestion!
          expect(DERBY, `فئة ${q.id} في الجلسة ${n}`).toContain(q.category)
          expect(DERBY_LEVELS, `مستوى ${q.id} في الجلسة ${n}`).toContain(q.level)
          seen.add(q.category)
          s = step(s, { t: 'S2_TO_REVEAL' })
          s = step(s, { t: 'S2_NEXT_ROUND' })
        }
      }
      /* والمضافة تُسحب فعلاً لا تُستثنى: في ستّين جلسة تظهر الفئتان في المرحلتين. */
      expect([...seen].sort()).toEqual([...DERBY].sort())
      expect([...seenS3].sort()).toEqual([...DERBY].sort())
    } finally {
      setDerbyCategories([])
      setQuestionOverlay([])
    }
  })

  it('بلا قائمة فئات: لا الديربي ولا الحق ما تلحق يسحب مضافاً مهما امتلأت الطبقة', () => {
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

/**
 * ثنائيّات الديربي — لا مواجهة تتكرّر ما بقيت مواجهةٌ لم تقع (قرار علي ٢١
 * سبتمبر ٢٠٢٦). الشاشة تختار بـ`pickDerbyPair` والمحرّك يسجّل في `s2Pairs`،
 * فالاختبار يمشي بهما معاً كما تمشي الشاشة.
 */
describe('ثنائيّات الديربي', () => {
  const toDerby = (players: [string[], string[]]) => {
    let s = createSession({ ...INPUT, players })
    for (const cell of boardCells(s)) {
      s = step(s, { t: 'S1_PICK', ...cell })
      s = step(s, { t: 'S1_SCORE', team: null })
    }
    return step(s, { t: 'INTERVAL_CONTINUE' })
  }
  const playDerby = (players: [string[], string[]]) => {
    let s = toDerby(players)
    const pairs: string[] = []
    while (s.phase === 'stage2-selection') {
      const sel = pickDerbyPair(s)
      s = step(s, { t: 'S2_SELECT', sel })
      pairs.push(sel.join(':'))
      s = step(s, { t: 'S2_TO_REVEAL' })
      s = step(s, { t: 'S2_NEXT_ROUND' })
    }
    return pairs
  }

  it('٢×٢: الجولات الأربع أربعُ مواجهاتٍ مختلفة — A/D وB/C بعد A/C وB/D', () => {
    for (let n = 0; n < 200; n++) {
      const pairs = playDerby([
        ['A', 'B'],
        ['C', 'D'],
      ])
      expect(pairs).toHaveLength(4)
      expect(new Set(pairs).size, `الجلسة ${n}: ${pairs.join(' ')}`).toBe(4)
    }
  })

  it('٣×٣ و٢×٣: لا مواجهة تتكرّر، والدورة الكاملة محفوظة معها', () => {
    const cases: [string[], string[]][] = [
      [
        ['A', 'B', 'C'],
        ['D', 'E', 'F'],
      ],
      [
        ['A', 'B'],
        ['C', 'D', 'E'],
      ],
    ]
    for (const players of cases)
      for (let n = 0; n < 200; n++) {
        let s = toDerby(players)
        const pairs: string[] = []
        while (s.phase === 'stage2-selection') {
          const before = s.s2Rem
          const sel = pickDerbyPair(s)
          expect(before[0]).toContain(sel[0])
          expect(before[1]).toContain(sel[1])
          s = step(s, { t: 'S2_SELECT', sel })
          pairs.push(sel.join(':'))
          s = step(s, { t: 'S2_TO_REVEAL' })
          s = step(s, { t: 'S2_NEXT_ROUND' })
        }
        expect(new Set(pairs).size, `${players.flat().join('')} — ${pairs.join(' ')}`).toBe(pairs.length)
      }
  })

  it('١×١: لا مواجهة غيرُ الواحدة — يعود الاختيار على الدورة بلا سقوط', () => {
    const pairs = playDerby([['A'], ['B']])
    expect(pairs).toEqual(['0:0', '0:0', '0:0', '0:0'])
  })

  it('لقطةٌ محفوظة قبل ذاكرة المواجهات تُستأنف بلا مواجهات', () => {
    const { s2Pairs: _drop, ...old } = encodeState(createSession(INPUT))
    expect(isStoredState(old)).toBe(true)
    expect(decodeState(old as Parameters<typeof decodeState>[0]).s2Pairs).toEqual([])
  })
})

/**
 * تصحيحُ الحكم — ±5 بجانب نقاط الفريق.
 *
 * الحكم يخطئ في «من أجاب؟» فتذهب النقاط للفريق الغلط. وهذا الفعل يمرّ
 * بالمخفّض لا بالواجهة كي يُحفظ مع الجلسة — ولو عُدّل الرقم في الشاشة وحدها
 * لعاد الخطأ عند أوّل استئناف.
 */
describe('تصحيح الحكم', () => {
  const fresh = () => createSession(INPUT)

  it('يزيد وينقص للفريق المقصود وحده', () => {
    let s = fresh()
    s = step(s, { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP })
    expect(s.teams[0].score).toBe(SCORE_FIX_STEP)
    expect(s.teams[1].score).toBe(0)

    s = step(s, { t: 'ADJUST', team: 0, delta: -SCORE_FIX_STEP })
    expect(s.teams[0].score).toBe(0)
  })

  /* ردُّ خطأٍ كامل: خليّةٌ صعبة (30) ذهبت للفريق الغلط. والضغطات تُحسب من
     الثابت لا تُكتب رقماً — فتغييرُ الخطوة لا يكسر الاختبار بل يقيسه. */
  it('يردّ نقاط سؤالٍ كاملٍ ذهب للفريق الخطأ', () => {
    const wrong = 30
    const presses = wrong / SCORE_FIX_STEP
    expect(Number.isInteger(presses), 'خطوةُ التصحيح تقسم نقاط اللعبة').toBe(true)

    let s = fresh()
    s = step(s, { t: 'ADJUST', team: 1, delta: wrong })
    for (let i = 0; i < presses; i++) s = step(s, { t: 'ADJUST', team: 1, delta: -SCORE_FIX_STEP })
    for (let i = 0; i < presses; i++) s = step(s, { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP })
    expect([s.teams[0].score, s.teams[1].score]).toEqual([wrong, 0])
  })

  /* الحارسُ الحقيقيّ للقيمة: كلُّ ما تمنحه اللعبة مضاعفُ الخطوة، فلا خطأ
     يعجز التصحيحُ عن ردّه بالضبط. يسقط لو صارت الخطوة 20 أو 15. */
  it('كل قيمةٍ تمنحها اللعبة مضاعفٌ لخطوة التصحيح', () => {
    const awards = [
      ...Object.values(STAGE1_LEVEL_POINTS),
      STAGE2_CORRECT,
      STAGE2_WRONG,
      STAGE3_POINTS,
      TIEBREAK_POINTS,
    ]
    for (const v of awards) expect(Math.abs(v) % SCORE_FIX_STEP, `${v}`).toBe(0)
  })

  /* أعمدةُ الختام تجمع المجموع دائماً: التصحيح يُقيَّد على مرحلة طوره، فلا
     يظهر مجموعٌ لا تفسّره أعمدته. */
  it('يُقيَّد على مرحلة الطور الجاري فتبقى أعمدة الختام مطابقة', () => {
    let s = fresh()
    expect(s.phase).toBe('stage1-board')
    s = step(s, { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP })
    expect(s.stagePoints.s1[0]).toBe(SCORE_FIX_STEP)

    s = step({ ...s, phase: 'stage2-question' }, { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP })
    expect(s.stagePoints.s2[0]).toBe(SCORE_FIX_STEP)

    s = step({ ...s, phase: 'stage3-play' }, { t: 'ADJUST', team: 1, delta: -SCORE_FIX_STEP })
    expect(s.stagePoints.s3[1]).toBe(-SCORE_FIX_STEP)

    s = step({ ...s, phase: 'tiebreak' }, { t: 'ADJUST', team: 1, delta: SCORE_FIX_STEP })
    expect(s.stagePoints.tie[1]).toBe(SCORE_FIX_STEP)

    for (const t of [0, 1] as const) {
      const cols = (['s1', 's2', 's3', 'tie'] as const).reduce((n, k) => n + s.stagePoints[k][t], 0)
      expect(cols, `مجموع أعمدة الفريق ${t}`).toBe(s.teams[t].score)
    }
  })

  /* الفاصلُ ذيلُ ما سبقه: قبل الديربي ذيلُ اللوح، وقبل الحق ما تلحق ذيلُ
     الديربي. كان يُنسب كلُّه إلى اللوح، فتصحيحٌ بعد الديربي يظهر في العمود
     الخطأ و«وين خسرنا؟» يُجاب غلطاً. */
  it('التصحيح في الفاصل يُقيَّد على المرحلة التي سبقته', () => {
    const before2 = step(
      { ...fresh(), phase: 'interval', intervalNext: 'stage2-selection' },
      { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP },
    )
    expect(before2.stagePoints.s1[0]).toBe(SCORE_FIX_STEP)
    expect(before2.stagePoints.s2[0]).toBe(0)

    const before3 = step(
      { ...fresh(), phase: 'interval', intervalNext: 'stage3-play' },
      { t: 'ADJUST', team: 0, delta: SCORE_FIX_STEP },
    )
    expect(before3.stagePoints.s2[0]).toBe(SCORE_FIX_STEP)
    expect(before3.stagePoints.s1[0]).toBe(0)

    const beforeTie = step(
      { ...fresh(), phase: 'interval', intervalNext: 'tiebreak' },
      { t: 'ADJUST', team: 1, delta: -SCORE_FIX_STEP },
    )
    expect(beforeTie.stagePoints.s3[1]).toBe(-SCORE_FIX_STEP)
  })
})

/**
 * حرّاس الطور — الدفعة الثانية (٧ سبتمبر ٢٠٢٦). فعلٌ متأخّر أو مكرَّر من
 * شاشةٍ ذهبت لا يحرّك طوراً غير طوره: كان `S3_END_TURN` مرّتين يُنهي دورَي
 * الفريقين، والكشفُ يقلب الختام إلى كشف، وتنقيطُ الحسم يعمل في اللوح.
 * الحالة نفسها تُعاد لا نسخة.
 */
describe('حرّاس الطور — أفعال متأخّرة ومكرَّرة', () => {
  it('انتهاء الدور مرّتين لا يُنهي دور الفريق الثاني', () => {
    let s = driveToStage3()
    const first = s.s3Team
    s = step(s, { t: 'S3_END_TURN', team: first })
    expect(s.s3Team).toBe(1 - first)
    expect(reducer(s, { t: 'S3_END_TURN', team: first })).toBe(s)
    expect(s.phase).toBe('stage3-play')
  })

  it('لا كشف خارج شاشته ولا تنقيط خارج طوره', () => {
    const board = createSession(INPUT)
    expect(reducer(board, { t: 'S1_TO_REVEAL' })).toBe(board)
    expect(reducer(board, { t: 'S2_TO_REVEAL' })).toBe(board)
    expect(reducer(board, { t: 'S3_REVEAL' })).toBe(board)
    expect(reducer(board, { t: 'S3_START', at: 0 })).toBe(board)
    expect(reducer(board, { t: 'S3_END_TURN', team: 0 })).toBe(board)
    expect(reducer(board, { t: 'INTERVAL_CONTINUE' })).toBe(board)
    expect(reducer(board, { t: 'TIEBREAK_PICK', team: 0 })).toBe(board)
    expect(reducer(board, { t: 'S2_NEXT_ROUND' })).toBe(board)

    const end = { ...driveToStage3(), phase: 'endgame' as const }
    expect(reducer(end, { t: 'S1_TO_REVEAL' })).toBe(end)
    expect(reducer(end, { t: 'S3_JUDGE', verdict: 'correct' })).toBe(end)
    expect(reducer(end, { t: 'TIEBREAK_SPIN', category: BOARD[0] })).toBe(end)
  })

  it('تنقيط الحسم يحتاج سؤالاً معروضاً', () => {
    const tie = { ...driveToStage3(), phase: 'tiebreak' as const }
    expect(reducer(tie, { t: 'TIEBREAK_PICK', team: 0 })).toBe(tie)
  })
})

/**
 * المؤقّت موعدٌ في الجلسة لا مدّةٌ في الشاشة (SPEC ٦: «الساعة لا تتوقّف
 * أبداً»). إعادةُ التحميل في الحق ما تلحق كانت تعطي ثلاثين ثانيةً جديدة
 * مع إبقاء النقاط.
 */
describe('المؤقّت محفوظ مع الجلسة', () => {
  it('«ابدأ الآن» يثبّت موعد الانتهاء ولا يعيده ضغطٌ ثانٍ', () => {
    let s = driveToStage3()
    expect(s.timerEndsAt).toBeNull()
    s = step(s, { t: 'S3_START', at: 1_000_000 })
    expect(s.timerEndsAt).toBe(1_000_000 + STAGE3_TIMER_MS)
    expect(reducer(s, { t: 'S3_START', at: 2_000_000 })).toBe(s)
  })

  it('انتهاء الدور يمحو الموعد فيبدأ الفريق الثاني من شاشة الاستعداد', () => {
    let s = step(driveToStage3(), { t: 'S3_START', at: 1_000_000 })
    s = step(s, { t: 'S3_END_TURN', team: s.s3Team })
    expect(s.timerEndsAt).toBeNull()
  })

  it('خليّة اللوح وسؤال الديربي يحملان موعدهما، والكشف يمحوه', () => {
    let s = createSession(INPUT)
    s = step(s, { t: 'S1_PICK', category: BOARD[0], level: 'سهل', at: 5_000 })
    expect(s.timerEndsAt).toBe(5_000 + STAGE1_CONSULT_MS)
    s = step(s, { t: 'S1_TO_REVEAL' })
    expect(s.timerEndsAt).toBeNull()

    let d = driveToStage3()
    d = { ...d, phase: 'stage2-selection' }
    d = step(d, { t: 'S2_SELECT', sel: [0, 0], at: 7_000 })
    expect(d.timerEndsAt).toBe(7_000 + STAGE2_TIMER_MS)
    d = step(d, { t: 'S2_TO_REVEAL' })
    expect(d.timerEndsAt).toBeNull()
  })

  /* لقطةٌ من قبل هذا الإصدار بلا موعد تُستأنف كما كانت. */
  it('لقطة بلا موعد تُقرأ بموعدٍ فارغ', () => {
    const stored = encodeState(createSession(INPUT)) as Record<string, unknown>
    delete stored.timerEndsAt
    expect(isStoredState(stored)).toBe(true)
    expect(decodeState(stored as never).timerEndsAt).toBeNull()
  })
})

/**
 * فئة «حروف» — بلاطةٌ تقف على حرف الجواب قبل السؤال (قرار علي ١٣ سبتمبر
 * ٢٠٢٦). الحرف يتبع السؤال المسحوب، والمؤقّت ينتظر وقوف البلاطة.
 */
describe('فئة حروف', () => {
  const rows: Question[] = Array.from({ length: 80 }, (_, i) => ({
    id: `ADM${8000 + i}`,
    category: LETTERS_CATEGORY,
    level: STAGE1_LEVELS[i % STAGE1_LEVELS.length],
    topic: '',
    question: `سؤال حروف رقم ${i}؟`,
    answer: `${ALPHABET[i % ALPHABET.length]}واب ${i}`,
  }))

  const withLetters = (fn: (s: GameState) => void) => {
    setQuestionOverlay(rows)
    try {
      const board = [LETTERS_CATEGORY, ...BOARD.slice(0, STAGE1_CATEGORIES - 1)]
      fn(createSession({ ...INPUT, categories: board }))
    } finally {
      setQuestionOverlay([])
    }
  }

  it('خليّة حروف تمرّ بالبلاطة، والمؤقّت لا يبدأ إلّا بعد وقوفها', () => {
    withLetters((s0) => {
      let s = step(s0, { t: 'S1_PICK', category: LETTERS_CATEGORY, level: 'سهل', at: 1_000 })
      expect(s.phase).toBe('stage1-letter')
      expect(s.timerEndsAt).toBeNull()
      expect(s.currentQuestion!.category).toBe(LETTERS_CATEGORY)
      /* الحرف مشتقٌّ من الجواب المسحوب — لا يُختار قبله */
      expect(firstLetter(s.currentQuestion!.answer)).not.toBeNull()
      /* الخليّة أُقفلت لحظة الضغط كما في أيّ فئة */
      expect(s.s1Played).toContain(cellKey(LETTERS_CATEGORY, 'سهل'))

      /* الكشف لا يسبق البلاطة */
      expect(reducer(s, { t: 'S1_TO_REVEAL' })).toBe(s)

      s = step(s, { t: 'S1_LETTER_DONE', at: 4_000 })
      expect(s.phase).toBe('stage1-question')
      expect(s.timerEndsAt).toBe(4_000 + STAGE1_CONSULT_MS)
      s = step(s, { t: 'S1_TO_REVEAL' })
      expect(s.phase).toBe('stage1-reveal')
    })
  })

  it('S1_LETTER_DONE خارج طور البلاطة لا يفعل شيئاً، والفئة العاديّة لا تمرّ بها', () => {
    withLetters((s0) => {
      expect(reducer(s0, { t: 'S1_LETTER_DONE', at: 1 })).toBe(s0)
      const s = step(s0, { t: 'S1_PICK', category: BOARD[0], level: 'سهل', at: 1_000 })
      expect(s.phase).toBe('stage1-question')
      expect(s.timerEndsAt).toBe(1_000 + STAGE1_CONSULT_MS)
    })
  })

  it('لقطة طور البلاطة تُستأنف كما تُستأنف لقطة السؤال', () => {
    withLetters((s0) => {
      const s = step(s0, { t: 'S1_PICK', category: LETTERS_CATEGORY, level: 'متوسط' })
      expect(isStoredState(encodeState(s))).toBe(true)
      expect(isStoredState({ ...encodeState(s), currentQuestion: null })).toBe(false)
    })
  })
})

/**
 * فئة «ولا كلمة» — رمزٌ يمسحه الممثّل قبل أن يبدأ شيء (قرار علي ٢٠ سبتمبر
 * ٢٠٢٦، تجريبيّة). المؤقّت ينتظر ضغطة الحكم، ومدّته ستّون لا خمسٌ وأربعون،
 * والتنقيط بالفعل نفسه: فريقُ صاحب الدور أو لا أحد.
 */
describe('فئة ولا كلمة', () => {
  const rows: Question[] = Array.from({ length: 80 }, (_, i) => ({
    id: `ADM${8100 + i}`,
    category: CHARADES_CATEGORY,
    level: STAGE1_LEVELS[i % STAGE1_LEVELS.length],
    topic: 'مسلسل',
    question: `عنوان رقم ${i}`,
    answer: `عنوان رقم ${i}`,
  }))

  const withCharades = (fn: (s: GameState) => void) => {
    setQuestionOverlay(rows)
    try {
      const board = [CHARADES_CATEGORY, ...BOARD.slice(0, STAGE1_CATEGORIES - 1)]
      fn(createSession({ ...INPUT, categories: board }))
    } finally {
      setQuestionOverlay([])
    }
  }

  it('خليّة ولا كلمة تقف على الرمز بلا مؤقّت، ولا يبدأ إلّا بضغطة «ابدأ»', () => {
    withCharades((s0) => {
      let s = step(s0, { t: 'S1_PICK', category: CHARADES_CATEGORY, level: 'سهل', at: 1_000 })
      expect(s.phase).toBe('stage1-charade')
      expect(s.timerEndsAt).toBeNull()
      expect(s.currentQuestion!.category).toBe(CHARADES_CATEGORY)
      expect(s.s1Played).toContain(cellKey(CHARADES_CATEGORY, 'سهل'))

      /* لا كشف ولا تنقيط قبل التمثيل */
      expect(reducer(s, { t: 'S1_TO_REVEAL' })).toBe(s)
      expect(reducer(s, { t: 'S1_SCORE', team: 0 })).toBe(s)

      s = step(s, { t: 'S1_CHARADE_START', at: 9_000 })
      expect(s.phase).toBe('stage1-question')
      expect(s.timerEndsAt).toBe(9_000 + STAGE1_CHARADE_MS)
      expect(STAGE1_CHARADE_MS).toBeGreaterThan(STAGE1_CONSULT_MS)

      s = step(s, { t: 'S1_TO_REVEAL' })
      expect(s.phase).toBe('stage1-reveal')
      /* «أصاب» = نقاط الخليّة لصاحب الدور */
      const owner = stage1Owner(s.s1Index, s.startingTeam)
      const before = s.teams[owner].score
      s = step(s, { t: 'S1_SCORE', team: owner })
      expect(s.teams[owner].score).toBe(before + STAGE1_LEVEL_POINTS['سهل'])
      expect(s.phase).toBe('stage1-board')
    })
  })

  it('S1_CHARADE_START خارج طور الرمز لا يفعل شيئاً، والفئة العاديّة لا تمرّ به', () => {
    withCharades((s0) => {
      expect(reducer(s0, { t: 'S1_CHARADE_START', at: 1 })).toBe(s0)
      const s = step(s0, { t: 'S1_PICK', category: BOARD[0], level: 'سهل', at: 1_000 })
      expect(s.phase).toBe('stage1-question')
      expect(s.timerEndsAt).toBe(1_000 + STAGE1_CONSULT_MS)
      expect(reducer(s, { t: 'S1_CHARADE_START', at: 2 })).toBe(s)
    })
  })

  it('لقطة طور الرمز تُستأنف كما تُستأنف لقطة السؤال', () => {
    withCharades((s0) => {
      const s = step(s0, { t: 'S1_PICK', category: CHARADES_CATEGORY, level: 'متوسط' })
      expect(isStoredState(encodeState(s))).toBe(true)
      expect(isStoredState({ ...encodeState(s), currentQuestion: null })).toBe(false)
    })
  })
})
