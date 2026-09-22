import { beforeEach, describe, expect, it } from 'vitest'
import {
  groupCategories,
  groupOf,
  setCategoryGroups,
  setCategoryOrder,
} from '../components/categoryGroups'

/**
 * تقسيم الفئات على تصنيفاتها — طبقةُ عرضٍ في شاشة الإعداد لا طبقةُ لعب.
 *
 * وهي تُختبر لأنّ عطبَها صامت: فئةٌ تسقط من الشاشة لا تُرى إلّا حين يبحث
 * عنها الحكم أمام المجلس، والشجرةُ ستكبر إلى عشرات الفئات فلا تُحصى بالعين.
 */
describe('تقسيم الفئات على التصنيفات', () => {
  beforeEach(() => {
    setCategoryGroups({})
    setCategoryOrder({})
  })

  it('بلا تصنيفات: قسمٌ واحد بكل الفئات — الشاشة كما كانت', () => {
    const out = groupCategories(['أ', 'ب', 'ج'])
    expect(out).toEqual([{ name: null, cats: ['أ', 'ب', 'ج'] }])
  })

  it('التصنيفات بترتيب `sort`، وما لا تصنيف له في آخر قسم', () => {
    setCategoryGroups({
      'كأس العالم': { name: 'رياضة', sort: 1 },
      جغرافيا: { name: 'ثقافة عامة', sort: 0 },
      'الدوري الإنجليزي': { name: 'رياضة', sort: 1 },
      تاريخ: { name: 'ثقافة عامة', sort: 0 },
    })
    const out = groupCategories(['جغرافيا', 'كأس العالم', 'الكويت', 'تاريخ', 'الدوري الإنجليزي'])
    expect(out).toEqual([
      { name: 'ثقافة عامة', cats: ['جغرافيا', 'تاريخ'] },
      { name: 'رياضة', cats: ['كأس العالم', 'الدوري الإنجليزي'] },
      { name: null, cats: ['الكويت'] },
    ])
  })

  /* الثبات شرطُ تشغيل لا تفضيل: قائمةٌ تُعاد ترتيباً بين ضغطتين تنقل إصبع
     الحكم إلى فئةٍ أخرى — انظر تعليل `Setup`. */
  it('ترتيب الفئات داخل القسم هو ترتيب القائمة الواردة لا الأبجديّة', () => {
    setCategoryGroups({
      ياء: { name: 'س', sort: 0 },
      ألف: { name: 'س', sort: 0 },
    })
    expect(groupCategories(['ياء', 'ألف'])[0].cats).toEqual(['ياء', 'ألف'])
  })

  it('تصنيفان برقمٍ واحد يُرتَّبان بالاسم — لا يتبادلان موضعيهما بين قراءتين', () => {
    setCategoryGroups({
      ب: { name: 'باء', sort: 0 },
      ت: { name: 'تاء', sort: 0 },
    })
    const first = groupCategories(['ت', 'ب']).map((s) => s.name)
    const again = groupCategories(['ب', 'ت']).map((s) => s.name)
    expect(first).toEqual(again)
  })

  it('فئةٌ لا يعرفها الجدول تبقى في الشاشة — لا تختفي لأنّها بلا مظلّة', () => {
    setCategoryGroups({ جغرافيا: { name: 'ثقافة عامة', sort: 0 } })
    const out = groupCategories(['جغرافيا', 'فئة جديدة'])
    expect(out[out.length - 1]).toEqual({ name: null, cats: ['فئة جديدة'] })
    expect(out.flatMap((s) => s.cats)).toHaveLength(2)
  })

  /* ترتيب المدير من اللوحة (٢٣ سبتمبر ٢٠٢٦): المرتّبة برقمها، وغير المرتّبة
     بعدها بموضعها في القائمة الواردة — فلا تختفي فئةٌ أُضيفت بعد الترتيب. */
  it('الفئات داخل التصنيف بترتيب المدير، وغير المرتّبة بعدها بترتيبها', () => {
    setCategoryGroups({
      أ: { name: 'س', sort: 0 },
      ب: { name: 'س', sort: 0 },
      ج: { name: 'س', sort: 0 },
      د: { name: 'س', sort: 0 },
    })
    setCategoryOrder({ ج: 1, أ: 2 })
    expect(groupCategories(['أ', 'ب', 'ج', 'د'])[0].cats).toEqual(['ج', 'أ', 'ب', 'د'])
  })

  it('وقسم «بلا تصنيف» يتبع الترتيب كذلك', () => {
    setCategoryOrder({ ز: 1 })
    expect(groupCategories(['و', 'ز'])).toEqual([{ name: null, cats: ['ز', 'و'] }])
  })

  it('groupOf يقول مظلّة الفئة أو null', () => {
    setCategoryGroups({ جغرافيا: { name: 'ثقافة عامة', sort: 0 } })
    expect(groupOf('جغرافيا')).toBe('ثقافة عامة')
    expect(groupOf('الكويت')).toBeNull()
  })
})
