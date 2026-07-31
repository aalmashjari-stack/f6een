import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' يجعل النسخة المبنية تعمل من أي مجلد (file:// أو أي مضيف) — مهم لفتحها على التابلت لاحقاً.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true },
})
