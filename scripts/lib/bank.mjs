/**
 * **البنك كما هو في القاعدة الحيّة، لا كما في الملفّ.**
 *
 * `data/questions-bank-v5.json` بذرةُ أوّل إقلاع ومرجعُ الاختبارات، أمّا ما
 * يراه اللاعب فهو `question_overrides` — وفيه اليوم ثلاثة آلافٍ ونيّف مقابل
 * ألفين ونصف في الملفّ. **والفرق كلُّه فئاتٌ لا أثر لها في الملفّ أصلاً**:
 * سيارات وأكلات وأغاني وطرب والزمن الجميل ومعالم، وكلُّ ما يُضاف من اللوحة.
 *
 * فحارسُ الدفعات كان يقارن بالملفّ وحده — أي أنّه **أعمى عن كلّ فئةٍ
 * جديدة**، وهي بالضبط ما نؤلّف له. ومن كتب ثمانين سؤالاً في «كأس العالم»
 * ثمّ ثمانين في «دوري الأبطال» لا يحرسه ملفٌّ لا يعرف الفئتين.
 *
 * فإن وُجد `.env.db` قرأنا القاعدة، وإلّا فالملفّ — والفحصُ يقول أيَّهما
 * قرأ، فلا يُظنّ الفحصُ الناقص كاملاً.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..')

function fileBank() {
  return [
    ...JSON.parse(readFileSync(resolve(root, 'data/questions-bank-v5.json'), 'utf8')).questions,
    ...JSON.parse(readFileSync(resolve(root, 'data/questions-extra.json'), 'utf8')).questions,
  ].map((q) => ({ id: q.id, category: q.category, level: q.level, question: q.question, answer: q.answer }))
}

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

/**
 * يعيد `{ rows, source }` — و`source` يُطبع للمستعمِل عمداً: فحصٌ قرأ
 * الملفّ وحده ليس كفحصٍ قرأ القاعدة، والفرقُ يجب أن يُرى لا أن يُفترض.
 */
export async function loadBank() {
  const url = dbUrl()
  if (!url) return { rows: fileBank(), source: 'الملفّ (لا .env.db)' }
  try {
    const { default: pg } = await import('pg')
    const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
    await c.connect()
    const r = await c.query(
      'select question_id as id, category, level, question, answer from public.question_overrides',
    )
    await c.end()
    if (r.rows.length === 0) return { rows: fileBank(), source: 'الملفّ (القاعدة فارغة)' }
    return { rows: r.rows, source: `القاعدة الحيّة (${r.rows.length} سؤالاً)` }
  } catch (e) {
    return { rows: fileBank(), source: `الملفّ — تعذّرت القاعدة: ${e.message.slice(0, 60)}` }
  }
}
