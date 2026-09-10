/**
 * تصنيفاتٌ فوق الفئات — «رياضة» يضمّ «كأس العالم» و«الدوري الإنجليزي»،
 * و«ثقافة عامة» يضمّ «جغرافيا» و«تاريخ» (قرار علي ١٠ سبتمبر ٢٠٢٦).
 *
 * **وهذه طبقةُ عرضٍ لا طبقةُ لعب.** المحرّك كلّه — السحب والذاكرة وحدّ
 * الخليّة وصلاحية الفئة — يقع على (فئة × مستوى) كما كان، ولا يعرف التصنيف
 * ولا يسأل عنه. وظيفتُه واحدة: أن تُقرأ أربعون بطاقةً في شاشة الإعداد بدل
 * أن تُقلَّب.
 *
 * فلذلك يسكن هنا مع `categoryArt` لا في `game/bank.ts`: من فتح المحرّك
 * ليقرأ كيف يُختار سؤال لا ينبغي أن يمرّ على عناوين شاشة.
 *
 * والخريطة تأتي من القاعدة (`extra_categories`) — لا اسمَ تصنيفٍ واحد في
 * الشيفرة، لأنّ الشجرة ستكبر كثيراً ولا يُنتظر بها إصدارُ متجر.
 */
interface GroupOfCat {
  name: string
  /** ترتيب التصنيف في شاشة الإعداد — من `category_groups.sort`. */
  sort: number
}

let byCat: Record<string, GroupOfCat> = {}

export function setCategoryGroups(map: Record<string, GroupOfCat>) {
  byCat = map
}

export function groupOf(cat: string): string | null {
  return byCat[cat]?.name ?? null
}

/** قسمٌ في شاشة الإعداد: عنوانٌ وفئاته. `name === null` = بلا تصنيف. */
export interface CategorySection {
  name: string | null
  cats: string[]
}

/**
 * يقسّم قائمة الفئات إلى أقسامها بترتيب التصنيفات، **وترتيب الفئات داخل
 * القسم كما جاءت** — وهو ترتيب `allCategories`: المشحونة ثمّ المضافة
 * بترتيب إضافتها. الثبات مقصود كما في `Setup`: قائمةٌ تُعاد ترتيباً بين
 * ضغطتين تنقل إصبع الحكم إلى فئةٍ أخرى.
 *
 * وما لا تصنيف له يجتمع في قسمٍ أخيرٍ بلا عنوان — فلا تختفي فئةٌ من
 * الشاشة لأنّ أحداً نسي أن يضعها تحت مظلّة.
 */
export function groupCategories(cats: string[]): CategorySection[] {
  const sections = new Map<string, { sort: number; cats: string[] }>()
  const loose: string[] = []

  for (const cat of cats) {
    const g = byCat[cat]
    if (!g) {
      loose.push(cat)
      continue
    }
    const sec = sections.get(g.name)
    if (sec) sec.cats.push(cat)
    else sections.set(g.name, { sort: g.sort, cats: [cat] })
  }

  const out: CategorySection[] = [...sections.entries()]
    /* الترتيب بالرقم ثمّ بالاسم: رقمان متساويان (تصنيفان أُضيفا قبل أوّل
       إعادة ترتيب) لا يتبادلان مواضعهما بين قراءةٍ وأخرى. */
    .sort((a, b) => a[1].sort - b[1].sort || a[0].localeCompare(b[0], 'ar'))
    .map(([name, sec]) => ({ name, cats: sec.cats }))

  if (loose.length) out.push({ name: null, cats: loose })
  return out
}
