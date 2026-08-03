export interface BrandMarkProps {
  /** ارتفاع العلامة بالبكسل */
  size?: number
  /** يرسم لوحة ليل الغوص خلفها بزوايا مدوّرة — كما في أيقونة التطبيق */
  plate?: boolean
}

/**
 * علامة صحصحلي — خليتان سداسيتان متداخلتان.
 *
 * الذهبي والمرجاني هما لونا كلمة «صحصح لي» نفسها، والتقاطع كريمي.
 *
 * **التقاطع لون صريح لا شفافية:** الشفافية تتغيّر بتغيّر ما تحتها، واللون
 * الصريح ثابت في كل قصّ وفي الطباعة. وكتل صلبة لا حلقات مفرّغة — جُرّبت
 * الحلقات فتلبّكت عند 27px.
 */
export function BrandMark({ size = 96, plate = true }: BrandMarkProps) {
  const A = '412,337 563.55,424.5 563.55,599.5 412,687 260.45,599.5 260.45,424.5'
  const B = '612,337 763.55,424.5 763.55,599.5 612,687 460.45,599.5 460.45,424.5'
  const id = 'sh-mark-overlap'
  return (
    <svg
      viewBox={plate ? '0 0 1024 1024' : '225 322 574 380'}
      width={plate ? size : undefined}
      height={size}
      role="img"
      aria-label="صحصحلي"
    >
      <defs>
        <clipPath id={id}>
          <polygon points={A} />
        </clipPath>
      </defs>
      {plate && <rect width="1024" height="1024" rx="230" fill="var(--sh-night)" />}
      <polygon points={A} fill="var(--sh-gold)" />
      <polygon points={B} fill="var(--sh-coral)" />
      <g clipPath={`url(#${id})`}>
        <polygon points={B} fill="var(--sh-cream)" />
      </g>
    </svg>
  )
}
