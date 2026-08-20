#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const inputPath = resolve(process.argv[2] || '/Users/alialmashjari/Downloads/Celebrities.rtf')
const outputDir = resolve(process.argv[3] || 'assets/celebrities')
const limit = Number.parseInt(process.env.CELEB_LIMIT || '0', 10)
const start = Number.parseInt(process.env.CELEB_START || '1', 10)
const targetOk = Number.parseInt(process.env.CELEB_TARGET_OK || '0', 10)
const userAgent = 'F6een-celebrity-importer/1.0 (local asset preparation)'
const blockedIndices = new Set([60, 69, 83, 97, 107])
const englishAliases = new Map([
  [61, 'Demis Hassabis'],
  [65, 'Pony Ma'],
  [70, 'Lei Jun'],
  [71, 'Patrick Collison'],
  [102, 'Charlie Munger'],
  [107, 'Françoise Bettencourt Meyers'],
  [108, 'Kristalina Georgieva'],
  [121, 'James Gorman'],
  [123, 'Larry Fink'],
  [125, 'Stephen A. Schwarzman'],
  [136, 'Katalin Karikó'],
  [137, 'Drew Weissman'],
  [148, 'Hanan Balkhy'],
  [167, 'Radwa Ashour'],
])

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

function stripHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanName(rawName) {
  let value = rawName.trim()
  const arabicParenthetical = [...value.matchAll(/\(([^)]*[\u0600-\u06ff][^)]*)\)/g)]
    .map((match) => match[1])
    .find((candidate) => !/إرث|السابق|مؤسس|رئيس|حائز/.test(candidate))

  if (/Olaf Scholz/i.test(value) && arabicParenthetical) value = arabicParenthetical
  value = value
    .replace(/^(سمو\s+)?(الملك|الأمير|الشيخ|السلطان|الدكتور)\s+/u, '')
    .replace(/\s*\((إرث[^)]*|إرثه[^)]*|إرث تاريخي حديث|إرث فيزيائي|إرث سينمائي|إرث معماري)\)\s*/gu, ' ')
    .replace(/^[أإ]\s+(?=[A-Za-z])/u, '')
    .replace(/\s+/g, ' ')
    .trim()
  return value
}

function searchTerms(rawName) {
  const cleaned = cleanName(rawName)
  const withoutParentheses = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  const terms = [cleaned, withoutParentheses]
  for (const match of rawName.matchAll(/\(([^)]+)\)/g)) {
    if (!/إرث|السابق|مستمر/.test(match[1])) terms.push(match[1].trim())
  }
  return [...new Set(terms.filter(Boolean))]
}

async function fetchJson(url, attempts = 8) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': userAgent } })
      if (!response.ok) {
        if (response.status === 429 && attempt < attempts) {
          const retryAfter = Number.parseInt(response.headers.get('retry-after') || '0', 10)
          await sleep(Math.max(Math.min(retryAfter * 1000, 30_000), 4000 * attempt))
          continue
        }
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(350 * attempt)
    }
  }
  throw lastError
}

