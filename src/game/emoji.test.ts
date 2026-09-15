import { describe, expect, it } from 'vitest'
import { splitEmojiQuestion } from './emoji'

describe('splitEmojiQuestion', () => {
  it('يفصل الرموز عن الذيل عند الشرطة الطويلة', () => {
    expect(splitEmojiQuestion('🦁 👑 — ما الفيلم؟')).toEqual({ lead: '🦁 👑', tail: 'ما الفيلم؟' })
  })
  it('الأرقام المفتاحيّة رموزٌ لا حروف', () => {
    expect(splitEmojiQuestion('📖 🌙 1️⃣0️⃣0️⃣1️⃣ — ما الكتاب؟').lead).toBe('📖 🌙 1️⃣0️⃣0️⃣1️⃣')
  })
  it('صدرٌ فيه حروف أو سؤالٌ بلا فاصل يعود كما هو', () => {
    expect(splitEmojiQuestion('ما الفيلم — 🦁؟')).toEqual({ lead: '', tail: 'ما الفيلم — 🦁؟' })
    expect(splitEmojiQuestion('🦁 👑 ما الفيلم؟')).toEqual({ lead: '', tail: '🦁 👑 ما الفيلم؟' })
  })
})
