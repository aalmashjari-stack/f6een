/**
 * تواريخ الواجهة — بأرقام لاتينية.
 *
 * `toLocaleDateString` بالعربيّة يعطي ٠١٢٣، وكلّ رقم في فطين لاتينيّ (العجلة
 * والنقاط والمؤقّت). فالتنسيق يدويّ لا بمحلّية.
 */

const p = (n: number) => String(n).padStart(2, '0')

/** يوم: 2026/08/30 — والنصّ الأصليّ يُعاد كما هو إن لم يكن تاريخاً. */
export function day(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`
}

/** يوم وساعة — للوحة الإدارة حيث يفرّق ترتيبُ الدقائق بين جلستين في يوم. */
export function stamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${day(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`
}
