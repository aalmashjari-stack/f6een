-- تصليبٌ من مراجعة ٢٥ سبتمبر ٢٠٢٦ (شاملة، خمسة مراجعين على الشيفرة كلّها).
--
-- ١) `admin_insights` كانت تُكسَر بصفٍّ واحد: `sessions.state` يكتبه صاحبه
--    بلا قيد على شكله، والدالّة تصبّ `score` و`startingTeam` و`st` بـ`::int`
--    و`players` بـ`jsonb_array_length` — فنصٌّ مكان رقمٍ في جلسةٍ منتهية
--    يُسقط لسان الإحصائيّات كلَّه برسالة «invalid input syntax». فقراءتان
--    متسامحتان: الرقم رقمٌ وإلّا null، والمصفوفة طولها وإلّا صفر.
-- ٢) صفّ الجلسة: كان بوسع صاحبه تبديل `id` و`created_at` — فتنحرف
--    إحصائيّات اليوم والوسيط. الحارس القائم (`sessions_lock_terminal`) يُمدّ.
-- ٣) `used_questions`: سياسة التحديث (٢٣ سبتمبر) قصدت تحريك `used_at` وحده،
--    وسمحت فعلاً بتبديل `question_id` — أي محو الذاكرة التي يحرم الحذفُ محوَها.
-- ٤) `admin_save_question`: النموذج المفرد كان الوحيد بلا فحص تكرار النصّ،
--    فسؤالٌ موجود يدخل بمعرّف ثانٍ ويظهر مرّتين في الجلسة (المحرّك يميّز
--    بالمعرّف). صور الأسئلة مستثناة كما في الرفع بالجملة.

/* ═══════════════ ١) قراءتان متسامحتان + admin_insights ═══════════════ */

