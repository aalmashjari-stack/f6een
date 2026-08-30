import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { deleteAccount, signOut } from '../lib/auth'
import { day } from '../lib/date'
import type { GameSummary, Profile } from '../lib/games'
import { fetchMyGames, fetchProfile, gamesLabel, redeemGiftCode } from '../lib/games'

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
export function AccountMenu({
  session,
  balance,
  onBalance,
}: {
  session: Session
  balance?: number | null
  onBalance?: (n: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [gift, setGift] = useState<{ ok: boolean; msg: string } | null>(null)
  const [redeeming, setRedeeming] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [games, setGames] = useState<GameSummary[] | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)

  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>
  const email = session.user.email ?? 'حساب مجهول'
  const name =
    str(meta.full_name) ||
    [str(meta.first_name), str(meta.last_name)].filter(Boolean).join(' ') ||
    ''
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
        if (alive) setLoadErr(e instanceof Error ? e.message : 'تعذّرت القراءة')
      })
    return () => {
      alive = false
    }
  }, [open, onBalance])

  /* Escape يغلق: الصفحة تغطّي الشاشة، والمخرج يجب أن يكون بيد الحكم دائماً. */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function run(fn: () => Promise<void>) {
    setErr(null)
    setBusy(true)
    try {
      await fn()
      /* لا إفراغ لـbusy عند النجاح: الجلسة تختفي فتُبدَّل الشاشة كلّها. */
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذّر التنفيذ')
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
      setGift({ ok: false, msg: e2 instanceof Error ? e2.message : 'تعذّرت الإضافة' })
    } finally {
      setRedeeming(false)
    }
  }

  const shown = profile ? profile.balance : balance

  return (
    <>
      <button className="acct-tab" onClick={() => setOpen(true)} title={email}>
        حسابي
      </button>

      {open && (
        <div className="acct-veil" onClick={() => setOpen(false)}>
          <div
            className="acct-panel"
            role="dialog"
            aria-label="حسابي"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="acct-head">
              <h2 className="acct-title">حسابي</h2>
              <button className="acct-x" onClick={() => setOpen(false)} aria-label="إغلاق">
                ×
              </button>
            </header>

            <div className="acct-body">
              <section className="acct-sec">
                <h3 className="acct-h3">بياناتي</h3>
                <dl className="acct-data">
                  {name && <Row label="الاسم" value={name} />}
                  <Row label="البريد" value={email} ltr />
                  {phone && <Row label="الهاتف" value={phone} ltr />}
                  {birth && <Row label="الميلاد" value={day(birth)} />}
                  <Row label="عضو منذ" value={profile ? day(profile.createdAt) : '…'} />
                  <Row
                    label="الرصيد"
                    value={shown === null || shown === undefined ? '…' : gamesLabel(shown)}
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
                <h3 className="acct-h3">
                  ألعابي{games && games.length > 0 ? ` · ${games.length}` : ''}
                </h3>
                {loadErr && <p className="acct-err">{loadErr}</p>}
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
                <p className="acct-warn">
                  يُحذف الحساب ورصيده وسجلّ الأسئلة التي ظهرت لك وألعابك. لا رجوع.
                </p>
              )}
              {err && <p className="acct-err">{err}</p>}
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .acct-tab {
          position:fixed; inset-block-end:clamp(6px,1.2vh,14px);
          inset-inline-start:clamp(6px,1.2vw,16px);
          z-index:50;
          font:inherit; font-weight:800; cursor:pointer;
          font-size:clamp(10px,1.3vw,14px);
          padding:clamp(4px,.8vh,8px) clamp(8px,1.4vw,14px);
          border:0; border-radius:999px;
          background:var(--n-surface, #fff); color:var(--n-ink-3, #948CA8);
          box-shadow:var(--n-e1, 0 1px 2px rgba(0,0,0,.08));
          opacity:.55; transition:opacity .2s ease;
        }
        .acct-tab:hover { opacity:1; }

        /* الغطاء يُغلق بالضغط خارج الصفحة — المخرج نفسه الذي يتوقّعه الإبهام. */
        .acct-veil {
          position:fixed; inset:0; z-index:60;
          display:flex; align-items:center; justify-content:center;
          padding:clamp(8px,2vh,24px);
          background:rgba(10,8,20,.5);
          backdrop-filter:blur(2px);
        }

        /* الصفحة لا تتمدّد بتمدّد قائمة الألعاب: ارتفاعها مقيَّد والقائمة
           وحدها تتمرّر داخلها — فتبقى القاعدة «الشاشة الواحدة» قائمة. */
        .acct-panel {
          display:flex; flex-direction:column;
          width:min(560px, 100%); max-height:min(86vh, 760px);
          overflow:hidden;
          background:var(--n-surface, #fff); color:var(--n-ink, #1A1626);
          border-radius:var(--n-r2, 14px);
          box-shadow:var(--n-e3, 0 22px 50px rgba(0,0,0,.16));
        }
        .acct-head {
          display:flex; align-items:center; justify-content:space-between;
          gap:8px; padding:14px 16px 10px;
          border-block-end:1px solid var(--n-line, #E5E1F0);
        }
        .acct-title { margin:0; font-size:17px; font-weight:900; }
        .acct-x {
          font:inherit; font-size:20px; font-weight:800; line-height:1;
          cursor:pointer; border:0; border-radius:999px;
          width:32px; height:32px;
          background:var(--n-surface-2, #F8F7FC); color:var(--n-ink-2, #5D5670);
        }

        .acct-body { overflow:auto; padding:14px 16px; display:flex; flex-direction:column; gap:18px; }
        .acct-sec { display:flex; flex-direction:column; gap:8px; }
        .acct-h3 {
          margin:0; font-size:12px; font-weight:900; letter-spacing:.02em;
          color:var(--n-ink-3, #948CA8);
        }

        .acct-data { margin:0; display:grid; grid-template-columns:auto 1fr; gap:6px 12px; }
        .acct-k { font-size:13px; font-weight:700; color:var(--n-ink-3, #948CA8); }
        .acct-v {
          margin:0; font-size:14px; font-weight:700; color:var(--n-ink-2, #5D5670);
          overflow-wrap:anywhere;
        }
        /* القيمة اللاتينية تبقى على حافة العمود نفسها: محاذاة البداية مع
           اتّجاهٍ لاتينيّ تقذفها إلى الطرف المقابل فتنفصل عن مفتاحها. */
        .acct-v.ltr { direction:ltr; text-align:end; }
        .acct-v.strong { font-weight:900; color:var(--n-brand, #7A3E9D); }

        .acct-gift { display:grid; grid-template-columns:1fr auto; gap:8px; margin-block-start:4px; }
        .acct-in {
          font:inherit; font-weight:700; font-size:14px; width:100%;
          padding:9px 12px; border-radius:10px;
          border:1px solid var(--n-line, #E5E1F0);
          background:var(--n-surface-2, #F8F7FC); color:var(--n-ink, #1A1626);
        }
        .acct-in::placeholder { color:var(--n-ink-3, #948CA8); font-weight:700; }
        .acct-in:focus { outline:none; border-color:var(--n-brand, #7A3E9D); background:#fff; }

        .acct-games { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
        .g-row {
          display:flex; flex-direction:column; gap:4px;
          padding:9px 11px; border-radius:10px;
          background:var(--n-surface-2, #F8F7FC);
        }
        .g-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .g-date { font-size:12px; font-weight:700; color:var(--n-ink-3, #948CA8); }
        .g-tag { font-size:11px; font-weight:800; padding:2px 8px; border-radius:999px;
          background:var(--n-surface, #fff); color:var(--n-ink-3, #948CA8); }
        .g-tag.open { color:var(--n-brand, #7A3E9D); }
        .g-teams { display:flex; align-items:baseline; gap:8px; font-size:14px; font-weight:700;
          flex-wrap:wrap; }
        .g-pair { display:inline-flex; align-items:baseline; gap:8px; }
        .g-team { display:inline-flex; align-items:baseline; gap:6px;
          color:var(--n-ink-2, #5D5670); }
        /* الرقم معزول اتّجاهياً: النقاط تنزل تحت الصفر (SPEC ٢)، و«−10» داخل
           سطرٍ عربيّ يُقلب إلى «10−» بلا هذا العزل. */
        .g-score { direction:ltr; unicode-bidi:isolate; font-variant-numeric:tabular-nums; }
        /* الفائز وحده ملوّن: الصفّ يُقرأ بلمحة، والسؤال الوحيد فيه «مين فاز؟». */
        .g-team.win { color:var(--n-brand, #7A3E9D); font-weight:900; }
        .g-sep { color:var(--n-ink-3, #948CA8); }
        .g-none { font-size:13px; font-weight:700; color:var(--n-ink-3, #948CA8); }

        .acct-foot {
          display:flex; flex-direction:column; gap:8px;
          padding:12px 16px 14px;
          border-block-start:1px solid var(--n-line, #E5E1F0);
        }
        .acct-act {
          font:inherit; font-weight:800; cursor:pointer;
          font-size:14px; padding:9px 12px;
          border:0; border-radius:10px;
          background:var(--n-surface-2, #F8F7FC); color:var(--n-ink, #1A1626);
          transition:background .2s ease, color .2s ease;
        }
        .acct-act:disabled { opacity:.5; cursor:default; }
        .acct-act.danger { color:var(--n-bad, #DC4033); }
        /* الحالة المسلَّحة صريحة اللون: لا تُضغط وهي بلون الحياد. */
        .acct-act.danger.armed { background:var(--n-bad, #DC4033); color:#fff; }
        .acct-warn, .acct-err, .acct-note {
          margin:0; font-size:12px; font-weight:700; line-height:1.6;
        }
        .acct-warn { color:var(--n-ink-2, #5D5670); }
        .acct-note { color:var(--n-ink-3, #948CA8); }
        .acct-err { color:var(--n-bad, #DC4033); }
        .acct-ok {
          margin:0; font-size:12px; font-weight:800; line-height:1.6;
          color:var(--n-good, #2F9E63);
        }
      `}</style>
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
