import type { Level } from './types'
/* بلاحقة `.ts` صراحةً: `scripts/check-drafts.mjs` يستورد هذه الوحدة في Node
   مباشرةً (تجريد الأنواع)، وNode لا يحلّ الاستيراد بلا لاحقة — ولا تُستورد
   هنا إلّا وحداتٌ بلا تبعيّاتٍ من المتصفّح. */
import { BOARD_LEVELS } from './levels.ts'

/**
 * فئة «ولا كلمة» — تمثيلٌ صامت، والكلمة في هاتف الممثّل وحده (قرار علي
 * ٢٠ سبتمبر ٢٠٢٦، SPEC §٤). **تجريبيّة حتى يلعبها بنفسه.**
 *
 * أوّل فئةٍ تكسر «شاشةٌ واحدة، لا يلمس اللاعبون شيئاً»: الكلمة لا يجوز أن
 * تظهر على الشاشة الكبيرة وإلّا رآها المخمّنون، فتعرض الشاشةُ رمزَ QR يمسحه
 * ممثّلُ صاحب الدور بهاتفه. والكسرُ محصورٌ في موضعٍ واحد: الهاتف **يقرأ**
 * ولا يضغط — كلُّ ضغطةٍ تبقى للحكم على الشاشة الكبيرة، ولا ربطَ للهاتف
 * بالجلسة ولا مزامنة.
 *
 * **الرابط يحمل الكلمةَ نفسها** ويفتح صفحةً ثابتة (`k.html`) لا تحتاج
 * تسجيلاً ولا قاعدة. والتشفير **حجابٌ لا سرّ**: يكفي أن لا تُقرأ الكلمةُ
 * بالعين من الرابط؛ من فتح أدوات المطوّر ليغشّ في مجلسٍ فأمرُه للمجلس.
 *
 * **والرابط قصيرٌ عمداً**: رمزُ QR الطويل نقاطُه أصغر، والمجلس يمسحه من
 * تلفزيونٍ على بُعد ثلاثة أمتار وأربعة. فالكلمة لا تُرمَّز UTF-8 (بايتان
 * لكلّ حرف) بل بايتاً واحداً للحرف العربيّ — عنوانٌ من عشرين حرفاً يصير
 * سبعةً وعشرين رمزاً في الرابط بدل أربعةٍ وخمسين، فينزل الرمز من 33 وحدة
 * إلى 29.
 *
 * والاسم مفتاحُ الفئة في الشيفرة كأسماء الفئات كلّها — لا يُعاد تسميته
 * (SPEC §٧)، وهو مكتوبٌ في كلّ سؤالٍ من أسئلتها في القاعدة.
 */
export const CHARADES_CATEGORY = 'ولا كلمة'

/**
 * أنواع ما يُمثَّل — **تُكتب للممثّل دائماً** (قرار علي ٢٠ سبتمبر ٢٠٢٦):
 * «على هامان يا فرعون» وحدها لا تقول إن كانت مسرحيّةً أم فيلماً أم مثلاً،
 * والممثّل يبدأ بإشارة النوع قبل الكلمة. النوع في حقل `topic` في القاعدة
 * بهذه الألفاظ نفسها، ويُحمَل في الرمز رقماً واحداً لا اسماً.
 *
 * **ترتيبُها جزءٌ من الصيغة**: الرقم في رابطٍ مفتوحٍ في هاتفٍ يُفكّ بهذه
 * القائمة، فالإضافةُ في آخرها لا في وسطها.
 */
export const CHARADE_KINDS = ['مسلسل', 'فيلم', 'مسرحية', 'أغنية', 'مثل'] as const
export type CharadeKind = (typeof CHARADE_KINDS)[number]

export const isCharadeKind = (topic: string): topic is CharadeKind => (CHARADE_KINDS as readonly string[]).includes(topic)

/** ما يحمله الرمز إلى هاتف الممثّل. */
export interface Charade {
  level: Level
  text: string
  /** نوع العمل — يغيب عن روابط الصيغة الأولى فقط. */
  kind?: CharadeKind
  /** مفتاح ملصقه المشحون (`pic-kilma-…`) — لا رابطاً مرفوعاً: الرابط يطوّل الرمز فيصغّر وحداته. */
  image?: string
}

export function isCharadesCategory(category: string): boolean {
  return category === CHARADES_CATEGORY
}

