-- نتيجةُ كلّ سؤال في إحصاء اللوحة (طلب علي ٢٣ سبتمبر ٢٠٢٦: «ضيف حفظ نتيجة
-- كل سؤال»). المحرّك صار يحفظ `state.results` — لكلّ سؤالٍ حُكم عليه مرحلتُه
-- (1–4) ونتيجته (c أُصيب · w أخطأ · n لم يُصبه أحد) — وهذه الدالّة تقرؤها:
-- نسبة الإصابة لكلّ مرحلة ومستوى وفئة، والأسئلة الأصعب، وما يبدو في غير
-- مستواه. الجلسات التي سبقت هذا اليوم بلا نتائج، فالأرقام تبدأ من الصفر.
--
-- إعادةُ تعريفٍ كاملة لـ`admin_insights` من `20260923200000` مع الإضافات —
-- وهذه الهجرة هي الأحدث لها من الآن.

create or replace function public.admin_insights(p_exclude_admins boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz  constant text := 'Asia/Kuwait';
  out jsonb;
begin
  if not public.is_super() then
    raise exception 'not_super';
  end if;

  with
  s as (
    select x.*,
           case when jsonb_typeof(x.state -> 's1Categories') = 'array'
                then x.state -> 's1Categories' else '[]'::jsonb end as cats,
           case when jsonb_typeof(x.state -> 'askedQuestionIds') = 'array'
                then x.state -> 'askedQuestionIds' else '[]'::jsonb end as asked
      from public.sessions x
     where not (p_exclude_admins and exists (select 1 from public.admins a where a.id = x.user_id))
  ),
  acc as (
    select p.* from public.profiles p
     where not (p_exclude_admins and exists (select 1 from public.admins a where a.id = p.id))
  ),
  /* الجلسة المكتملة بفريقين ونتيجتين — ما عداها لا تُقاس نتيجته. */
  fin as (
    select s.*,
           (s.state -> 'teams' -> 0 ->> 'score')::int as a,
           (s.state -> 'teams' -> 1 ->> 'score')::int as b,
           jsonb_array_length(coalesce(s.state -> 'teams' -> 0 -> 'players', '[]')) as pa,
           jsonb_array_length(coalesce(s.state -> 'teams' -> 1 -> 'players', '[]')) as pb,
           (s.state ->> 'startingTeam')::int as starter
      from s
     where s.status = 'finished'
       and jsonb_typeof(s.state -> 'teams') = 'array'
       and jsonb_array_length(s.state -> 'teams') = 2
  ),
  /* الأسماء القديمة لفئاتٍ أُعيدت تسميتها: الجلسة تحفظ الاسم لحظةَ لعبها،
     فبلا هذا تنقسم الفئة الواحدة صفّين ويسقط القديم «بلا تصنيف». */
  renamed(old, cur) as (
    values ('دين وسيرة', 'إسلامي'), ('رياضة وأرقام', 'رياضة عامة'),
           ('بريزون بريك', 'Prison break'), ('صراع العروش', 'Game of thrones'),
           ('بريكنغ باد', 'Breaking bad'), ('ديكستر', 'Dexter')
  ),
  picks as (
    select coalesce(r.cur, c ->> 'name') as name, s.status
      from s
     cross join jsonb_array_elements(s.cats) c
      left join renamed r on r.old = c ->> 'name'
     where coalesce(c ->> 'name', '') <> ''
  ),
  shown as (
    select q.value #>> '{}' as id from s, jsonb_array_elements(s.asked) q
  ),
  /* نتيجةُ كلّ سؤال (`state.results`، منذ ٢٣ سبتمبر ٢٠٢٦): ‏st المرحلة، ‏r ‏c/w/n. */
  res as (
    select x.key as id, (x.value ->> 'st')::int as st, x.value ->> 'r' as r
      from s, jsonb_each(case when jsonb_typeof(s.state -> 'results') = 'object'
                              then s.state -> 'results' else '{}'::jsonb end) x
  ),
  resq as (
    select res.*, o.category, o.level, o.question, o.answer
      from res join public.question_overrides o on o.question_id = res.id
  ),
  /* لكلّ سؤال: كم عُرض وكم أُصيب — في الجولة الجماعية وحدها للمستوى: هي
     اللوح المتدرّج بالنقاط، والديربي والحق ما تلحق من السهل والمتوسط بمؤقّتٍ
     آخر. و«الأصعب» من المراحل كلّها. */
  perq as (
    select id, category, level, question, answer,
           count(*) as n, count(*) filter (where r = 'c') as c,
           count(*) filter (where st = 1) as n1, count(*) filter (where st = 1 and r = 'c') as c1
      from resq group by id, category, level, question, answer
  ),
  /* الفئة القابلة للّعب: غير مخفيّة، وفي كلّ مستوياتها الأربعة سؤالٌ حيّ. */
  playable as (
    select o.category as name
      from public.question_overrides o
      left join public.question_flags f on f.question_id = o.question_id
     where f.status is null or f.status = 'ok'
     group by o.category
    having count(distinct o.level) >= 4
  )
  select jsonb_build_object(
    'generated_at', now(),
    'exclude_admins', p_exclude_admins,

    'overview', jsonb_build_object(
      'accounts',        (select count(*) from acc),
      'accounts_7d',     (select count(*) from acc where acc.created_at >= now() - interval '7 days'),
      'accounts_30d',    (select count(*) from acc where acc.created_at >= now() - interval '30 days'),
      'players',         (select count(distinct s.user_id) from s),
      'returning',       (select count(*) from (select s.user_id from s group by 1 having count(*) >= 2) r),
      'sessions',        (select count(*) from s),
      'finished',        (select count(*) from s where s.status = 'finished'),
      'abandoned',       (select count(*) from s where s.status = 'abandoned'),
      'open',            (select count(*) from s where s.status not in ('finished', 'abandoned')),
      'sessions_7d',     (select count(*) from s where s.created_at >= now() - interval '7 days'),
      'sessions_30d',    (select count(*) from s where s.created_at >= now() - interval '30 days'),
      'median_minutes',  (select round(percentile_cont(0.5) within group (
                             order by extract(epoch from (s.updated_at - s.created_at)) / 60)::numeric, 0)
                            from s where s.status = 'finished'),
      'questions_shown', (select count(*) from shown),
      'avg_questions',   (select round(avg(jsonb_array_length(s.asked)), 0) from s where s.status = 'finished'),
      'reports',         (select count(*) from public.question_reports r
                           where not (p_exclude_admins and exists (select 1 from public.admins a where a.id = r.user_id))),
      'redemptions',     (select count(*) from public.gift_redemptions)
    ),

    /* «أيّ فئةٍ اختيرت أكثر» — الستّ التي يختارها اللاعبون للّوح في الإعداد. */
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.name, 'group', t.grp, 'picks', t.n, 'finished', t.f)
                       order by t.n desc, t.name)
        from (select p.name, c.group_name as grp, count(*) as n,
                     count(*) filter (where p.status = 'finished') as f
                from picks p left join public.categories c on c.name = p.name
               group by p.name, c.group_name) t
    ), '[]'::jsonb),

    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.grp, 'picks', t.n) order by t.n desc)
        from (select coalesce(c.group_name, 'بلا تصنيف') as grp, count(*) as n
                from picks p left join public.categories c on c.name = p.name
               group by 1) t
    ), '[]'::jsonb),

    /* قابلةٌ للّعب ولم يخترها أحد. */
    'never_picked', coalesce((
      select jsonb_agg(c.name order by c.name)
        from public.categories c
        join playable pl on pl.name = c.name
       where not coalesce(c.hidden, false)
         and not exists (select 1 from picks p where p.name = c.name)
    ), '[]'::jsonb),

    /* ما ظهر فعلاً على الشاشة في المراحل كلّها (الديربي والحق ما تلحق تسحب من
       فئاتٍ غير الستّ). */
    'shown_by_category', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.category, 'n', t.n) order by t.n desc)
        from (select o.category, count(*) as n
                from shown join public.question_overrides o on o.question_id = shown.id
               group by 1) t
    ), '[]'::jsonb),

    'shown_by_level', coalesce((
      select jsonb_object_agg(t.level, t.n)
        from (select o.level, count(*) as n
                from shown join public.question_overrides o on o.question_id = shown.id
               group by 1) t
    ), '{}'::jsonb),

    'by_day', (
      select jsonb_agg(jsonb_build_object('day', d.day, 'n', coalesce(c.n, 0), 'finished', coalesce(c.f, 0))
                       order by d.day)
        from generate_series((now() at time zone tz)::date - 29, (now() at time zone tz)::date, '1 day') as d(day)
        left join (select (s.created_at at time zone tz)::date as day, count(*) as n,
                          count(*) filter (where s.status = 'finished') as f
                     from s group by 1) c on c.day = d.day
    ),

    'by_hour', (
      select jsonb_agg(coalesce(c.n, 0) order by h.h)
        from generate_series(0, 23) as h(h)
        left join (select extract(hour from s.created_at at time zone tz)::int as h, count(*) as n
                     from s group by 1) c on c.h = h.h
    ),

    /* 0 = الأحد، كما في `extract(dow)`. */
    'by_weekday', (
      select jsonb_agg(coalesce(c.n, 0) order by w.w)
        from generate_series(0, 6) as w(w)
        left join (select extract(dow from s.created_at at time zone tz)::int as w, count(*) as n
                     from s group by 1) c on c.w = w.w
    ),

    'games', jsonb_build_object(
      'measured',      (select count(*) from fin),
      'avg_players',   (select round(avg(fin.pa + fin.pb), 1) from fin),
      'team_sizes',    coalesce((
                         select jsonb_agg(jsonb_build_object('size', t.size, 'n', t.n) order by t.n desc)
                           from (select least(fin.pa, fin.pb) || '×' || greatest(fin.pa, fin.pb) as size,
                                        count(*) as n
                                   from fin group by 1) t), '[]'::jsonb),
      'avg_winner',    (select round(avg(greatest(fin.a, fin.b)), 0) from fin),
      'avg_loser',     (select round(avg(least(fin.a, fin.b)), 0) from fin),
      'avg_margin',    (select round(avg(abs(fin.a - fin.b)), 0) from fin),
      'starter_wins',  (select count(*) from fin
                         where fin.a <> fin.b and (fin.a > fin.b) = (fin.starter = 0)),
      'decided',       (select count(*) from fin where fin.a <> fin.b),
      'tiebreaks',     (select count(*) from fin
                         where coalesce((fin.state -> 'stagePoints' -> 'tie' ->> 0)::int, 0) <> 0
                            or coalesce((fin.state -> 'stagePoints' -> 'tie' ->> 1)::int, 0) <> 0),
      /* متوسّط نقاط الفريق الواحد في كلّ مرحلة — أين تُكسب اللعبة. */
      'stage_avg',     (select jsonb_build_object(
                          's1', round(avg(((fin.state -> 'stagePoints' -> 's1' ->> 0)::int
                                         + (fin.state -> 'stagePoints' -> 's1' ->> 1)::int) / 2.0), 0),
                          's2', round(avg(((fin.state -> 'stagePoints' -> 's2' ->> 0)::int
                                         + (fin.state -> 'stagePoints' -> 's2' ->> 1)::int) / 2.0), 0),
                          's3', round(avg(((fin.state -> 'stagePoints' -> 's3' ->> 0)::int
                                         + (fin.state -> 'stagePoints' -> 's3' ->> 1)::int) / 2.0), 0))
                          from fin where jsonb_typeof(fin.state -> 'stagePoints') = 'object'),
      's3_correct',    (select coalesce(sum((fin.state -> 's3Counts' -> 'correct' ->> 0)::int
                                          + (fin.state -> 's3Counts' -> 'correct' ->> 1)::int), 0)
                          from fin where jsonb_typeof(fin.state -> 's3Counts') = 'object'),
      's3_wrong',      (select coalesce(sum((fin.state -> 's3Counts' -> 'wrong' ->> 0)::int
                                          + (fin.state -> 's3Counts' -> 'wrong' ->> 1)::int), 0)
                          from fin where jsonb_typeof(fin.state -> 's3Counts') = 'object')
    ),

    'results', jsonb_build_object(
      'measured',  (select count(*) from res),
      'sessions',  (select count(*) from s where jsonb_typeof(s.state -> 'results') = 'object'
                                              and s.state -> 'results' <> '{}'::jsonb),
      'by_stage',  coalesce((
                     select jsonb_agg(jsonb_build_object('st', t.st, 'n', t.n, 'c', t.c, 'w', t.w) order by t.st)
                       from (select st, count(*) as n, count(*) filter (where r = 'c') as c,
                                    count(*) filter (where r = 'w') as w
                               from res group by st) t), '[]'::jsonb),
      'by_level',  coalesce((
                     select jsonb_agg(jsonb_build_object('level', t.level, 'n', t.n, 'c', t.c))
                       from (select level, count(*) as n, count(*) filter (where r = 'c') as c
                               from resq where st = 1 group by level) t), '[]'::jsonb),
      /* نسبة الإصابة لكلّ فئة في اللوح — بخمسة أسئلةٍ محكومة على الأقلّ. */
      'by_category', coalesce((
                     select jsonb_agg(jsonb_build_object('name', t.category, 'n', t.n, 'c', t.c)
                                      order by t.c::numeric / t.n, t.n desc)
                       from (select category, count(*) as n, count(*) filter (where r = 'c') as c
                               from resq where st = 1 group by category having count(*) >= 5) t), '[]'::jsonb),
      /* الأصعب: عُرض مرّتين على الأقلّ وأُصيب في النصف أو أقلّ — وإلّا امتلأت
         القائمة في أوّل الأيّام بأسئلةٍ أصابها الجميع لأنّها الوحيدة المعروضة مرّتين. */
      'hardest',   coalesce((
                     select jsonb_agg(to_jsonb(t) order by t.c::numeric / t.n, t.n desc)
                       from (select id, category, level, question, answer, n, c from perq
                              where n >= 2 and c::numeric / n <= 0.5
                              order by c::numeric / n, n desc limit 20) t), '[]'::jsonb),
      /* مستوىً يحتاج مراجعة: «سهل» يُخطئه أكثرهم، و«صعب/تعجيزي» يُصيبه أكثرهم —
         في اللوح وحده وبثلاث مرّاتٍ على الأقلّ. */
      'too_hard',  coalesce((
                     select jsonb_agg(to_jsonb(t) order by t.c1::numeric / t.n1)
                       from (select id, category, level, question, answer, n1, c1 from perq
                              where level = 'سهل' and n1 >= 3 and c1::numeric / n1 <= 0.34
                              limit 30) t), '[]'::jsonb),
      'too_easy',  coalesce((
                     select jsonb_agg(to_jsonb(t) order by t.c1::numeric / t.n1 desc)
                       from (select id, category, level, question, answer, n1, c1 from perq
                              where level in ('صعب', 'تعجيزي') and n1 >= 3 and c1::numeric / n1 >= 0.8
                              limit 30) t), '[]'::jsonb)
    ),

    /* أين يُترك اللعب: طورُ الجلسة المنسحبة لحظة إغلاقها. */
    'abandoned_at', coalesce((
      select jsonb_agg(jsonb_build_object('phase', t.phase, 'n', t.n) order by t.n desc)
        from (select coalesce(s.state ->> 'phase', '—') as phase, count(*) as n
                from s where s.status = 'abandoned' group by 1) t
    ), '[]'::jsonb),

    'top_accounts', coalesce((
      select jsonb_agg(jsonb_build_object('email', t.email, 'sessions', t.n, 'finished', t.f, 'last', t.last)
                       order by t.n desc)
        from (select u.email, count(*) as n, count(*) filter (where s.status = 'finished') as f,
                     max(s.created_at) as last
                from s join auth.users u on u.id = s.user_id
               group by u.email
               order by count(*) desc
               limit 10) t
    ), '[]'::jsonb)
  )
  into out;

  return out;
end;
$$;

revoke execute on function public.admin_insights(boolean) from public, anon;
grant execute on function public.admin_insights(boolean) to authenticated;
