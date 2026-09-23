import { useCallback, useEffect, useState } from 'react'
import { fetchInsights, type Insights as Data } from '../lib/admin'
import { day, stamp } from '../lib/date'

/**
 * لسان «الإحصائيات» — طلب علي ٢٣ سبتمبر ٢٠٢٦: «احصائيات فيها جميع انواع
 * الاحصائيات مثل اي فئة تم اختيارها اكثر».
 *
 * الحساب كلُّه في `admin_insights`، وهذا اللسان يرسم وحده. والرسوم **لونٌ
 * واحد** (`--n-brand`) وكلُّ شريطٍ عليه رقمه: لا سلسلتين في رسمٍ واحد، فلا
 * مفتاحَ ألوانٍ يُحفظ ولا لونٌ يحمل معنىً وحده. والأرقام لاتينيّة دائماً.
 *
 * **ومصدرُه الجلسات على الخادم** — ألعاب الحسابات المسجّلة. ولا تُحفظ نتيجة
 * كلّ سؤال، فلا «أصعب سؤال» هنا؛ يُقال ذلك في أسفل اللسان لا يُترك يُظنّ نقصاً.
 */

const PHASES: Record<string, string> = {
  'stage1-board': 'لوح الجولة الجماعية',
  'stage1-letter': 'بلاطة الحروف',
  'stage1-charade': 'ولا كلمة',
  'stage1-question': 'سؤال الجولة الجماعية',
  'stage1-reveal': 'كشف الجولة الجماعية',
  interval: 'الفاصل بين المراحل',
  'stage2-selection': 'اختيار لاعبَي الديربي',
  'stage2-question': 'سؤال الديربي',
  'stage2-reveal': 'كشف الديربي',
  'stage3-play': 'الحق ما تلحق',
  tiebreak: 'سؤال الحسم',
  endgame: 'الختام',
}

const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const LEVELS = ['سهل', 'متوسط', 'صعب', 'تعجيزي']

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—')
const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(n))

