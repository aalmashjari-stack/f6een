import { useEffect, useState } from 'react'
import quitGameCss from './QuitGame.css?inline'

/**
 * الخروج من جلسة قائمة.
 *
 * كان زرّ «لعبة جديدة» يعيش في شاشة الختام وحدها، فمن أراد هجر لعبة في
 * منتصفها لم يجد باباً — واللعبة تُستأنف تلقائياً في كل فتح (نافذة الاستكمال،
 * SPEC القسم ٩)، فيصير الاستئنافُ سجناً لا خدمة.
 *
 * **بضغطتين لا بواحدة.** الزرّ حاضرٌ في زاوية الشاشة أثناء اللعب، وضغطةٌ واحدة سهوَاً
 * تُلغي جلسةً كاملة أمام المجلس. الأولى تكشف السؤال، والثانية تُنهي، ويعود
 * إلى حاله وحده بعد أربع ثوانٍ إن لم تُؤكَّد.
 *
 * ولا نافذة `confirm` من النظام: تقطع المشهد بصندوق أبيض غريب عن الهويّة،
 * وبعض حاويات الويب تحجبها أصلاً.
 *
 * و`charged` تكشف الثمن قبل الضغطة الثانية: اللعبة تُخصم عند إنشاء الجلسة
 * ولا تُعاد بالانسحاب (SPEC ٣). إخفاء ذلك يجعل الزرّ فخّاً — ولا يُقال إلا
 * حين يكون صحيحاً، فجلسةٌ بلا خصم لا تُخوَّف بثمنٍ لم يُدفع.
 */
export function QuitGame({ onQuit, charged = false }: { onQuit: () => void; charged?: boolean }) {
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!asking) return
    const t = setTimeout(() => setAsking(false), 4000)
    return () => clearTimeout(t)
  }, [asking])

  return (
    <>
      {/* الاثنان في عمودٍ واحد لا حرَّان: حين كان كلٌّ منهما `fixed` بإزاحته
          الخاصّة كانا يتراكبان خمسة بكسلات — الإزاحتان مضبوطتان بحسابٍ يدويّ
          لارتفاع الزرّ، وهو يتغيّر بالخطّ والحشو. العمود يجعل الفجوة بنيةً
          لا حساباً. */}
      <div className="quit-corner">
        {asking && charged && <p className="quit-warn">اللعبة مخصومة ولا تُعاد</p>}

        <button
          className={'quit-game' + (asking ? ' asking' : '')}
          onClick={() => (asking ? onQuit() : setAsking(true))}
          title="إنهاء الجلسة والعودة إلى الإعداد"
        >
          {asking ? 'تأكيد الإنهاء' : 'إنهاء'}
        </button>
      </div>

      <style>{quitGameCss}</style>
    </>
  )
}
