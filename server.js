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
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

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
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

/* الأصلُ المبصوم اسمُه يحمل بصمةَ محتواه، فتغيُّرُ المحتوى يغيّر الاسم —
   ولا معنى لإعادة التحقّق من ملفٍّ لا يتغيّر أبداً. */
const HASHED = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/

/** `no-cache` لا تعني «لا تخزّن» بل «خزّن وتحقّق قبل الاستعمال». */
const cacheFor = (path) =>
  HASHED.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache'

/** يمنع الخروجَ من `dist` عبر `..` في المسار. */
function safeJoin(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  const full = join(ROOT, clean)
  return full.startsWith(ROOT) ? full : null
}

async function readIfFile(path) {
  try {
    const s = await stat(path)
    return s.isFile() ? await readFile(path) : null
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0]
  const target = safeJoin(urlPath === '/' ? '/index.html' : urlPath)
  if (!target) {
    res.writeHead(400).end('bad path')
    return
  }

  let path = target
  let body = await readIfFile(path)

  /* ارتدادُ الـSPA للمسارات وحدها: الأصلُ المفقود يبقى 404 صريحاً، فلا
     يُخدَع طلبُ ملفٍّ ناقص بصفحةٍ ترجع له بنوع HTML. */
  if (!body && !extname(urlPath)) {
    path = join(ROOT, 'index.html')
    body = await readIfFile(path)
  }

  if (!body) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('غير موجود')
    return
  }

  res.writeHead(200, {
    'Content-Type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': cacheFor(urlPath),
    'X-Content-Type-Options': 'nosniff',
  }).end(body)
}).listen(PORT, () => {
  console.log(`f6een على المنفذ ${PORT}`)
})
