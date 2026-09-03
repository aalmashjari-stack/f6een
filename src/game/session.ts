import type { Level, Mark, Phase, Player, Team, TeamId } from './types'
import type { Question } from './types'
import { drawStage3Queue } from './draw'

/* ============================ الثوابت — القسم ٢ ============================ */
// وضع اختبار سريع: أضف ?fast للرابط لتقليص المؤقتات ×١٠ (للتنقّل السريع فقط، لا يؤثّر على اللعب العادي).
const TIME_SCALE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast') ? 0.1 : 1

/**
 * لوح الجولة الجماعية — كل فريق يختار ثلاث فئات، فتصير ستّاً، ولكل فئة
 * مستوياتها الثلاثة. ثمانية عشر سؤالاً، والنقاط تتبع المستوى لا الموضع.
 */
export const STAGE1_TEAM_CATEGORIES = 3
export const STAGE1_CATEGORIES = STAGE1_TEAM_CATEGORIES * 2
export const STAGE1_LEVELS: Level[] = ['سهل', 'متوسط', 'صعب']
export const STAGE1_QUESTIONS = STAGE1_CATEGORIES * STAGE1_LEVELS.length
export const STAGE1_CONSULT_MS = 60_000 * TIME_SCALE
export const STAGE1_LEVEL_POINTS: Record<Level, number> = {
  'سهل': 10,
  'متوسط': 20,
  'صعب': 30,
}
export const STAGE2_TIMER_MS = 30_000 * TIME_SCALE
export const STAGE2_CORRECT = 20
export const STAGE2_WRONG = -10
export const STAGE3_TIMER_MS = 30_000 * TIME_SCALE
export const STAGE3_POINTS = 5
export const STAGE3_QUEUE_SIZE = 40
export const TIEBREAK_POINTS = 10

/** مفتاح خليّة في لوح الجولة الجماعية — (فئة، مستوى). */
export function cellKey(category: string, level: Level): string {
  return `${category}|${level}`
}

/** صاحب الدور في الجولة الجماعية: البادئ يلعب 0/2/4، والآخر 1/3/5. */
export function stage1Owner(index: number, startingTeam: TeamId): TeamId {
  return (index % 2 === 0 ? startingTeam : (1 - startingTeam)) as TeamId
}

/** فئة على لوح الجولة الجماعية، ومَن اختارها — اللوح يقول لكل فريق أين اختياره. */
export interface PickedCategory {
  name: string
  pickedBy: TeamId
}

/** خليّة اللوح: فئة ومستوى. النقاط تتبع المستوى (`STAGE1_LEVEL_POINTS`). */
export interface Stage1Cell {
  category: string
  level: Level
}

export interface GameState {
  phase: Phase
  teams: [Team, Team]
  startingTeam: TeamId

  usedQuestionIds: Set<string>

  /**
   * قوالب الأسئلة التي ظهرت في هذه الجلسة — لا يُعرض قالب مرتين (انظر familyOf).
   * داخل الجلسة فقط لا عبر الجلسات: القوالب أحد وعشرون، وحجزها دائماً يُجفّف البنك.
   * مصفوفة لا Set لأن الحالة تُحفظ بـ JSON للاستئناف.
   */
  spentFamilies: string[]

  /**
   * معرّفات ما عُرض في **هذه الجلسة** بترتيب عرضه — لا ما عرفه الحساب.
   * `usedQuestionIds` تراكميّة عبر الجلسات (مئات)، وشاشة الختام تحتاج ثلاثة
   * عشر سؤالاً بعينها ليختار المبلِّغ منها المعطوب (SPEC ١٠).
   */
  askedQuestionIds: string[]

  /** تصنيفات خرجت من العجلة في المرحلة الحالية (تُصفّر عند بداية الديربي). */
  spentCategories: string[]
  currentCategory: string | null
  currentQuestion: Question | null

  /* المرحلة ١ — اللوح المختار */
  /** الفئات الست بترتيب اختيارها، ومع كل واحدة الفريق الذي اختارها. */
  s1Categories: PickedCategory[]
  /** مفاتيح الخلايا التي خرجت من اللوح — `cellKey`. مصفوفة لا Set: الحالة تُحفظ بـJSON. */
  s1Played: string[]
  /** الخليّة الجارية — تُملأ عند الضغط عليها في اللوح وتُفرَّغ بعد التنقيط. */
  s1Cell: Stage1Cell | null
  s1Index: number

  /* المرحلة ٢ */
  s2Rounds: number
  s2Index: number
  s2Rem: [number[], number[]] // مؤشرات اللاعبين المتبقّين في الدورة الحالية لكل فريق
  s2Sel: [number, number] | null // اللاعب المختار من كل فريق (مؤشر)
  s2Marks: [Mark, Mark]

  /* المرحلة ٣ */
  s3Team: TeamId
  s3Queue: Question[]
  s3Pos: number
  s3Revealed: boolean
  s3Done: TeamId[] // الفرق التي أنهت دورها

  /* فاصل */
  intervalNext: Phase

  /* إحصاء */
  correctByPlayer: Record<string, number>
  wrongByPlayer: Record<string, number>
  /** نقاط كل فريق موزّعة على المراحل — عمود الختام: أين كُسبت اللعبة وأين خُسرت. */
  stagePoints: Record<StageKey, [number, number]>
  /** الحق ما تلحق: عدد الأسئلة بكل نتيجة لكل فريق (صحيحة · خاطئة). */
  s3Counts: Record<'correct' | 'wrong', [number, number]>
  reportedQuestionIds: string[]
}