function apiUrl(host, params) {
  const url = new URL(`https://${host}/w/api.php`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url
}

function chunks(items, size) {
  const result = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

function imageInfoFromPage(page) {
  const info = page?.imageinfo?.[0]
  if (!info || page.missing !== undefined) return null
  if (!/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) return null
  const meta = info.extmetadata || {}
  return {
    fileTitle: page.title,
    downloadUrl: info.thumburl || info.url,
    originalUrl: info.url,
    descriptionUrl: info.descriptionurl,
    license: stripHtml(meta.LicenseShortName?.value || meta.UsageTerms?.value || 'غير محدد'),
    licenseUrl: stripHtml(meta.LicenseUrl?.value || ''),
    creator: stripHtml(meta.Artist?.value || meta.Credit?.value || 'غير محدد'),
  }
}

async function searchWikipedia(term, host = 'ar.wikipedia.org') {
  const payload = await fetchJson(apiUrl(host, {
    action: 'query',
    generator: 'search',
    gsrsearch: term,
    gsrnamespace: '0',
    gsrlimit: '5',
    prop: 'pageimages|pageprops',
    piprop: 'thumbnail|name',
    pithumbsize: '960',
    format: 'json',
    origin: '*',
  }))
  const pages = Object.values(payload.query?.pages || {}).sort((a, b) => a.index - b.index)
  return pages.find((page) => page.pageimage && page.pageprops?.wikibase_item) || null
}

async function exactWikipediaPage(term, host) {
  const payload = await fetchJson(apiUrl(host, {
    action: 'query',
    titles: term,
    redirects: '1',
    prop: 'pageimages|pageprops',
    piprop: 'thumbnail|name',
    pithumbsize: '960',
    format: 'json',
    origin: '*',
  }))
  return Object.values(payload.query?.pages || {}).find(
    (page) => page.pageimage && page.pageprops?.wikibase_item && page.missing === undefined,
  ) || null
}

async function searchWikidata(term) {
  const search = await fetchJson(apiUrl('www.wikidata.org', {
    action: 'wbsearchentities',
    search: term,
    language: 'ar',
    uselang: 'ar',
    type: 'item',
    limit: '6',
    format: 'json',
    origin: '*',
  }))
  const ids = (search.search || []).map((item) => item.id)
  if (!ids.length) return null
  const entities = await fetchJson(apiUrl('www.wikidata.org', {
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'claims|labels|descriptions',
    languages: 'ar|en',
    format: 'json',
    origin: '*',
  }))
  for (const id of ids) {
    const entity = entities.entities?.[id]
    const isHuman = entity?.claims?.P31?.some((claim) => claim.mainsnak?.datavalue?.value?.id === 'Q5')
    const image = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (isHuman && image) {
      return {
        pageimage: image,
        pageprops: { wikibase_item: id },
        title: entity.labels?.ar?.value || entity.labels?.en?.value || term,
      }
    }
  }
  return null
}

async function commonsImageInfo(fileTitle) {
  const title = fileTitle.startsWith('File:') ? fileTitle : `File:${fileTitle}`
  const payload = await fetchJson(apiUrl('commons.wikimedia.org', {
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: '640',
    format: 'json',
    origin: '*',
  }))
  return imageInfoFromPage(Object.values(payload.query?.pages || {})[0])
}

async function bulkPrefetch(people) {
  const foundPages = new Map()
  for (const group of chunks(people, 40)) {
    const terms = group.map((person) => ({ person, term: searchTerms(person.rawName)[1] || searchTerms(person.rawName)[0] }))
    const payload = await fetchJson(apiUrl('ar.wikipedia.org', {
      action: 'query',
      titles: terms.map(({ term }) => term).join('|'),
      redirects: '1',
      prop: 'pageimages|pageprops',
      piprop: 'name',
      format: 'json',
      origin: '*',
    }))
    const aliases = new Map()
    for (const row of payload.query?.normalized || []) aliases.set(row.from, row.to)
    for (const row of payload.query?.redirects || []) aliases.set(row.from, row.to)
    const pagesByTitle = new Map(Object.values(payload.query?.pages || {}).map((page) => [page.title, page]))
    const resolveTitle = (title) => {
      let current = title.replaceAll('_', ' ')
      for (let count = 0; aliases.has(current) && count < 5; count += 1) current = aliases.get(current)
      return current
    }
    for (const { person, term } of terms) {
      const page = pagesByTitle.get(resolveTitle(term))
      if (page?.pageimage && page.pageprops?.wikibase_item) foundPages.set(person.index, page)
    }
    await sleep(1200)
  }

  const files = [...new Set([...foundPages.values()].map((page) => page.pageimage))]
  const infoByFile = new Map()
  for (const group of chunks(files, 40)) {
    const payload = await fetchJson(apiUrl('commons.wikimedia.org', {
      action: 'query',
      titles: group.map((title) => title.startsWith('File:') ? title : `File:${title}`).join('|'),
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '640',
      format: 'json',
      origin: '*',
    }))
    for (const page of Object.values(payload.query?.pages || {})) {
      const info = imageInfoFromPage(page)
      if (info) infoByFile.set(page.title.replace(/^File:/, '').replaceAll('_', ' '), info)
    }
    await sleep(1200)
  }

  const prefetched = new Map()
  for (const person of people) {
    const page = foundPages.get(person.index)
    const image = page && infoByFile.get(page.pageimage.replace(/^File:/, '').replaceAll('_', ' '))
    if (page && image) {
      prefetched.set(person.index, {
        ...image,
        matchedTitle: page.title,
        wikidataId: page.pageprops.wikibase_item,
        searchTerm: searchTerms(person.rawName)[1] || searchTerms(person.rawName)[0],
      })
    }
  }
  return prefetched
}

async function findImage(person, prefetched) {
  if (blockedIndices.has(person.index)) return null
  const englishAlias = englishAliases.get(person.index)
  if (englishAlias) {
    const page = await exactWikipediaPage(englishAlias, 'en.wikipedia.org')
      || await searchWikipedia(englishAlias, 'en.wikipedia.org')
    if (page) {
      const image = await commonsImageInfo(page.pageimage)
      if (image) return { ...image, matchedTitle: page.title, wikidataId: page.pageprops.wikibase_item, searchTerm: englishAlias }
    }
  }
  if (prefetched.has(person.index)) return prefetched.get(person.index)
  for (const term of searchTerms(person.rawName)) {
    const page = await searchWikipedia(term)
    if (page) {
      const image = await commonsImageInfo(page.pageimage)
      if (image) return { ...image, matchedTitle: page.title, wikidataId: page.pageprops.wikibase_item, searchTerm: term }
    }
  }
  for (const term of searchTerms(person.rawName)) {
    const entity = await searchWikidata(term)
    if (entity) {
      const image = await commonsImageInfo(entity.pageimage)
      if (image) return { ...image, matchedTitle: entity.title, wikidataId: entity.pageprops.wikibase_item, searchTerm: term }
    }
  }
  return null
}

async function download(url, path, attempts = 6) {
  const cleanUrl = new URL(url)
  cleanUrl.search = ''
  const proxyUrl = new URL('https://images.weserv.nl/')
  proxyUrl.searchParams.set('url', cleanUrl.toString())
  proxyUrl.searchParams.set('w', '640')
  proxyUrl.searchParams.set('output', 'jpg')
  proxyUrl.searchParams.set('q', '90')
  await execFileAsync('/usr/bin/curl', [
    '-L', '--fail', '--silent', '--show-error',
    '--retry', String(attempts), '--retry-all-errors', '--retry-delay', '3',
    '--user-agent', userAgent,
    '--output', path,
    proxyUrl.toString(),
  ], { maxBuffer: 20 * 1024 * 1024 })
}

async function makeSquareJpeg(inputPath, outputPath, scratchDir) {
  const scaled = join(scratchDir, `${basename(outputPath)}.scaled.jpg`)
  const staged = join(scratchDir, `${basename(outputPath)}.final.jpg`)
  await execFileAsync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '88', '-Z', '480', inputPath, '--out', scaled])
  await execFileAsync('/usr/bin/sips', ['-p', '480', '480', '--padColor', '0F2C42', scaled, '--out', staged])
  await rename(staged, outputPath)
  await rm(scaled, { force: true })
}

