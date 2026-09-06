import { describe, expect, it } from 'vitest'
import { reducer } from './reducer'
import { familiesOf, playableCategories, poolByCatLevel, poolShippedByLevels } from './bank'
import { STAGE1_CATEGORIES, STAGE1_LEVELS, createSession, stage1Owner } from './session'
import type { GameState } from './session'
import type { Level, Question } from './types'
import { shuffle } from './draw'

/**
 * جلساتٌ متتابعة بذاكرةٍ تتراكم — الاختبار الذي كان غائباً.
 *
 * كلّ قياسٍ سبقه كان جلساتٍ جديدةً ببنكٍ نظيف، فمرّت الضمانتان لأنّ الاختبار
 * لا يبلغ الشرط الذي تسقطان عنده. تدقيقٌ في ٦ سبتمبر ٢٠٢٦ قاد حساباً واحداً
 * جلسةً بعد جلسة فوجد: سؤالاً يظهر مرّتين في الليلة الواحدة عند الجلسة
 * الحادية والثلاثين، وطابور الحق ما تلحق فارغاً عند الثالثة والثلاثين —
 * والأفق في SPEC ١٢ (نحو ٢٨ جلسة) كان يقول ذلك.
 *
 * هنا تُقاد جلساتٌ أكثر ممّا يحتمل البنك كلّه، والذاكرة تنتقل من جلسةٍ إلى
 * التي بعدها كما تفعل `App` عبر التخزين المحلّي، عبر المحرّك نفسه لا عبر
 * محاكاة. والمطلوب بعد النفاد كما قبله: لا سؤال مرّتين، ولا قالبان من
 * عائلة، ولا ورقةَ ناقصة في الحق ما تلحق — والتكرار الوحيد المسموح تكرارُ
 * ما سُمع في ليلةٍ سابقة، من أقدمها.
 */

/** أقصى ما يُعرض في دور الحق ما تلحق (٣٠ ثانية ≈ ١٠–١٤) — الأقصى ليُستهلك البنك أسرع. */
const S3_PER_TURN = 14

const INPUT = (categories: string[]) => ({
  teamNames: ['النحل', 'الصقور'] as [string, string],
  players: [
    ['علي', 'سارة'],
    ['خالد', 'منى'],
  ] as [string[], string[]],
  startingTeam: 0 as const,
  categories,
})

const boardCells = (s: GameState): { category: string; level: Level }[] =>
  shuffle(s.s1Categories.flatMap((c) => STAGE1_LEVELS.map((level) => ({ category: c.name, level }))))

const step = (s: GameState, a: Parameters<typeof reducer>[1]) => reducer(s, a)!

/** يلعب جلسةً كاملة بذاكرةٍ واردة ويعيد ما عُرض والذاكرةَ الخارجة. */
function playSession(history: Set<string>): { shown: Question[]; state: GameState } {
  const shown: Question[] = []
  const cats = shuffle(playableCategories()).slice(0, STAGE1_CATEGORIES)
  let s = createSession(INPUT(cats), history)

  for (const cell of boardCells(s)) {
    s = step(s, { t: 'S1_PICK', ...cell })
    shown.push(s.currentQuestion!)
    s = step(s, { t: 'S1_TO_REVEAL' })
    s = step(s, { t: 'S1_SCORE', team: stage1Owner(s.s1Index, s.startingTeam) })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })

  while (s.phase === 'stage2-selection') {
    s = step(s, { t: 'S2_SELECT', sel: [s.s2Rem[0][0], s.s2Rem[1][0]] })
    shown.push(s.currentQuestion!)
    s = step(s, { t: 'S2_TO_REVEAL' })
    s = step(s, { t: 'S2_NEXT_ROUND' })
  }
  s = step(s, { t: 'INTERVAL_CONTINUE' })

  for (const turn of [0, 1]) {
    for (let k = 0; k < S3_PER_TURN; k++) {
      const q = s.s3Queue[s.s3Pos]
      expect(q, `نفد الطابور — الدور ${turn} الورقة ${k}`).toBeDefined()
      shown.push(q)
      s = step(s, { t: 'S3_REVEAL' })
      s = step(s, { t: 'S3_JUDGE', verdict: k % 3 === 0 ? 'wrong' : 'correct' })
    }
    if (turn === 0) {
      const q = s.s3Queue[s.s3Pos]
      expect(q, 'نفد الطابور عند انتهاء الدور الأوّل').toBeDefined()
      shown.push(q)
      s = step(s, { t: 'S3_END_TURN', team: s.s3Team })
    }
  }

  return { shown, state: s }
}

