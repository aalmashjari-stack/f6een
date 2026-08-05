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
