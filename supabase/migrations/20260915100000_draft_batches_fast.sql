/*
   **قائمةُ الدفعات تنتهي بمهلة الجملة** — ١٥ سبتمبر ٢٠٢٦.

   بعد اعتماد دفعة «حروف» الثانية ظهر في لسان المسوّدات:
   «canceling statement due to statement timeout» وبقيت القائمة على حالها
   القديمة. الجدول بلغ 5123 مسوّدة في 111 دفعة، و`admin_draft_batches`
   كانت تحسب «فئةٌ غير موجودة» بجملةٍ فرعيّة **لكلّ صفٍّ من المسوّدات**،
   تمسح `question_overrides` كلَّها بلا فهرس على `category`: 5123 × 5705
   مقارنة — ثانيةٌ وربع على اتّصالٍ مباشر، وتتجاوز ثماني ثوانٍ من وراء
   PostgREST. وهي تطول مع كلّ دفعةٍ تُضاف، لأنّ الدالّة تعدّ المبتوتَ فيه
   أيضاً لا المعلَّقَ وحده.

   الإصلاح: مجموعةُ الفئات المعروفة تُحسب **مرّةً واحدة** ثمّ يُربط بها
   بـ`left join`، وفهرسٌ على `question_overrides(category)` تنتفع به
   الدالّة نفسها وكلُّ ما يعدّ بالفئة (حدُّ العشرين في `admin_delete_question`).
   قيس على القاعدة الحيّة: 1107 مللي ثانية ← 10.
*/

create index if not exists question_overrides_category_idx
  on public.question_overrides (category);

create or replace function public.admin_draft_batches()
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
  with known as (
    select distinct o.category as name from public.question_overrides o
    union
    select c.name from public.categories c
  )
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
         bool_or(k.name is null)
    from public.question_drafts d
    left join known k on k.name = d.category
   where public.is_admin()
   group by d.batch
   order by min(d.created_at) desc;
$$;

revoke execute on function public.admin_draft_batches() from public, anon;
grant  execute on function public.admin_draft_batches() to authenticated;
