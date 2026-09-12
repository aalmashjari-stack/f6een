#!/usr/bin/env node
/**
 * فحصُ العائلات — الإجابةُ الواحدة في خلايا مختلفة.
 *
 *   node scripts/families.mjs            # تقرير فقط
 *   node scripts/families.mjs --apply    # يكتب العائلات في القاعدة
 *
 * حارسُ الجلسة في المحرّك يمنع سؤالين من **عائلةٍ** واحدة، ويستنتج
 * العائلةَ من أوّل أربع كلمات في السؤال. فسؤالان بنصّين مختلفين وجوابٍ
 * واحد — «من الصحابيّ الذي قاد اليرموك؟» في «الصحابة» و«من الملقّب بسيف
 * الله؟» في «دين وسيرة» — يلتقيان في جلسةٍ واحدة بلا مانع، ويسمع المجلس
 * «خالد بن الوليد» مرّتين. والعلاجُ ليس الحذف (حدُّ الخليّة عشرون) بل
 * **تصريحُ عائلةٍ واحدة** للمجموعة كلّها في حقل `family`.
 *
 * ما يفعله:
 *  1. يجمع الأسئلة الحيّة (بلا المحجوب) بالإجابة المطبَّعة — بلا تشكيل ولا
 *     همزات ولا أقواس ولا صيغ أدب («رضي الله عنه»).
 *  2. يتجاهل الأعداد (سبعة، 1994) — فهي تتكرّر بطبعها ولا تُلاحَظ.
 *  3. يتجاهل المجموعات التي كلُّها في خليّةٍ واحدة (فئة × مستوى): اللوح
 *     يسحب من الخليّة سؤالاً واحداً فلا تلتقي.
 *  4. لكلّ مجموعةٍ عابرةٍ للخلايا يختار عائلةً: القائمةَ التي تطابق الإجابة
 *     رسماً إن وُجدت، وإلّا الوحيدةَ القائمة، وإلّا نصَّ الإجابة.
 *  5. يكتبها لمن **لا عائلة له** ولمن عائلتُه رسمٌ آخر للاسم نفسه («عمر» →
 *     «عمر بن الخطاب»). **ولا يكسر عائلةً موضوعيّة قائمة** («مدد الخلافة»،
 *     «أمّهات المؤمنين»): هي مقصودةٌ تجمع أسئلةً بموضوعها، فتُترك ويُبلَّغ عنها.
 *
 * **والمتجانساتُ تُستثنى باليد** (`HOMONYMS`): «سالي» الفتاة و«سالي» سيّارة
 * بيكسار، و«الثلث» خطٌّ ونصيب، و«القطر» نحاس ودولة — جوابٌ واحد لفظاً لا
 * معنىً، والمجلس لا يشعر بتكراره. القائمة تكبر مع كلّ تشغيل.
 *
 * التشغيل بعد كلّ اعتمادٍ كبير من المسوّدات؛ فالمعتمَد لا يحمل عائلةً
 * تلقائيّاً. كُتب في مراجعة ١٢ سبتمبر ٢٠٢٦ (189 مجموعة، 225 وسماً) وأُعيدت
 * كتابته يومها لأنّه كان في مجلّدٍ مؤقّت ضاع — فهذا موضعه.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const apply = process.argv.includes('--apply')

function dbUrl() {
  const p = resolve(root, '.env.db')
  if (!existsSync(p)) return null
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (line.startsWith('SUPABASE_DB_URL=')) {
      const v = line.slice('SUPABASE_DB_URL='.length).trim().replace(/^["']|["']$/g, '')
      return /^postgres(ql)?:\/\//.test(v) ? v : null
    }
  }
  return null
}
const url = dbUrl()
if (!url) {
  console.error('ينقص SUPABASE_DB_URL في .env.db — الفحص يقرأ القاعدة الحيّة لا الملفّ.')
  process.exit(1)
}

/* ── التطبيع ── */
const HONORIFICS = [
  /صلى الله عليه وسلم/g, /صلّى الله عليه وسلّم/g,
  /رضي الله عن(?:ه|ها|هم|هما)/g, /علي(?:ه|ها|هم)\s?السلام/g,
]
/** نصُّ الإجابة للعرض: بلا صيغ أدبٍ ولا ما بين قوسين. */
const display = (s) =>
  HONORIFICS.reduce((t, re) => t.replace(re, ' '), String(s ?? ''))
    .replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
