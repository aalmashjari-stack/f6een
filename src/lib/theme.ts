/* الوضع الليليّ: سمة data-theme="night" على <html> تفعّل skins/night.css.
   الاختيار محفوظ في الجهاز، ويُطبَّق قبل أوّل رسم من سطرٍ في index.html —
   هنا القراءة والتبديل من الواجهة فقط. */

const KEY = 'f6een.theme'

export function isNight(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'night'
}

export function setNight(on: boolean) {
  if (on) document.documentElement.setAttribute('data-theme', 'night')
  else document.documentElement.removeAttribute('data-theme')
  try {
    localStorage.setItem(KEY, on ? 'night' : 'day')
  } catch {
    /* تصفّح خاصّ: يعمل في الجلسة ولا يُحفظ */
  }
}
