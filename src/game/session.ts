import type { Level, Mark, Phase, Player, Team, TeamId } from './types'
import type { Question } from './types'
import { drawStage3Queue } from './draw'

/* ============================ الثوابت — القسم ٢ ============================ */
// وضع اختبار سريع: أضف ?fast للرابط لتقليص المؤقتات ×١٠ (للتنقّل السريع فقط، لا يؤثّر على اللعب العادي).
const TIME_SCALE =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast') ? 0.1 : 1

/**
 * لوح الجولة الجماعية — الفريقان يختاران ستّ فئات معاً، ولكل فئة
 * مستوياتها الثلاثة. ثمانية عشر سؤالاً، والنقاط تتبع المستوى لا الموضع.
 */
/* ستّ فئات للّوح يختارها الفريقان معاً بلا قسمة ولا تناوب (قرار علي ٥ سبتمبر
   ٢٠٢٦). كانت ثلاثاً لكل فريق، وكانت الخليّة تحمل لون من اختارها. */
export const STAGE1_CATEGORIES = 6
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
export const STAGE3_POINTS = 10
export const STAGE3_QUEUE_SIZE = 40
export const TIEBREAK_POINTS = 10

/**
 * خطوةُ تصحيح الحكم — يدويّة بـ+ و− بجانب نقاط كل فريق.
 *
 * الحكم يخطئ في «من أجاب؟» فتذهب النقاط للفريق الغلط، ولم يكن لها ردّ:
 * الجلسة تمضي والخطأ ثابت إلى الختام.
 *
 * **وعشرٌ لا خمس.** كانت خمساً بحجّة أنّها تبلغ 10 و20 و30 كلَّها — والحجّة
 * خاطئة: كلُّ ما تمنحه اللعبة مضاعفُ عشرة (10 · 20 · 30 · ‎+20‎ · ‎−10‎ · 10)،
 * فلا قيمةَ نصفُها خمس لتُصحَّح. والعشرة تبلغ أيّ خطأ في نصف الضغطات.
 */
export const SCORE_FIX_STEP = 10

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

  /** تصنيف السؤال الجاري — لوحُ الجولة الجماعية وحده يملؤه (الديربي بلا تصنيفات). */
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

  /**
   * موعدُ انتهاء المؤقّت الجاري (ميلي ثانية منذ 1970)، أو `null` بلا مؤقّت.
   *
   * المؤقّت كان يعيش في الشاشة وحدها فيبدأ من أوّله مع كلّ تركيب: إعادةُ
   * تحميلٍ في الحق ما تلحق كانت تعطي ثلاثين ثانيةً جديدة مع إبقاء النقاط
   * (تدقيق ٦ سبتمبر ٢٠٢٦). و«الساعة لا تتوقّف أبداً» (SPEC ٦) تعني موعداً
   * لا مدّة: من عاد بعد فوات الموعد وجد الدور منتهياً. الوقت يأتي من الفعل
   * (`at`) لا من المخفّض، فيبقى نقيّاً وقابلاً للاختبار.
   */
  timerEndsAt: number | null

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

/**
 * مرحلةُ الطور — لأجل عمود الختام.
 *
 * تصحيحُ الحكم يُقيَّد على المرحلة التي وقع فيها لا على عمودٍ خاصّ به: أعمدة
 * الختام تبقى تجمع المجموع، ولا يحتاج المخطَّطُ المحفوظ مفتاحاً جديداً تفتقده
 * الجلساتُ القديمة. والفاصلُ يتبع الجولة الجماعية — هو ذيلُها لا بابُ الديربي.
 */
export function stageOfPhase(s: Pick<GameState, 'phase' | 'intervalNext'>): StageKey {
  const { phase } = s
  if (phase === 'interval') {
    /* الفاصلُ ذيلُ ما سبقه: قبل الديربي ذيلُ اللوح، وقبل الحق ما تلحق ذيلُ
       الديربي، وقبل الحسم ذيلُ الحق ما تلحق. كان يُنسب كلُّه إلى اللوح،
       فتصحيحٌ بعد الديربي يظهر في عمود الجولة الجماعية. */
    if (s.intervalNext === 'stage3-play') return 's2'
    if (s.intervalNext === 'tiebreak') return 's3'
    return 's1'
  }
  if (phase.startsWith('stage2')) return 's2'
  if (phase === 'stage3-play') return 's3'
  if (phase === 'tiebreak') return 'tie'
  return 's1'
}

export interface SetupInput {
  teamNames: [string, string]
  players: [string[], string[]]
  startingTeam: TeamId
  /** ستّ فئات للّوح، يختارها الفريقان معاً بلا قسمة (القسم ٤). */
  categories: string[]
}

