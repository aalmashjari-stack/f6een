import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { shippedImage, shippedPrefixes } from './shippedImage'

/**
 * حارسُ المجلّد المنسيّ.
 *
 * غابت صورُ المعالم عن اللوحة وهي سليمة في اللعب، ثمّ غابت صورُ «الزمن
 * الجميل» كذلك — في يومٍ واحد (٨ سبتمبر ٢٠٢٦)، والسبب في المرّتين أنّ
 * السلسلة كانت مكتوبةً في موضعين فنُسي أحدهما فيهما. فصارت في
 * `shippedImage` موضعاً واحداً، وهذا الفحص يحرس أنّ كلّ مجلّدٍ يمرّ منه.
 *
 * **والمفاتيح تُقرأ من المجلّدات نفسها لا تُكتب هنا**: ملفٌّ يُسمّى في
 * الاختبار يجعل حذفَ صورةٍ واحدة يُسقطه، والمقصودُ وصلُ المجلّد لا بقاءُ
 * صورةٍ بعينها.
 */
const FOLDERS = {
  المشاهير: import.meta.glob('../../assets/celebrities/celeb-*.jpg'),
  المعالم: import.meta.glob('../../assets/landmarks/landmark-*.jpg'),
  'الزمن الجميل': import.meta.glob('../../assets/zaman/zaman-*.jpg'),
  'صور الفئات': import.meta.glob('../../assets/pics/pic-*.jpg'),
}

const keyOf = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.[^.]+$/, '')

describe('shippedImage', () => {
  for (const [name, mods] of Object.entries(FOLDERS)) {
    it(`يحلّ مفتاحاً من مجلّد ${name}`, () => {
      const paths = Object.keys(mods)
      expect(paths.length, `مجلّد ${name} فارغ`).toBeGreaterThan(0)
      expect(shippedImage(keyOf(paths[0])), `مجلّد ${name} غير موصولٍ بالسلسلة`).not.toBeNull()
    })
  }

  it('يردّ null لمفتاحٍ لا ملفَّ له', () => {
    expect(shippedImage('zaman-nope-999')).toBeNull()
    expect(shippedImage('')).toBeNull()
  })
})

/**
 * حارسُ القاعدة: بادئاتُ الصور المشحونة هي نفسها ما يقبله `is_art_ref`.
 *
 * المجلّد الجديد كان يحتاج سطراً هنا **وهجرةً** تضيف بادئته إلى نمط القاعدة
 * (`^(celeb|landmark|zaman|pic)-…`). وإغفالُ الهجرة لا يظهر في التطبيق: يظهر
 * حين يرفع الوكيل دفعةَ مسوّدات فتُردّ كلُّها بـ`bad_image_url` — وقع فعلاً
 * مع «الزمن الجميل» (٨ سبتمبر ٢٠٢٦).
 *
 * **والمقروءُ آخرُ تعريفٍ لكلّ دالّة لا أوّلُه**: الدالّة تُعاد كتابتها عبر
 * الهجرات، وأحدثُها وحده هو الحقيقة. فكلُّ دالّةٍ حمل أيُّ تعريفٍ لها النمطَ
 * يُفحص آخرُ تعريفٍ لها — فإن بقي فيه النمط وجب أن يطابق المجلّدات.
 */
describe('بادئات الصور في القاعدة', () => {
  const dir = resolve(__dirname, '../../supabase/migrations')
  const latest = new Map<string, string>()
  const everHad = new Set<string>()
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    const sql = readFileSync(resolve(dir, file), 'utf8')
    const parts = sql.split(/(?=create\s+(?:or\s+replace\s+)?function\s+public\.)/i).slice(1)
    for (const part of parts) {
      const name = /function\s+public\.(\w+)/i.exec(part)![1]
      latest.set(name, part)
      if (/\^\(celeb\|/.test(part)) everHad.add(name)
    }
  }
  const groups = [...everHad].flatMap((name) => {
    const m = /\^\(([a-z|]+)\)-/.exec(latest.get(name)!)
    return m ? [{ name, prefixes: m[1].split('|').sort() }] : []
  })

  it('دالّةٌ واحدة على الأقلّ ما زالت تحمل النمط', () => {
    expect(groups.map((g) => g.name)).toContain('is_art_ref')
  })

  it('كلّ مجلّدٍ مشحون تقبله القاعدة، ولا بادئةَ في القاعدة بلا مجلّد', () => {
    for (const g of groups) expect(g.prefixes, `public.${g.name}`).toEqual(shippedPrefixes())
  })
})
