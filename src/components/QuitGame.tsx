import { useEffect, useState } from 'react'

/**
 * الخروج من جلسة قائمة.
 *
 * كان زرّ «لعبة جديدة» يعيش في شاشة الختام وحدها، فمن أراد هجر لعبة في
 * منتصفها لم يجد باباً — واللعبة تُستأنف تلقائياً في كل فتح (نافذة الاستكمال،
 * SPEC القسم ٩)، فيصير الاستئنافُ سجناً لا خدمة.
 *
 * **بضغطتين لا بواحدة.** الشريط يعلو الشاشة أثناء اللعب، وضغطةٌ واحدة سهوَاً
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
      <button
        className={'quit-game' + (asking ? ' asking' : '')}
        onClick={() => (asking ? onQuit() : setAsking(true))}
        title="إنهاء الجلسة والعودة إلى الإعداد"
      >
        {asking ? 'تأكيد الإنهاء' : 'إنهاء'}
      </button>

      {asking && charged && <p className="quit-warn">اللعبة مخصومة ولا تُعاد</p>}

      <style>{`
        .quit-game {
          position:fixed; inset-block-start:clamp(6px,1.2vh,14px);
          inset-inline-start:clamp(6px,1.2vw,16px);
          z-index:50;
          font:inherit; font-weight:800; cursor:pointer;
          font-size:clamp(10px,1.3vw,14px);
          padding:clamp(4px,.8vh,8px) clamp(8px,1.4vw,14px);
          border:0; border-radius:999px;
          background:var(--n-surface, #fff); color:var(--n-ink-3, #948CA8);
          box-shadow:var(--n-e1, 0 1px 2px rgba(0,0,0,.08));
          opacity:.55;
          transition:opacity .2s ease, background .2s ease, color .2s ease;
        }
        .quit-game:hover { opacity:1; }
        /* الحالة الثانية صريحة اللون: لا تُضغط سهواً وهي بلون الحياد. */
        .quit-game.asking {
          opacity:1;
          background:var(--n-bad, #DC4033); color:#fff;
        }
        /* تحت الزرّ لا داخله: الشريط حبّةٌ صغيرة، وتوسيعها بالنصّ يزحم الشاشة
           أثناء اللعب — والتحذير لا يظهر إلا في اللحظة التي يُقرأ فيها. */
        .quit-warn {
          position:fixed; inset-block-start:clamp(30px,4.6vh,44px);
          inset-inline-start:clamp(6px,1.2vw,16px);
          z-index:50; margin:0;
          font-weight:800; font-size:clamp(9px,1.15vw,12px);
          padding:clamp(3px,.6vh,6px) clamp(7px,1.2vw,12px);
          border-radius:999px;
          background:var(--n-surface, #fff); color:var(--n-bad, #DC4033);
          box-shadow:var(--n-e1, 0 1px 2px rgba(0,0,0,.08));
        }
      `}</style>
    </>
  )
}
