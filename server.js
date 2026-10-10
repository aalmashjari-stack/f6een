/**
 * خادمُ النسخة المنشورة.
 *
 * كان النشر يعتمد على خادمٍ يكتشفه Railway بنفسه، فلا نملك رؤوسَه: كان
 * يخدم `.html` **بلا `Cache-Control` إطلاقاً**، فتخمّن المتصفّحاتُ المدّة
 * من `Last-Modified` (heuristic caching) — وسفاري من أشرسها فيه، فبقي
 * يعرض نسخةً قديمة بعد النشر (بلاغ علي، ٢ سبتمبر ٢٠٢٦). وضبطُ الرؤوس في
 * `vite.config.ts` لم يغيّر شيئاً لأنّ `vite preview` ليس هو ما يُشغَّل.
 *
 * فصار الخادمُ ملكَنا: عشرات الأسطر بلا تبعية، وسلوكُه مكتوبٌ لا مُكتشَف.
 */
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const ROOT = resolve(import.meta.dirname, 'dist')
const PORT = Number(process.env.PORT) || 4173

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

/* الأصلُ المبصوم اسمُه يحمل بصمةَ محتواه، فتغيُّرُ المحتوى يغيّر الاسم —
   ولا معنى لإعادة التحقّق من ملفٍّ لا يتغيّر أبداً. */
const HASHED = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/

/** `no-cache` لا تعني «لا تخزّن» بل «خزّن وتحقّق قبل الاستعمال». */
const cacheFor = (path) =>
  HASHED.test(path)
    ? 'public, max-age=31536000, immutable'
    : MEDIA.test(path)
      ? 'public, max-age=86400'
      : 'no-cache'

/* الفيديو (فيديو الشرح، 12MB) يُخزَّن يوماً: بـ`no-cache` كانت كلّ مشاهدةٍ
   تسحبه كاملاً من هنا — الخادم لا يرسل ETag فلا يُعاد التحقّق بلا جسم.
   فمن استبدل الفيديو بدّل اسمه، وإلّا بقي القديم عند Cloudflare يوماً. */
const MEDIA = /\.mp4$/i

/**
 * طلبُ مدى (`Range: bytes=a-b`) — سفاري لا يشغّل فيديو إلّا من خادمٍ يجيب
 * عنه بـ206، ويطلب منه القطعة بعد القطعة. مدىً واحد يكفي (المتصفّحات لا
 * تطلب غيره للوسائط)، وما لا يُفهم يُتجاهَل فيُرسَل الملفّ كاملاً.
 */
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header ?? '')
  if (!m || (m[1] === '' && m[2] === '')) return null
  let start, end
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]))
    end = size - 1
  } else {
    start = Number(m[1])
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1)
  }
  return start <= end && start < size ? { start, end } : 'unsatisfiable'
}

/**
 * يمنع الخروجَ من `dist` عبر `..` في المسار.
 *
 * والمقارنة بالفاصل لا بالبادئة وحدها: `startsWith(ROOT)` كانت تقبل
 * `dist-x/…` جاراً لـ`dist`. و`decodeURIComponent` يرمي على `%` ناقصة
 * (`/%E0%A4`)، فيُمسك هنا ويُردّ المسارُ باطلاً بدل أن يصعد الخطأ رفضاً
 * غير مُمسَك يُسقط العمليّة كلّها — طلبٌ واحد مشوَّه كان يطفئ الخادم.
 */
function safeDecode(urlPath) {
  try {
    return decodeURIComponent(urlPath)
  } catch {
    return urlPath
  }
}

/**
 * رؤوسُ الأمان على كلّ ردّ.
 *
 * - `frame-ancestors 'none'` و`X-Frame-Options`: لا يُضمَّن الموقع في إطار
 *   موقعٍ آخر — اللوحة تعمل بجلسة المدير المحفوظة، فإطارٌ شفّاف فوقها يسرق
 *   نقرةً على «حذف» أو «رصيد» (clickjacking).
 * - `object-src`/`base-uri`/`form-action`: لا إضافات، ولا `<base>` يحرّف
 *   الروابط النسبيّة، ولا نموذج يُرسَل إلى غير الموقع.
 * - HSTS: بعد أوّل زيارة لا يُفتح الموقع بـhttp ولو على شبكةٍ معادية.
 *   بلا includeSubDomains — لا نعرف كلَّ نطاقٍ فرعيّ عند المسجِّل.
 * - لا كاميرا ولا ميكروفون ولا موقع: اللعبة لا تطلبها، فلا يطلبها شيءٌ باسمها.
 *   وقفلُ الشاشة (Wake Lock) يبقى مسموحاً — «إبقاء الشاشة مستيقظة» يحتاجه.
 */
