type BrandLogoProps = {
  className?: string
}

/**
 * شعار فطين النصّي.
 *
 * استُخدمت الصيغ العربية المتصلة لكل حرف حتى نستطيع تكبير الطاء من دون تحويل
 * الكلمة إلى صورة أو التضحية بصحة قراءتها.
 *
 * وثمنُ ذلك أنّ هذه الصيغ (أشكال العرض U+FExx) خارج تغطية Baloo، فيرسمها
 * Cairo — التالي في سلسلة الخطوط. لا تبدّلها بالحروف الأساسية ظنّاً أنّك
 * تُعيد الشعار إلى Baloo: الأساسيةُ تتشكّل تلقائياً فيسقط تكبيرُ الطاء.
 */
export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span className={`f6een-mark ${className}`.trim()} role="img" aria-label="فطين">
      <span className="f6een-word" aria-hidden="true">
        <span className="f6een-letter f6een-fa">ﻓ</span>
        <span className="f6een-letter f6een-taa">ﻄ</span>
        <span className="f6een-letter f6een-yaa">ﻴ</span>
        <span className="f6een-letter f6een-nun">ﻦ</span>
      </span>
      <span className="f6een-spark spark-1" aria-hidden="true" />
      <span className="f6een-spark spark-2" aria-hidden="true" />
    </span>
  )
}
