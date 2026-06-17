-- Private bucket for student-ID / enrollment evidence + RLS storage policies.

insert into storage.buckets (id, name, public)
values ('student-ids', 'student-ids', false)
on conflict (id) do nothing;

-- owners can read/write their own evidence; admins can read everything
create policy "student-ids: own read"
  on storage.objects for select
  using (bucket_id = 'student-ids' and owner = auth.uid());

create policy "student-ids: own insert"
  on storage.objects for insert
  with check (bucket_id = 'student-ids' and owner = auth.uid());

create policy "student-ids: own delete"
  on storage.objects for delete
  using (bucket_id = 'student-ids' and owner = auth.uid());

create policy "student-ids: admin read"
  on storage.objects for select
  using (bucket_id = 'student-ids' and public.is_admin());
