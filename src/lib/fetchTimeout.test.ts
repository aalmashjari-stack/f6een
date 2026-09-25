import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TimeoutError, isExempt, withTimeout } from './fetchTimeout'

/* `fetch` لا يردّ أبداً — هذا شكل العطل على الآيفون: طلبٌ أُسقط أثناء
   تعليق التطبيق فبقي وعدُه معلّقاً بلا رفض. */
const hanging: typeof fetch = (_input, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal!.reason))
  })

describe('withTimeout — مهلة طلبات الشبكة', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('طلبٌ لا يردّ يُرفض بعد المهلة لا يبقى معلّقاً', async () => {
    const f = withTimeout(hanging, () => 1000)
    const p = f('https://x.supabase.co/rest/v1/rpc/start_session')
    const settled = vi.fn()
    p.then(settled, settled)
    await vi.advanceTimersByTimeAsync(999)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toHaveBeenCalledTimes(1)
    expect(settled.mock.calls[0][0]).toBeInstanceOf(TimeoutError)
  })

  it('الردّ في الوقت يمرّ كما هو ويُلغى المؤقّت', async () => {
    const ok = new Response('1')
    const base = vi.fn<typeof fetch>(async () => ok)
    const f = withTimeout(base, () => 1000)
    await expect(f('https://x.supabase.co/rest/v1/profiles')).resolves.toBe(ok)
    expect(base.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('التخزين مستثنى: لا إشارة إلغاء تُضاف ولا مهلة', async () => {
    const base = vi.fn<typeof fetch>(async () => new Response())
    const f = withTimeout(base, () => 1000)
    await f('https://x.supabase.co/storage/v1/object/art/a.jpg', { method: 'POST' })
    expect(base.mock.calls[0][1]?.signal).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
    expect(isExempt(new URL('https://x.supabase.co/storage/v1/object/list/art'))).toBe(true)
    expect(isExempt(new Request('https://x.supabase.co/auth/v1/token'))).toBe(false)
  })

  it('إلغاءُ النداء نفسه يبقى مسموعاً قبل المهلة', async () => {
    const f = withTimeout(hanging, () => 10_000)
    const own = new AbortController()
    const p = f('https://x.supabase.co/rest/v1/sessions', { signal: own.signal })
    const settled = vi.fn()
    p.then(settled, settled)
    own.abort(new Error('mine'))
    await vi.advanceTimersByTimeAsync(0)
    expect(settled).toHaveBeenCalledTimes(1)
    expect((settled.mock.calls[0][0] as Error).message).toBe('mine')
  })

  it('المهلة تُقرأ عند كلّ طلب — اللوحة ترفعها بعد إنشاء العميل', async () => {
    let ms = 100
    const f = withTimeout(hanging, () => ms)
    const first = vi.fn()
    f('https://x.supabase.co/rest/v1/a').then(first, first)
    ms = 5000
    const second = vi.fn()
    f('https://x.supabase.co/rest/v1/b').then(second, second)
    await vi.advanceTimersByTimeAsync(100)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(4900)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('صفرٌ أو أقلّ يعطّل المهلة', async () => {
    const base = vi.fn<typeof fetch>(async () => new Response())
    await withTimeout(base, () => 0)('https://x.supabase.co/rest/v1/a')
    expect(base.mock.calls[0][1]?.signal).toBeUndefined()
  })
})
