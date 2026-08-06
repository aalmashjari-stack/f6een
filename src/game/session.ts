import type { Level, Mark, Phase, Player, Team, TeamId } from './types'
import type { Question } from './types'
import { drawStage3Queue } from './draw'

/* ============================ الثوابت — القسم ٢ ============================ */
// وضع اختبار سريع: أضف ?fast للرابط لتقليص المؤقتات ×١٠ (للتنقّل السريع فقط، لا يؤثّر على اللعب العادي).
const TIME_SCALE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast') ? 0.1 : 1

export const STAGE1_QUESTIONS = 8
export const STAGE1_CONSULT_MS = 60_000 * TIME_SCALE
export const STAGE1_RIVAL_MS = 15_000 * TIME_SCALE
export const STAGE1_POINTS = 10
export const STAGE2_TIMER_MS = 30_000 * TIME_SCALE
export const STAGE2_CORRECT = 20
export const STAGE2_WRONG = -10
export const STAGE3_TIMER_MS = 30_000 * TIME_SCALE
export const STAGE3_POINTS = 5
export const STAGE3_QUEUE_SIZE = 40
export const TIEBREAK_POINTS = 10

/** مستوى سؤال الجولة الجماعية حسب الموضع — القسم ٨. */
export function stage1Level(index: number): Level {
  if (index < 2) return 'سهل'
  if (index < 6) return 'متوسط'
  return 'صعب'
}

/** صاحب الدور في الجولة الجماعية: البادئ يلعب 0/2/4، والآخر 1/3/5. */
export function stage1Owner(index: number, startingTeam: TeamId): TeamId {
  return (index % 2 === 0 ? startingTeam : (1 - startingTeam)) as TeamId
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

  /** تصنيفات خرجت من العجلة في المرحلة الحالية (تُصفّر عند بداية الديربي). */
  spentCategories: string[]
  currentCategory: string | null
  currentQuestion: Question | null

  /* المرحلة ١ */
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
  const s3Queue = drawStage3Queue(STAGE3_QUEUE_SIZE, used)

  const correctByPlayer: Record<string, number> = {}
  const wrongByPlayer: Record<string, number> = {}
  for (const t of teams)
    for (const p of t.players) {
      correctByPlayer[p.id] = 0
      wrongByPlayer[p.id] = 0
    }

  return {
    phase: 'stage1-wheel',
    teams,
    startingTeam: input.startingTeam,
    usedQuestionIds: used,
    spentFamilies: [],
    spentCategories: [],
    currentCategory: null,
    currentQuestion: null,
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

/* ======================= الذاكرة عبر الجلسات — القسم ٨ ======================= */
const USED_KEY = 'sahsahli.usedQuestionIds'

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