function parsePeople(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.includes(' - '))
    .map((line, index) => {
      const [rawName, ...descriptionParts] = line.split(' - ')
      return {
        index: index + 1,
        rawName: rawName.trim(),
        name: cleanName(rawName),
        description: descriptionParts.join(' - ').trim(),
      }
    })
}

async function rtfToText(path) {
  const { stdout } = await execFileAsync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', path], { maxBuffer: 20 * 1024 * 1024 })
  return stdout
}

async function saveManifest(results) {
  await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(results, null, 2)}\n`)
  const header = ['index', 'name', 'status', 'filename', 'matchedTitle', 'wikidataId', 'license', 'licenseUrl', 'descriptionUrl']
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = results.map((row) => header.map((key) => quote(row[key])).join(','))
  await writeFile(join(outputDir, 'manifest.csv'), `\uFEFF${header.join(',')}\n${rows.join('\n')}\n`)
}

await mkdir(outputDir, { recursive: true })
const scratchDir = join(outputDir, '.download-cache')
await mkdir(scratchDir, { recursive: true })

const people = parsePeople(await rtfToText(inputPath))
const selected = people.filter((person) => person.index >= start).slice(0, limit || undefined)
let existing = []
try {
  existing = JSON.parse(await readFile(join(outputDir, 'manifest.json'), 'utf8'))
} catch {}
const byIndex = new Map(existing.map((row) => [row.index, row]))
const pending = selected.filter((person) => byIndex.get(person.index)?.status !== 'ok')
console.log(`مطابقة مجمّعة: ${pending.length} اسماً غير مكتمل`)
const prefetched = await bulkPrefetch(pending)
console.log(`طابقت الدفعة المجمّعة ${prefetched.size} اسماً`)

for (const person of selected) {
  if (targetOk && [...byIndex.values()].filter((row) => row.status === 'ok').length >= targetOk) break
  const previous = byIndex.get(person.index)
  if (previous?.status === 'ok') {
    console.log(`[${person.index}/${people.length}] موجود: ${person.name}`)
    continue
  }
  try {
    console.log(`[${person.index}/${people.length}] بحث: ${person.name}`)
    const image = await findImage(person, prefetched)
    if (!image) {
      byIndex.set(person.index, { ...person, status: 'needs-review', reason: 'لم تُعثر على صورة حرة موثوقة' })
      await saveManifest([...byIndex.values()].sort((a, b) => a.index - b.index))
      continue
    }
    const filename = `celeb-${String(person.index).padStart(3, '0')}-${image.wikidataId.toLowerCase()}.jpg`
    const downloaded = join(scratchDir, `${String(person.index).padStart(3, '0')}.source`)
    await download(image.downloadUrl, downloaded)
    await makeSquareJpeg(downloaded, join(outputDir, filename), scratchDir)
    await rm(downloaded, { force: true })
    byIndex.set(person.index, { ...person, status: 'ok', filename, ...image })
  } catch (error) {
    byIndex.set(person.index, { ...person, status: 'error', reason: error.message })
  }
  await saveManifest([...byIndex.values()].sort((a, b) => a.index - b.index))
  await sleep(1500)
}

const results = [...byIndex.values()].sort((a, b) => a.index - b.index)
await saveManifest(results)
await rm(scratchDir, { recursive: true, force: true })
const ok = results.filter((row) => row.status === 'ok').length
const review = results.filter((row) => row.status !== 'ok').length
console.log(`اكتمل: ${ok} صورة، وتحتاج المراجعة: ${review}`)
