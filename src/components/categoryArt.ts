import geography from '../../assets/categories/geography.png'
import history from '../../assets/categories/history.png'
import religion from '../../assets/categories/religion.png'
import science from '../../assets/categories/science.png'
import medicine from '../../assets/categories/medicine.png'
import biologyAstronomy from '../../assets/categories/biology-astronomy.png'
import literatureArts from '../../assets/categories/literature-arts.png'
import techMisc from '../../assets/categories/tech-misc.png'
import sportsNumbers from '../../assets/categories/sports-numbers.png'

/**
 * تصنيفات تركيبها طوليّ لا يحتمل القصّ — الإطار ٣:٢ يبتر طرفيها، فتُعرض
 * كاملة مصغّرة داخله بدل أن تملأه.
 *
 * والقيمة تدرّجٌ مقروء من عمود الحافة اليسرى للصورة نفسها، يملأ ما يبقى على
 * جانبيها فتبدو ممتدّة إلى حافّتَي البطاقة كأخواتها لا موضوعة على فراغ داكن.
 * لكل صورة تدرّجها: خطّ الأفق فيها ليس حيث هو في غيرها.
 */
export const ART_FIT_WHOLE: Record<string, string> = {
  // أفق الصورة عند ٧٥٪: جدار أزرق رمادي فوقه، وأرض رملية دافئة تحته
  'رياضة وأرقام':
    'linear-gradient(to bottom, #7d8f97 0%, #8d8b94 15%, #728ba3 35%, #8995ac 55%, #8595a9 75%, #f0d695 75.5%, #fac388 78%, #fdc28f 88%, #f79449 100%)',
}

/**
 * صورة كل تصنيف في لوحة التصنيفات — اختارها علي في ٥ أغسطس ٢٠٢٦.
 * المفاتيح هي أسماء التصنيفات في بنك الأسئلة حرفياً.
 */
export const CATEGORY_ART: Record<string, string> = {
  'جغرافيا ومعالم': geography,
  'تاريخ وحضارات': history,
  'دين وسيرة': religion,
  'علوم واختراعات': science,
  'طب وصحة': medicine,
  'أحياء وفلك': biologyAstronomy,
  'أدب وفنون': literatureArts,
  'تقنية ومنوعات': techMisc,
  'رياضة وأرقام': sportsNumbers,
}
