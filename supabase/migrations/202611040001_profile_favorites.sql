begin;

create table if not exists public.profile_favorites (
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  freelancer_id uuid not null
    references public.freelancer_profiles(profile_id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (user_id, freelancer_id),

  constraint profile_favorites_no_self_favorite
    check (user_id <> freelancer_id)
);

create index if not exists profile_favorites_freelancer_idx
  on public.profile_favorites(freelancer_id);

alter table public.profile_favorites
  enable row level security;

grant select, insert, delete
on public.profile_favorites
to authenticated;

drop policy if exists "Los usuarios pueden consultar sus favoritos"
on public.profile_favorites;

create policy "Los usuarios pueden consultar sus favoritos"
on public.profile_favorites
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "Los usuarios pueden agregar favoritos"
on public.profile_favorites;

create policy "Los usuarios pueden agregar favoritos"
on public.profile_favorites
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "Los usuarios pueden eliminar sus favoritos"
on public.profile_favorites;

create policy "Los usuarios pueden eliminar sus favoritos"
on public.profile_favorites
for delete
to authenticated
using (
  auth.uid() = user_id
);

commit;