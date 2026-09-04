import { describe, expect, it } from 'vitest'
import { drawByLevel, drawOne, drawStage3Queue } from './draw'
import { ALL_QUESTIONS, familiesOf, familyOf, poolByCatLevel, poolByLevels, poolShippedByLevels, setBlockedQuestionIds } from './bank'
import type { Level } from './types'

const CAT = 'جغرافيا ومعالم'
const LEVEL: Level = 'متوسط'

const famOf = (id: string, pool = poolByCatLevel(CAT, LEVEL)) => familyOf(pool.find((q) => q.id === id)!)

describe('drawOne — النقاء', () => {
  /**
   * حارس انحدار: كان drawOne يضيف المعرّف إلى used في مكانها، فيحرق
   * StrictMode سؤالين مقابل سؤال معروض واحد. الحرق مسؤولية المحرك وحده.
   */
  it('لا يمسّ مجموعة المحروق', () => {
    const used = new Set<string>()
    drawOne(CAT, LEVEL, used)
    expect(used.size).toBe(0)
  })

  it('لا يمسّ المحجوز ولا القوالب المطروقة', () => {
    const reserved = new Set(['X'])
    const families = new Set(['Y'])
    drawOne(CAT, LEVEL, new Set(), reserved, families)
    expect([...reserved]).toEqual(['X'])
    expect([...families]).toEqual(['Y'])
  })
})

describe('drawOne — الاستبعاد', () => {
  it('لا يسحب سؤالاً محروقاً ما دام في الخلية غيره', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const used = new Set(cell.slice(1).map((q) => q.id)) // كلّها إلا واحداً
    expect(drawOne(CAT, LEVEL, used).id).toBe(cell[0].id)
  })

  it('لا يسحب ورقة محجوزة لطابور الحق ما تلحق ما دام في الخلية غيرها', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const reserved = new Set([cell[0].id])
    for (let i = 0; i < 40; i++) expect(reserved.has(drawOne(CAT, LEVEL, new Set(), reserved).id)).toBe(false)
  })

  it('لا يسحب من موضوع مصرَّح به طُرق في الجلسة ما دام في الخلية غيره', () => {
    /* الموضوع المصرَّح به يحرسه السحب كما يحرس القالب — وإلّا عاد السؤالان
       اللذان جوابهما واحد إلى الاجتماع في جلسة. */
    const q = ALL_QUESTIONS.filter((x) => x.family).find(
      (x) => poolByCatLevel(x.category, x.level).length > 1,
    )
    if (!q) return
    const spent = new Set(familiesOf(q))
    for (let i = 0; i < 40; i++) {
      const picked = drawOne(q.category, q.level, new Set(), new Set(), spent)
      if (picked.id === q.id) continue // تنازلٌ حين تضيق الخليّة — مسموح
      expect(familiesOf(picked).some((f) => spent.has(f)), picked.id).toBe(false)
    }
  })

  it('لا يسحب من قالب طُرق في الجلسة ما دام في الخلية غيره', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const withFam = cell.find((q) => familyOf(q) !== null)
    if (!withFam) return // خلية بلا قوالب — لا شيء يُختبر
    const spent = new Set([familyOf(withFam)!])
    for (let i = 0; i < 40; i++) {
      const picked = drawOne(CAT, LEVEL, new Set(), new Set(), spent)
      expect(famOf(picked.id)).not.toBe(familyOf(withFam))
    }
  })
})

describe('drawOne — سلّم التنازل عند ضيق المخزون', () => {
  /**
   * الترتيب مقصود: سؤال من قالب مطروق يُحسّ متشابهاً، أما كسر الحجز فيعيد
   * السؤال نفسه حرفياً في الجلسة. فالقالب يسقط أولاً، ثم الحجز، ثم عدم التكرار.
   */
  it('يتنازل عن القالب قبل أن يتنازل عن الحجز', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const famQ = cell.find((q) => familyOf(q) !== null)!
    // كل الخلية محجوزة إلا سؤالاً واحداً، وقالبه مطروق: يجب أن يُختار هو لا المحجوز
    const reserved = new Set(cell.filter((q) => q.id !== famQ.id).map((q) => q.id))
    const spent = new Set([familyOf(famQ)!])
    expect(drawOne(CAT, LEVEL, new Set(), reserved, spent).id).toBe(famQ.id)
  })

  it('يتنازل عن الحجز قبل أن يعيد سؤالاً محروقاً', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const spare = cell[0]
    const used = new Set(cell.filter((q) => q.id !== spare.id).map((q) => q.id))
    const reserved = new Set([spare.id]) // الوحيد غير المحروق محجوز
    expect(drawOne(CAT, LEVEL, used, reserved).id).toBe(spare.id)
  })

  it('يعيد سؤالاً حتى لو احترقت الخلية كلها — لا يسقط ولا يعيد undefined', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const used = new Set(cell.map((q) => q.id))
    const picked = drawOne(CAT, LEVEL, used)
    expect(picked).toBeDefined()
    expect(cell.map((q) => q.id)).toContain(picked.id)
  })
})

