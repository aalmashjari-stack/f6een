/* بناء الحزمة: esbuild للجافاسكربت، tsc للأنواع، ونسخ ملفات CSS كما هي.
   المحوّل يكتشف المكوّنات من مخرجات .d.ts، فالأنواع ليست ترفاً. */
import { build } from 'esbuild'
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

mkdirSync('dist', { recursive: true })

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2020',
  logLevel: 'info',
})

// ملف واحد مسطّح للمحوّل: الرموز أولاً ثم المكوّنات — بلا @import،
// لأن إغلاق الاستيراد هو ما تستهلكه التصاميم المبنيّة.
writeFileSync('dist/ds.css', readFileSync('src/tokens.css','utf8') + '\n' + readFileSync('src/components.css','utf8'))

for (const f of readdirSync('src').filter((f) => f.endsWith('.css'))) {
  cpSync(`src/${f}`, `dist/${f}`)
}

execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' })
console.log('✓ dist')