/**
 * `script-src`: لا يجري في الصفحة إلّا سكربتٌ من الموقع نفسه — فنصٌّ محقون
 * (`<script>` أو `<img onerror>` في سؤالٍ أو رسالة) لا يُنفَّذ ولو أفلت من
 * React. والسكربت المضمَّن في `index.html` (سمة ما قبل الإقلاع) يُجاز ببصمته،
 * تُحسب من `dist` عند الإقلاع لا بيد: تعديلُه لا يكسر الصفحة بصمت.
 * الويب لا يحمّل سكربتاً من الخارج (غوغل يُفتح بإعادة توجيه، لا بسكربت)،
 * إلّا مِقياسَ Cloudflare Web Analytics يحقنه Cloudflare نفسه في الصفحة —
 * حُجب أوّلَ نشر (١٠ أكتوبر) فأُجيز باسمه.
 */
async function inlineScriptHashes() {
  const hashes = new Set()
  for (const name of await readdir(ROOT).catch(() => [])) {
    if (!name.endsWith('.html')) continue
    const html = await readFile(join(ROOT, name), 'utf8')
    for (const [, code] of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash('sha256').update(code).digest('base64')}'`)
    }
  }
  return [...hashes].join(' ')
}

const SCRIPT_SRC =
  `script-src 'self' https://static.cloudflareinsights.com ${await inlineScriptHashes()}`.trim()

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': `${SCRIPT_SRC}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`,
  'Strict-Transport-Security': 'max-age=31536000',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function safeJoin(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return null
  }
  const clean = normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const full = join(ROOT, clean)
  return full === ROOT || full.startsWith(ROOT + sep) ? full : null
}

async function readIfFile(path) {
  try {
    const s = await stat(path)
    return s.isFile() ? await readFile(path) : null
  } catch {
    return null
  }
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }).end()
    return
  }
  const urlPath = (req.url ?? '/').split('?')[0]
  /* مقطعٌ يبدأ بنقطة (`/.env`، `/.git/config`) لا يُخدَم ولا يرتدّ إلى
     الصفحة: لا شيء منها في `dist`، وردُّ 200 عليها يُقرأ في الفاحصات
     الأمنيّة تسريباً، ويخفي يوماً ملفّاً نُسخ إلى `dist` بالخطأ. */
  if (/(^|\/)\./.test(urlPath) || /(^|\/)\./.test(safeDecode(urlPath))) {
    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('غير موجود')
    return
  }
  const target = safeJoin(urlPath === '/' ? '/index.html' : urlPath)
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('bad path')
    return
  }

  let path = target
  let body = await readIfFile(path)

  /* المسارُ النظيف قبل الارتداد: `/k` يفتح `k.html` — رابطُ رمز «ولا
     كلمة» يُرسَم على تلفزيونٍ ويُمسح من بعيد، وكلُّ حرفٍ فيه يصغّر وحدات
     الرمز؛ فاللاحقةُ تسقط منه. وينطبق على `/privacy` وأمثاله بلا قائمة. */
  if (!body && !extname(urlPath)) {
    /* يُقرأ المسارُ الذي أجازه `safeJoin` نفسه لا المسارُ الخام: `safeJoin`
       يطبّع `/../x` إلى `/x`، فالفحصُ على نسخةٍ والقراءةُ من أخرى كانا يفتحان
       أيَّ ملفّ ‎.html‎ خارج `dist` (`curl --path-as-is /../secret`). */
    const page = safeJoin(`${urlPath.replace(/\/$/, '')}.html`)
    if (page) body = await readIfFile((path = page))
  }

  /* ارتدادُ الـSPA للمسارات وحدها: الأصلُ المفقود يبقى 404 صريحاً، فلا
     يُخدَع طلبُ ملفٍّ ناقص بصفحةٍ ترجع له بنوع HTML. */
  if (!body && !extname(urlPath)) {
    path = join(ROOT, 'index.html')
    body = await readIfFile(path)
  }

  if (!body) {
    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }).end('غير موجود')
    return
  }

  const headers = {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': cacheFor(urlPath),
    'Accept-Ranges': 'bytes',
  }
  const total = body.length
  const range = parseRange(req.headers.range, total)
  if (range === 'unsatisfiable') {
    res.writeHead(416, { ...headers, 'Content-Range': `bytes */${total}` }).end()
    return
  }
  if (range) body = body.subarray(range.start, range.end + 1)
  res.writeHead(range ? 206 : 200, {
    ...headers,
    'Content-Length': body.length,
    ...(range && { 'Content-Range': `bytes ${range.start}-${range.end}/${total}` }),
  })
  /* HEAD يأخذ الرؤوس وحدها — بلا هذا يُرسَل الجسم كاملاً لمن لم يطلبه. */
  res.end(req.method === 'HEAD' ? undefined : body)
}

/* أيّ خطأٍ غير متوقَّع في معالجة طلبٍ يُردّ 500 على ذلك الطلب وحده —
   لا رفضاً غير مُمسَك يُخرج Node من العمليّة ويقطع كلّ من في المجلس. */
createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('خطأ في الخادم')
  })
}).listen(PORT, () => {
  console.log(`f6een على المنفذ ${PORT}`)
})
