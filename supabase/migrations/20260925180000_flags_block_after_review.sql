-- البلاغ لا يحجب عن الجميع إلّا بعد مراجعة علي (قراره ٢٥ سبتمبر ٢٠٢٦).
--
-- كان الحجز فوريّاً بلا عتبة منذ ٣٠ أغسطس، فصار بوسع حسابٍ مجّانيّ واحد أن
-- يحجب عشرين سؤالاً في اليوم عن كلّ المجالس ببلاغاتٍ على ما «عُرض عليه» —
-- وشرطُ العرض يُقرأ من حالةٍ يكتبها هو. القرار: البلاغ يُسجَّل `pending`
-- للمراجعة في اللوحة، ولا يخرج السؤال من أيدي اللاعبين حتى يقرّر المدير
-- «ألغِه» (`disabled`). وعلى جهاز المبلِّغ وحده يبقى محجوباً محلّيّاً
-- (`ownBlockedIds`) — خيارُه هو، لا يمسّ غيره.

create or replace function public.blocked_question_ids()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(f.question_id order by f.question_id), '[]'::jsonb)
    from public.question_flags f
   where f.status = 'disabled';
$$;

/* القديمة للأجهزة التي لم تُرقَّ — القاعدة نفسها. */
create or replace function public.blocked_questions()
returns table (question_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select f.question_id from public.question_flags f where f.status = 'disabled';
$$;
