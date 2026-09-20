import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

/**
 * رمز QR يُرسم SVG — لفئة «ولا كلمة» (SPEC §٤).
 *
 * SVG لا صورة: يملأ ما يُعطى من الشاشة بلا تشويش، ووحداتُه مستطيلاتٌ حادّة
 * تُقرأ من بعيد. **وتصحيحُ الخطأ في أدناه (L)**: التلفزيون لا يُخدَش،
 * والدرجةُ الأعلى تزيد الوحدات فتصغّر كلَّ وحدة — وحجمُ الوحدة هو ما
 * يقرّر أقصى مسافةٍ يُمسح منها. والهامش الأبيض (quiet zone) أربعُ وحداتٍ
 * كما تشترط المواصفة؛ بلا هامشٍ كافٍ يفشل المسح على خلفيّةٍ داكنة.
 */
const QUIET = 4

export function QrCode({ value, className }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, 'L')
    qr.addData(value, 'Byte')
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (qr.isDark(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`
    return { size: n + QUIET * 2, path: d }
  }, [value])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="رمز الاستجابة السريعة"
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  )
}
