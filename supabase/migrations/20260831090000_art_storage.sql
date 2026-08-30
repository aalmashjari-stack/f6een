-- مخزن الصور — دلو `art` في Supabase Storage.
--
-- **عامٌّ للقراءة عمداً.** الصورة تُعرض على شاشة المجلس بوسم `img`، ولو
-- كانت مقيّدة لاحتاج كل عرضٍ رمزاً موقّعاً ينتهي — فتظهر صورة مكسورة في
-- منتصف سؤال. وليس فيها ما يُخفى: هي فنّ الفئات وصور المشاهير نفسها التي
-- تُشحن مع التطبيق اليوم.
--
-- والكتابة للمدير وحده، بنفس الحارس الذي يحرس كل شيء: `is_admin()`.
--
-- **وثمنٌ يجب أن يُعرف:** الصورة المرفوعة تُجلب من الشبكة، بخلاف المشحونة
-- في الحزمة. فأوّل عرضٍ لها يحتاج اتّصالاً (ثمّ يخزّنها المتصفّح)، واللعبة
-- التي تعمل بلا إنترنت (SPEC ٦) تعمل بلا هذه الصور وحدها.

insert into storage.buckets (id, name, public)
values ('art', 'art', true)
on conflict (id) do update set public = true;

create policy "art: anyone reads"
  on storage.objects for select
  using (bucket_id = 'art');

create policy "art: admin uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'art' and public.is_admin());

create policy "art: admin replaces"
  on storage.objects for update to authenticated
  using (bucket_id = 'art' and public.is_admin())
  with check (bucket_id = 'art' and public.is_admin());

create policy "art: admin deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'art' and public.is_admin());
