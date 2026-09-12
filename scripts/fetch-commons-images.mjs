#!/usr/bin/env node
/**
 * يجلب صوراً من ويكيميديا كومنز برخصٍ حرّة إلى مجلّد أصولٍ مشحون.
 *
 *   node scripts/fetch-commons-images.mjs <targets.json> <assets/pics> [pic]
 *
 * الملفّ قائمةُ أهداف: `{ key, wiki, file?, lang? }` — `key` اسمُ المفتاح
 * بلا بادئة، و`wiki` عنوانُ مقالة ويكيبيديا التي تُؤخذ **صورتُها الرئيسة**
 * (`pageimages`)، أو `file` اسمُ ملفٍّ في كومنز يُؤخذ كما هو. والمقالةُ
 * أدقّ من البحث في كومنز: صورةُ المقالة الرئيسة اختارها محرّرون بشرٌ لتمثّل
 * الموضوع، وبحثُ كومنز يُعيد تفصيلاً معماريّاً أو منظراً عريضاً — أو ما هو
 * أسوأ (بحثُ «تمثال الحرية» أعاد يوماً صورةً فيها البرجان يحترقان).
 *
 * **والرخصةُ شرطٌ لا يُتجاوز**: تُقبل الملكيّةُ العامّة وCC0 وCC BY وCC BY-SA
 * بإصداراتها، ويُردّ ما فيه NC أو ND أو ما لا رخصةَ له — فاللعبة تُباع.
 * وكلُّ صورةٍ مقبولة تُسجَّل في `attribution.json` بمؤلّفها وصفحتها ورخصتها.
 *
 * والصورةُ تُنزَّل بعرض 1100 بكسل ثمّ تُحوَّل بـ`sips` إلى JPEG. **و`sips`
 * لا يضغط**: خيارُ الجودة فيه شبه معطَّل (جودة 60 أعطت 912 كيلوبايت مقابل
 * 1052 عند 82)، فخرجت 109 صور في 30 ميغا. الضغطُ الفعليّ بعده بـPillow:
 * `im.thumbnail((1100,1100)); im.save(p, quality=78, optimize=True)` — نزلت
 * إلى 15 ميغا بلا فرقٍ يُرى على شاشة المجلس. **والانتقاءُ بالعين بعد
 * الجلب**: الرخصةُ لا تقول إن كان المعلمُ يُعرَف من آخر المجلس، ولا إن
 * كانت الصورة تحمل اسمَ الجواب مطبوعاً (بطاقة بيليه 1970 حملت اسمه فقُصّت).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'

const [targetsPath, outDir = 'assets/pics', prefix = 'pic'] = process.argv.slice(2)
if (!targetsPath) {
  console.error('الاستعمال: node scripts/fetch-commons-images.mjs <targets.json> [assets/pics] [pic]')
  process.exit(1)
}

const UA = 'F6een-quiz-images/1.0 (https://f6een.com; a.almashjari@gmail.com)'
const WIDTH = 1100
const OK_LICENCE = /^(public domain|pd|cc0|no restrictions|cc by(-sa)? ?\d(\.\d)?|cc-by(-sa)?-\d(\.\d)?|attribution)/i
const BAD_LICENCE = /(-nc|-nd|\bnc\b|\bnd\b|fair use|non-free|gfdl 1\.2 only)/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', ...params })
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    await sleep(1500 * (attempt + 1))
  }
  throw new Error(`api failed: ${url}`)
}

/** صورةُ المقالة الرئيسة — اسمُ ملفٍّ في كومنز، أو null. */
async function pageImage(title, lang) {
  const j = await api(`${lang}.wikipedia.org`, {
    action: 'query', prop: 'pageimages', piprop: 'name', titles: title, redirects: 1,
  })
  const page = Object.values(j.query?.pages ?? {})[0]
  return page?.pageimage ? `File:${page.pageimage}` : null
}

/** معلومات الملفّ: الرابط المصغَّر والرخصة والمؤلّف. */
async function imageInfo(file) {
  const j = await api('commons.wikimedia.org', {
    action: 'query', prop: 'imageinfo', titles: file,
    iiprop: 'url|extmetadata|size|mime', iiurlwidth: String(WIDTH),
  })
  const page = Object.values(j.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) return null
  const m = info.extmetadata ?? {}
  const strip = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return {
    title: page.title,
    thumb: info.thumburl ?? info.url,
    mime: info.mime,
    width: info.width, height: info.height,
    licence: strip(m.LicenseShortName?.value),
    licenceUrl: strip(m.LicenseUrl?.value),
    artist: strip(m.Artist?.value),
    credit: strip(m.Credit?.value),
    description: strip(m.ImageDescription?.value).slice(0, 200),
  }
}

const targets = JSON.parse(readFileSync(resolve(targetsPath), 'utf8'))
mkdirSync(resolve(outDir), { recursive: true })
const attrPath = resolve(outDir, 'attribution.json')
const attribution = existsSync(attrPath) ? JSON.parse(readFileSync(attrPath, 'utf8')) : []
const byKey = new Map(attribution.map((a) => [a.key, a]))

const report = []
for (const t of targets) {
  const dest = resolve(outDir, `${prefix}-${t.key}.jpg`)
  if (existsSync(dest) && !t.force) { report.push(`= ${t.key}: موجود`); continue }
  try {
    const file = t.file ? (t.file.startsWith('File:') ? t.file : `File:${t.file}`) : await pageImage(t.wiki, t.lang ?? 'en')
    if (!file) { report.push(`✗ ${t.key}: لا صورة رئيسة لمقالة «${t.wiki}»`); continue }
    const info = await imageInfo(file)
    if (!info) { report.push(`✗ ${t.key}: لا معلومات لـ${file}`); continue }
    if (!/^image\/(jpeg|png)$/.test(info.mime)) { report.push(`✗ ${t.key}: نوعٌ غير مقبول ${info.mime} — ${file}`); continue }
    if (BAD_LICENCE.test(info.licence) || !OK_LICENCE.test(info.licence)) {
      report.push(`✗ ${t.key}: رخصةٌ مرفوضة «${info.licence}» — ${file}`); continue
    }
    if (Math.max(info.width, info.height) < 600) { report.push(`✗ ${t.key}: صغيرة ${info.width}×${info.height} — ${file}`); continue }

    const res = await fetch(info.thumb, { headers: { 'User-Agent': UA } })
    if (!res.ok) { report.push(`✗ ${t.key}: فشل التنزيل ${res.status}`); continue }
    const tmp = dest + '.tmp'
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()))
    /* تصغيرٌ وتحويلٌ إلى JPEG بجودة 82، وأكبر بُعدٍ 1100. */
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', String(WIDTH), tmp, '--out', dest], { stdio: 'ignore' })
    unlinkSync(tmp)

    const entry = {
      key: t.key,
      licence: info.licence,
      artist: info.artist || info.credit || 'غير مذكور',
      page: info.title,
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(info.title.replace(/ /g, '_'))}`,
    }
    byKey.set(t.key, entry)
    report.push(`✓ ${t.key}: ${info.licence} — ${info.artist || info.credit} — ${info.title}`)
    await sleep(400)
  } catch (e) {
    report.push(`✗ ${t.key}: ${e.message}`)
  }
}

const merged = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key))
writeFileSync(attrPath, JSON.stringify(merged, null, 2) + '\n')
console.log(report.join('\n'))
console.log(`\n${merged.length} صورة مسجَّلة في ${attrPath}`)
