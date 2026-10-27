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
import letters from '../../assets/categories/letters.jpg'
import beauty from '../../assets/categories/beauty.jpg'
import fashion from '../../assets/categories/fashion.jpg'
import { LETTERS_CATEGORY } from '../game/letters'

/**
 * صورة كل تصنيف في لوحة التصنيفات — اختارها علي في ٥ أغسطس ٢٠٢٦.
 * المفاتيح هي أسماء التصنيفات في بنك الأسئلة حرفياً.
 */
export const CATEGORY_ART: Record<string, string> = {
  'جغرافيا ومعالم': geography,
  'تاريخ وحضارات': history,
  إسلامي: religion,
  'علوم واختراعات': science,
  'طب وصحة': medicine,
  'أحياء وفلك': biologyAstronomy,
  'أدب وفنون': literatureArts,
  'تقنية ومنوعات': techMisc,
  'رياضة عامة': sportsNumbers,
  // الفئات الثلاث المضافة في ٧ أغسطس ٢٠٢٦ — صورها من علي بنسبة ٣:٢ أصلاً فلا تُقصّ
  الكويت: kuwait,
  'سينما ودراما': cinemaDrama,
  'من أنا؟': whoAmI,
  مشاهير: celebrities,
  // أُضيفت في ٢٣ أغسطس ٢٠٢٦ مع فئة الأمثال والألغاز — ٣:٢ أصلاً فلا تُقصّ
  'أمثال وألغاز': proverbsRiddles,
  // «حروف» (١٣ سبتمبر ٢٠٢٦) — بلاطاتٌ بألوان الهويّة، مرسومة لا مصوَّرة؛ ٣:٢
  [LETTERS_CATEGORY]: letters,
  // فئتا «بنات» (١٩ سبتمبر ٢٠٢٦) — ثلاث لوحاتٍ من صور المنتجات نفسها التي
  // تحملها الأسئلة، ٣:٢؛ بطاقةٌ مؤقّتة حتى يرفع علي صورته من اللوحة فتعلو عليها.
  'مكياج وعناية وعطور': beauty,
  'موضة وأزياء وماركات': fashion,
}

/* ===================== الجيل الثاني: شفّافة ٢:٣ فوق «الأشعّة» ===================== */
/**
 * علي ٢٥ أكتوبر ٢٠٢٦: «شيل الخلفية القشدية وبدلها بالخلفية الي اخترناها». الرسوم
 * شفّافةٌ فتظهر تحتها `--art-rays` من blocks.css، وتعلو على الجيل الأوّل لفئاتها.
 * والمرفوع من اللوحة يعلو عليها كما يعلو على أيّ مشحون — فهجرة
 * `20261025130000_category_art_v2` تمسح المرفوع القديم لهذه الفئات وحدها.
 */
const V2 = import.meta.glob('../../assets/categories/v2/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const ART_V2: Record<string, string> = {
  'تاريخ وحضارات': 'history',
  'حضارات قديمة': 'ancient-civilizations',
  'أدب وفنون': 'literature-arts',
  'جغرافيا ومعالم': 'geography',
  'لغة عربية': 'arabic-language',
  'دوري أبطال أوروبا': 'champions-league',
  إسلامي: 'religion',
  'سينما ودراما': 'cinema-drama',
  'السيرة النبوية': 'seerah',
  'قصص الأنبياء': 'prophets-stories',
  'الصحابة والتابعون': 'companions',
  'من أنا؟': 'who-am-i',
  مشاهير: 'celebrities',
  'أغاني وطرب': 'songs',
  أنمي: 'anime',
  'الزمن الجميل': 'golden-era',
  'ألعاب فيديو': 'video-games',
  'القرآن الكريم': 'quran',
  'الفقه والعبادات': 'fiqh',
  'موضة وماركات': 'fashion',
  'مكياج وعطور': 'beauty',
  [LETTERS_CATEGORY]: 'letters',
  أكلات: 'food',
  'أمثال وألغاز': 'proverbs-riddles',
  الكويت: 'kuwait',
  'تقنية ومنوعات': 'tech-misc',
  'شعارات أندية': 'club-logos',
  'The Sopranos': 'sopranos',
  'معلومات عامة': 'general-knowledge',
  'علوم واختراعات': 'science',
  'طب وصحة': 'medicine',
  'أعلام دول': 'flags',
  إيموجي: 'emoji',
  سيارات: 'cars',
  معالم: 'landmarks',
  شعارات: 'logos',
  'ديزني وبيكسار': 'disney',
  لوكيشن: 'location',
  'أحياء وفلك': 'biology-astronomy',
  'كأس العالم': 'world-cup',
  'الدوري الإنجليزي': 'premier-league',
  'الدوري الإسباني': 'la-liga',
  'الدوري الإيطالي': 'serie-a',
  'الدوري الألماني': 'bundesliga',
  'رياضة عامة': 'general-sports',
  'Game of thrones': 'game-of-thrones',
  'Prison break': 'prison-break',
  'Breaking bad': 'breaking-bad',
  Dexter: 'dexter',
  الأسطورة: 'ostora',
}

for (const [cat, slug] of Object.entries(ART_V2)) {
  const url = V2[`../../assets/categories/v2/${slug}.webp`]
  if (url) CATEGORY_ART[cat] = url
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
