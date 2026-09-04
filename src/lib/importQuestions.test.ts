import { describe, expect, it } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { buildPlan, parseCsv, parseXlsx } from './importQuestions'

const CTX = {
  categories: ['الكويت', 'أدب وفنون'],
  existing: [
    { id: 'M001', question: 'ما هي عاصمة مصر؟' },
    { id: 'ADM0001', question: 'كم برجاً في مدينة الكويت؟' },
  ],
}

const HEAD = ['التصنيف', 'المستوى', 'السؤال', 'الإجابة', 'الموضوع', 'المعرّف']

/** زِمُّ إكسل من ورقةٍ ونصوصٍ مشتركة مكتوبتين يداً. */
function xlsxRaw(sheet: string, shared: string): ArrayBuffer {
  const zip = zipSync({
    'xl/sharedStrings.xml': strToU8(shared),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
  })
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer
}

/**
 * ملفّ إكسل حقيقيّ مصغّر: زِمٌّ فيه ورقة وسلسلة نصوص مشتركة.
 *
 * الخليّة الفارغة تُكتب مغلقةً على نفسها `<c r="B2" s="1"/>` — كما يكتبها
 * إكسل لخليّةٍ فارغة لها تنسيق، وهو ما يقع في كلّ ورقةٍ منسّقة.
 */
function xlsx(rows: string[][]): ArrayBuffer {
  const strings = [...new Set(rows.flat().filter((c) => c !== ''))]
  const shared =
    `<?xml version="1.0"?><sst>` +
    strings.map((s) => `<si><t>${s.replace(/&/g, '&amp;')}</t></si>`).join('') +
    `</sst>`
  const sheet =
    `<?xml version="1.0"?><worksheet><sheetData>` +
    rows
      .map(
        (r, i) =>
          `<row r="${i + 1}">` +
          r
            .map((c, j) => {
              const ref = `${String.fromCharCode(65 + j)}${i + 1}`
              return c === ''
                ? `<c r="${ref}" s="1"/>`
                : `<c r="${ref}" t="s"><v>${strings.indexOf(c)}</v></c>`
            })
            .join('') +
          `</row>`,
      )
      .join('') +
    `</sheetData></worksheet>`
  return xlsxRaw(sheet, shared)
}

describe('قراءة الملفّ', () => {
  it('يقرأ xlsx بنصوصه المشتركة', () => {
    const table = parseXlsx(xlsx([HEAD, ['الكويت', 'سهل', 'س', 'ج', '', '']]))
    expect(table[0]).toEqual(HEAD)
    expect(table[1][2]).toBe('س')
  })

  it('يقرأ csv مع الاقتباس وفاصلةٍ داخل النصّ', () => {
    const table = parseCsv('أ,ب\n"سؤال، فيه فاصلة",جواب\n')
    expect(table[1]).toEqual(['سؤال، فيه فاصلة', 'جواب'])
  })

  /* الخليّة الفارغة المغلقة على نفسها كانت تبتلع ما بعدها حتى إغلاق الخليّة
     التالية، فتنزاح الأعمدة ويُقرأ رقمُ النصّ المشترك قيمةً في غير مكانه. */
  it('الخليّة الفارغة المغلقة على نفسها لا تزيح ما بعدها', () => {
    const table = parseXlsx(xlsx([HEAD, ['الكويت', '', 'س', 'ج', '', 'M001']]))
    expect(table[1]).toEqual(['الكويت', '', 'س', 'ج', '', 'M001'])
  })

  it('الصفّ الفارغ المغلق على نفسه لا يبتلع الصفّ التالي', () => {
    const shared = `<sst><si><t>أ</t></si><si><t>ب</t></si></sst>`
    const sheet =
      `<worksheet><sheetData>` +
      `<row r="1"><c r="A1" t="s"><v>0</v></c></row>` +
      `<row r="2" s="1" customFormat="1"/>` +
      `<row r="3"><c r="A3" t="s"><v>1</v></c></row>` +
      `</sheetData></worksheet>`
    const table = parseXlsx(xlsxRaw(sheet, shared))
    expect(table).toEqual([['أ'], [], ['ب']])
  })

  /* النصّ المشترك الفارغ يُكتب `<t/>` — كان يبتلع نصّ الخليّة التالية. */
  it('النصّ المشترك الفارغ لا يسرق نصّ جاره', () => {
    const shared = `<sst><si><t/></si><si><t>ب</t></si></sst>`
    const sheet =
      `<worksheet><sheetData><row r="1">` +
      `<c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c>` +
      `</row></sheetData></worksheet>`
    expect(parseXlsx(xlsxRaw(sheet, shared))[0]).toEqual(['', 'ب'])
  })

  /* إكسل العربي يبدأ ملفّه بعلامة ترتيب البايتات، وبدون طرحها يصير اسم أوّل
     عمود «؟التصنيف» فلا يُعرف. */
  it('يطرح علامة ترتيب البايتات من أوّل خلية', () => {
    expect(parseCsv('﻿التصنيف,المستوى')[0][0]).toBe('التصنيف')
  })
})