/**
 * الخليّة تفرغ في اللعب فعلاً: بلاغٌ يصل بعد بدء الجلسة يحجز آخر سؤالٍ في
 * خليّةٍ ضيّقة (فئات الصور فيها سؤالٌ واحد في المستوى). كان `drawOne` يعود
 * بلا سؤال فيسقط المحرّك على `q.id` أمام المجلس — والآن يسقط إلى المستوى
 * نفسه من فئةٍ أخرى، ثمّ إلى البنك كلّه.
 */
describe('drawOne — الخليّة الفارغة لا تُسقط المحرّك', () => {
  it('فئة لا وجود لها تسقط إلى المستوى نفسه من فئة أخرى', () => {
    const q = drawOne('فئة لا وجود لها', 'صعب', new Set())
    expect(q).toBeDefined()
    expect(q.level).toBe('صعب')
  })

  it('خليّة حُجزت كلّها بالبلاغات تسقط إلى المستوى بلا محجوز', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const blocked = new Set(cell.map((q) => q.id))
    setBlockedQuestionIds(blocked)
    try {
      for (let i = 0; i < 20; i++) {
        const q = drawOne(CAT, LEVEL, new Set())
        expect(q.level).toBe(LEVEL)
        expect(blocked.has(q.id)).toBe(false)
      }
    } finally {
      setBlockedQuestionIds([])
    }
  })

  it('drawByLevel يسقط إلى البنك كلّه إن حُجز المستوى المشحون كلّه', () => {
    const level = poolShippedByLevels(['صعب'])
    setBlockedQuestionIds(level.map((q) => q.id))
    try {
      const q = drawByLevel('صعب', new Set())
      expect(q).toBeDefined()
    } finally {
      setBlockedQuestionIds([])
    }
  })
})

describe('drawStage3Queue', () => {
  it('يعطي العدد المطلوب بلا تكرار سؤال', () => {
    const q = drawStage3Queue(40, new Set())
    expect(q).toHaveLength(40)
    expect(new Set(q.map((x) => x.id)).size).toBe(40)
  })

  it('يتجنّب القوالب المطروقة في الجلسة حين يُمدَّد في منتصفها', () => {
    const first = drawStage3Queue(40, new Set())
    const fams = new Set(first.map(familyOf).filter((f): f is string => f !== null))
    if (fams.size === 0) return
    for (let i = 0; i < 20; i++) {
      const more = drawStage3Queue(10, new Set(first.map((q) => q.id)), fams)
      for (const q of more) {
        const f = familyOf(q)
        if (f !== null) expect(fams.has(f), q.id).toBe(false)
      }
    }
  })

  it('بلا قالبين من عائلة واحدة — أسئلته تُعرض متتابعة في ثلاثين ثانية', () => {
    for (let i = 0; i < 50; i++) {
      const fams = drawStage3Queue(40, new Set()).map(familyOf).filter((f): f is string => f !== null)
      expect(new Set(fams).size).toBe(fams.length)
    }
  })

  it('يستبعد المحروق', () => {
    const pool = poolByLevels(['سهل', 'متوسط'])
    const used = new Set(pool.slice(0, 300).map((q) => q.id))
    for (const q of drawStage3Queue(40, used)) expect(used.has(q.id)).toBe(false)
  })

  it('من مستويَي سهل ومتوسط فقط — لا صعب في سباق الثلاثين ثانية', () => {
    for (const q of drawStage3Queue(40, new Set())) expect(q.level).not.toBe('صعب')
  })
})

/**
 * السؤال المبلَّغ عنه محجوز حتى يراجعه المدير — ولا يعود من باب التنازل.
 *
 * الترشيح في `poolByCatLevel`/`poolByLevels` لا في `drawOne`، لأنّ السحب
 * يتنازل عند ضيق المخزون حتى يصل إلى الخلية كاملة (`cell`). الاختبار يحجز
 * الخلية كلّها إلّا سؤالاً واحداً ويسحب مئة مرّة: بترشيحٍ في السحب وحده
 * كانت المحجوزة تعود هنا.
 */
describe('الأسئلة المحجوزة لا تُسحب', () => {
  it('لا يسحب محجوزاً ولو نفد ما سواه', () => {
    const cell = poolByCatLevel(CAT, LEVEL)
    const keep = cell[0].id
    setBlockedQuestionIds(cell.slice(1).map((q) => q.id))
    try {
      for (let i = 0; i < 100; i++) {
        expect(drawOne(CAT, LEVEL, new Set(cell.map((q) => q.id))).id).toBe(keep)
      }
    } finally {
      setBlockedQuestionIds([])
    }
  })

  it('طابور الحق ما تلحق لا يحمل محجوزاً', () => {
    const pool = poolByLevels(['سهل', 'متوسط'])
    const blocked = new Set(pool.slice(0, 40).map((q) => q.id))
    setBlockedQuestionIds(blocked)
    try {
      const queue = drawStage3Queue(40, new Set())
      expect(queue.some((q) => blocked.has(q.id))).toBe(false)
    } finally {
      setBlockedQuestionIds([])
    }
  })
})
