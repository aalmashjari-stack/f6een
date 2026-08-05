// الصور الجديدة تصل بنسبة ٣:٢ — نسبة الإطار نفسها — فتملأه بلا قصّ ولا حشو.
// وتُشحن JPEG: رسمٌ بلا شفافية، فحجمها رُبع PNG عند نفس العرض (١٠٢٤px، وهو
// ثلاثة أضعاف أكبر عرض تبلغه البطاقة). ما بقي PNG لم يُستبدل أصله بعد.
import geography from '../../assets/categories/geography.jpg'
import history from '../../assets/categories/history.png'
import religion from '../../assets/categories/religion.png'
import science from '../../assets/categories/science.png'
import medicine from '../../assets/categories/medicine.png'
import biologyAstronomy from '../../assets/categories/biology-astronomy.png'
import literatureArts from '../../assets/categories/literature-arts.png'
import techMisc from '../../assets/categories/tech-misc.png'
import sportsNumbers from '../../assets/categories/sports-numbers.jpg'

/**
 * تصنيفات تركيبها لا يحتمل القصّ — الإطار ٣:٢ يبتر ما لا يُستغنى عنه فيها،
 * فتُعرض كاملة مصغّرة داخله، ويملأ ما حولها نسخةٌ مكبّرة مضبّبة منها.
 *
 * جُرّب قبله تدرّجٌ يدوي مقروء من ألوان حافة كل صورة، وفشل: حواف هذه الصور
 * تتغيّر أفقياً لا رأسياً فقط (جدارٌ في طرف وسماء في الآخر)، فبدا التدرّج
 * شرائط طينية لا امتداداً للصورة. والنسخة المضبّبة تناسب كل موضع من نفسها.
 */
export const ART_FIT_WHOLE = new Set([
  'تاريخ وحضارات', // لوحتان فوق بعض، والقصّ يبتر إحداهما
])

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
