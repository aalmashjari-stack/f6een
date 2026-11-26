import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * الصفحتان القانونيّتان ملفّان ثابتان في `public/` — لا يمرّان بـReact ولا
 * بـtsc، فخطؤهما لا يظهر إلّا في المتصفّح. هذا يمسك اثنين قبل النشر:
 * عنصرٌ نائب لم يُملأ (اسم البائع)، ورابطٌ بين الصفحتين انقطع.
 */
const page = (name: string) => readFileSync(join(import.meta.dirname, '../../public', name), 'utf8')

describe('الصفحات القانونيّة', () => {
  it('لا عنصر نائب باقٍ في الشروط', () => {
    expect(page('terms.html')).not.toMatch(/__[A-Z]+__/)
  })
  it('الشروط والخصوصيّة يشير كلٌّ منهما إلى الآخر', () => {
    expect(page('terms.html')).toContain('href="/privacy"')
    expect(page('privacy.html')).toContain('href="/terms"')
  })
  it('بريد الدعم في الصفحتين', () => {
    expect(page('terms.html')).toContain('support@f6een.com')
    expect(page('privacy.html')).toContain('support@f6een.com')
  })
})
