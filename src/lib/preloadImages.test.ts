import { describe, expect, it } from 'vitest'
import type { Question } from '../game/types'
import { questionImageSrcs } from './preloadImages'

const q = (over: Partial<Question>): Question =>
  ({ id: 'x', category: 'c', level: 'easy', question: 'س', answer: 'ج', ...over }) as Question

describe('questionImageSrcs', () => {
  it('بلا صور: لا شيء', () => {
    expect(questionImageSrcs(q({}))).toEqual([])
  })
  it('المفتاح المشحون يُحلّ إلى ملفّه، صورة السؤال قبل صورة الإجابة', () => {
    const srcs = questionImageSrcs(q({ image: 'pic-flag-sg', answerImage: 'pic-flag-ge' }))
    expect(srcs).toHaveLength(2)
    expect(srcs[0]).toContain('pic-flag-sg')
    expect(srcs[1]).toContain('pic-flag-ge')
  })
  it('الرابط المرفوع يمرّ كما هو، والمكرّر مرّةً واحدة', () => {
    const url = 'https://example.com/a.jpg'
    expect(questionImageSrcs(q({ image: url, answerImage: url }))).toEqual([url])
  })
  it('المفتاح المجهول يُسقَط لا يُستبدل بالصورة المؤقّتة', () => {
    expect(questionImageSrcs(q({ image: 'no-such-key', answerImage: 'nope' }))).toEqual([])
  })
})
