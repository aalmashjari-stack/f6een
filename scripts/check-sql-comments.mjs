#!/usr/bin/env node
/**
 * حارسُ تعليقات الهجرات — يمسك عطباً صامتاً كلَّفنا هجرةً كاملة.
 *
 * **تعليقاتُ Postgres متداخلة بخلاف C**: `/*` داخل تعليقٍ مفتوح يفتح تعليقاً
 * ثانياً، و`*` + `/` الأوّل يغلق الداخلَ لا الخارج. فسطرٌ يشرح أمراً مثل
 * «‪grep … supabase/migrations/‬» متبوعاً بنجمة ونقطة sql يفتح تعليقاً لا
 * يُغلق أبداً — فيبتلع الملفَّ كلَّه، ويسقط بـ`unterminated /* comment`.
 *
 * ووقع هذا فعلاً في `20260910000000_admin_questions_jsonb_face.sql`: هجرةٌ
 * كُتبت لتصلح قصَّ تصدير اللوحة عند ألف صفّ، وكانت **لا تُطبَّق أصلاً** —
 * ولا شيء كان سيكشفها إلّا محاولةُ تشغيلها على قاعدةٍ حيّة.
 *
 *   node scripts/check-sql-comments.mjs
 *
 * ولا يفحص هذا نحوَ SQL كلَّه — يفحص عمقَ التعليقات وحده، وهو ما لا تراه
 * العين في ملفٍّ نصفُه شرحٌ عربيّ.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'supabase/migrations'

/**
 * يمشي على الملفّ حرفاً حرفاً بعمق التعليقات.
 *
 * والنصوص تُتخطّى: `'…'` و`"…"` و`$$…$$` — فـ`/*` داخل نصٍّ حرفٌ لا تعليق،
 * وجسمُ الدوالّ كلُّه بين `$$` وفيه أنماطٌ كثيرة.
 */
function scan(sql) {
  let depth = 0
  let openedAt = 0
  let line = 1
  let i = 0
  /* بلاغاتُ الاتّجاه الثاني: تعليقٌ أُغلق مبكراً في منتصف الشرح. */
  const notes = []

  while (i < sql.length) {
    const c = sql[i]
    const next = sql[i + 1]

    if (c === '\n') line++

    if (depth === 0) {
      /* علامة الدولار: `$$` أو `$اسم$` — يُقفز إلى نظيرتها. */
      const dollar = /^\$[A-Za-z_]*\$/.exec(sql.slice(i))
      if (dollar) {
        const tag = dollar[0]
        const end = sql.indexOf(tag, i + tag.length)
        const chunk = sql.slice(i, end === -1 ? sql.length : end + tag.length)
        line += (chunk.match(/\n/g) ?? []).length
        i += chunk.length
        continue
      }
      if (c === "'" || c === '"') {
        let j = i + 1
        while (j < sql.length && sql[j] !== c) {
          if (sql[j] === '\n') line++
          j++
        }
        i = j + 1
        continue
      }
      /* تعليق سطر — إلى آخر السطر، ولا يفتح شيئاً. */
      if (c === '-' && next === '-') {
        const nl = sql.indexOf('\n', i)
        i = nl === -1 ? sql.length : nl
        continue
      }
    }

    if (c === '/' && next === '*') {
      if (depth === 0) openedAt = line
      else notes.push(`السطر ${line}: رمزُ فتحِ تعليقٍ داخل تعليق — يفتح ثانياً لا يُغلق`)
      depth++
      i += 2
      continue
    }
    if (c === '*' && next === '/' && depth > 0) {
      depth--
      /* أُغلق التعليق وبقي على السطر نفسه شرحٌ عربيّ: العلامةُ كانت مقصودةً
         حرفاً في الكلام لا إغلاقاً — وهذا يقطع التعليق فيصير باقي الشرح
         شيفرةً تُقرأ. (وقعت فعلاً في ١٠ سبتمبر ٢٠٢٦ في نفس الملفّ الذي
         كُتب للتحذير منها.) */
      if (depth === 0) {
        const rest = sql.slice(i + 2, sql.indexOf('\n', i + 2) + 1 || undefined)
        if (/[؀-ۿ]/.test(rest)) {
          notes.push(`السطر ${line}: تعليقٌ أُغلق ثمّ تلاه شرحٌ عربيّ — الغالبُ أنّ الإغلاق غير مقصود`)
        }
      }
      i += 2
      continue
    }
    i++
  }

  return { depth, openedAt, notes }
}

let bad = 0
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()

for (const f of files) {
  const { depth, openedAt, notes } = scan(readFileSync(join(DIR, f), 'utf8'))
  if (depth > 0) {
    bad++
    console.error(
      `✗ ${f}: تعليقٌ لم يُغلق (عمق ${depth}) — بدأ عند السطر ${openedAt}.\n` +
        `  الغالبُ أنّ داخله «/» متبوعةً بنجمة، وهي تفتح تعليقاً ثانياً في Postgres.`,
    )
  }
  for (const n of notes) {
    bad++
    console.error(`✗ ${f}: ${n}`)
  }
}

console.log(`فُحصت ${files.length} هجرة · تعليقات غير مغلقة: ${bad}`)
process.exit(bad ? 1 : 0)
