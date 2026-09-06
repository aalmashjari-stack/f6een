import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * الإغلاق المعلَّق: نيّة الإغلاق تُكتب قبل الطلب وتُمحى بعد نجاحه.
 *
 * كان فشل الإغلاق عند الختام يُبتلع، فيبقى الخادم على لقطةٍ سابقة للنهاية
 * ويستأنفها التشغيل التالي — المجلس يعود إلى الجولة الأخيرة من لعبةٍ
 * انتهت. هنا يُحاكى خادمٌ يرفض أوّلاً ثمّ يقبل.
 */

let failNext = 0
const updates: { patch: Record<string, unknown>; id: unknown }[] = []

vi.mock('./supabase', () => {
  const chain: Record<string, unknown> = {}
  let patch: Record<string, unknown> = {}
  chain.update = vi.fn((p: Record<string, unknown>) => {
    patch = p
    return chain
  })
  chain.eq = vi.fn(async (_col: string, id: unknown) => {
    if (failNext > 0) {
      failNext -= 1
      return { data: null, error: { message: '503' } }
    }
    updates.push({ patch, id })
    return { data: null, error: null }
  })
  return { supabase: { from: () => chain } }
})

/* مخزنٌ في الذاكرة مكان `localStorage` — البيئة عارية. */
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
})

const { closeSessionDurably, flushPendingClose, pendingClose } = await import('./games')
const { setStorageOwner } = await import('../game/session')

beforeEach(() => {
  store.clear()
  updates.length = 0
  failNext = 0
  setStorageOwner('user-a')
})

describe('الإغلاق المعلَّق', () => {
  it('ينجح فلا يبقى شيءٌ معلَّقاً', async () => {
    await closeSessionDurably('s1', 'finished')
    expect(pendingClose()).toBeNull()
    expect(updates).toHaveLength(1)
    expect(updates[0].patch.status).toBe('finished')
  })

  it('يفشل فيبقى معلَّقاً بحاله ولقطته، ويُعاد عند الإقلاع', async () => {
    failNext = 1
    await expect(closeSessionDurably('s1', 'finished', { phase: 'endgame' } as never)).rejects.toBeTruthy()
    const p = pendingClose()
    expect(p?.id).toBe('s1')
    expect(p?.status).toBe('finished')
    expect((p?.state as { phase: string }).phase).toBe('endgame')

    await flushPendingClose()
    expect(pendingClose()).toBeNull()
    expect(updates).toHaveLength(1)
    expect(updates[0].id).toBe('s1')
    expect((updates[0].patch.state as { phase: string }).phase).toBe('endgame')
  })

  it('يفشل الإقلاع أيضاً فيبقى إلى المرّة القادمة', async () => {
    failNext = 2
    await closeSessionDurably('s1', 'abandoned').catch(() => {})
    await flushPendingClose().catch(() => {})
    expect(pendingClose()?.status).toBe('abandoned')
  })

  it('المعلَّق باسم حسابٍ لا يراه حسابٌ آخر', async () => {
    failNext = 1
    await closeSessionDurably('s1', 'finished').catch(() => {})
    setStorageOwner('user-b')
    expect(pendingClose()).toBeNull()
    setStorageOwner('user-a')
    expect(pendingClose()?.id).toBe('s1')
  })
})
