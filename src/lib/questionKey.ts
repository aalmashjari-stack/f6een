/**
 * مفتاحُ السؤال لكشف التكرار — **تعريفٌ واحد في ثلاثة مواضع**.
 *
 * «ما هي عاصمةُ مصر؟» و«ما هي عاصمة مصر» سؤالٌ واحد على المسامع. ويُقاس
 * ذلك في ثلاثة مواضع: معاينة «رفع ملفّ» في اللوحة (`importQuestions`)،
 * وفاحص المسوّدات قبل الإرسال (`scripts/check-drafts.mjs`)، وحارس القاعدة
 * `public.norm_question` في الرفع والاعتماد. وكانت ثلاثة تطبيعاتٍ مختلفة
 * (مسح ١٦ أكتوبر ٢٠٢٦):
 *
 * - المعاينة كانت تحذف كلّ ما ليس حرفاً أو رقماً — **ومنه الإيموجي**. فـ«🦁👑
 *   — ما الفيلم؟» و«🚢🧊💔 — ما الفيلم؟» مفتاحٌ واحد: 106 أسئلة إيموجي
 *   تنكمش إلى 21، ورفعُها من ملفٍّ يردّ كلَّ سؤالٍ إلّا واحداً في كلّ ذيل،
 *   والقاعدة تقبلها.
 * - والقاعدة كانت تحوّل «ة» إلى «ي» (`translate('أإآةى','ااايي')`) والمعاينة
 *   إلى «ه».
 * - ولا أحدٌ منها يرى «سنة 1920» و«سنة ١٩٢٠» سؤالاً واحداً — 21 زوجاً مكرّراً
 *   في نصوص البنك والتقارير.
 *
 * **فالتعريف هنا جدولُ حروفٍ صريح لا أصنافُ يونيكود**: `\p{L}` في JavaScript
 * و`[:punct:]` في Postgres لا يتطابقان، والثاني يتبع إعدادات القاعدة. والجدولُ
 * نفسه يُكتب في الهجرة نداءَ `translate()` واحداً، و`questionKey.test.ts`
 * يُسقط البناء إن اختلف آخرُ تعريفٍ لـ`norm_question` عمّا يولّده `sqlNormQuestion`.
 * فمن غيّر حرفاً هنا يكتب هجرةً بمخرَج `sqlNormQuestion()`.
 */

/** حرفٌ يُستبدل بآخر: الهمزات على الألف، والألف المقصورة، والتاء المربوطة، والأرقام، والحروف اللاتينيّة الكبيرة. */
const FOLD: [from: string, to: string][] = [
  ['أإآٱ', 'اااا'],
  ['ى', 'ي'],
  ['ة', 'ه'],
  ['٠١٢٣٤٥٦٧٨٩', '0123456789'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'],
]

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCharCode(from + i)).join('')

/**
 * حرفٌ يُحذف: التشكيل والتطويل، والمسافات بأنواعها، وعلامات الترقيم.
 * **والإيموجي ليس منها** — فئة «إيموجي» سؤالُها الرموزُ نفسها. ومُحدِّدا
 * الصيغة (U+FE0E/F) ورابطُ العرض الصفريّ تُحذف، فـ«❤️» و«❤» رمزٌ واحد.
 */
const DROP = [
  range(0x064b, 0x0652), // التشكيل
  'ٰـ', // الألف الخنجريّة والتطويل
  '\t\n\v\f\r   ',
  range(0x2000, 0x200f), // المسافات وعلامات الاتّجاه والعرض الصفريّ
  '    　﻿︎️',
  range(0x21, 0x2f), // ! " # $ % & ' ( ) * + , - . /
  range(0x3a, 0x40), // : ; < = > ? @
  range(0x5b, 0x60), // [ \ ] ^ _ `
  range(0x7b, 0x7e), // { | } ~
  '؟،؛«»…“”‘’„—–‐·•٫٬',
].join('')

const MAP = new Map<string, string>()
for (const [from, to] of FOLD) [...from].forEach((c, i) => MAP.set(c, to[i]))
for (const c of DROP) MAP.set(c, '')

/** مفتاحُ السؤال: نصّان مفتاحُهما واحد سؤالٌ واحد. */
export function questionKey(s: string): string {
  let out = ''
  for (const c of s) out += MAP.get(c) ?? c
  return out
}

/** حرفٌ يُكتب في نصّ SQL كما هو، وما سواه بـ`\XXXX` داخل `U&'…'`. */
const literal = (s: string) =>
  [...s]
    .map((c) => {
      if (c === '\\') return '\\\\'
      if (c === "'") return "''"
      const n = c.codePointAt(0)!
      return n > 0x20 && n < 0x7f ? c : `\\${n.toString(16).padStart(4, '0')}`
    })
    .join('')

/**
 * جسمُ `public.norm_question` مولَّداً من الجدول نفسه: `translate()` يستبدل
 * حرفاً بحرف، وما زاد في القائمة الأولى عن الثانية يحذفه.
 */
export function sqlNormQuestion(): string {
  const from = FOLD.map(([f]) => f).join('') + DROP
  const to = FOLD.map(([, t]) => t).join('')
  return `select translate(coalesce(p, ''), U&'${literal(from)}', U&'${literal(to)}');`
}
