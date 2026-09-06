import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * ذاكرة الحساب من الخادم صفحةً صفحة، وبترتيب الاستعمال.
 *
 * `db-max-rows` في Supabase ألفٌ، وما فوقه يُقصّ بصمت — فحسابٌ لعب عشرين
 * جلسة كان جهازه الثاني يستلم ذاكرةً مبتورة. يُحاكى هنا خادمٌ يحمل أكثر
 * من ألف صفّ ويردّ على `range` بشريحته، ويُفحص أنّ الكلّ وصل بترتيبه.
 */

const UID = '0476fcfb-6bee-49e5-8677-96af14fcdf9a'
const TOTAL = 2350
const rows = Array.from({ length: TOTAL }, (_, i) => ({ question_id: `Q${i}` }))
const ranges: [number, number][] = []
let orderedBy: string | null = null

vi.mock('./supabase', () => {
  const chain: Record<string, unknown> = {}
  for (const k of ['select', 'eq']) chain[k] = vi.fn(() => chain)
  chain.order = vi.fn((col: string) => {
    orderedBy = col
    return chain
  })
  chain.range = vi.fn(async (from: number, to: number) => {
    ranges.push([from, to])
    /* الخادم يقصّ الصفحة عند الألف مهما طُلب فوقها. */
    return { data: rows.slice(from, Math.min(to + 1, from + 1000)), error: null }
  })
  return {
    supabase: {
      from: () => chain,
      auth: {
        getSession: async () => ({ data: { session: { user: { id: UID } } }, error: null }),
      },
    },
  }
})

const { fetchServerUsedIds } = await import('./usedQuestions')

beforeEach(() => {
  ranges.length = 0
})

describe('fetchServerUsedIds', () => {
  it('يقرأ ما فوق الألف صفحةً صفحة ويُبقي الترتيب', async () => {
    const ids = await fetchServerUsedIds()
    expect(ids).toHaveLength(TOTAL)
    expect(ids[0]).toBe('Q0')
    expect(ids[TOTAL - 1]).toBe(`Q${TOTAL - 1}`)
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ])
  })

  it('مرتَّبٌ بزمن الاستعمال — الأقدم أوّلاً، لقاعدة «الأقدم استخداماً»', async () => {
    await fetchServerUsedIds()
    expect(orderedBy).toBe('used_at')
  })
})
