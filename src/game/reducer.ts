import type { Mark, Question, TeamId } from './types'
import { familyOf } from './bank'
import { drawOne } from './draw'
import {
  GameState,
  SetupInput,
  StageKey,
  STAGE1_POINTS,
  STAGE1_QUESTIONS,
  STAGE2_CORRECT,
  STAGE2_WRONG,
  STAGE3_POINTS,
  TIEBREAK_POINTS,
  createSession,
  stage1Level,
  stage1Owner,
} from './session'

export type Action =
  | { t: 'START'; input: SetupInput }
  | { t: 'SPIN_DONE'; category: string } // العجلة توقّفت على تصنيف
  | { t: 'S1_TO_REVEAL' } // انتهت مهلة الفريق الآخر ← كشف تلقائي
  | { t: 'S1_SCORE'; outcome: 'owner' | 'rival' | 'none' }
  | { t: 'S2_TO_REVEAL' } // انتهى مؤقت الديربي ← كشف
  | { t: 'INTERVAL_CONTINUE' }
  | { t: 'S2_SELECT'; sel: [number, number] } // اختيار اللاعبَين (بعد التشويق)
  | { t: 'S2_SET_MARK'; who: 0 | 1; mark: Mark }
  | { t: 'S2_NEXT_ROUND' }
  | { t: 'S3_REVEAL' }
  | { t: 'S3_JUDGE'; verdict: 'correct' | 'wrong' }
  | { t: 'S3_END_TURN' } // انتهت الثلاثون ثانية
  | { t: 'TIEBREAK_SPIN'; category: string }
  | { t: 'TIEBREAK_PICK'; team: TeamId | 'none' }
  | { t: 'REPORT_QUESTION'; id: string }
  | { t: 'NEW_GAME' }

/** أوراق الحق ما تلحق التي لم تُعرض بعد — محجوزة فلا تُسحب لمرحلة أخرى. */
const pendingS3Ids = (s: GameState): Set<string> =>
  new Set(s.s3Queue.slice(s.s3Pos).map((q) => q.id))

/** قوالب ممنوعة الآن: ما ظهر في الجلسة + ما ينتظر دوره في طابور الحق ما تلحق. */
const guardedFamilies = (s: GameState): Set<string> => {
  const fams = new Set(s.spentFamilies)
  for (const q of s.s3Queue.slice(s.s3Pos)) {
    const fam = familyOf(q)
    if (fam !== null) fams.add(fam)
  }
  return fams
}

/**
 * يحرق سؤالاً عُرض للتوّ: معرّفه وقالبه.
 * بمجموعة جديدة لا بتعديل القديمة — المحرك نقيّ، والحفظ في التخزين أثرٌ
 * جانبي يقع في App عند تغيّر الحالة، لا هنا.
 */
const burn = (s: GameState, q: Question): GameState => {
  const usedQuestionIds = new Set(s.usedQuestionIds)
  usedQuestionIds.add(q.id)
  const fam = familyOf(q)
  const spentFamilies =
    fam === null || s.spentFamilies.includes(fam) ? s.spentFamilies : [...s.spentFamilies, fam]
  return { ...s, usedQuestionIds, spentFamilies }
}

/** كل نقطة تُسجَّل مرّتين: في مجموع الفريق، وفي عمود مرحلتها لشاشة الختام. */
const addScore = (s: GameState, team: TeamId, delta: number, stage: StageKey): GameState => {
  const teams = [...s.teams] as GameState['teams']
  teams[team] = { ...teams[team], score: teams[team].score + delta }
  const bucket = [...s.stagePoints[stage]] as [number, number]
  bucket[team] += delta
  return { ...s, teams, stagePoints: { ...s.stagePoints, [stage]: bucket } }
}

