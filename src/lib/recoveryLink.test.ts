import { describe, expect, it } from 'vitest'
import { codeExchangeWorked, readRecoveryLink } from './recoveryLink'

/**
 * الحالة التي بُنيت لأجلها: رابطُ استعادةٍ فُتح في متصفّح غير الذي طلبه، فلا
 * `code_verifier` في ذاكرته. كانت الشاشة ترجع إلى الصفحة الرئيسة بلا رسالة،
 * فيقرؤها اللاعب «الرابط لا يعمل» ولا يعرف ما يصنع (علي، ٨ سبتمبر ٢٠٢٦).
 */
describe('readRecoveryLink', () => {
  it('لا رابط بلا معامل الاستعادة — ولو حمل العنوان رمزاً', () => {
    expect(readRecoveryLink('').kind).toBe('none')
    expect(readRecoveryLink('?code=abc').kind).toBe('none')
  })

  it('يفضّل token_hash — وهو الذي يعمل في أيّ متصفّح', () => {
    const l = readRecoveryLink('?recovery=1&token_hash=H1&type=recovery')
    expect(l.kind).toBe('token')
    expect(l.kind === 'token' && l.tokenHash).toBe('H1')
  })

  it('الشكل القديم بـ code يبقى مقروءاً — في البريد رسائلُ سابقة', () => {
    expect(readRecoveryLink('?recovery=1&code=abc').kind).toBe('session')
    expect(readRecoveryLink('?recovery=1').kind).toBe('session')
  })

  /* `token_hash=` فارغاً ليس رمزاً: يُعامَل معاملة الشكل القديم لا يُرسل
     إلى الخادم ليُردّ بخطأ. */
  it('token_hash فارغ ليس رمزاً', () => {
    expect(readRecoveryLink('?recovery=1&token_hash=').kind).toBe('session')
  })
})

describe('codeExchangeWorked', () => {
  it('نجاحٌ حين تُوجد جلسة ومُحي الرمز من العنوان', () => {
    expect(codeExchangeWorked('?recovery=1', true)).toBe(true)
  })

  it('فشلٌ بلا جلسة', () => {
    expect(codeExchangeWorked('?recovery=1', false)).toBe(false)
  })

  /* الحالة الخبيثة: على الجهاز جلسةٌ قديمة سليمة ورابطُ البريد ميّت. فلولا
     قراءةُ بقاء `code` لقيل «جاهز» ثمّ سقط الحفظ بلا سبب مفهوم. */
  it('فشلٌ حين تبقى code في العنوان ولو وُجدت جلسة قديمة', () => {
    expect(codeExchangeWorked('?recovery=1&code=abc', true)).toBe(false)
  })
})