/**
 * ستّون ثانية للتمثيل لا خمسٌ وأربعون كالتشاور: التشاور كلامٌ بين ستّة،
 * والتمثيلُ يبدأ بلحظةِ حيرةٍ أمام كلمةٍ لم يختارها الممثّل ثمّ بمحاولاتٍ
 * تُفهم أو لا تُفهم — وخمسٌ وأربعون تُضيّق على السهل قبل الصعب. تُقاس في
 * جلسة علي التجريبيّة (SPEC §١٣) وتُعدَّل هنا وحدها.
 */
export const STAGE1_CHARADE_MS = 60_000

/** مسار الصفحة الثابتة على الموقع — بلا لاحقة؛ الخادم يفتح `k.html` (انظر `server.js`). */
export const CHARADE_PAGE_PATH = '/k'

/**
 * أصلُ الرابط في الرمز: **الموقع دائماً** لا `location.origin` — في التطبيق
 * الأصليّ الأصلُ `capacitor://localhost` ولا يفتحه هاتفُ أحد. والمعاينةُ
 * المحلّية وحدها (localhost) تشير إلى نفسها كي تُقاس قبل النشر.
 */
export function charadePageOrigin(origin: string = typeof location === 'undefined' ? '' : location.origin): string {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.|10\.)/.test(origin) ? origin : 'https://f6een.com'
}

/* ───────────────────────── الترميز ───────────────────────── */

/**
 * بايتٌ واحد لكلّ حرف: المدى العربيّ ‎U+0600–U+06FF‎ يُطرح منه ‎0x600‎
 * فيصير ‎0x00–0xFF‎ كلَّه. وبقيّة الأحرف — الفراغ واللاتينيّ والأرقام
 * والترقيم — تحتاج مخرجاً:
 * - الفراغ أكثرُها فيأخذ ‎0x20‎ (خانة ‎U+0620‎، حرفٌ كشميريّ لا يقع في عنوان).
 * - الرقم اللاتينيّ يُكتب رقماً هنديّاً (‎0x60–0x69‎) ويُردّ لاتينيّاً عند
 *   الفكّ — الواجهة لاتينيّة دائماً.
 * - وما سوى ذلك بايتُ هروبٍ ‎0x1F‎ (خانة ‎U+061F‎) يتلوه البايتُ كما هو
 *   إن كان ≤ ‎0xFF‎، أو ‎0x1E‎ (خانة ‎U+061E‎) تتلوه وحدةُ UTF-16 في بايتين
 *   — الشرطة الطويلة والأقواس المزدوجة تقع في العناوين. والخاناتُ
 *   نفسُها (؝ و؞ و؟) تُهرَّب كأيّ حرفٍ خارج المدى.
 */
const ESC1 = 0x1f
const ESC2 = 0x1e
const SPACE = 0x20
/** فاصلٌ بين الكلمة ومفتاح الملصق (خانة ‎U+061D‎، علامةٌ لا تقع في عنوان). */
const SEP = 0x1d

function toBytes(text: string): number[] {
  const out: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    if (c === 0x20) out.push(SPACE)
    else if (c >= 0x30 && c <= 0x39) out.push(0x60 + (c - 0x30))
    else if (c >= 0x600 && c <= 0x6ff && c !== 0x620 && c !== 0x61d && c !== 0x61e && c !== 0x61f) out.push(c - 0x600)
    else if (c <= 0xff) out.push(ESC1, c)
    else out.push(ESC2, c >> 8, c & 0xff)
  }
  return out
}

function fromBytes(bytes: number[]): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b === ESC1) {
      const n = bytes[++i]
      if (n === undefined) break
      s += String.fromCharCode(n)
    } else if (b === ESC2) {
      const hi = bytes[++i], lo = bytes[++i]
      if (hi === undefined || lo === undefined) break
      s += String.fromCharCode((hi << 8) | lo)
    } else if (b === SPACE) s += ' '
    else if (b >= 0x60 && b <= 0x69) s += String.fromCharCode(0x30 + (b - 0x60))
    else s += String.fromCharCode(0x600 + b)
  }
  return s
}

/** مفتاح الحجاب — يدور على البايتات؛ ثابتٌ ومعلوم، وليس المطلوبُ أكثر. */
const VEIL = [0x66, 0x61, 0x74, 0x69, 0x6e, 0x21, 0x9d, 0x3c]
const veil = (bytes: number[]) => bytes.map((b, i) => b ^ VEIL[i % VEIL.length])

