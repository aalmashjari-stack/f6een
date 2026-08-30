// الصور المستبدَلة تصل بنسبة ٣:٢ — نسبة الإطار نفسها — فتملأه بلا قصّ.
// وتُشحن JPEG: رسمٌ بلا شفافية، فحجمها رُبع PNG عند نفس العرض (١٠٢٤px، وهو
// ثلاثة أضعاف أكبر عرض تبلغه البطاقة). وما بقي PNG مربّعٌ يُقصّ، وقد ارتضاه
// علي في ٦ أغسطس ٢٠٢٦ — القصّ لا يبتر منه ما لا يُستغنى عنه.
import geography from '../../assets/categories/geography.jpg'
import history from '../../assets/categories/history.jpg'
import religion from '../../assets/categories/religion.png'
import science from '../../assets/categories/science.png'
import medicine from '../../assets/categories/medicine.png'
import biologyAstronomy from '../../assets/categories/biology-astronomy.png'
import literatureArts from '../../assets/categories/literature-arts.png'
import techMisc from '../../assets/categories/tech-misc.png'
import sportsNumbers from '../../assets/categories/sports-numbers.jpg'
import kuwait from '../../assets/categories/kuwait.jpg'
import cinemaDrama from '../../assets/categories/cinema-drama.jpg'
import whoAmI from '../../assets/categories/who-am-i.jpg'
import celebrities from '../../assets/categories/celebrities.jpg'
import proverbsRiddles from '../../assets/categories/proverbs-riddles.jpg'

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
  // الفئات الثلاث المضافة في ٧ أغسطس ٢٠٢٦ — صورها من علي بنسبة ٣:٢ أصلاً فلا تُقصّ
  'الكويت': kuwait,
  'سينما ودراما': cinemaDrama,
  'من أنا؟': whoAmI,
  'مشاهير': celebrities,
  // أُضيفت في ٢٣ أغسطس ٢٠٢٦ مع فئة الأمثال والألغاز — ٣:٢ أصلاً فلا تُقصّ
  'أمثال وألغاز': proverbsRiddles,
}

/* ===================== الصور المرفوعة من اللوحة ===================== */
/**
 * صورة فئة رفعها المدير — تعلو على المشحونة إن وُجدت، وتملأ فراغ الفئة
 * الجديدة التي لا صورة لها في الحزمة.
 *
 * **المشحون هو الافتراض والمرفوع هو الاستثناء المعكوس هنا عمداً:** من بدّل
 * صورةً من اللوحة يريد الجديدة لا القديمة، وإلّا لم يكن للتبديل معنى.
 * وحذف الرابط يعيد المشحونة كما كانت.
 */
let uploaded: Record<string, string> = {}

export function setCategoryArt(map: Record<string, string>) {
  uploaded = map
}

export function categoryArt(cat: string): string | undefined {
  return uploaded[cat] ?? CATEGORY_ART[cat]
}