export function largestTeamSize(players: [string[], string[]]): number {
  return Math.max(players[0].length, players[1].length)
}

/**
 * `used` = ذاكرة الحساب بترتيب الاستعمال (الأقدم أوّلاً). تُقرأ من التخزين
 * المحلّي في اللعب، وتُمرَّر صراحةً في الاختبار الذي يقود جلساتٍ متتابعة
 * بذاكرةٍ تتراكم — وهو الاختبار الوحيد الذي يبلغ نفاد البنك.
 */
export function createSession(input: SetupInput, used: Set<string> = loadUsedIds()): GameState {
  const teams: [Team, Team] = [0, 1].map((id) => ({
    id: id as TeamId,
    name: input.teamNames[id],
    players: input.players[id].map((name, i) => ({ id: `t${id}p${i}`, name })),
    score: 0,
  })) as [Team, Team]

  const s2Rounds = Math.max(4, largestTeamSize(input.players))

  /* اللوح بترتيب الاختيار كما وقع. ولا مالك للفئة: الفريقان يختاران الستّ
     معاً، فلا لون فريقٍ على الخليّة ولا اسمَ صاحبٍ فوقها. */
  const s1Categories: PickedCategory[] = input.categories.map((name) => ({ name }))
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
    timerEndsAt: null,
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
  /* لقطةٌ من إصدارٍ سبق المؤقّت المحفوظ تُستأنف بلا موعد — كما كانت. */
  return { ...s, usedQuestionIds: new Set(s.usedQuestionIds), timerEndsAt: s.timerEndsAt ?? null }
}

const PHASES = new Set<string>([
  'setup',
  'stage1-board',
  'stage1-question',
  'stage1-reveal',
  'interval',
  'stage2-selection',
  'stage2-question',
  'stage2-reveal',
  'stage3-play',
  'tiebreak',
  'endgame',
])

/**
 * هل هذه لقطةٌ بشكل النسخة الحالية؟ تُفحص **بنيةً لا نسخةً**: الخادم يحفظ
 * الحالة بلا رقم نسخة، وجلسةٌ فُتحت قبل أن يتبدّل الشكل (العجلة قبل لوح
 * الجولة الجماعية مثلاً) تبقى «مفتوحة» عنده، فيردّها `start_session` في
 * كلّ بدء — ويستأنفها التطبيق فيسقط عند أوّل شاشةٍ تقرأ حقلاً لم يعد
 * موجوداً، ثمّ يعيد الكرّة في كلّ تشغيل. الفحص هنا هو ما يميّز اللقطة
 * الصالحة من التي تُغلق ويُبدأ بعدها من الإعداد.
 *
 * والحفظ المحلّي يحمل رقمَ نسخة (`SAVE_VERSION` في App) ويُفحص بهذا أيضاً:
 * رقمٌ يُرفع باليد قد يُنسى، والبنية لا تُنسى.
 */
