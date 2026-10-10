import { useCallback, useEffect, useState } from 'react'
import type { Question } from '../game/types'

/**
 * حِمل مشترك لكل لسان: قراءة، ثمّ إمّا خطأ أو بيانات.
 *
 * `reload` تُعاد بعد كل كتابة — القاعدة هي المصدر، والتعديل المحلّي المتفائل
 * يُظهر رقماً لم تقبله القاعدة.
 */
export function useLoad<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const reload = useCallback(() => {
    fn()
      .then((d) => {
        setData(d)
        setErr(null)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
    /* الدالّة تُبنى في كل عرض، ووضعها في التبعيّات يجعل الأثر يدور بلا نهاية. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(reload, [reload])
  return { data, err, reload }
}

/**
 * عددٌ صحيح من خانةٍ يكتبها المدير — **والأرقام الهنديّة تُقبل**: لوحة مفاتيح
 * عربيّة تكتب «٥»، و`Number('٥')` هو NaN، وNaN في JSON يصير null، وnull في
 * سقف الكود يعني «بلا سقف». فكان «٥» يُنشئ كوداً بلا حدّ ويقول «أُنشئ».
 * يعيد null لما ليس عدداً صحيحاً، فيُردّ لا يُخمَّن.
 */
export function wholeNumber(raw: string): number | null {
  const t = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
  if (!/^\d+$/.test(t)) return null
  return Number(t)
}


/**
 * البنك يُحمَّل عند فتح لسان البلاغات وحده — استيراد ديناميكيّ.
 *
 * ستّمئة كيلوبايت من الأسئلة لا معنى لتحميلها لمن فتح اللوحة ليمنح لعبةً
 * ويغلق. ولا تُقرأ البلاغات بلا البنك: القاعدة تحفظ المعرّف وحده، والنصّ
 * يعيش في الملفّ المشحون (`data/questions-bank-v5.json`).
 */
export function useBank() {
  const [bank, setBank] = useState<Question[] | null>(null)
  useEffect(() => {
    let alive = true
    import('../game/bank').then((m) => {
      if (alive) setBank(m.ALL_QUESTIONS)
    })
    return () => {
      alive = false
    }
  }, [])
  return bank
}
