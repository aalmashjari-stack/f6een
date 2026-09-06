import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * البلاغ يحجز محلّياً في لحظته، ويبقى في صندوقٍ صادر حتى يقبله الخادم.
 *
 * بلا شبكة كانت الشاشة تقول «بُلّغ» والقائمة المحلّية فارغة، والبلاغ يضيع
 * بمغادرة الختام (تدقيق ٦ سبتمبر ٢٠٢٦). يُحاكى هنا خادمٌ يعطّل ثمّ يقبل،
 * وخادمٌ يرفض عن علم.
 */

let mode: 'ok' | 'down' | 'final' = 'ok'
const calls: { id: string; session: string | null }[] = []

vi.mock('./supabase', () => ({
  supabase: {
    rpc: vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (name === 'blocked_questions') return { data: [{ question_id: 'SRV1' }], error: null }
      if (mode === 'down') return { data: null, error: { message: 'FetchError: network' } }
      if (mode === 'final') return { data: null, error: { message: 'not_shown' } }
      calls.push({ id: args.p_question_id as string, session: args.p_session_id as string | null })
      return { data: 'pending', error: null }
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

const { flushPendingReports, pendingReports, reportQuestion, syncBlocked } = await import('./questionFlags')
const { blockedQuestionIds } = await import('../game/bank')
const { setStorageOwner } = await import('../game/session')

beforeEach(() => {
  store.clear()
  calls.length = 0
  mode = 'ok'
  setStorageOwner('user-a')
})

describe('البلاغ والصندوق الصادر', () => {
  it('ينجح: يحجز محلّياً ويرفع ولا يبقي شيئاً في الصندوق', async () => {
    await reportQuestion('E001', 's1')
    expect(blockedQuestionIds().has('E001')).toBe(true)
    expect(calls).toEqual([{ id: 'E001', session: 's1' }])
    expect(pendingReports()).toEqual([])
  })

  it('بلا شبكة: الحجز المحلّي يقع فوراً والبلاغ يبقى في الصندوق ثمّ يُعاد', async () => {
    mode = 'down'
    await expect(reportQuestion('E002', 's1')).rejects.toBeTruthy()
    expect(blockedQuestionIds().has('E002')).toBe(true)
    expect(pendingReports()).toEqual([{ id: 'E002', sessionId: 's1' }])

    mode = 'ok'
    await flushPendingReports()
    expect(calls).toEqual([{ id: 'E002', session: 's1' }])
    expect(pendingReports()).toEqual([])
  })

  it('رفضٌ عن علم يُخرج البلاغ من الصندوق ويُبقي الحجز المحلّي', async () => {
    mode = 'final'
    await reportQuestion('E003', 's1')
    expect(pendingReports()).toEqual([])
    expect(blockedQuestionIds().has('E003')).toBe(true)
  })

  it('مزامنة المحجوز من الخادم لا تمحو ما ينتظر في الصندوق', async () => {
    mode = 'down'
    await reportQuestion('E004', 's1').catch(() => {})
    await syncBlocked()
    expect(blockedQuestionIds().has('SRV1')).toBe(true)
    expect(blockedQuestionIds().has('E004')).toBe(true)
  })

  it('الصندوق باسم الحساب', async () => {
    mode = 'down'
    await reportQuestion('E005', 's1').catch(() => {})
    setStorageOwner('user-b')
    expect(pendingReports()).toEqual([])
  })
})
