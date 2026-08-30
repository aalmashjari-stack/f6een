import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { deleteAccount, signOut } from '../lib/auth'
import { fetchBalance, gamesLabel, redeemGiftCode } from '../lib/games'

/**
 * حساب اللاعب — الخروج والحذف.
 *
 * **يظهر خارج اللعب فقط.** لا مكان له فوق سؤال مؤقّت أو ديربي: الشاشة
 * وقتها للمجلس لا لإدارة الحساب.
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

  const email = session.user.email ?? 'حساب مجهول'

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
      const games = await redeemGiftCode(code)
      setCode('')
      setGift({ ok: true, msg: `أُضيفت ${gamesLabel(games)} إلى رصيدك` })
      /* الرصيد يُقرأ من الخادم لا يُجمع هنا: الجمع المحلّي يفترق عن الحقيقة
         عند أوّل استبدالٍ من جهازٍ آخر. */
      if (onBalance) fetchBalance().then(onBalance).catch(() => {})
    } catch (e2) {
      setGift({ ok: false, msg: e2 instanceof Error ? e2.message : 'تعذّرت الإضافة' })
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <>
      <button className="acct-tab" onClick={() => setOpen((v) => !v)} title={email}>
        {open ? '×' : 'حسابي'}
      </button>

      {open && (
        <div className="acct-panel" role="dialog" aria-label="حسابي">
          <p className="acct-mail">{email}</p>

          <p className="acct-bal">
            الرصيد: <b>{balance === null || balance === undefined ? '…' : gamesLabel(balance)}</b>
          </p>

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
              يُحذف الحساب ورصيده وسجلّ الأسئلة التي ظهرت لك. لا رجوع.
            </p>
          )}
          {err && <p className="acct-err">{err}</p>}
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

        .acct-panel {
          position:fixed; inset-block-end:clamp(34px,5vh,54px);
          inset-inline-start:clamp(6px,1.2vw,16px);
          z-index:51;
          display:flex; flex-direction:column; gap:8px;
          width:min(300px, 84vw);
          padding:14px;
          background:var(--n-surface, #fff); color:var(--n-ink, #1A1626);
          border-radius:var(--n-r2, 14px);
          box-shadow:var(--n-e3, 0 22px 50px rgba(0,0,0,.16));
        }
        .acct-mail {
          margin:0 0 2px; font-size:13px; font-weight:700;
          color:var(--n-ink-3, #948CA8);
          overflow-wrap:anywhere; direction:ltr; text-align:start;
        }
        .acct-bal { margin:0; font-size:14px; font-weight:700; color:var(--n-ink-2, #5D5670); }
        .acct-bal b { color:var(--n-brand, #7A3E9D); }
        .acct-gift { display:grid; grid-template-columns:1fr auto; gap:8px; }
        .acct-in {
          font:inherit; font-weight:700; font-size:14px; width:100%;
          padding:9px 12px; border-radius:10px;
          border:1px solid var(--n-line, #E5E1F0);
          background:var(--n-surface-2, #F8F7FC); color:var(--n-ink, #1A1626);
        }
        .acct-in::placeholder { color:var(--n-ink-3, #948CA8); font-weight:700; }
        .acct-in:focus { outline:none; border-color:var(--n-brand, #7A3E9D); background:#fff; }
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
        .acct-warn, .acct-err {
          margin:0; font-size:12px; font-weight:700; line-height:1.6;
        }
        .acct-warn { color:var(--n-ink-2, #5D5670); }
        .acct-err { color:var(--n-bad, #DC4033); }
        .acct-ok {
          margin:0; font-size:12px; font-weight:800; line-height:1.6;
          color:var(--n-good, #2F9E63);
        }
      `}</style>
    </>
  )
}
