import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * حارس انحدار: كلُّ استعلامٍ يقيّد نفسه بصاحب الجلسة.
 *
 * سياساتُ RLS تُجمع بـOR، و«المدير يقرأ الكلّ» تُضاف إلى «كلٌّ يقرأ صفّه»
 * — فمن اتّكل على RLS في التصفية رأى صفوف الجميع: انفجر `.single()`
 * على حساب مدير، وظهرت في «ألعابي» ألعابُ غيره، واستُوردت أسئلةُ الجميع
 * مستعملةً فأحرقت البنك (بلاغ علي، ٢ سبتمبر ٢٠٢٦).
 *
 * يُمسَك هنا بناءُ الاستعلام لا نتيجتُه: لا شبكة ولا قاعدة، بل تسجيلُ
 * `.eq()` التي خرجت فعلاً. فلو سقط قيدُ المستخدم يوماً، سقط الاختبار —
 * وهو ما لا يكشفه تصفّحٌ يدويّ إلّا على حسابِ مديرٍ وبعد أن يوجد صفّان.
 */

const UID = '0476fcfb-6bee-49e5-8677-96af14fcdf9a'

/** يسجّل كلّ `.eq()` في السلسلة، ويردّ شكلاً صالحاً لأيّ نهاية. */
function makeChain(rows: unknown) {
  const eqs: [string, unknown][] = []
  const result = { data: rows, error: null }
  const chain: Record<string, unknown> = {}
  for (const k of ['select', 'order', 'limit', 'insert', 'upsert', 'update']) {
    chain[k] = vi.fn(() => chain)
  }
  chain.eq = vi.fn((col: string, val: unknown) => {
    eqs.push([col, val])
    return chain
  })
  chain.single = vi.fn(async () => result)
  chain.maybeSingle = vi.fn(async () => result)
  chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res)
  return { chain, eqs }
}

let lastTable = ''
let lastEqs: [string, unknown][] = []

vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => {
      lastTable = table
      const rows =
        table === 'profiles'
          ? { games_balance: 3, created_at: '2026-01-01T00:00:00Z' }
          : []
      const { chain, eqs } = makeChain(rows)
      lastEqs = eqs
      return chain
    },
    auth: {
      getSession: async () => ({ data: { session: { user: { id: UID } } }, error: null }),
    },
  },
}))

const { fetchBalance, fetchOpenSession, fetchProfile, fetchMyGames } = await import('./games')
const { fetchServerUsedIds } = await import('./usedQuestions')

beforeEach(() => {
  lastTable = ''
  lastEqs = []
})

describe('كلّ قراءةٍ تقيّد نفسها بصاحب الجلسة', () => {
  const cases: [string, () => Promise<unknown>, string, string][] = [
    ['fetchBalance', () => fetchBalance(), 'profiles', 'id'],
    ['fetchProfile', () => fetchProfile(), 'profiles', 'id'],
    ['fetchOpenSession', () => fetchOpenSession(), 'sessions', 'user_id'],
    ['fetchMyGames', () => fetchMyGames(), 'sessions', 'user_id'],
    ['fetchServerUsedIds', () => fetchServerUsedIds(), 'used_questions', 'user_id'],
  ]

  for (const [name, run, table, column] of cases) {
    it(`${name} يقيّد ${table} بـ${column}`, async () => {
      await run()
      expect(lastTable).toBe(table)
      expect(lastEqs).toContainEqual([column, UID])
    })
  }
})
