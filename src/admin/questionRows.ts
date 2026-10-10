import type { AdminQuestionEdit } from '../lib/admin'
import { isImageUrl } from '../game/celebs'
import { shippedImage } from '../game/shippedImage'
import type { Question } from '../game/types'

/**
 * حدّ الخليّة — عشرون سؤالاً لكل (فئة × مستوى)، وهو ما تفرضه
 * `assert_cell_floor` في القاعدة و`bank.test.ts` على الملفّ.
 *
 * مكتوبٌ هنا للعرض وحده: اللوحة تقوله قبل أن تُردّ المحاولة، والقاعدة هي
 * التي تمنع. فمن غيّره في الهجرة فليغيّره هنا — ولا عكس.
 */
export const CELL_FLOOR = 20

export type Source = 'bank' | 'edited' | 'added'

export interface Row {
  q: Question
  source: Source
  origin?: AdminQuestionEdit['origin']
  /** له صفٌّ في القاعدة، فالحذف يطاله. المشحونُ بلا صفٍّ لا يُحذف. */
  deletable: boolean
}

/**
 * كل الأسئلة: البنك المشحون مدموجاً بما عُدّل وأُضيف.
 *
 * **الدمج في المتصفّح لا في القاعدة.** البنك ملفٌّ تحمله هذه الصفحة أصلاً،
 * والقاعدة لا تعرف منه شيئاً — فيها الفرق وحده. ولو أُرسل البنك كلّه إلى
 * القاعدة ليُدمج هناك لصار لكل سؤالٍ نسختان تفترقان عند أوّل إصدار.
 */
const SOURCE_OF: Record<AdminQuestionEdit['origin'], Source> = {
  bank: 'bank',
  override: 'edited',
  new: 'added',
}

/**
 * البنك المشحون بعد تركيب التعديلات — نفس دمج المحرّك، بمصدر كل صفّ.
 *
 * `live` = القاعدة صارت مرجع الأسئلة (مفتاح `bank_in_db`). حينها **لا
 * يُدمج الملفّ أصلاً**: صفوف القاعدة هي البنك كلّه، ودمجُ الملفّ فوقها
 * يعيد كل سؤالٍ حذفتَه.
 */
export function merge(
  bank: Question[],
  edits: AdminQuestionEdit[],
  /* صفٌّ واحد بـ`origin = 'bank'` يكفي دليلاً: البنك انتُقل. الشاشاتُ
     الأخرى (البلاغات والفئات) لا تسأل المفتاح، فتكفيها هذه القرينة. */
  live = edits.some((e) => e.origin === 'bank'),
): Row[] {
  if (live) {
    return edits.map((e) => ({
      q: toQuestion(e),
      source: SOURCE_OF[e.origin] ?? 'added',
      origin: e.origin,
      deletable: true,
    }))
  }

  const byId = new Map(edits.map((e) => [e.question_id, e]))
  const out: Row[] = bank.map((base) => {
    const e = byId.get(base.id)
    return e
      ? { q: toQuestion(e), source: 'edited' as const, origin: e.origin, deletable: true }
      : { q: base, source: 'bank' as const, deletable: false }
  })
  for (const e of edits) {
    if (e.origin === 'new') out.push({ q: toQuestion(e), source: 'added', origin: 'new', deletable: true })
  }
  return out
}

export function resolveImage(image: string): string | null {
  if (isImageUrl(image)) return image
  /* السلسلة في `shippedImage` موضعاً واحداً تخدم اللوحة وشاشة اللعب معاً:
     كانت مكتوبةً هنا وهناك، فغاب مجلّدٌ عن أحدهما مرّتين في يومٍ واحد. */
  return shippedImage(image)
}

function toQuestion(e: AdminQuestionEdit): Question {
  return {
    id: e.question_id,
    category: e.category,
    level: e.level as Question['level'],
    topic: e.topic ?? '',
    question: e.question,
    answer: e.answer,
    ...(e.image ? { image: e.image } : {}),
    ...(e.answer_image ? { answerImage: e.answer_image } : {}),
    ...(e.family ? { family: e.family } : {}),
  }
}
