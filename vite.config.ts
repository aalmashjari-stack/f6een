import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' يجعل النسخة المبنية تعمل من أي مجلد (file:// أو أي مضيف) — مهم لفتحها على التابلت لاحقاً.
export default defineConfig({
  plugins: [react()],
  base: './',
  // strictPort: المنفذ ثابت لا يزحف. الذاكرة المحلية (الجلسة المحفوظة و used_question_ids)
  // مربوطة بالأصل origin، فلو تغيّر المنفذ ضاع سجلّ الأسئلة المستخدمة وعادت تتكرّر.
  // إن كان ٤١٧٣ مشغولاً يفشل الخادم بوضوح بدل أن ينتقل بصمت لمنفذ آخر.
  server: { host: true, port: 4173, strictPort: true },
})