export function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.t) {
    case 'START':
      return createSession(action.input)

    case 'NEW_GAME':
      return null

    /* ---------------- العجلة → السؤال ---------------- */
    case 'SPIN_DONE': {
      if (!state) return state
      const level =
        state.phase === 'stage1-wheel' ? stage1Level(state.s1Index) : 'متوسط'
      const q = drawOne(
        action.category,
        level,
        state.usedQuestionIds,
        pendingS3Ids(state),
        guardedFamilies(state),
      )
      return {
        ...burn(state, q),
        currentCategory: action.category,
        currentQuestion: q,
        spentCategories: [...state.spentCategories, action.category],
        phase: state.phase === 'stage1-wheel' ? 'stage1-question' : 'stage2-question',
      }
    }

    case 'S1_TO_REVEAL': {
      if (!state) return state
      return { ...state, phase: 'stage1-reveal' }
    }

    case 'S2_TO_REVEAL': {
      if (!state) return state
      return { ...state, phase: 'stage2-reveal' }
    }

    /* ---------------- تنقيط الجولة الجماعية ---------------- */
    case 'S1_SCORE': {
      if (!state) return state
      const owner = stage1Owner(state.s1Index, state.startingTeam)
      const rival = (1 - owner) as TeamId
      let s = state
      if (action.outcome === 'owner') s = addScore(s, owner, STAGE1_POINTS, 's1')
      else if (action.outcome === 'rival') s = addScore(s, rival, STAGE1_POINTS, 's1')

      const nextIndex = s.s1Index + 1
      if (nextIndex < STAGE1_QUESTIONS) {
        return { ...s, s1Index: nextIndex, currentCategory: null, currentQuestion: null, phase: 'stage1-wheel' }
      }
      // انتهت المرحلة ١ → فاصل ثم الديربي (تُصفَّر العجلة)
      return {
        ...s,
        s1Index: nextIndex,
        currentCategory: null,
        currentQuestion: null,
        spentCategories: [],
        intervalNext: 'stage2-selection',
        phase: 'interval',
      }
    }

    /* ---------------- الفاصل ---------------- */
    case 'INTERVAL_CONTINUE': {
      if (!state) return state
      return { ...state, phase: state.intervalNext }
    }

    /* ---------------- اختيار لاعبَي الديربي ---------------- */
    case 'S2_SELECT': {
      if (!state) return state
      // إزالة المختارَين من دورة كل فريق؛ إعادة تعبئة الدورة إن فرغت
      const rem: [number[], number[]] = [
        state.s2Rem[0].filter((i) => i !== action.sel[0]),
        state.s2Rem[1].filter((i) => i !== action.sel[1]),
      ]
      for (const t of [0, 1] as const)
        if (rem[t].length === 0) rem[t] = state.teams[t].players.map((_, i) => i)
      return {
        ...state,
        s2Sel: action.sel,
        s2Rem: rem,
        s2Marks: ['صمت', 'صمت'],
        phase: 'stage2-wheel',
      }
    }

    case 'S2_SET_MARK': {
      if (!state) return state
      const marks = [...state.s2Marks] as [Mark, Mark]
      marks[action.who] = action.mark
      /* لاعب واحد على الأكثر يحمل علامة في الجولة (القسم ٥): من بادر أولاً هو صاحب
         الإجابة وحده — إن أصاب أخذ +20، وإن أخطأ خُصم منه وانتهت الجولة ولم يرثها خصمه.
         الشاشة كانت تسمح بتعليم الاثنين فتُخالف القاعدة بضغطتين.
         آخر ضغطة تفوز: الحكم صحّح نفسه، فيُفرَّغ الآخر بدل حجب الضغطة بلا تفسير. */
      if (action.mark !== 'صمت') {
        const other = (1 - action.who) as 0 | 1
        marks[other] = 'صمت'
      }
      return { ...state, s2Marks: marks }
    }

    case 'S2_NEXT_ROUND': {
      if (!state || !state.s2Sel) return state
      const sel = state.s2Sel
      // تطبيق النقاط والإحصاء
      let s = state
      const correctByPlayer = { ...s.correctByPlayer }
      const wrongByPlayer = { ...s.wrongByPlayer }
      for (const who of [0, 1] as const) {
        const teamId = who as TeamId
        const mark = s.s2Marks[who]
        const playerIdx = sel[who]
        const player = s.teams[teamId].players[playerIdx]
        if (mark === 'صح') {
          s = addScore(s, teamId, STAGE2_CORRECT, 's2')
          correctByPlayer[player.id] = (correctByPlayer[player.id] ?? 0) + 1
        } else if (mark === 'غلط') {
          s = addScore(s, teamId, STAGE2_WRONG, 's2')
          wrongByPlayer[player.id] = (wrongByPlayer[player.id] ?? 0) + 1
        }
      }
      s = { ...s, correctByPlayer, wrongByPlayer }

      const nextIndex = s.s2Index + 1
      if (nextIndex < s.s2Rounds) {
        return { ...s, s2Index: nextIndex, s2Sel: null, currentCategory: null, currentQuestion: null, phase: 'stage2-selection' }
      }
      // انتهى الديربي → فاصل ثم الحق ما تلحق
      return {
        ...s,
        s2Index: nextIndex,
        s2Sel: null,
        currentCategory: null,
        currentQuestion: null,
        intervalNext: 'stage3-play',
        phase: 'interval',
      }
    }

    /* ---------------- الحق ما تلحق ---------------- */
    case 'S3_REVEAL': {
      if (!state) return state
      return { ...state, s3Revealed: true }
    }

    case 'S3_JUDGE': {
      if (!state) return state
      let s = state
      if (action.verdict === 'correct') s = addScore(s, s.s3Team, STAGE3_POINTS, 's3')
      const counts = [...s.s3Counts[action.verdict]] as [number, number]
      counts[s.s3Team] += 1
      s = { ...s, s3Counts: { ...s.s3Counts, [action.verdict]: counts } }
      // السؤال ظهر على الشاشة فيُحرق الآن، أصيب أم لا (القسم ٨).
      // الحرق هنا لا عند سحب الطابور، حتى لا يحترق الاحتياطي الذي لم يُعرض.
      const shown = s.s3Queue[s.s3Pos]
      if (shown) s = burn(s, shown)
      return { ...s, s3Pos: s.s3Pos + 1, s3Revealed: false }
    }

    case 'S3_END_TURN': {
      if (!state) return state
      const done = state.s3Done.includes(state.s3Team) ? state.s3Done : [...state.s3Done, state.s3Team]
      // السؤال المعروض لحظة انتهاء الوقت ظهر على الشاشة (القسم ٨): يُحرق ويُتجاوز
      // كي لا يبدأ به الفريق التالي من جديد. الحكم يفعل هذا عند كل سؤال، أما هنا
      // فالوقت هو من أنهى الدور والسؤال الجاري لم يُحكَم بعد.
      let s = state
      const shown = s.s3Queue[s.s3Pos]
      if (shown) s = { ...burn(s, shown), s3Pos: s.s3Pos + 1 }
      if (done.length < 2) {
        const nextTeam = (1 - s.s3Team) as TeamId
        return { ...s, s3Team: nextTeam, s3Done: done, s3Revealed: false }
      }
      // انتهى الفريقان → تعادل؟ فاصل تعادل : ختام
      // يمرّ بالفاصل أولاً: القفز المباشر إلى سؤال حاسم بلا إنذار يفاجئ المتسابقين
      // ولا يعرفون أنهم في سؤال فاصل ولا ما قواعده.
      if (s.teams[0].score === s.teams[1].score) {
        return {
          ...s,
          s3Done: done,
          currentCategory: null,
          currentQuestion: null,
          spentCategories: [],
          s3Revealed: false,
          intervalNext: 'tiebreak',
          phase: 'interval',
        }
      }
      return { ...s, s3Done: done, phase: 'endgame' }
    }

    /* ---------------- فاصل التعادل ---------------- */
    case 'TIEBREAK_SPIN': {
      if (!state) return state
      const q = drawOne(
        action.category,
        'صعب',
        state.usedQuestionIds,
        pendingS3Ids(state),
        guardedFamilies(state),
      )
      return {
        ...burn(state, q),
        currentCategory: action.category,
        currentQuestion: q,
        s3Revealed: false,
      }
    }

    case 'TIEBREAK_PICK': {
      if (!state) return state
      let s = state
      if (action.team !== 'none') s = addScore(s, action.team, TIEBREAK_POINTS, 'tie')
      // إن بقي التعادل (لا أحد أصاب) نعيد سؤالاً صعباً آخر
      if (s.teams[0].score === s.teams[1].score) {
        return { ...s, currentQuestion: null, currentCategory: null, s3Revealed: false, phase: 'tiebreak' }
      }
      return { ...s, phase: 'endgame' }
    }

    case 'REPORT_QUESTION': {
      if (!state) return state
      if (state.reportedQuestionIds.includes(action.id)) return state
      return { ...state, reportedQuestionIds: [...state.reportedQuestionIds, action.id] }
    }

    default:
      return state
  }
}