export function isStoredState(x: unknown): x is StoredState {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  const arr = (k: string) => Array.isArray(s[k])
  const num = (k: string) => typeof s[k] === 'number' && Number.isFinite(s[k] as number)
  const obj = (k: string) => !!s[k] && typeof s[k] === 'object'
  const teamId = (v: unknown) => v === 0 || v === 1
  const pair = (v: unknown) => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number')
  if (typeof s.phase !== 'string' || !PHASES.has(s.phase)) return false
  if (!arr('teams') || (s.teams as unknown[]).length !== 2) return false
  const teamsOk = (s.teams as unknown[]).every((t) => {
    if (!t || typeof t !== 'object') return false
    const team = t as Record<string, unknown>
    return (
      teamId(team.id) &&
      typeof team.name === 'string' &&
      Array.isArray(team.players) &&
      team.players.every(
        (p) => !!p && typeof p === 'object' && typeof (p as Player).id === 'string' && typeof (p as Player).name === 'string',
      ) &&
      typeof team.score === 'number'
    )
  })
  if (!teamsOk) return false
  const stagePoints = s.stagePoints as Record<string, unknown> | undefined
  const s3Counts = s.s3Counts as Record<string, unknown> | undefined
  const question = (v: unknown) =>
    !!v &&
    typeof v === 'object' &&
    typeof (v as Question).id === 'string' &&
    typeof (v as Question).question === 'string' &&
    typeof (v as Question).answer === 'string'
  /* ما تحتاجه شاشة الطور بعينه — فحصٌ بنيويّ عامّ كان يقبل لقطة «سؤال»
     بلا سؤال، فتسقط الشاشة على `null` عند كلّ إقلاع بلا مخرج. */
  const phaseOk = (() => {
    switch (s.phase) {
      case 'stage1-question':
      case 'stage1-reveal':
        return question(s.currentQuestion) && obj('s1Cell')
      case 'stage2-question':
      case 'stage2-reveal':
        return question(s.currentQuestion) && pair(s.s2Sel)
      case 'tiebreak':
        return s.currentQuestion === null || question(s.currentQuestion)
      default:
        return true
    }
  })()
  if (!phaseOk) return false
  return (
    teamId(s.startingTeam) &&
    arr('usedQuestionIds') &&
    arr('askedQuestionIds') &&
    arr('spentFamilies') &&
    arr('s1Categories') &&
    arr('s1Played') &&
    num('s1Index') &&
    num('s2Rounds') &&
    num('s2Index') &&
    arr('s2Rem') &&
    arr('s2Marks') &&
    teamId(s.s3Team) &&
    arr('s3Queue') &&
    num('s3Pos') &&
    arr('s3Done') &&
    typeof s.intervalNext === 'string' &&
    obj('correctByPlayer') &&
    obj('wrongByPlayer') &&
    obj('stagePoints') &&
    ['s1', 's2', 's3', 'tie'].every((k) => pair(stagePoints?.[k])) &&
    obj('s3Counts') &&
    ['correct', 'wrong'].every((k) => pair(s3Counts?.[k])) &&
    arr('reportedQuestionIds') &&
    (s.timerEndsAt === undefined || s.timerEndsAt === null || num('timerEndsAt')) &&
    (s.s3Queue as unknown[]).every(question)
  )
}

/* ======================= التخزين المحلّي مخصوصٌ بالحساب ======================= */
/**
 * كلّ ما يُكتب في `localStorage` يُكتب باسم الحساب — الذاكرةُ عبر الجلسات،
 * والجلسةُ المحفوظة، والإغلاقُ المعلَّق.
 *
 * كان المفتاح واحداً للجهاز كلّه، فحسابٌ ثانٍ يدخل على الجهاز نفسه يرث
 * ذاكرةَ الأوّل وتُرفع باسمه إلى الخادم، ويرى لعبته المحفوظة (تدقيق ٦
 * سبتمبر ٢٠٢٦). والمبرّر القديم — رفعُ ما لُعب قبل التسجيل — سقط حين صار
 * الدخول إجباريّاً؛ وبقيت منه خطوةٌ واحدة: المفتاحُ القديم بلا اسمٍ يرثه
 * **أوّلُ** حسابٍ يدخل بعد هذا الإصدار ثمّ يُمحى، فلا تضيع ذاكرةُ جهازٍ
 * لعب قبله.
 */
let owner = 'anon'

/** يُضبط حين تُعرف الجلسة، قبل أيّ قراءة — `null` لمن يلعب بلا حساب. */
export function setStorageOwner(id: string | null) {
  owner = id ?? 'anon'
}

export function scopedKey(base: string): string {
  return `${base}:${owner}`
}

export function readScoped(base: string): string | null {
  try {
    const key = scopedKey(base)
    const own = localStorage.getItem(key)
    if (own !== null || owner === 'anon') return own
    /* الوراثة مرّةً واحدة ولحسابٍ حقيقيّ وحده. */
    const legacy = localStorage.getItem(base)
    if (legacy === null) return null
    localStorage.setItem(key, legacy)
    localStorage.removeItem(base)
    return legacy
  } catch {
    return null
  }
}

export function writeScoped(base: string, value: string) {
  try {
    localStorage.setItem(scopedKey(base), value)
  } catch {
    /* تجاهل */
  }
}

export function removeScoped(base: string) {
  try {
    localStorage.removeItem(scopedKey(base))
  } catch {
    /* تجاهل */
  }
}

/* ======================= الذاكرة عبر الجلسات — القسم ٨ ======================= */
const USED_KEY = 'f6een.usedQuestionIds'

/**
 * بترتيب الاستعمال: أوّل المجموعة أقدمُ ما سُمع. الترتيب هو ما تعتمد عليه
 * قاعدة «الأقدم استخداماً» في السحب عند النفاد (SPEC ٨)، فلا يُعاد بناؤها
 * مرتَّبةً ولا تُفرز.
 */
export function loadUsedIds(): Set<string> {
  try {
    const raw = readScoped(USED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function persistUsedIds(used: Set<string>) {
  writeScoped(USED_KEY, JSON.stringify([...used]))
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