create or replace function public.jsonb_int(x jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(x) = 'number' then round((x #>> '{}')::numeric)::int end
$$;

create or replace function public.jsonb_len(x jsonb)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(x) = 'array' then jsonb_array_length(x) else 0 end
$$;

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
           public.jsonb_int(s.state -> 'teams' -> 0 -> 'score') as a,
           public.jsonb_int(s.state -> 'teams' -> 1 -> 'score') as b,
           public.jsonb_len(s.state -> 'teams' -> 0 -> 'players') as pa,
           public.jsonb_len(s.state -> 'teams' -> 1 -> 'players') as pb,
           public.jsonb_int(s.state -> 'startingTeam') as starter
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
    select x.key as id, public.jsonb_int(x.value -> 'st') as st, x.value ->> 'r' as r
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
                         where coalesce(public.jsonb_int(fin.state -> 'stagePoints' -> 'tie' -> 0), 0) <> 0
                            or coalesce(public.jsonb_int(fin.state -> 'stagePoints' -> 'tie' -> 1), 0) <> 0),
      /* متوسّط نقاط الفريق الواحد في كلّ مرحلة — أين تُكسب اللعبة. */
      'stage_avg',     (select jsonb_build_object(
                          's1', round(avg((public.jsonb_int(fin.state -> 'stagePoints' -> 's1' -> 0)
                                         + public.jsonb_int(fin.state -> 'stagePoints' -> 's1' -> 1)) / 2.0), 0),
                          's2', round(avg((public.jsonb_int(fin.state -> 'stagePoints' -> 's2' -> 0)
                                         + public.jsonb_int(fin.state -> 'stagePoints' -> 's2' -> 1)) / 2.0), 0),
                          's3', round(avg((public.jsonb_int(fin.state -> 'stagePoints' -> 's3' -> 0)
                                         + public.jsonb_int(fin.state -> 'stagePoints' -> 's3' -> 1)) / 2.0), 0))
                          from fin where jsonb_typeof(fin.state -> 'stagePoints') = 'object'),
      's3_correct',    (select coalesce(sum(public.jsonb_int(fin.state -> 's3Counts' -> 'correct' -> 0)
                                          + public.jsonb_int(fin.state -> 's3Counts' -> 'correct' -> 1)), 0)
                          from fin where jsonb_typeof(fin.state -> 's3Counts') = 'object'),
      's3_wrong',      (select coalesce(sum(public.jsonb_int(fin.state -> 's3Counts' -> 'wrong' -> 0)
                                          + public.jsonb_int(fin.state -> 's3Counts' -> 'wrong' -> 1)), 0)
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
grant  execute on function public.admin_insights(boolean) to authenticated;

/* ═══════════════ ٢) صفّ الجلسة: المعرّف والزمن ثابتان ═══════════════ */

create or replace function public.sessions_lock_terminal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'open' and new.status is distinct from old.status then
    raise exception 'session_closed' using
      hint = 'الجلسة المنتهية لا تُفتح ثانيةً';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'session_owner_fixed';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'session_identity_fixed';
  end if;
  return new;
end;
$$;

/* ═══════════════ ٣) ذاكرة الأسئلة: الزمن يتحرّك والمعرّف لا ═══════════════ */

create or replace function public.used_questions_lock_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.question_id is distinct from old.question_id or new.user_id is distinct from old.user_id then
    raise exception 'used_question_fixed' using
      hint = 'التحديث يحرّك used_at وحده';
  end if;
  return new;
end;
$$;

drop trigger if exists used_questions_lock_id on public.used_questions;
create trigger used_questions_lock_id
  before update on public.used_questions
  for each row execute function public.used_questions_lock_id();

/* ═══════════════ ٤) النموذج المفرد يرفض النصّ المكرّر ═══════════════ */

create or replace function public.admin_save_question(
  p_id           text default null,
  p_category     text default null,
  p_level        text default null,
  p_topic        text default null,
  p_question     text default null,
  p_answer       text default null,
  p_image        text default null,
  p_answer_image text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  qid      text := nullif(btrim(coalesce(p_id, '')), '');
  fresh    boolean := qid is null;
  kind     text;
  old_cat  text;
  old_lvl  text;
  twin     text;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  if btrim(coalesce(p_question, '')) = '' or btrim(coalesce(p_answer, '')) = '' then
    raise exception 'empty_question';
  end if;

  if btrim(coalesce(p_category, '')) = '' then
    raise exception 'no_category';
  end if;

  if p_level not in ('سهل', 'متوسط', 'صعب', 'تعجيزي') then
    raise exception 'bad_level';
  end if;

  /* النصّ نفسه (بعد التطبيع) موجودٌ بمعرّفٍ آخر — كما في الرفع بالجملة
     والاعتماد؛ وأسئلة الصور خارج الفحص لأنّ نصّها قالبٌ («من هذا؟»). */
  if nullif(btrim(coalesce(p_image, '')), '') is null then
    select o.question_id into twin
      from public.question_overrides o
     where public.norm_question(o.question) = public.norm_question(p_question)
       and o.image is null
       and (qid is null or o.question_id <> qid)
     limit 1;
    if twin is not null then
      raise exception 'سؤالٌ بالنصّ نفسه موجود: %', twin;
    end if;
  end if;

  if fresh then
    qid := 'ADM' || lpad(nextval('public.question_admin_seq')::text, 4, '0');
    kind := 'new';
  else
    select o.origin, o.category, o.level into kind, old_cat, old_lvl
      from public.question_overrides o where o.question_id = qid;
    kind := coalesce(kind, 'override');
  end if;

  insert into public.question_overrides
    (question_id, category, level, topic, question, answer, image, answer_image,
     origin, updated_by)
  values
    (qid, btrim(p_category), p_level, nullif(btrim(coalesce(p_topic, '')), ''),
     btrim(p_question), btrim(p_answer),
     nullif(btrim(coalesce(p_image, '')), ''),
     nullif(btrim(coalesce(p_answer_image, '')), ''),
     kind, (select auth.uid()))
  on conflict (question_id) do update
    set category     = excluded.category,
        level        = excluded.level,
        topic        = excluded.topic,
        question     = excluded.question,
        answer       = excluded.answer,
        image        = excluded.image,
        answer_image = excluded.answer_image,
        updated_at   = now(),
        updated_by   = excluded.updated_by;

  /* انتقل من خليّة إلى أخرى: الخليّة التي غادرها تُقاس كما لو حُذف منها. */
  if old_cat is not null and (old_cat <> btrim(p_category) or old_lvl <> p_level) then
    perform public.assert_cell_floor(old_cat, old_lvl);
  end if;

  return qid;
end;
$$;
