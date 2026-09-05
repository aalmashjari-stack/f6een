-- الحذفُ بالجملة في معاملةٍ واحدة — وحارسُ الخليّة يُقاس على النتيجة.
--
-- **العطب:** حذفُ فئة «سيارات» توقّف عند ستّين سؤالاً — عشرين في كل مستوى.
-- الحارس في `admin_delete_question` يُقاس على صفٍّ واحد، فلا يرى أنّ الحكم
-- يفرغ الخليّة كلّها: يرى نزولاً من عشرين إلى تسعة عشر فيردّه. ولا سبيل من
-- عشرين إلى صفرٍ بخطوةٍ واحدة، فيُحبس عندها بلا مخرج.
--
-- **والقاعدة نفسها كانت أخشن ممّا يجب.** خليّةٌ فارغة لا تكسر شيئاً: فئةٌ
-- يفرغ أحد مستوياتها تخرج من `playableCategories` كلّها فلا يصل إليها سحب.
-- الخطرُ خليّةٌ **نحيفة** في فئةٍ ما زالت تُلعب — تُستنزف في جلستين وتتكرّر.
-- فالممنوع هو النطاق ١…١٩ لا الصفر.
--
-- ومن هنا: الحكم يُرسل المعرّفات كلَّها في نداءٍ واحد، فتُحذف ثمّ تُقاس
-- الخلايا المتأثّرة على حالتها النهائية. والرفضُ يُرجع المعاملة كلَّها —
-- إمّا أن يقع الحذف كلُّه أو لا شيء منه، فلا يبقى الحكم أمام نصف عمل.
--
-- ومكسبٌ ثانٍ: مئة وستّة وستّون نداءً متتابعاً صارت نداءً واحداً.

create or replace function public.admin_delete_questions(p_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cells   jsonb;
  c       jsonb;
  cat     text;
  lvl     text;
  removed integer;
  after_n bigint;
  min_n   integer;
  gone    integer;
  live    boolean;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    return jsonb_build_object('deleted', 0);
  end if;

  if array_length(p_ids, 1) > 3000 then
    raise exception 'too_many_rows';
  end if;

  /* الخلايا المتأثّرة وعددُ المحذوف من كلٍّ — تُلتقط **قبل** الحذف، إذ لا
     يبقى بعده ما يدلّ عليها. */
  select jsonb_agg(jsonb_build_object('c', t.category, 'l', t.level, 'r', t.r))
    into cells
    from (
      select o.category, o.level, count(*)::integer as r
        from public.question_overrides o
       where o.question_id = any (p_ids)
       group by o.category, o.level
    ) t;

  delete from public.question_overrides o where o.question_id = any (p_ids);
  get diagnostics gone = row_count;

  live := coalesce(
    (select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);

  if live then
    for c in select * from jsonb_array_elements(coalesce(cells, '[]'::jsonb))
    loop
      cat     := c ->> 'c';
      lvl     := c ->> 'l';
      removed := (c ->> 'r')::integer;

      select count(*) into after_n
        from public.question_overrides o
       where o.category = cat and o.level = lvl;

      select case when exists (
               select 1 from public.question_overrides i
                where i.category = cat and i.image is not null
             ) then 1 else 20 end
        into min_n;

      /* ثلاثة تمرّ وواحدٌ يُردّ:
         · الصفر يمرّ — الفئة تخرج من اللعب ولا تُكسر.
         · ما بلغ الحدَّ يمرّ.
         · ما كان دون الحدّ قبل الحذف يمرّ — فئةٌ لمّا تكتمل لا يُقفل بابها.
         · والمردود: خليّةٌ كانت فوق الحدّ فنزلت إلى ما بين ١ والحدّ. */
      if after_n > 0 and after_n < min_n and after_n + removed >= min_n then
        raise exception 'cell_floor: % · % — % من %', cat, lvl, after_n, min_n;
      end if;
    end loop;
  end if;

  return jsonb_build_object('deleted', gone);
end;
$$;

revoke execute on function public.admin_delete_questions(text[]) from public, anon;
grant  execute on function public.admin_delete_questions(text[]) to authenticated;

-- والحذفُ المفرد يتبع القاعدة نفسها: الصفر يمرّ.
-- كان `n = 0` مردوداً، فسؤالٌ أخيرٌ في خليّةٍ نحيفة لا يُحذف بلا سبب.
create or replace function public.admin_delete_question(p_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  kind  text;
  cat   text;
  lvl   text;
  live  boolean;
  n     bigint;
  min_n integer;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  delete from public.question_overrides o
   where o.question_id = btrim(coalesce(p_id, ''))
   returning o.origin, o.category, o.level into kind, cat, lvl;

  if kind is null then
    raise exception 'no_such_question';
  end if;

  live := coalesce(
    (select f.enabled from public.app_flags f where f.key = 'bank_in_db'), false);

  if live then
    select count(*) into n
      from public.question_overrides o
     where o.category = cat and o.level = lvl;

    select case when exists (
             select 1 from public.question_overrides i
              where i.category = cat and i.image is not null
           ) then 1 else 20 end
      into min_n;

    if n > 0 and n < min_n and n + 1 >= min_n then
      raise exception 'cell_floor: % · % — % من %', cat, lvl, n, min_n;
    end if;
  end if;

  return kind;
end;
$$;

revoke execute on function public.admin_delete_question(text) from public, anon;
grant  execute on function public.admin_delete_question(text) to authenticated;
