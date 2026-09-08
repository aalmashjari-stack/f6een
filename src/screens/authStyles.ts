/**
 * أنماط شاشات الحساب — إنشاءُ الحساب والدخول وتعيين كلمة السرّ.
 *
 * **في وحدةٍ مشتركة لا في شاشةٍ واحدة**: كانت هنا داخل `SignUp.tsx` تُحقن
 * منه، و`ResetPassword` يستعمل أسماء الأصناف نفسها بلا حقن — فمن فتح رابط
 * الاستعادة رأى صفحةً عاريةً بلا بطاقة ولا زرّ (٨ سبتمبر ٢٠٢٦). وأيّ شاشةٍ
 * ثالثة تستعمل `su-*` تستوردها من هنا وتحقنها، ولا تنسخها.
 */
/* البادئة "body .screen" لازمة لتغلب overflow:hidden في theme.css — نفس ما
   يفعله الإعداد. */
export const AUTH_CSS = `
  body .screen.su { overflow-y:auto; }
  .su { display:flex; justify-content:center; align-items:flex-start;
        padding:clamp(12px,3vh,32px) clamp(14px,4vw,32px); }
  .su-row { display:grid; grid-template-columns:1fr 1fr; gap:clamp(8px,1.4vw,12px); }
  .su-row.phone { grid-template-columns:1.15fr 1fr; }
  .su-card {
    width:min(480px, 100%); margin-inline:auto;
    display:flex; flex-direction:column; gap:clamp(9px,1.5vh,14px);
    background:var(--n-surface,#fff); border-radius:var(--n-r3,20px);
    box-shadow:var(--n-e2); padding:clamp(18px,3.4vw,30px);
  }
  .su-done { text-align:center; gap:14px; }
  .su-title { margin:0; text-align:center; font-weight:800;
              font-size:clamp(20px,3.4vw,30px); color:var(--n-brand,#7A3E9D); }
  .su-sub { margin:0 0 4px; text-align:center; color:var(--n-ink-2,#5D5670);
            font-weight:600; line-height:1.8; font-size:clamp(12px,1.6vw,15px); }
  .su-in {
    font:inherit; font-weight:700; width:100%;
    padding:clamp(9px,1.5vh,13px) clamp(10px,1.6vw,14px);
    border:1px solid var(--n-line,#E5E1F0); border-radius:var(--n-r2,14px);
    background:var(--n-surface-2,#F8F7FC); color:var(--n-ink,#1A1626);
    font-size:clamp(13px,1.7vw,16px);
  }
  .su-in::placeholder { color:var(--n-ink-3,#948CA8); font-weight:700; }
  .su-in:focus { outline:none; border-color:var(--n-brand,#7A3E9D); background:#fff; }
  .su-terms { display:flex; align-items:flex-start; gap:8px;
              font-size:clamp(12px,1.5vw,14px); color:var(--n-ink-2,#5D5670); font-weight:700; }
  .su-terms input { margin-top:5px; accent-color:var(--n-brand,#7A3E9D); }
  .su-terms a { color:var(--n-brand,#7A3E9D); }
  .su-err { margin:0; color:var(--n-bad,#DC4033); font-weight:800;
            font-size:clamp(12px,1.6vw,15px); }
  .su-submit {
    font:inherit; font-weight:800; cursor:pointer; border:0;
    border-radius:var(--n-r3,20px); padding:clamp(10px,1.8vh,15px);
    font-size:clamp(14px,2vw,19px);
    background:var(--n-ink,#1A1626); color:#fff; box-shadow:var(--n-e2);
  }
  .su-submit:disabled { background:rgba(23,23,31,.07); color:var(--n-ink-3,#948CA8); box-shadow:none; }
  .su-foot { display:flex; justify-content:space-between; gap:10px; }
  .su-note { margin:0; color:var(--n-ink-2,#5C5470); font-weight:700; line-height:1.5;
             font-size:clamp(12px,1.5vh,14px); }
  .su-recover { justify-content:space-between; gap:10px; }
  .su-link:disabled { opacity:.5; cursor:default; }
  .su-link { background:none; border:0; cursor:pointer; font:inherit; font-weight:700;
             font-size:clamp(11px,1.4vw,14px); color:var(--n-ink-3,#948CA8); }
  .su-link:hover { color:var(--n-brand,#7A3E9D); }
`
