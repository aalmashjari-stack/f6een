import { useCallback, useEffect, useState } from 'react'
import { fetchBackups, type BackupRun } from '../lib/admin'
import { stamp } from '../lib/date'

/**
 * لسان «النسخ الاحتياطي» — طلب علي ٩ أكتوبر ٢٠٢٦.
 *
 * يقرأ `backup.runs` (عبر `admin_backups`): سطرٌ تكتبه المهمّة الليليّة بعد
 * كلّ تشغيل، نجح أو فشل. والنسخ نفسها في Cloudflare R2 مشفّرة، فاللوحة لا
 * تنزّلها ولا تفتحها — تعرض حالتها فقط.
 *
 * «سليمة» = آخر نسخة ناجحة قبل أقلّ من 26 ساعة: الليلة الماضية مع هامش
 * لتأخّر جدولة GitHub. وما فوقها يُقال صراحةً، لأنّ النسخة المتوقّفة بصمت
 * أسوأ ما يقع لنظام نسخ.
 */

const HEALTHY_HOURS = 26

const n = (v: number | null | undefined) => (v === null || v === undefined ? '—' : v.toLocaleString('en-US'))
const mb = (b: number | null | undefined) => (b ? `${(b / 1024 / 1024).toFixed(2)} MB` : '—')

function ago(iso: string): string {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5
  if (h < 1) return 'قبل أقلّ من ساعة'
  if (h < 48) return `قبل ${Math.round(h)} ساعة`
  return `قبل ${Math.round(h / 24)} يوماً`
}

export function Backups() {
  const [runs, setRuns] = useState<BackupRun[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setErr(null)
    fetchBackups()
      .then(setRuns)
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  if (err) return <p className="a-err">{err}</p>
  if (!runs) return <p className="a-note">…</p>

  const lastOk = runs.find((r) => r.ok)
  const healthy = lastOk ? (Date.now() - new Date(lastOk.at).getTime()) / 36e5 < HEALTHY_HOURS : false
  const t = lastOk?.tables ?? {}

  return (
    <div className={'ins' + (loading ? ' busy' : '')}>
      <div className="a-bar">
        {/* قبل أوّل تسجيل لا «متأخّرة» حمراء: لا شيء فشل بعد، والأحمر يُقرأ عطلاً. */}
        {runs.length > 0 && (
          <span className={'tag ' + (healthy ? 'finished' : 'bad')}>{healthy ? 'سليمة' : 'متأخّرة'}</span>
        )}
        <span>
          {lastOk ? (
            <>
              آخر نسخة ناجحة <span className="num">{stamp(lastOk.at)}</span> · {ago(lastOk.at)}
            </>
          ) : (
            'لا نسخة ناجحة مسجّلة بعد'
          )}
        </span>
        <button className="a-btn" onClick={load} disabled={loading}>
          تحديث
        </button>
      </div>

      {lastOk && (
        <div className="a-tiles">
          <Stat v={mb(lastOk.size_bytes)} label="حجم النسخة" />
          <Stat v={n(t['auth.users'])} label="حساب" />
          <Stat v={n(t['public.question_overrides'])} label="سؤال في البنك" />
          <Stat v={n(t['public.question_drafts'])} label="مسوّدة" />
          <Stat v={n(t['public.sessions'])} label="جلسة" />
          <Stat v={n(lastOk.images_total)} label="صورة" />
        </div>
      )}

      {runs.length === 0 ? (
        <p className="a-note">لم يُسجَّل تشغيلٌ بعد — أوّل سطر بعد نسخة الليلة الساعة 3 فجراً.</p>
      ) : (
        <div className="a-card a-scroll">
          <table className="a-tbl">
            <thead>
              <tr>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>الحجم</th>
                <th>حساب</th>
                <th>سؤال</th>
                <th>صور جديدة</th>
                <th>السجلّ</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="num">{stamp(r.at)}</td>
                  <td>
                    <span className={'tag ' + (r.ok ? 'finished' : 'bad')}>{r.ok ? 'ناجحة' : 'فشلت'}</span>
                  </td>
                  <td className="num">{mb(r.size_bytes)}</td>
                  <td className="num">{n(r.tables?.['auth.users'])}</td>
                  <td className="num">{n(r.tables?.['public.question_overrides'])}</td>
                  <td className="num">{n(r.images_new)}</td>
                  <td>
                    {r.run_url ? (
                      <a href={r.run_url} target="_blank" rel="noreferrer">
                        فتح
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="ins-sub">
        كلّ ليلة الساعة 3 فجراً بتوقيت الكويت، إلى Cloudflare R2 مشفّرةً بمفتاحك. تُحفظ اليوميّة 35 يوماً
        والشهريّة 400، ولا تُحذف نسخة قبل 30 يوماً. وتصل النتيجة على تيليغرام.
      </p>
    </div>
  )
}

function Stat({ v, label }: { v: string; label: string }) {
  return (
    <div className="a-tile">
      <b className="num">{v}</b>
      <span>{label}</span>
    </div>
  )
}
