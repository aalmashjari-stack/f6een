import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * صفوفُ القاعدة تصل بمستوياتها كلّها — **وصفُّ اللوح الرابع ليس استثناءً**.
 *
 * كان `toQuestion` يرشّح بقائمة مستوياتٍ مكتوبةٍ بيدها على ثلاثة. فلمّا دخل
 * «تعجيزي» في ٩ سبتمبر ٢٠٢٦ صار كلُّ صفٍّ تعجيزيٍّ يُطرح هنا صامتاً — وفي
 * وضع `db` القاعدةُ هي البنك كلُّه، فخلا الصفُّ الرابع من كلّ تصنيف،
 * و`playableCategories` تشترط الصفوف الأربعة فرجعت فارغة: **لا فئة تظهر في
 * الإعداد**، لا في الموقع ولا في التطبيق (بلاغ علي في اليوم نفسه).
 *
 * فالفحص يقيس ما يراه اللاعب: تصنيفٌ كامل الصفوف يأتي من القاعدة، فيجب أن
 * يظهر في `playableCategories` — والصفُّ الفاسد وحده يُطرح.
 */

const rows: Record<string, unknown>[] = []

vi.mock('./supabase', () => ({
  supabase: {
    rpc: vi.fn(async (name: string) => {
      if (name === 'bank_signature') return { data: null, error: { message: 'no' } }
      if (name === 'question_bank') return { data: { mode: 'db', rows }, error: null }
      return { data: [], error: null }
    }),
  },
}))

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
})

const { syncOverlay } = await import('./questionOverlay')
const { playableCategories, poolByCatLevel, allQuestions } = await import('../game/bank')
const { BOARD_LEVELS } = await import('../game/levels')

/* تصنيفٌ مشحون: في وضع `db` لا يُقرأ من الملفّ شيء، فصفوفُه هنا من القاعدة
   وحدها — وهو في `allCategories` فيصحّ قياسُ `playableCategories` عليه. */
const CAT = 'الكويت'

/** بنكٌ كاملُ الصفوف لتصنيفٍ واحد — سؤالان في كلّ صفّ. */
function fullRows() {
  return BOARD_LEVELS.flatMap((level, i) =>
    [0, 1].map((n) => ({
      question_id: `DB${i}${n}`,
      category: CAT,
      level,
      topic: null,
      question: `سؤال ${level} ${n}`,
      answer: `جواب ${level} ${n}`,
      image: null,
    })),
  )
}

beforeEach(() => {
  store.clear()
  rows.length = 0
})

describe('طبقة الأسئلة من القاعدة', () => {
  it('تقبل صفوف اللوح كلّها، فيظهر التصنيف في الإعداد', async () => {
    rows.push(...fullRows())
    await syncOverlay()

    for (const level of BOARD_LEVELS) {
      expect(poolByCatLevel(CAT, level).length, `الصفّ «${level}» فارغ`).toBeGreaterThan(0)
    }
    expect(playableCategories()).toContain(CAT)
  })

  it('التصنيف ينقصه صفٌّ فلا يدخل الاختيار — والباقي يبقى', async () => {
    const short = BOARD_LEVELS[BOARD_LEVELS.length - 1]
    rows.push(...fullRows().filter((r) => r.level !== short))
    await syncOverlay()

    expect(playableCategories()).not.toContain(CAT)
    expect(allQuestions().length).toBeGreaterThan(0)
  })

  /* `answer_image` عمودٌ جديد (٩ سبتمبر ٢٠٢٦): وجهٌ يظهر في الكشف إلى جانب
     الإجابة، والسؤالُ يبقى نصّاً. صمتُ `toQuestion` عنه كان يعني عموداً
     يُملأ في اللوحة ولا يصل الشاشة أبداً. */
  it('صورة الإجابة تصل من القاعدة، وغيابها لا يضرّ', async () => {
    const withFace: Record<string, unknown>[] = fullRows()
    withFace[0].answer_image = 'celeb-002-q6892571'
    rows.push(...withFace)
    await syncOverlay()

    const q = allQuestions().find((x) => x.id === withFace[0].question_id)
    expect(q?.answerImage).toBe('celeb-002-q6892571')
    expect(q?.image).toBeUndefined()
    const plain = allQuestions().find((x) => x.id === withFace[1].question_id)
    expect(plain?.answerImage).toBeUndefined()
  })

  it('الصفّ الفاسد وحده يُطرح ولا يُسقط الطبقة', async () => {
    rows.push(...fullRows(), {
      question_id: '',
      category: CAT,
      level: BOARD_LEVELS[0],
      topic: null,
      question: '',
      answer: '',
      image: null,
    })
    await syncOverlay()

    expect(playableCategories()).toContain(CAT)
    expect(allQuestions().some((q) => q.id === '')).toBe(false)
  })
})
