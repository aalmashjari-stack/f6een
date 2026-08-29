import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { deleteAccount, signOut } from '../lib/auth'

/**
 * حساب اللاعب — الخروج والحذف.
 *
 * **يظهر خارج اللعب فقط.** لا مكان له فوق سؤال مؤقّت أو ديربي: الشاشة
 * وقتها للمجلس لا لإدارة الحساب.
 *
 * وحذف الحساب **شرط متجر آبل** لكل تطبيق يسمح بإنشائه، ووعدٌ صريح في سياسة
 * الخصوصيّة المنشورة. فهو بضغطتين ولونٍ صريح في الثانية — لا يُبلَغ سهواً،
 * ولا يُخفى خلف بريد يُراسَل.
 */
export function AccountMenu({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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

  return (
    <>
      <button className="acct-tab" onClick={() => setOpen((v) => !v)} title={email}>
        {open ? '×' : 'حسابي'}
      </button>

      {open && (
        <div className="acct-panel" role="dialog" aria-label="حسابي">
          <p className="acct-mail">{email}</p>

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
      `}</style>
    </>
  )
}
