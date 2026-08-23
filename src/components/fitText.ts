import { useLayoutEffect, type RefObject } from 'react'

/**
 * نصٌّ يقيس نفسه: بعد أن يرسمه المتصفّح نُصغّر خطّه درجةً درجة حتى يسع
 * صندوقَه عرضاً وارتفاعاً.
 *
 * كان هذا المنطق حبيس QuestionText.tsx لأن السؤال وحده كان يطول. ثم دخلت
 * فئة «أمثال وألغاز» في ٢٣ أغسطس ٢٠٢٦ بإجابات جملٍ كاملة — أطولها مئة
 * واثنان وعشرون حرفاً بينما وسيط البنك عشرة — ففاضت بطاقة الكشف عن نفسها
 * تسعةً وتسعين بكسلاً وابتُترت الإجابة. فأُخرج المنطق إلى هنا ليخدم الاثنين.
 *
 * الصندوق هو الأب لا الفقرة: حروف العربية بمدّاتها وتشكيلها تتجاوز صندوقَ
 * سطرها فيكبر scrollHeight الفقرة على سطرٍ واحد ويُوهم بفيضٍ لا وجود له.
 * أمّا فيض الأب (بحدّه المقصوص) فلا يقع إلا حين يتجاوز النصُّ سقفَه فعلاً.
 */
export function useFitText(ref: RefObject<HTMLElement | null>, dep: string) {
  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return

    const fit = () => {
      el.style.fontSize = '' // العودة لمقاس CSS ثم الهبوط منه
      const start = parseFloat(getComputedStyle(el).fontSize)
      const overflows = () =>
        box.scrollWidth > box.clientWidth + 1 || box.scrollHeight > box.clientHeight + 1
      let size = start
      const floor = start * 0.55 // أرضيةٌ تحفظ القراءة من آخر المجلس (القسم ١)
      while (size > floor && overflows()) {
        size -= 1
        el.style.fontSize = size + 'px'
      }
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [ref, dep])
}
