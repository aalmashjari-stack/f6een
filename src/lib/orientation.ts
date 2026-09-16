import { registerPlugin } from '@capacitor/core'
import { isNativeApp } from './platform'

/**
 * اتجاه الشاشة في التطبيق المثبَّت — الإضافة الأصليّة في
 * `ios/App/App/OrientationPlugin.swift`.
 *
 * ما قبل «ابدأ اللعبة» (التعريف، الدخول، الإعداد) يُمسك فيه الجوال باليد
 * وفيه كتابة، فالاتجاه للجهاز. ومن البدء الشاشةُ عريضة (SPEC §١) فيُقفل
 * الأفقيّ — والتطبيق يدير الجهاز بنفسه، لا بوّابة «أدر جهازك».
 *
 * في المتصفّح لا شيء: الموقع له بوّابته ولا يُمسّ (قرار علي ٢٤ أغسطس ٢٠٢٦).
 */
type Mode = 'landscape' | 'portrait' | 'any'

interface OrientationPlugin {
  lock(options: { mode: Mode }): Promise<void>
}

const plugin = registerPlugin<OrientationPlugin>('F6eenOrientation')

export function lockOrientation(mode: Mode): void {
  if (!isNativeApp) return
  /* الفشل لا يوقف اللعبة: أسوأ ما فيه أن يبقى الجهاز على اتجاهه. */
  plugin.lock({ mode }).catch(() => {})
}