/** مفتاح المقارنة: نفس تطبيع `check-drafts` تقريباً. */
const norm = (s) =>
  display(s)
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()

const isNumber = (k) =>
  /^[\d\s.,%]+$/.test(k) ||
  /^(واحد|اثنان|اثنتان|اثنا|اثنتا|ثلاث|اربع|خمس|ست|سبع|ثمان|تسع|عشر|احدي|عشرون|ثلاثون|اربعون|خمسون|ستون|سبعون|ثمانون|تسعون|مئه|الف|الواحد)/.test(k)

/** متجانساتٌ لفظاً لا معنىً — بمفتاح التطبيع. */
const HOMONYMS = new Set([
  'سالي', 'الثلث', 'الحجر', 'طيبه', 'الاسد', 'الخليه', 'الواو', 'ازرق', 'القطر',
  'دانتي', 'الجمهوريه', 'البيض', 'المهر', 'الخشب', 'النبي', 'الغراب', 'المغرب',
  'الكلب', 'التمر', 'رمضان', 'مكه',
])

const { default: pg } = await import('pg')
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await c.connect()
const { rows } = await c.query(`
  select o.question_id as id, o.category, o.level, o.question, o.answer, o.family
    from public.question_overrides o
   where not exists (select 1 from public.question_flags f
                      where f.question_id = o.question_id and f.status = 'disabled')`)

const groups = new Map()
for (const r of rows) {
  const k = norm(r.answer)
  if (!k || k.length < 3 || isNumber(k) || HOMONYMS.has(k)) continue
  if (!groups.has(k)) groups.set(k, [])
  groups.get(k).push(r)
}

const updates = []
const kept = []
let unified = 0
for (const [k, g] of groups) {
  if (g.length < 2) continue
  if (new Set(g.map((r) => `${r.category}|${r.level}`)).size < 2) continue
  const fams = [...new Set(g.map((r) => r.family).filter(Boolean))]
  if (fams.length === 1 && g.every((r) => r.family)) { unified++; continue }

  const answerLike = fams.find((f) => norm(f) === k)
  const target = answerLike ?? (fams.length === 0 ? display(g[0].answer) : fams.length === 1 ? fams[0] : null)

  console.log(`\n## «${k}» → ${target ?? '؟'}   (عائلات قائمة: ${fams.join(' / ') || '—'})`)
  for (const r of g) {
    console.log(`   ${r.id} [${r.category} · ${r.level}] f=${r.family ?? '—'} :: ${r.question.slice(0, 70)}`)
    if (r.family === target) continue
    if (target && (!r.family || norm(r.family) === k)) updates.push([r.id, target])
    else kept.push(r)
  }
}

console.log(`\nمجموعات موحَّدة أصلاً: ${unified} · وسومٌ مقترحة: ${updates.length} · تُركت على عائلةٍ موضوعيّة: ${kept.length}`)
if (kept.length) console.log('  ' + [...new Set(kept.map((r) => `${r.id}(${r.family})`))].join(' · '))

if (apply && updates.length) {
  for (const [id, f] of updates) {
    await c.query('update public.question_overrides set family = $2, updated_at = now() where question_id = $1', [id, f])
  }
  console.log(`\nكُتب ${updates.length} وسماً.`)
} else if (updates.length) {
  console.log('\nأضف --apply للكتابة.')
}
await c.end()
