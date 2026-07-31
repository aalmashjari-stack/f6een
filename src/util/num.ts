const AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

/** تحويل الأرقام الغربية لعربية-هندية — الواجهة عربية بالكامل فلا تُخلط الأرقام. */
export function ar(value: number | string): string {
  return String(value).replace(/-/g, '−').replace(/\d/g, (d) => AR[+d])
}