export function Insights() {
  const [excludeAdmins, setExcludeAdmins] = useState(false)
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [allCats, setAllCats] = useState(false)

  const load = useCallback((ex: boolean) => {
    setLoading(true)
    setErr(null)
    fetchInsights(ex)
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : 'تعذّرت القراءة'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(excludeAdmins), [load, excludeAdmins])

  if (err) return <p className="a-err">{err}</p>
  if (!data) return <p className="a-note">…</p>

  const o = data.overview
  const g = data.games
  const cats = allCats ? data.categories : data.categories.slice(0, 15)
  const s3Total = g.s3_correct + g.s3_wrong

  return (
    <div className={'ins' + (loading ? ' busy' : '')}>
      <div className="a-bar">
        <label className="ins-toggle">
          <input type="checkbox" checked={excludeAdmins} onChange={(e) => setExcludeAdmins(e.target.checked)} />
          استبعد حسابات الإدارة
        </label>
        <button className="a-btn" onClick={() => load(excludeAdmins)} disabled={loading}>
          تحديث
        </button>
        <span className="a-muted">محدَّثة {stamp(data.generated_at)}</span>
      </div>

      <Section title="نظرة عامة">
        <div className="a-tiles">
          <Stat n={o.sessions} label="جلسة" sub={`${o.sessions_7d} في آخر 7 أيام`} />
          <Stat n={o.finished} label="مكتملة" sub={`${pct(o.finished, o.sessions)} من الجلسات`} />
          <Stat n={o.abandoned} label="منسحبة" sub={pct(o.abandoned, o.sessions)} />
          <Stat n={o.players} label="حساباً لعب" sub={`${o.returning} عاد ولعب مرّة ثانية`} />
          <Stat n={o.accounts} label="حساب" sub={`${o.accounts_7d} جديد في 7 أيام`} />
          <Stat n={o.median_minutes} label="دقيقة" sub="مدّة الجلسة المكتملة (الوسيط)" />
          <Stat n={o.questions_shown} label="سؤال عُرض" sub={`${num(o.avg_questions)} في اللعبة المكتملة`} />
          <Stat n={o.reports} label="بلاغ" sub={`${o.redemptions} استرداد كود هدية`} />
        </div>
      </Section>

      <Section title="الفئات الأكثر اختياراً" note="الفئات الستّ التي يختارها اللاعبون للّوح في الإعداد.">
        <Bars
          rows={cats.map((c) => ({
            label: c.name,
            hint: c.group ?? undefined,
            value: c.picks,
            title: `${c.name}: اختيرت ${c.picks} مرّة، منها ${c.finished} في جلسةٍ اكتملت`,
          }))}
        />
        {data.categories.length > 15 && (
          <button className="a-btn ins-more" onClick={() => setAllCats((v) => !v)}>
            {allCats ? 'أظهر أعلى 15' : `أظهر الكل (${data.categories.length})`}
          </button>
        )}
        {data.categories.length === 0 && <p className="a-note">لا جلسات بعد.</p>}
      </Section>

      <div className="ins-grid">
        <Section title="حسب التصنيف">
          <Bars rows={data.groups.map((x) => ({ label: x.name, value: x.picks, title: `${x.name}: ${x.picks} اختياراً` }))} />
        </Section>

        <Section title="لم يخترها أحد" note="فئاتٌ قابلة للّعب لم تدخل أيّ لوح.">
          {data.never_picked.length === 0 ? (
            <p className="a-note">كلُّ فئةٍ اختيرت مرّةً على الأقلّ.</p>
          ) : (
            <div className="ins-chips">
              {data.never_picked.map((n) => (
                <span key={n} className="tag">
                  {n}
                </span>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="ins-grid">
        <Section title="الأكثر ظهوراً على الشاشة" note="في المراحل كلّها — الديربي والحق ما تلحق تسحبان من غير الستّ.">
          <Bars
            rows={data.shown_by_category
              .slice(0, 12)
              .map((x) => ({ label: x.name, value: x.n, title: `${x.name}: ${x.n} سؤالاً عُرض` }))}
          />
        </Section>

        <Section title="الأسئلة المعروضة حسب المستوى">
          <Bars
            rows={LEVELS.map((l) => ({
              label: l,
              value: data.shown_by_level[l] ?? 0,
              title: `${l}: ${data.shown_by_level[l] ?? 0} سؤالاً`,
            }))}
          />
        </Section>
      </div>

      <Section title="الجلسات في آخر 30 يوماً" note="بتوقيت الكويت.">
        <Columns
          values={data.by_day.map((d) => d.n)}
          titles={data.by_day.map((d) => `${day(d.day)}: ${d.n} جلسة، ${d.finished} مكتملة`)}
          ticks={data.by_day.map((d, i) => (i % 5 === 0 || i === data.by_day.length - 1 ? day(d.day).slice(5) : ''))}
        />
      </Section>

      <div className="ins-grid">
        <Section title="حسب ساعة البدء">
          <Columns
            values={data.by_hour}
            titles={data.by_hour.map((n, h) => `الساعة ${h}:00 — ${n} جلسة`)}
            ticks={data.by_hour.map((_, h) => (h % 3 === 0 ? String(h) : ''))}
          />
        </Section>

        <Section title="حسب اليوم">
          <Bars
            rows={data.by_weekday.map((n, i) => ({ label: WEEKDAYS[i], value: n, title: `${WEEKDAYS[i]}: ${n} جلسة` }))}
            keepOrder
          />
        </Section>
      </div>

      <Section title="اللعب" note={`من ${g.measured} جلسة مكتملة.`}>
        <div className="a-tiles">
          <Stat n={g.avg_players} label="لاعباً في اللعبة" sub="متوسّط الفريقين معاً" />
          <Stat n={g.avg_winner} label="نقاط الفائز" sub={`والخاسر ${num(g.avg_loser)}`} />
          <Stat n={g.avg_margin} label="فارق النقاط" sub="متوسّط" />
          <Stat n={g.decided > 0 ? Math.round((g.starter_wins / g.decided) * 100) : null} label="% فوز البادئ" sub={`${g.starter_wins} من ${g.decided}`} />
          <Stat n={g.tiebreaks} label="احتاجت سؤال حسم" sub={pct(g.tiebreaks, g.measured)} />
          <Stat
            n={s3Total > 0 ? Math.round((g.s3_correct / s3Total) * 100) : null}
            label="% إصابة في الحق ما تلحق"
            sub={`${g.s3_correct} صح · ${g.s3_wrong} خطأ`}
          />
        </div>
        <div className="ins-grid">
          <div>
            <h4 className="ins-h4">متوسط نقاط الفريق في كلّ مرحلة</h4>
            <Bars
              keepOrder
              rows={[
                ['الجولة الجماعية', g.stage_avg?.s1],
                ['الديربي', g.stage_avg?.s2],
                ['الحق ما تلحق', g.stage_avg?.s3],
              ].map(([label, v]) => ({
                label: label as string,
                value: (v as number | null | undefined) ?? 0,
                title: `${label}: ${num(v as number | null | undefined)} نقطة للفريق`,
              }))}
            />
          </div>
          <div>
            <h4 className="ins-h4">حجم الفريقين</h4>
            <Bars rows={g.team_sizes.map((t) => ({ label: t.size, value: t.n, title: `${t.size}: ${t.n} جلسة` }))} />
          </div>
        </div>
      </Section>

      <div className="ins-grid">
        <Section title="أين تُترك الجلسة" note="الشاشة التي كانت مفتوحة حين انسحب اللاعبون.">
          <Bars
            rows={data.abandoned_at.map((x) => ({
              label: PHASES[x.phase] ?? x.phase,
              value: x.n,
              title: `${PHASES[x.phase] ?? x.phase}: ${x.n} جلسة`,
            }))}
          />
          {data.abandoned_at.length === 0 && <p className="a-note">لا جلسة منسحبة.</p>}
        </Section>

        <Section title="أكثر الحسابات لعباً">
          <div className="ins-rows">
            {data.top_accounts.map((a) => (
              <div key={a.email ?? a.last} className="ins-row">
                <span className="ins-mail">{a.email ?? '—'}</span>
                <span className="num">
                  {a.sessions} <small>({a.finished} مكتملة)</small>
                </span>
                <span className="a-muted">{day(a.last)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <p className="a-note">
        المصدر: جلسات الحسابات المسجّلة على الخادم. نتيجةُ كلّ سؤالٍ على حدة لا تُحفظ (المحفوظ مجاميع المراحل)، فلا
        يُعرف منها أصعبُ سؤال.
      </p>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="a-card ins-sec">
      <h3 className="ins-h3">{title}</h3>
      {note && <p className="ins-sub">{note}</p>}
      {children}
    </section>
  )
}

function Stat({ n, label, sub }: { n: number | null | undefined; label: string; sub?: string }) {
  return (
    <div className="a-tile">
      <b className="num">{num(n)}</b>
      <span>{label}</span>
      {sub && <small className="ins-tile-sub">{sub}</small>}
    </div>
  )
}

/**
 * أشرطةٌ أفقيّة مرتّبة — الاسم ثمّ الشريط ثمّ رقمه. الشريط يبدأ من جهة الاسم
 * (اليمين في RTL)، ويُقاس على أكبر قيمةٍ في القائمة.
 */
function Bars({
  rows,
  keepOrder = false,
}: {
  rows: { label: string; hint?: string; value: number; title: string }[]
  keepOrder?: boolean
}) {
  const list = keepOrder ? rows : [...rows].sort((a, b) => b.value - a.value)
  const max = Math.max(1, ...list.map((r) => r.value))
  return (
    <div className="ins-bars">
      {list.map((r) => (
        <div key={r.label} className="ins-bar" title={r.title}>
          <span className="ins-label">
            {r.label}
            {r.hint && <small> · {r.hint}</small>}
          </span>
          <span className="ins-track">
            <span className="ins-fill" style={{ width: `${(Math.max(0, r.value) / max) * 100}%` }} />
          </span>
          <span className="ins-val num">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * أعمدةٌ عموديّة لسلسلةٍ زمنيّة — **من اليسار إلى اليمين** ولو كانت الصفحة
 * عربيّة: المحور الزمنيّ يُقرأ كالساعة والتقويم، والأرقام تحته لاتينيّة.
 */
function Columns({ values, titles, ticks }: { values: number[]; titles: string[]; ticks: string[] }) {
  const max = Math.max(1, ...values)
  return (
    <div className="ins-cols" dir="ltr">
      <div className="ins-cols-max num">{Math.max(0, ...values)} أعلى عمود</div>
      <div className="ins-cols-plot">
        {values.map((v, i) => (
          <span key={i} className="ins-col" title={titles[i]}>
            <span className="ins-col-fill" style={{ height: `${(v / max) * 100}%` }} />
          </span>
        ))}
      </div>
      <div className="ins-cols-ticks">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}