/* base64url بلا حشو — أحرفُه كلُّها آمنةٌ في الجزء بعد ‎#‎ */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function b64encode(bytes: number[]): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2]
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0)
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63]
    if (b !== undefined) s += B64[(n >> 6) & 63]
    if (c !== undefined) s += B64[n & 63]
  }
  return s
}

function b64decode(s: string): number[] | null {
  const out: number[] = []
  let buf = 0, bits = 0
  for (const ch of s) {
    const v = B64.indexOf(ch)
    if (v < 0) return null
    buf = (buf << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out.push((buf >> bits) & 0xff)
    }
  }
  return out
}

/** ترتيب المستوى في الرمز — رقمٌ واحد لا اسم؛ من `BOARD_LEVELS` لا من قائمةٍ ثانية. */
const levelIndex = (level: Level) => BOARD_LEVELS.indexOf(level)

/**
 * مفتاحُ الملصق في الرمز: أحرفٌ لاتينيّة وأرقامٌ وشرطات، بايتٌ للحرف كما
 * هو — لا يمرّ بترميز الكلمة (يجعل اللاتينيّ بايتين). والبادئة `pic-kilma-`
 * على كلّ ملصقات الفئة فتُحذف وتُردّ؛ ومفتاحٌ من غيرها يُسبق بشرطةٍ مائلة
 * (لا تقع في اسم ملفّ) فيُحمل كاملاً.
 */
const KILMA = 'pic-kilma-'
const keyToBytes = (key: string) => [...(key.startsWith(KILMA) ? key.slice(KILMA.length) : '/' + key)].map((ch) => ch.charCodeAt(0) & 0xff)
const keyFromBytes = (bytes: number[]) => {
  const s = String.fromCharCode(...bytes)
  return s.startsWith('/') ? s.slice(1) : KILMA + s
}

/**
 * الجزءُ الذي يُوضع بعد ‎#‎ في الرابط: صيغةٌ (حرفٌ واحد) ثمّ المستوى ثمّ
 * النوع ثمّ الكلمة محجوبةً، ثمّ فاصلٌ ومفتاحُ الملصق إن وُجد. الصيغةُ أوّلاً
 * كي تُفكّ روابطُ اليوم لو تغيّر الترميز غداً — الرمزُ على شاشةٍ لحظتَه،
 * لكنّ الصفحةَ قد تبقى مفتوحةً في هاتفٍ. والصيغة `a` (المستوى والكلمة
 * وحدهما) ما زالت تُفكّ.
 *
 * والنوع بايتٌ واحد: صفرٌ لا نوع، وإلّا ترتيبُه في `CHARADE_KINDS` زائد واحد.
 */
export function encodeCharade(level: Level, text: string, extra: { kind?: string; image?: string } = {}): string {
  const idx = Math.max(0, levelIndex(level))
  const kind = extra.kind && isCharadeKind(extra.kind) ? CHARADE_KINDS.indexOf(extra.kind) + 1 : 0
  const bytes = [idx, kind, ...toBytes(text.trim())]
  if (extra.image && !/^https?:\/\//.test(extra.image)) bytes.push(SEP, ...keyToBytes(extra.image))
  return 'b' + b64encode(veil(bytes))
}

export function decodeCharade(fragment: string): Charade | null {
  const f = fragment.replace(/^#/, '')
  const fmt = f[0]
  if (fmt !== 'a' && fmt !== 'b') return null
  const raw = b64decode(f.slice(1))
  if (!raw || raw.length < 2) return null
  const bytes = veil(raw)
  const level = BOARD_LEVELS[bytes[0]]
  if (!level) return null
  if (fmt === 'a') {
    const text = fromBytes(bytes.slice(1))
    return text ? { level, text } : null
  }
  const kind = bytes[1] ? CHARADE_KINDS[bytes[1] - 1] : undefined
  const sep = bytes.indexOf(SEP, 2)
  const text = fromBytes(sep < 0 ? bytes.slice(2) : bytes.slice(2, sep))
  if (!text) return null
  const out: Charade = { level, text }
  if (kind) out.kind = kind
  if (sep >= 0 && sep + 1 < bytes.length) out.image = keyFromBytes(bytes.slice(sep + 1))
  return out
}

/** الرابط الكامل الذي يُرسم في الرمز. */
export function charadeUrl(level: Level, text: string, extra: { kind?: string; image?: string } = {}, origin?: string): string {
  return charadePageOrigin(origin) + CHARADE_PAGE_PATH + '#' + encodeCharade(level, text, extra)
}