describe('خطّة الرفع', () => {
  const plan = (rows: string[][]) => buildPlan([HEAD, ...rows], CTX)

  it('يقبل الصفّ السليم ويعدّه إضافة', () => {
    const p = plan([['الكويت', 'سهل', 'سؤال جديد تماماً', 'جوابه', 'تاريخ', '']])
    expect(p.rejected).toEqual([])
    expect(p.added).toBe(1)
    expect(p.rows[0].topic).toBe('تاريخ')
  })

  it('المعرّف الموجود يعني تعديلاً لا إضافة', () => {
    const p = plan([['الكويت', 'صعب', 'نصّ مصحَّح', 'جواب', '', 'M001']])
    expect(p.updated).toBe(1)
    expect(p.rows[0].id).toBe('M001')
  })

  it('يردّ الفئة غير المعروفة ولا يُنشئها', () => {
    const p = plan([['فئة ليست عندنا', 'سهل', 'س', 'ج', '', '']])
    expect(p.rows).toHaveLength(0)
    expect(p.rejected[0].reason).toContain('فئة غير معروفة')
  })

  it('يردّ المستوى غير المعروف والسطر الناقص', () => {
    const p = plan([
      ['الكويت', 'سهله', 'س', 'ج', '', ''],
      ['الكويت', 'سهل', '', 'ج', '', ''],
    ])
    expect(p.rejected.map((r) => r.reason)).toEqual([
      'مستوى غير معروف: سهله',
      'السؤال أو الإجابة فارغ',
    ])
  })

  /* التكرار بالنصّ المطبَّع لا الحرفيّ: التشكيل والهمزة والترقيم لا تصنع
     سؤالاً جديداً على المسامع. */
  it('يردّ ما يطابق سؤالاً في البنك ولو اختلف رسمه', () => {
    const p = plan([['أدب وفنون', 'سهل', 'ما هي عاصمةُ مصر', 'القاهرة', '', '']])
    expect(p.rejected[0].reason).toContain('موجود في البنك (M001)')
  })

  it('يسمح بتعديل السؤال نفسه بمعرّفه بلا أن يعدّه تكراراً', () => {
    const p = plan([['أدب وفنون', 'سهل', 'ما هي عاصمة مصر؟', 'القاهرة', '', 'M001']])
    expect(p.rejected).toEqual([])
    expect(p.updated).toBe(1)
  })

  it('يردّ المكرّر داخل الملفّ نفسه', () => {
    const p = plan([
      ['الكويت', 'سهل', 'سؤال يتكرّر', 'ج', '', ''],
      ['الكويت', 'صعب', 'سؤال يتكرّر', 'ج', '', ''],
    ])
    expect(p.added).toBe(1)
    expect(p.rejected[0].reason).toBe('السؤال مكرّر داخل الملفّ')
  })

  it('يردّ معرّفاً لا وجود له', () => {
    const p = plan([['الكويت', 'سهل', 'س', 'ج', '', 'ZZZ999']])
    expect(p.rejected[0].reason).toContain('معرّف لا وجود له')
  })

  it('يقول ما ينقص من الأعمدة بدل أن يرفع نصفاً', () => {
    const p = buildPlan([['التصنيف', 'السؤال'], ['الكويت', 'س']], CTX)
    expect(p.rows).toHaveLength(0)
    expect(p.rejected[0].reason).toContain('المستوى')
    expect(p.rejected[0].reason).toContain('الإجابة')
  })

  /* تعديل سؤال صورة من ملفّ كان يفقده صورته: صفّ الطبقة يحلّ محلّ سؤال
     البنك كلّه، فبلا الصورة يعود «من صاحب الصورة؟» نصّاً عارياً. */
  it('التعديل يحمل صورة السؤال القائم كما هي، والمضاف بلا صورة', () => {
    const ctx = {
      categories: ['الكويت'],
      existing: [{ id: 'X001', question: 'من صاحب الصورة؟', image: 'celeb-001-q367825' }],
    }
    const p = buildPlan(
      [
        HEAD,
        ['الكويت', 'سهل', 'من صاحب الصورة؟', 'اسم مصحَّح', '', 'X001'],
        ['الكويت', 'سهل', 'سؤال جديد', 'ج', '', ''],
      ],
      ctx,
    )
    expect(p.rejected).toEqual([])
    expect(p.rows[0].image).toBe('celeb-001-q367825')
    expect(p.rows[1].image).toBeNull()
  })

  it('يتخطّى الأسطر الفارغة بلا شكوى', () => {
    const p = plan([['', '', '', '', '', ''], ['الكويت', 'سهل', 'سؤال', 'جواب', '', '']])
    expect(p.rejected).toEqual([])
    expect(p.added).toBe(1)
  })
})
