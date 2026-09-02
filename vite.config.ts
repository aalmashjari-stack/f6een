import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// base: './' يجعل النسخة المبنية تعمل من أي مجلد (file:// أو أي مضيف) — مهم لفتحها على التابلت لاحقاً.

/**
 * رؤوسُ التخزين — الصفحةُ تُراجَع دائماً والأصولُ تُخزَّن دهراً.
 *
 * هذه **للمعاينة المحلّية وحدها** (`npm run preview`). الإنتاج يخدمه
 * `server.js`، وهو مرجعُ الرؤوس الحقيقيّ — وُضعت هنا أوّلاً ظنّاً أنّ
 * Railway يشغّل `vite preview`، فلم يتغيّر شيءٌ في الحيّ حتى قِيس الرأس
 * من الخارج فبان أنّه لا يُشغّله. تبقى لتطابق المعاينةُ الإنتاجَ.
 *
 * و`no-cache` لا تعني «لا تخزّن» بل «خزّن وتحقّق قبل الاستعمال»، فالصفحة
 * صغيرة والتحقّق رخيص.
 *
 * والأصولُ عكسُها تماماً: اسمُها يحمل بصمةَ محتواها، فتغيُّرُ المحتوى
 * يغيّر الاسم — ولا معنى لإعادة التحقّق من ملفٍّ لا يتغيّر أبداً.
 */
function cacheHeaders() {
  const hashed = /\/assets\/.+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/
  const set = (req: { url?: string }, res: { setHeader(k: string, v: string): void }) => {
    const path = (req.url ?? '').split('?')[0]
    res.setHeader(
      'Cache-Control',
      hashed.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache',
    )
  }
  return {
    name: 'f6een-cache-headers',
    configurePreviewServer(server: { middlewares: { use(fn: (req: never, res: never, next: () => void) => void): void } }) {
      server.middlewares.use((req, res, next) => {
        set(req, res)
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cacheHeaders()],
  base: './',
  // صفحتان لا واحدة: اللعبة على `index.html` ولوحة الإدارة على `admin.html`.
  // فصلُهما يعني أنّ شيفرة اللوحة وجداولها لا تُحمَّل على جهاز الحكم في
  // المجلس، وأنّ اللوحة لا تحمل محرّك اللعب ولا شاشاته.
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
  // strictPort: المنفذ ثابت لا يزحف. الذاكرة المحلية (الجلسة المحفوظة و used_question_ids)
  // مربوطة بالأصل origin، فلو تغيّر المنفذ ضاع سجلّ الأسئلة المستخدمة وعادت تتكرّر.
  // إن كان ٤١٧٣ مشغولاً يفشل الخادم بوضوح بدل أن ينتقل بصمت لمنفذ آخر.
  server: { host: true, port: 4173, strictPort: true },
})
