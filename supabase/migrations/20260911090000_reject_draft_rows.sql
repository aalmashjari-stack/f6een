-- **استبعادُ مسوّدةٍ بعينها قبل اعتماد الدفعة** (طلب علي ١١ سبتمبر ٢٠٢٦).
--
-- كان القرار على الدفعة كلّها: تُعتمد بثمانين سؤالاً أو تُرفض بثمانين. فمن
-- أراد إسقاط خمسةٍ منها لم يكن أمامه إلّا رفضُ الدفعة كلّها وإعادةُ
-- إرسالها منقّحة — وهذا يعني أن يمرّ المؤلّف على القائمة مرّتين، ويعني
-- أنّ خطأً واحداً يُسقط تسعةً وسبعين سؤالاً سليماً.
--
-- **ولا دالّة اعتمادٍ جديدة**: `admin_approve_drafts` تمرّ على المعلَّق
-- وحده (`status = 'pending'`)، فالمستبعَد يخرج من طريقها بطبعه. الاستبعادُ
-- رفضٌ لصفٍّ لا فعلٌ ثالث.

create or replace function public.admin_reject_draft_rows(p_ids bigint[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    raise exception 'bad_payload';
  end if;

  /* المعلَّق وحده يُستبعَد: صفٌّ اعتُمد صار سؤالاً في البنك، ورفضُه هنا
     يترك السؤالَ في يد اللاعب وحالتَه «مرفوض» — كذبةٌ في السجلّ. حذفُ
     المعتمَد من لسان الأسئلة لا من هنا. */
  update public.question_drafts
     set status = 'rejected', decided_at = now(), decided_by = (select auth.uid())
   where id = any (p_ids) and status = 'pending';

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.admin_reject_draft_rows(bigint[]) from public, anon;
grant  execute on function public.admin_reject_draft_rows(bigint[]) to authenticated;

/* ═══════════ وعمودُ «تعجيزي» في ملخّص الدفعة ═══════════ */
/*
   الملخّص كان ثلاثة مستويات، فدفعةُ ثمانين سؤالاً تظهر ٢٠+٢٠+٢٠ ومجموعُها
   ٨٠ — عشرون سؤالاً لا يعرف المديرُ أين ذهبت. وهذا ثالثُ موضعٍ يتخلّف عن
   «تعجيزي» منذ ٩ سبتمبر (بعد صفوف اللوح وجدول الفئات في اللوحة)؛ الدرسُ
   مكتوبٌ في `levels.ts`: من زاد مستوىً فليمرّ على مواضعه كلّها.

   وشكلُ الإرجاع تغيّر، فلا بدّ من الحذف قبل الإنشاء.
*/

drop function if exists public.admin_draft_batches();

create function public.admin_draft_batches()
returns table (
  batch uuid, source text, status text, n bigint,
  categories text, created_at timestamptz,
  easy bigint, medium bigint, hard bigint, taajizi bigint,
  pending bigint, rejected bigint,
  missing_category boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.batch,
         min(d.source),
         /* حالةُ الدفعة: ما دام فيها معلَّقٌ واحد فهي تنتظر قراراً — ولو
            استُبعد بعضُ صفوفها. وإلّا اختفت من الشاشة بأوّل استبعاد. */
         case when count(*) filter (where d.status = 'pending') > 0 then 'pending'
              when count(*) filter (where d.status = 'approved') > 0 then 'approved'
              else 'rejected' end,
         count(*),
         string_agg(distinct d.category, ' · '),
         min(d.created_at),
         count(*) filter (where d.level = 'سهل'),
         count(*) filter (where d.level = 'متوسط'),
         count(*) filter (where d.level = 'صعب'),
         count(*) filter (where d.level = 'تعجيزي'),
         count(*) filter (where d.status = 'pending'),
         count(*) filter (where d.status = 'rejected'),
         -- فئةٌ لم تُنشأ بعد: الاعتماد يُردّ حتى تُنشأ، واللوحة تقولها قبله.
         bool_or(not exists (
           select 1 from public.question_overrides o where o.category = d.category
           union all
           select 1 from public.categories c where c.name = d.category
         ))
    from public.question_drafts d
   where public.is_admin()
   group by d.batch
   order by min(d.created_at) desc;
$$;

revoke execute on function public.admin_draft_batches() from public, anon;
grant  execute on function public.admin_draft_batches() to authenticated;
