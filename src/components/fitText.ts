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
      /**
       * الهامش: المدّات والتشكيل تفيض عن صندوق السطر بكسرٍ من ارتفاعه — سؤالٌ
       * من سطر واحد بمقاس ٢٥ يعطي scrollHeight ٤٢ في صندوقٍ ارتفاعه ٣٨.
       * قياسُ الأب بدل الفقرة يكفي حين يكون للأب حدٌّ حقيقي (بطاقة السؤال في
       * الجولة الجماعية والديربي)، ويخذل حين يحتضن الأبُ نصَّه: هناك يساوي
       * ارتفاعُه ارتفاعَ السطر فيرث الوهم نفسه — وهذا ما كان يحدث في الحق ما
       * تلحق، فيهبط كلُّ سؤال إلى أرضية الـ٥٥٪ بلا سبب.
       * الفيض الحقيقي سطرٌ كامل على الأقل (١.٥ من المقاس)، وفيض الحروف دونه
       * بكثير — فثلث المقاس يفصل بينهما بأمان.
       */
      const overflows = () => {
        const slack = Math.max(1, size * 0.35)
        return box.scrollWidth > box.clientWidth + slack || box.scrollHeight > box.clientHeight + slack
      }
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
