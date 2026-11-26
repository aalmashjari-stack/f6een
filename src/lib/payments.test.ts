import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PACKS } from '../components/SitePanels'

/**
 * السعر في موضعين: المعروض (`PACKS`) والمحاسَب عليه (`purchase_packs` في
 * القاعدة). `pay_create` يرفض الشراء إن اختلفا — فاختلافُهما يعني متجراً لا
 * يبيع شيئاً. هذا الاختبار يمسكه قبل النشر: يقرأ آخر هجرةٍ تكتب الباقات.
 */
function dbPacks(): Map<number, string> {
  const dir = join(import.meta.dirname, '../../supabase/migrations')
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  let last: string | null = null
  for (const f of files) {
    const sql = readFileSync(join(dir, f), 'utf8')
    const m = /insert into public\.purchase_packs[^;]*;/i.exec(sql)
    if (m) last = m[0]
  }
  if (!last) throw new Error('no purchase_packs insert found')
  return new Map([...last.matchAll(/\((\d+),\s*([\d.]+)\)/g)].map(([, g, a]) => [Number(g), a]))
}

describe('أسعار الشراء', () => {
  it('المعروض هو المحاسَب عليه', () => {
    const db = dbPacks()
    expect(db.size).toBe(PACKS.length)
    for (const p of PACKS) expect(db.get(p.games), `باقة ${p.games}`).toBe(p.price)
  })
})
