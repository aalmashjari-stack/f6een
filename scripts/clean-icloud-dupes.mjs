#!/usr/bin/env node
/**
 * يمسح نسخ iCloud المكرّرة من مجلّدات البناء.
 *
 * المشروع يعيش تحت `Documents`، وهو مجلّدٌ تزامنه iCloud Drive. حين يكتب
 * `vite build` مئات الملفّات دفعةً واحدة يُنتج iCloud لبعضها نسخاً باسم
 * «اسم 2.jpg» أو «assets 3» — ولا يعرف Capacitor أنّها نسخ، فينقلها إلى
 * `ios/App/App/public` وتُشحن داخل التطبيق: أصولٌ مضاعفة في حزمةٍ حجمها
 * ستّة عشر ميغابايت أصلاً. وقع فعلاً: ‎index 2.html‎ و‎assets 2‎ داخل حزمة
 * الآيفون. يُنادى بعد كلّ بناء (‎postbuild‎) وبعد ‎cap sync‎ أيضاً: iCloud
 * يولّد النسخ أثناء النقل نفسِه، فتنظيفُ ‎dist‎ وحدَها قبل المزامنة لا يكفي —
 * وقع ذلك فعلاً، سبعُ نسخ في ‎ios/App/App/public‎ بعد مزامنةٍ ناجحة.
 *
 * النمط: فراغٌ ثمّ رقم في آخر الاسم قبل الامتداد. أسماء الحزمة كلّها
 * بشرطات لا فراغات، فلا يلتقط الشكلُ ملفّاً حقيقيّاً.
 */
import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DUP = / \d+(\.[^.]+)?$/
const roots =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['dist', 'ios/App/App/public', 'android/app/src/main/assets/public']

let removed = 0
function walk(dir) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const path = join(dir, e.name)
    if (DUP.test(e.name)) {
      rmSync(path, { recursive: true, force: true })
      removed++
      continue
    }
    if (e.isDirectory()) walk(path)
  }
}
for (const root of roots) walk(root)
console.log(removed === 0 ? 'لا نسخ مكرّرة' : `حُذفت ${removed} نسخة مكرّرة من iCloud`)
