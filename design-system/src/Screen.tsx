import type { ReactNode } from 'react'

export interface ScreenProps {
  children: ReactNode
  /** يوسّط المحتوى رأسياً — لشاشات الإعلان (الفاصل، الاستعداد) لا لشاشات اللعب */
  center?: boolean
}

/**
 * حاوية الشاشة الواحدة: خلفية ليل الغوص، وتوهّجان يتنفّسان، ونسيج خلية النحل.
 *
 * النسيج والتوهّجات ليست زينة — هي ما يجعل الشاشات تُقرأ كعالم واحد لا كشاشات
 * متفرّقة. وهي خافتة عمداً: الوضوح شرط تشغيل لا تفضيل جمالي، لأن اللعبة تُقرأ
 * من آخر المجلس.
 */
export function Screen({ children, center }: ScreenProps) {
  return (
    <div className="sh-screen" style={center ? { justifyContent: 'center' } : undefined}>
      {children}
    </div>
  )
}
