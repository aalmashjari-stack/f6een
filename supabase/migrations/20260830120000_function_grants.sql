-- صلاحيّات تنفيذ الدوالّ — إصلاحُ ما لم يُطبَّق (٣٠ أغسطس ٢٠٢٦).
--
-- الدوالّ في Postgres قابلة للتنفيذ من PUBLIC افتراضاً، ولذلك كُتب مع كل
-- واحدة منها `revoke … from public` ثم `grant … to authenticated`. لكنّ
-- المُتحقَّق منه على القاعدة الحيّة أنّ الدور `anon` — أي أيّ زائر يحمل
-- المفتاح العلنيّ بلا تسجيل — كان ينفّذ الثلاث جميعاً.
--
-- **الضرر الحقيقيّ واحد: تعداد أكواد الهدية.** `redeem_gift_code` تفرّق
-- بردّها بين كودٍ موجود وكودٍ لا وجود له، فمن ينفّذها بلا حساب يغربل
-- الاحتمالات حتى يعثر على كودٍ صالح — وأكواد الهدية أصولُ تسويقٍ مربوطة
-- بأصحابها (SPEC ٩). أمّا `start_session` فتردّ `no_balance` لأنّ
-- `auth.uid()` معدومة، و`delete_own_account` يحرسها شرطُ `not_authenticated`
-- الصريح — ولولاه لحذفت `where id = null` أي لا شيء، ثمّ أعادت نجاحاً.
--
-- والدرس: صلاحيّة التنفيذ تُختبَر بالمفتاح العلنيّ وحده لا يُفترض أنّها
-- طُبِّقت لأنّ السطر مكتوب في ملفّ الهجرة — انظر [[f6een-supabase]].

revoke execute on function
  public.redeem_gift_code(text),
  public.start_session(jsonb),
  public.delete_own_account()
from public, anon;

grant execute on function
  public.redeem_gift_code(text),
  public.start_session(jsonb),
  public.delete_own_account()
to authenticated;