/* ما يستهلكه الحق ما تلحق من مخزونه في الجلسة: ٢ × ١٤ وورقةُ انتهاء الدور. */
const S3_SHOWN = S3_PER_TURN * 2 + 1
const PER_SESSION = STAGE1_CATEGORIES * STAGE1_LEVELS.length + 4 + S3_SHOWN

describe('جلسات متتابعة بذاكرة دائمة — حتى ما بعد نفاد البنك', () => {
  /* مخزون الحق ما تلحق أضيق المخازن، وهو ما يفرغ أوّلاً. عددُ الجلسات
     يُشتقّ منه لا يُكتب رقماً: يتجاوز نفادَه بنصفه، فلو كبر البنك كبر
     الاختبار معه ولم يتوقّف قبل الحدّ الذي يقيسه. */
  const s3Pool = poolShippedByLevels(['سهل', 'متوسط']).filter((q) => q.question.length <= 80).length
  const SESSIONS = Math.ceil((s3Pool / S3_SHOWN) * 1.5)

  it(`${SESSIONS} جلسة على حسابٍ واحد: لا سؤال مرّتين ولا قالبان في الليلة، والطابور لا يفرغ`, () => {
    let history = new Set<string>()
    let firstRecycle: number | null = null

    for (let n = 1; n <= SESSIONS; n++) {
      const before = new Set(history)
      const { shown, state } = playSession(history)

      expect(shown, `الجلسة ${n}: عدد ما عُرض`).toHaveLength(PER_SESSION)

      const ids = shown.map((q) => q.id)
      expect(new Set(ids).size, `الجلسة ${n}: سؤال ظهر مرّتين`).toBe(ids.length)

      const fams = shown.flatMap(familiesOf)
      expect(new Set(fams).size, `الجلسة ${n}: قالبان من عائلة واحدة`).toBe(fams.length)

      /* الذاكرة تراكميّة: كلّ ما عُرض دخلها، ولم يسقط منها شيء. */
      for (const id of before) expect(state.usedQuestionIds.has(id), `الجلسة ${n}: سقط ${id} من الذاكرة`).toBe(true)
      for (const id of ids) expect(state.usedQuestionIds.has(id), `الجلسة ${n}: لم يُحرق ${id}`).toBe(true)

      if (firstRecycle === null && ids.some((id) => before.has(id))) firstRecycle = n
      history = state.usedQuestionIds
    }

    /* الاختبار بلغ النفاد فعلاً — وإلّا لم يقس شيئاً. */
    expect(firstRecycle, 'لم يبلغ الاختبار نفاد البنك').not.toBeNull()
    expect(firstRecycle!).toBeLessThan(SESSIONS)
  })

  /**
   * عند النفاد يُعاد **الأقدم** لا أيُّ سؤال (SPEC ٨): ترتيبُ الذاكرة هو
   * ترتيبُ الاستعمال، والمعاد أوّلُ ما فيها ممّا يصلح للخليّة.
   */
  it('ما يُعاد بعد النفاد هو أقدم ما في الذاكرة', () => {
    const full = new Set(poolShippedByLevels(['سهل', 'متوسط', 'صعب']).map((q) => q.id))
    /* ذاكرةٌ كاملة بترتيب مخلوط: الأقدم فيها ليس أوّل البنك. */
    const history = new Set(shuffle([...full]))
    const cats = shuffle(playableCategories()).slice(0, STAGE1_CATEGORIES)
    const s = createSession(INPUT(cats), history)

    /* ما حُجز لطابور الحق ما تلحق مستثنى بمعرّفه وبقوالبه معاً. */
    const reserved = new Set(s.s3Queue.map((q) => q.id))
    const guarded = new Set(s.s3Queue.flatMap(familiesOf))
    for (const cell of boardCells(s).slice(0, 6)) {
      const picked = step(s, { t: 'S1_PICK', ...cell }).currentQuestion!
      /* أوّل معرّف في الذاكرة يقع في الخليّة ويجوز عرضه. */
      const pool = poolByCatLevel(cell.category, cell.level)
      let oldest: string | null = null
      for (const id of history) {
        const q = pool.find((x) => x.id === id)
        if (q && !reserved.has(id) && familiesOf(q).every((f) => !guarded.has(f))) {
          oldest = id
          break
        }
      }
      expect(picked.id, `${cell.category} · ${cell.level}`).toBe(oldest)
    }
  })
})
