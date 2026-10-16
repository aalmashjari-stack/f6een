import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { questionKey, sqlNormQuestion } from './questionKey'

describe('questionKey', () => {
  it('التشكيل والهمزات والترقيم والمسافات لا تفرّق سؤالين', () => {
    expect(questionKey('ما هي عاصمةُ مِصر؟')).toBe(questionKey('ما هي عاصمه مصر'))
    expect(questionKey('أين تقع إسطنبول؟')).toBe(questionKey('اين تقع اسطنبول'))
    expect(questionKey('ما «الكتاب»… الأوّل؟')).toBe(questionKey('ما الكتاب الاول'))
  })

  it('الأرقام العربيّة واللاتينيّة رقمٌ واحد', () => {
    expect(questionKey('ما أول مدرسة نظامية أُنشئت في الكويت سنة ١٩١١؟')).toBe(
      questionKey('ما أول مدرسة نظامية أُنشئت في الكويت سنة 1911؟'),
    )
  })

  it('الحروف اللاتينيّة بلا فرق بين كبيرها وصغيرها', () => {
    expect(questionKey('من بطل Breaking Bad؟')).toBe(questionKey('من بطل breaking bad'))
  })

  /* المعاينة كانت تحذفها، فتردّ أسئلة «إيموجي» كلّها إلّا واحداً في كلّ ذيل. */
  it('الإيموجي يفرّق سؤالين', () => {
    expect(questionKey('🦁 👑 — ما الفيلم؟')).not.toBe(questionKey('🚢 🧊 💔 — ما الفيلم؟'))
    expect(questionKey('❤️ — ما الأغنية؟')).toBe(questionKey('❤ — ما الأغنية؟'))
  })

  it('الحرف الذي يحمل معنىً يبقى', () => {
    expect(questionKey('ما عاصمة النمسا؟')).not.toBe(questionKey('ما عاصمة السويد؟'))
    expect(questionKey('كم 15 + 5؟')).toBe('كم155')
  })
})

/**
 * القاعدة والمعاينة تقيسان بالتعريف نفسه: آخرُ تعريفٍ لـ`norm_question` في
 * الهجرات — وأحدثُها وحده هو الحقيقة — يحمل ما يولّده `sqlNormQuestion` حرفاً
 * بحرف. فتغييرُ الجدول بلا هجرة يُسقط الاختبار.
 */
describe('norm_question في القاعدة', () => {
  it('آخرُ تعريفٍ لها يطابق questionKey', () => {
    const dir = resolve(__dirname, '../../supabase/migrations')
    let latest = ''
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()) {
      const sql = readFileSync(resolve(dir, file), 'utf8')
      for (const part of sql.split(/(?=create\s+(?:or\s+replace\s+)?function\s+public\.)/i).slice(1))
        if (/^create\s+(?:or\s+replace\s+)?function\s+public\.norm_question\b/i.test(part)) latest = part
    }
    expect(latest).toContain(sqlNormQuestion())
  })
})