export type StageKey = 's1' | 's2' | 's3' | 'tie'

export interface SetupInput {
  teamNames: [string, string]
  players: [string[], string[]]
  startingTeam: TeamId
  /** ثلاث فئات لكل فريق — لوح الجولة الجماعية (القسم ٤). */
  categories: [string[], string[]]
}

export function largestTeamSize(players: [string[], string[]]): number {
  return Math.max(players[0].length, players[1].length)
}

export function createSession(input: SetupInput): GameState {
  const teams: [Team, Team] = [0, 1].map((id) => ({
    id: id as TeamId,
    name: input.teamNames[id],
    players: input.players[id].map((name, i) => ({ id: `t${id}p${i}`, name })),
    score: 0,
  })) as [Team, Team]

  const used = loadUsedIds()
  const s2Rounds = Math.max(4, largestTeamSize(input.players))

  /* اللوح مصفوف بترتيب الاختيار متناوباً — الفريق الأول أوّلاً ثم الثاني —
     فيقرأ المجلسُ من الشبكة مَن اختار ماذا بلا حاجة إلى شرح.
     والقرعة لا تدخل هنا: هي تحدّد من يجيب أوّلاً لا من يختار أوّلاً، وربطها
     بالاختيار كان يقلب ترتيب الفئات بأثر رجعيّ عند «إعادة القرعة». */
  const s1Categories: PickedCategory[] = []
  for (let i = 0; i < STAGE1_TEAM_CATEGORIES; i++)
    for (const t of [0, 1] as const)
      if (input.categories[t][i]) s1Categories.push({ name: input.categories[t][i], pickedBy: t })
  const s3Queue = drawStage3Queue(STAGE3_QUEUE_SIZE, used)

  const correctByPlayer: Record<string, number> = {}
  const wrongByPlayer: Record<string, number> = {}
  for (const t of teams)
    for (const p of t.players) {
      correctByPlayer[p.id] = 0
      wrongByPlayer[p.id] = 0
    }

  return {
    phase: 'stage1-board',
    teams,
    startingTeam: input.startingTeam,
    usedQuestionIds: used,
    askedQuestionIds: [],
    spentFamilies: [],
    spentCategories: [],
    currentCategory: null,
    currentQuestion: null,
    s1Categories,
    s1Played: [],
    s1Cell: null,
    s1Index: 0,
    s2Rounds,
    s2Index: 0,
    s2Rem: [teams[0].players.map((_, i) => i), teams[1].players.map((_, i) => i)],
    s2Sel: null,
    s2Marks: ['صمت', 'صمت'],
    s3Team: input.startingTeam,
    s3Queue,
    s3Pos: 0,
    s3Revealed: false,
    s3Done: [],
    intervalNext: 'stage2-selection',
    correctByPlayer,
    wrongByPlayer,
    stagePoints: { s1: [0, 0], s2: [0, 0], s3: [0, 0], tie: [0, 0] },
    s3Counts: { correct: [0, 0], wrong: [0, 0] },
    reportedQuestionIds: [],
  }
}

/* ===================== الحالة خارج الذاكرة — الحفظ والاستئناف ===================== */

/**
 * شكل الحالة حين تخرج من الذاكرة — إلى `localStorage` أو إلى عمود `state`
 * في جدول `sessions`.
 *
 * الفرق الوحيد أنّ `usedQuestionIds` مصفوفة لا `Set`: الـ`Set` يخرج من
 * `JSON.stringify` كائناً فارغاً `{}`، فتعود الجلسة المستأنَفة بذاكرة صفر
 * وتُعيد أسئلةً سُمعت.
 *
 * وشكلٌ واحد للوجهتين عمداً: لو افترق المحلّي عن الخادميّ لاختلفت الجلسة
 * المستأنَفة على الجهاز عن المستأنَفة عليه من حساب آخر — والفرق لا يظهر إلا
 * بعد الاستئناف.
 */
export type StoredState = Omit<GameState, 'usedQuestionIds'> & { usedQuestionIds: string[] }

export function encodeState(s: GameState): StoredState {
  return { ...s, usedQuestionIds: [...s.usedQuestionIds] }
}

export function decodeState(s: StoredState): GameState {
  return { ...s, usedQuestionIds: new Set(s.usedQuestionIds) }
}

/* ======================= الذاكرة عبر الجلسات — القسم ٨ ======================= */
const USED_KEY = 'f6een.usedQuestionIds'

export function loadUsedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(USED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function persistUsedIds(used: Set<string>) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify([...used]))
  } catch {
    /* تجاهل */
  }
}

/* ============================ مساعدات مشتقّة ============================ */
export function leader(teams: [Team, Team]): TeamId | null {
  if (teams[0].score === teams[1].score) return null
  return teams[0].score > teams[1].score ? 0 : 1
}

export interface PlayerStat {
  player: Player
  teamId: TeamId
  correct: number
  wrong: number
}

/** إحصاء اللاعب الفردي يأتي كلّه من الديربي — وهي المرحلة الوحيدة التي يُنقَّط فيها لاعب بعينه. */
export function playerStats(state: GameState): PlayerStat[] {
  const stats: PlayerStat[] = []
  for (const t of state.teams)
    for (const p of t.players)
      stats.push({
        player: p,
        teamId: t.id,
        correct: state.correctByPlayer[p.id] ?? 0,
        wrong: state.wrongByPlayer[p.id] ?? 0,
      })
  return stats
}
