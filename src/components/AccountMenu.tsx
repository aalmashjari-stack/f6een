import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authErrorText, deleteAccount, signOut } from '../lib/auth'
import { day } from '../lib/date'
import { isAdmin } from '../lib/admin'
import { isNativeApp } from '../lib/platform'
import type { GameSummary, Profile } from '../lib/games'
import { fetchMyGames, fetchProfile, gamesLabel, redeemGiftCode } from '../lib/games'
import accountMenuCss from './AccountMenu.css?inline'

/**
 * صفحة الحساب — بيانات اللاعب وألعابه، والخروج والحذف.
 *
 * **تظهر خارج اللعب فقط.** لا مكان لها فوق سؤال مؤقّت أو ديربي: الشاشة وقتها
 * للمجلس لا لإدارة الحساب.
 *
 * وحذف الحساب **شرط متجر آبل** لكل تطبيق يسمح بإنشائه، ووعدٌ صريح في سياسة
 * الخصوصيّة المنشورة. فهو بضغطتين ولونٍ صريح في الثانية — لا يُبلَغ سهواً،
 * ولا يُخفى خلف بريد يُراسَل.
 *
 * والرصيد وكود الهدية هنا بموضع SPEC القسم ٩: «الحقل في شاشة حسابي، **لا**
 * في شاشة الشراء جنب الأسعار مع مجموع متغيّر».
 *
 * واللفظ «إضافة» لا «استبدال» بقرار علي (٣٠ أغسطس ٢٠٢٦)، وSPEC ٩ يتبعه الآن.
 * ويبقى المحظور محظوراً: لا «خصم» ولا «كوبون» في أيّ نصّ، فهما ما يخرجان
 * باللعبة من قواعد آبل.
 *
 * **بيانات اللاعب تُقرأ من `user_metadata` لا من جدول.** هي مكتوبة هناك عند
 * التسجيل (انظر `signUpWithEmail`)، ونسخُها في `profiles` يصنع نسختين
 * تفترقان. و«عضو منذ» وحده من القاعدة لأنّه ليس فيها.
 */
/**
 * نصُّ الخطأ أيّاً كان شكلُه.
 *
 * أخطاءُ supabase-js ليست من نوع `Error` بل كائناتُ `PostgrestError`، فشرطُ
 * `instanceof Error` وحده كان يسقط عليها فيُعرض نصٌّ احتياطيّ عامّ —
 * ويضيع سببُ العطل الذي يكتبه الخادم. تُقرأ `message` أنّى وُجدت، ويبقى
 * الاحتياطيّ لما لا نصَّ فيه أصلاً.
 */
function errText(e: unknown): string {
  return authErrorText(e, 'تعذّرت القراءة')
}

