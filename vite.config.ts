import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// base: './' يجعل النسخة المبنية تعمل من أي مجلد (file:// أو أي مضيف) — مهم لفتحها على التابلت لاحقاً.
export default defineConfig({
  plugins: [react()],
  base: './',
  // صفحتان لا واحدة: اللعبة على `index.html` ولوحة الإدارة على `admin.html`.
  // فصلُهما يعني أنّ شيفرة اللوحة وجداولها لا تُحمَّل على جهاز الحكم في
  // المجلس، وأنّ اللوحة لا تحمل محرّك اللعب ولا شاشاته.
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  // strictPort: المنفذ ثابت لا يزحف. الذاكرة المحلية (الجلسة المحفوظة و used_question_ids)
  // مربوطة بالأصل origin، فلو تغيّر المنفذ ضاع سجلّ الأسئلة المستخدمة وعادت تتكرّر.
  // إن كان ٤١٧٣ مشغولاً يفشل الخادم بوضوح بدل أن ينتقل بصمت لمنفذ آخر.
  server: { host: true, port: 4173, strictPort: true },
})
