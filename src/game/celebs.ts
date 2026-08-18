import placeholder from '../../assets/celebrities/_placeholder.svg'

/**
 * صور أسئلة «من صاحب الصورة؟». المفتاح في البنك (حقل image) يُحلّ هنا إلى ملفٍ
 * مُجمَّع بواسطة Vite — الاستيراد الساكن شرطٌ ليضمّها المُجمِّع في البناء.
 *
 * لإضافة مشهور: ضع صورته في assets/celebrities/، استوردها هنا بمفتاحٍ، وأضف
 * سؤالاً في data/questions-extra.json حقلُه image يساوي المفتاح نفسه.
 * الصورة المفضّلة عمودية أو مربّعة وواضحة الوجه — تُعرض داخل إطارها بلا قصّ.
 */
const CELEB_IMAGES: Record<string, string> = {
  // placeholder ليس مشهوراً — ريثما تصل الصور الحقيقية، تعرضه البطاقات كلّها.
  // مثال بعد وصول الصور:
  //   import ronaldo from '../../assets/celebrities/ronaldo.jpg'
  //   'ronaldo': ronaldo,
}

/** مصدر صورة المفتاح، أو الصورة المؤقتة إن لم يُسجَّل بعد. */
export function celebSrc(key?: string): string {
  return (key && CELEB_IMAGES[key]) || placeholder
}