export function AccountMenu({
  session,
  balance,
  onBalance,
  open,
  onClose,
}: {
  session: Session
  balance?: number | null
  onBalance?: (n: number) => void
  /* الفتح بيد قائمة الرأس في شاشة الإعداد (١ سبتمبر ٢٠٢٦) — كان هنا زرّ
     «حسابي» عائم في الزاوية، وصار بنداً في القائمة مع الشراء والتواصل. */
  open: boolean
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [gift, setGift] = useState<{ ok: boolean; msg: string } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [admin, setAdmin] = useState(false)
  const [games, setGames] = useState<GameSummary[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  /* «أعد المحاولة» تزيده فتُعاد القراءة نفسها (علي ٥ أكتوبر ٢٠٢٦، من تدقيق
     التجربة): كان الخطأ يُقال تحت «ألعابي» وحدها، و«عضو منذ» يبقى «…» إلى
     الأبد، ولا سبيل إلى إعادةٍ إلّا بإغلاق الصفحة وفتحها. */
  const [reload, setReload] = useState(0)

  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>
  const email = session.user.email ?? 'حساب مجهول'
  const name =
    str(meta.full_name) || [str(meta.first_name), str(meta.last_name)].filter(Boolean).join(' ') || ''
  const phone = str(meta.phone)
  const birth = str(meta.birth_date)

  /* القراءة عند الفتح لا عند التركيب: الصفحة مغلقة معظم الوقت، وطلبان لكل
     عرضٍ لشاشة الإعداد بلا فائدة. */
  useEffect(() => {
    if (!open) return
    let alive = true
    setLoadErr(null)
    Promise.all([fetchProfile(), fetchMyGames()])
      .then(([p, g]) => {
        if (!alive) return
        setProfile(p)
        setGames(g)
        /* الرصيد المقروء هنا يُصعَّد إلى التطبيق: هو أحدث ممّا قرأه عند الإقلاع. */
        if (onBalance) onBalance(p.balance)
      })
      .catch((e) => {
        if (alive) setLoadErr(errText(e))
      })
    /* منفصلة عن الأولى: من ليس مديراً — وهو كل اللاعبين — يردّ الخادم عليه
       بخطأ صلاحية، ولو كان في نفس `Promise.all` لابتلع الخطأُ الرصيدَ
       والألعاب معه فرأى اللاعب صفحة فارغة. */
    isAdmin()
      .then((v) => alive && setAdmin(v))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open, onBalance, reload])

  /* **التسليح لا يعيش بعد لحظته** (علي ٥ أكتوبر ٢٠٢٦، من تدقيق التجربة):
     كانت الضغطة الأولى على «حذف الحساب» تبقى بعد الإغلاق — المكوّن مركَّبٌ
     ما دام الإعداد — فمن عاد إلى «حسابي» بعد دقائق وجد الحذف النهائيّ على
     بُعد ضغطة. يُصفَّر عند الإغلاق، وينطفئ وحده بعد خمس ثوانٍ كـ«إنهاء». */
  useEffect(() => {
    if (!open) setConfirming(false)
  }, [open])
  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 5000)
    return () => clearTimeout(t)
  }, [confirming])

  /* Escape يغلق: الصفحة تغطّي الشاشة، والمخرج يجب أن يكون بيد الحكم دائماً. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function run(fn: () => Promise<void>) {
    setErr(null)
    setBusy(true)
    try {
      await fn()
      /* لا إفراغ لـbusy عند النجاح: الجلسة تختفي فتُبدَّل الشاشة كلّها. */
    } catch (e) {
      setErr(authErrorText(e, 'تعذّر التنفيذ'))
      setBusy(false)
    }
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || redeeming) return
    setGift(null)
    setRedeeming(true)
    try {
      const games2 = await redeemGiftCode(code)
      setCode('')
      setGift({ ok: true, msg: `أُضيفت ${gamesLabel(games2)} إلى رصيدك` })
      /* الرصيد يُقرأ من الخادم لا يُجمع هنا: الجمع المحلّي يفترق عن الحقيقة
         عند أوّل إضافةٍ من جهازٍ آخر. */
      fetchProfile()
        .then((p) => {
          setProfile(p)
          if (onBalance) onBalance(p.balance)
        })
        .catch(() => {})
    } catch (e2) {
      setGift({ ok: false, msg: authErrorText(e2, 'تعذّرت الإضافة') })
    } finally {
      setRedeeming(false)
    }
  }

  const shown = profile ? profile.balance : balance

  return (
    <>
      {open && (
        <div className="acct-veil" onClick={onClose}>
          <div className="acct-panel" role="dialog" aria-label="حسابي" onClick={(e) => e.stopPropagation()}>
            <header className="acct-head">
              <h2 className="acct-title">حسابي</h2>
              <button className="acct-x" onClick={onClose} aria-label="إغلاق">
                ×
              </button>
            </header>

            <div className="acct-body">
              {loadErr && (
                <div className="acct-load-err" role="alert">
                  <p className="acct-err">{loadErr}</p>
                  <button className="acct-act" onClick={() => setReload((n) => n + 1)}>
                    أعد المحاولة
                  </button>
                </div>
              )}
              <section className="acct-sec">
                <h3 className="acct-h3">بياناتي</h3>
                <dl className="acct-data">
                  {name && <Row label="الاسم" value={name} />}
                  <Row label="البريد" value={email} ltr />
                  {phone && <Row label="الهاتف" value={phone} ltr />}
                  {birth && <Row label="الميلاد" value={day(birth)} />}
                  <Row label="عضو منذ" value={profile ? day(profile.createdAt) : loadErr ? '—' : '…'} />
                  <Row
                    label="الرصيد"
                    value={shown === null || shown === undefined ? (loadErr ? '—' : '…') : gamesLabel(shown)}
                    strong
                  />
                </dl>

                <form className="acct-gift" onSubmit={redeem}>
                  <input
                    className="acct-in"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="كود هدية"
                    aria-label="كود هدية"
                    dir="ltr"
                  />
                  <button className="acct-act" type="submit" disabled={redeeming || !code.trim()}>
                    {redeeming ? '…' : 'إضافة'}
                  </button>
                </form>
                {gift && <p className={gift.ok ? 'acct-ok' : 'acct-err'}>{gift.msg}</p>}
              </section>

              <section className="acct-sec">
                <h3 className="acct-h3">ألعابي{games && games.length > 0 ? ` · ${games.length}` : ''}</h3>
                {loadErr && games === null && <p className="acct-note">—</p>}
                {!loadErr && games === null && <p className="acct-note">…</p>}
                {!loadErr && games !== null && games.length === 0 && (
                  <p className="acct-note">لا ألعاب بعد — أوّل لعبة تظهر هنا.</p>
                )}
                {games !== null && games.length > 0 && (
                  <ul className="acct-games">
                    {games.map((g) => (
                      <GameRow key={g.id} game={g} />
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <footer className="acct-foot">
              {/* لا يظهر إلّا لمن تقول القاعدة إنّه مدير — والزرّ راحةٌ لا
                  حراسة: من كتب العنوان بيده يصل إلى الصفحة نفسها، ولا يرى
                  فيها شيئاً ما لم يكن صفّه في `admins`.

                  و`target="_blank"` في المتصفّح وحده: هناك يفتح اللوحة في
                  تبويب جديد فتبقى اللعبة مفتوحة. أمّا في التطبيق الأصليّ
                  فـCapacitor يحوّل الهدف الجديد إلى **سفاري النظام**، ويطلب
                  منه فتح `capacitor://localhost/admin.html` — وهو عنوانٌ لا
                  يعرفه، فلا يحدث شيء. فينتقل في مكانه، والرجوع من زرّ
                  «العودة للرئيسية» في رأس اللوحة. */}
              {admin && (
                <a
                  className="acct-act admin"
                  href="./admin.html"
                  {...(isNativeApp ? {} : { target: '_blank', rel: 'noreferrer' })}
                >
                  لوحة الإدارة
                </a>
              )}

              <button className="acct-act" disabled={busy} onClick={() => run(signOut)}>
                الخروج من الحساب
              </button>

              <button
                className={'acct-act danger' + (confirming ? ' armed' : '')}
                disabled={busy}
                onClick={() => (confirming ? run(deleteAccount) : setConfirming(true))}
              >
                {confirming ? 'تأكيد الحذف النهائي' : 'حذف الحساب'}
              </button>

              {confirming && (
                <p className="acct-warn">يُحذف الحساب ورصيده وسجلّ الأسئلة التي ظهرت لك وألعابك. لا رجوع.</p>
              )}
              {err && <p className="acct-err">{err}</p>}
            </footer>
          </div>
        </div>
      )}

      <style>{accountMenuCss}</style>
    </>
  )
}

function Row({
  label,
  value,
  ltr,
  strong,
}: {
  label: string
  value: string
  ltr?: boolean
  strong?: boolean
}) {
  return (
    <>
      <dt className="acct-k">{label}</dt>
      <dd className={'acct-v' + (ltr ? ' ltr' : '') + (strong ? ' strong' : '')}>{value}</dd>
    </>
  )
}

const STATUS: Record<GameSummary['status'], string> = {
  open: 'لم تكتمل بعد',
  finished: 'مكتملة',
  abandoned: 'منسحبة',
}

function GameRow({ game }: { game: GameSummary }) {
  const teams = game.teams
  const top =
    teams && teams.length === 2 && teams[0].score !== teams[1].score
      ? teams[0].score > teams[1].score
        ? 0
        : 1
      : -1

  /* التعادل يُقال صراحةً: غياب اللون على الفريقين يحتمل «تعادلا» ويحتمل
     «لم تُنقَّط»، والصفّ يُقرأ بلمحة فلا يُترك للاستنتاج. */
  const tie = game.status === 'finished' && teams?.length === 2 && teams[0].score === teams[1].score

  return (
    <li className="g-row">
      <div className="g-top">
        <span className="g-date">{day(game.createdAt)}</span>
        <span className={'g-tag' + (game.status === 'open' ? ' open' : '')}>
          {STATUS[game.status]}
          {tie ? ' · تعادل' : ''}
        </span>
      </div>
      {teams && teams.length === 2 ? (
        <div className="g-teams">
          {teams.map((t, i) => (
            <span key={i} className="g-pair">
              {i > 0 && <span className="g-sep">·</span>}
              <span className={'g-team' + (i === top ? ' win' : '')}>
                <span className="g-name">{t.name}</span>
                <span className="g-score">{t.score}</span>
              </span>
            </span>
          ))}
        </div>
      ) : (
        <span className="g-none">بلا تفاصيل</span>
      )}
    </li>
  )
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
