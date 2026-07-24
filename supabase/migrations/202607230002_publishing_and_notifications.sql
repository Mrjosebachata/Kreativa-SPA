-- KREATIVA: publicación de servicios + centro de notificaciones.
-- Ejecutar DESPUÉS de 202607230001_auth_and_rls.sql.

begin;

-- ---------------------------------------------------------------------------
-- 1. Catálogo público completo
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.skills enable row level security;
alter table public.gig_tags enable row level security;
alter table public.freelancer_skills enable row level security;
alter table public.portfolio_images enable row level security;

grant select on table public.categories to anon, authenticated;
grant select on table public.tags to anon, authenticated;
grant select on table public.skills to anon, authenticated;
grant select on table public.gig_tags to anon, authenticated;
grant select on table public.freelancer_skills to anon, authenticated;
grant select on table public.portfolio_images to anon, authenticated;

drop policy if exists "Categorias publicas visibles" on public.categories;
drop policy if exists "public_select_categories" on public.categories;
drop policy if exists "public_select_tags" on public.tags;
drop policy if exists "public_select_skills" on public.skills;
drop policy if exists "public_select_gig_tags" on public.gig_tags;
drop policy if exists "public_select_freelancer_skills" on public.freelancer_skills;
drop policy if exists "public_select_portfolio_images" on public.portfolio_images;

create policy "public_select_categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "public_select_tags"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "public_select_skills"
  on public.skills for select
  to anon, authenticated
  using (true);

create policy "public_select_gig_tags"
  on public.gig_tags for select
  to anon, authenticated
  using (true);

create policy "public_select_freelancer_skills"
  on public.freelancer_skills for select
  to anon, authenticated
  using (true);

create policy "public_select_portfolio_images"
  on public.portfolio_images for select
  to anon, authenticated
  using (true);

-- Las escrituras del catálogo se realizan únicamente mediante publish_service.
revoke insert, update, delete on table public.freelancer_profiles from authenticated;
revoke insert, update, delete on table public.gigs from authenticated;
revoke insert, update, delete on table public.tags from authenticated;
revoke insert, update, delete on table public.skills from authenticated;
revoke insert, update, delete on table public.gig_tags from authenticated;
revoke insert, update, delete on table public.freelancer_skills from authenticated;
revoke insert, update, delete on table public.portfolio_images from authenticated;

-- ---------------------------------------------------------------------------
-- 2. Bucket público para portadas y portafolios
-- ---------------------------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'service-images',
  'service-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "users_insert_service_images" on storage.objects;
drop policy if exists "users_delete_own_service_images" on storage.objects;
drop policy if exists "public_select_service_images" on storage.objects;

create policy "users_insert_service_images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'service-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users_delete_own_service_images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'service-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "public_select_service_images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'service-images');

-- ---------------------------------------------------------------------------
-- 3. Notificaciones privadas
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id          bigserial primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null
                check (
                  type in (
                    'commission_requested',
                    'commission_status_changed',
                    'review_received',
                    'service_published'
                  )
                ),
  title       text not null,
  body        text not null,
  entity_type text
                check (
                  entity_type is null
                  or entity_type in ('commission', 'review', 'service')
                ),
  entity_id   bigint,
  is_read     boolean not null default false,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read)
  where is_read = false;

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon;
revoke insert, delete on table public.notifications from anon, authenticated;
revoke update on table public.notifications from authenticated;

grant select on table public.notifications to authenticated;
grant update (is_read, read_at) on table public.notifications to authenticated;

drop policy if exists "users_select_own_notifications" on public.notifications;
drop policy if exists "users_update_own_notifications" on public.notifications;

create policy "users_select_own_notifications"
  on public.notifications
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users_update_own_notifications"
  on public.notifications
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. RPC transaccional para publicar un servicio
-- ---------------------------------------------------------------------------

create or replace function public.publish_service(
  p_title text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_cover_image_url text,
  p_bio text,
  p_full_bio text,
  p_location text,
  p_tags text[],
  p_skills text[],
  p_portfolio_urls text[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_gig_id bigint;
  v_label text;
  v_tag_id bigint;
  v_skill_id bigint;
  v_url text;
  v_position integer := 0;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para publicar un servicio.'
      using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_title, ''))) not between 10 and 120 then
    raise exception 'El título debe tener entre 10 y 120 caracteres.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_description, ''))) not between 40 and 1200 then
    raise exception 'La descripción debe tener entre 40 y 1200 caracteres.'
      using errcode = '22023';
  end if;

  if coalesce(p_price, 0) <= 0 then
    raise exception 'El precio debe ser mayor que cero.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_bio, ''))) not between 20 and 240 then
    raise exception 'La biografía corta debe tener entre 20 y 240 caracteres.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_full_bio, ''))) not between 40 and 1200 then
    raise exception 'La presentación debe tener entre 40 y 1200 caracteres.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.categories as category
    where category.id = p_category_id
  ) then
    raise exception 'La categoría seleccionada no existe.'
      using errcode = '23503';
  end if;

  if p_cover_image_url is null
     or position(
       '/service-images/' || v_user_id::text || '/'
       in p_cover_image_url
     ) = 0 then
    raise exception 'La portada no pertenece al usuario autenticado.'
      using errcode = '22023';
  end if;

  if cardinality(coalesce(p_tags, array[]::text[])) > 8 then
    raise exception 'Puedes agregar hasta 8 etiquetas.'
      using errcode = '22023';
  end if;

  if cardinality(coalesce(p_skills, array[]::text[])) > 10 then
    raise exception 'Puedes agregar hasta 10 habilidades.'
      using errcode = '22023';
  end if;

  if cardinality(coalesce(p_portfolio_urls, array[]::text[])) > 6 then
    raise exception 'Puedes agregar hasta 6 imágenes de portafolio.'
      using errcode = '22023';
  end if;

  foreach v_url in array coalesce(p_portfolio_urls, array[]::text[])
  loop
    if position(
      '/service-images/' || v_user_id::text || '/'
      in v_url
    ) = 0 then
      raise exception 'Una imagen de portafolio no pertenece al usuario autenticado.'
        using errcode = '22023';
    end if;
  end loop;

  insert into public.freelancer_profiles (
    profile_id,
    bio,
    full_bio
  )
  values (
    v_user_id,
    trim(p_bio),
    trim(p_full_bio)
  )
  on conflict (profile_id) do update
  set
    bio = excluded.bio,
    full_bio = excluded.full_bio;

  update public.profiles
  set
    location = nullif(trim(coalesce(p_location, '')), ''),
    role = case
      when role = 'client' then 'both'
      else role
    end,
    updated_at = now()
  where id = v_user_id;

  insert into public.gigs (
    freelancer_id,
    category_id,
    title,
    description,
    cover_image_url,
    price,
    currency,
    status
  )
  values (
    v_user_id,
    p_category_id,
    trim(p_title),
    trim(p_description),
    p_cover_image_url,
    p_price,
    'MXN',
    'active'
  )
  returning id into v_gig_id;

  foreach v_label in array coalesce(p_tags, array[]::text[])
  loop
    v_label := regexp_replace(trim(v_label), '\s+', ' ', 'g');

    if char_length(v_label) between 2 and 40 then
      v_tag_id := null;

      select tag.id
      into v_tag_id
      from public.tags as tag
      where lower(tag.name) = lower(v_label)
      limit 1;

      if v_tag_id is null then
        insert into public.tags (name)
        values (v_label)
        on conflict (name) do update set name = excluded.name
        returning id into v_tag_id;
      end if;

      insert into public.gig_tags (gig_id, tag_id)
      values (v_gig_id, v_tag_id)
      on conflict do nothing;
    end if;
  end loop;

  foreach v_label in array coalesce(p_skills, array[]::text[])
  loop
    v_label := regexp_replace(trim(v_label), '\s+', ' ', 'g');

    if char_length(v_label) between 2 and 60 then
      v_skill_id := null;

      select skill.id
      into v_skill_id
      from public.skills as skill
      where lower(skill.name) = lower(v_label)
      limit 1;

      if v_skill_id is null then
        insert into public.skills (name)
        values (v_label)
        on conflict (name) do update set name = excluded.name
        returning id into v_skill_id;
      end if;

      insert into public.freelancer_skills (freelancer_id, skill_id)
      values (v_user_id, v_skill_id)
      on conflict do nothing;
    end if;
  end loop;

  foreach v_url in array coalesce(p_portfolio_urls, array[]::text[])
  loop
    v_position := v_position + 1;

    insert into public.portfolio_images (
      freelancer_id,
      image_url,
      display_order
    )
    values (
      v_user_id,
      v_url,
      v_position
    );
  end loop;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id
  )
  values (
    v_user_id,
    'service_published',
    'Tu servicio ya está publicado',
    trim(p_title) || ' ya aparece en el catálogo de KREATIVA.',
    'service',
    v_gig_id
  );

  return v_gig_id;
end;
$function$;

revoke all on function public.publish_service(
  text,
  text,
  bigint,
  numeric,
  text,
  text,
  text,
  text,
  text[],
  text[],
  text[]
) from public;

grant execute on function public.publish_service(
  text,
  text,
  bigint,
  numeric,
  text,
  text,
  text,
  text,
  text[],
  text[],
  text[]
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Triggers de notificación
-- ---------------------------------------------------------------------------

create or replace function public.notify_new_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_client_name text;
begin
  select profile.full_name
  into v_client_name
  from public.profiles as profile
  where profile.id = new.client_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id
  )
  values (
    new.freelancer_id,
    'commission_requested',
    'Nueva solicitud de comisión',
    coalesce(v_client_name, 'Un cliente') || ' quiere trabajar contigo en “' ||
      new.title || '”.',
    'commission',
    new.id
  );

  return new;
end;
$function$;

drop trigger if exists on_commission_created_notify on public.commissions;

create trigger on_commission_created_notify
  after insert on public.commissions
  for each row execute function public.notify_new_commission();

create or replace function public.notify_commission_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_status_label text;
  v_title text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  v_status_label := case new.status
    when 'pending' then 'pendiente'
    when 'accepted' then 'aceptada'
    when 'in_progress' then 'en progreso'
    when 'delivered' then 'entregada'
    when 'completed' then 'completada'
    when 'cancelled' then 'cancelada'
    else new.status
  end;

  v_title := case new.status
    when 'accepted' then 'Comisión aceptada'
    when 'delivered' then 'Trabajo entregado'
    when 'completed' then 'Comisión completada'
    when 'cancelled' then 'Comisión cancelada'
    else 'La comisión cambió de estado'
  end;

  if v_actor_id = new.client_id then
    insert into public.notifications (
      user_id, type, title, body, entity_type, entity_id
    )
    values (
      new.freelancer_id,
      'commission_status_changed',
      v_title,
      '“' || new.title || '” ahora está ' || v_status_label || '.',
      'commission',
      new.id
    );
  elsif v_actor_id = new.freelancer_id then
    insert into public.notifications (
      user_id, type, title, body, entity_type, entity_id
    )
    values (
      new.client_id,
      'commission_status_changed',
      v_title,
      '“' || new.title || '” ahora está ' || v_status_label || '.',
      'commission',
      new.id
    );
  else
    insert into public.notifications (
      user_id, type, title, body, entity_type, entity_id
    )
    values
      (
        new.client_id,
        'commission_status_changed',
        v_title,
        '“' || new.title || '” ahora está ' || v_status_label || '.',
        'commission',
        new.id
      ),
      (
        new.freelancer_id,
        'commission_status_changed',
        v_title,
        '“' || new.title || '” ahora está ' || v_status_label || '.',
        'commission',
        new.id
      );
  end if;

  return new;
end;
$function$;

drop trigger if exists on_commission_status_notify on public.commissions;

create trigger on_commission_status_notify
  after update of status on public.commissions
  for each row execute function public.notify_commission_status_change();

create or replace function public.notify_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_client_name text;
begin
  select profile.full_name
  into v_client_name
  from public.profiles as profile
  where profile.id = new.client_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    entity_type,
    entity_id
  )
  values (
    new.freelancer_id,
    'review_received',
    'Recibiste una nueva reseña',
    coalesce(v_client_name, 'Un cliente') || ' calificó tu trabajo con ' ||
      new.rating::text || ' de 5 estrellas.',
    'review',
    new.id
  );

  return new;
end;
$function$;

drop trigger if exists on_review_created_notify on public.reviews;

create trigger on_review_created_notify
  after insert on public.reviews
  for each row execute function public.notify_new_review();

-- Permite que el cliente reseñe una comisión completada una sola vez.
grant insert on table public.reviews to authenticated;
grant usage, select on sequence public.reviews_id_seq to authenticated;

drop policy if exists "clients_insert_completed_commission_reviews" on public.reviews;

create policy "clients_insert_completed_commission_reviews"
  on public.reviews
  for insert
  to authenticated
  with check (
    client_id = (select auth.uid())
    and exists (
      select 1
      from public.commissions as commission
      where commission.id = reviews.commission_id
        and commission.client_id = reviews.client_id
        and commission.freelancer_id = reviews.freelancer_id
        and commission.status = 'completed'
    )
  );

-- El trigger de rating debe poder actualizar el agregado aunque el cliente no
-- tenga permisos directos de escritura sobre freelancer_profiles.
create or replace function public.update_freelancer_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.freelancer_profiles
  set
    rating = (
      select round(avg(review.rating)::numeric, 1)
      from public.reviews as review
      where review.freelancer_id = new.freelancer_id
    ),
    reviews_count = (
      select count(*)
      from public.reviews as review
      where review.freelancer_id = new.freelancer_id
    )
  where profile_id = new.freelancer_id;

  return new;
end;
$function$;

revoke all on function public.notify_new_commission() from public;
revoke all on function public.notify_commission_status_change() from public;
revoke all on function public.notify_new_review() from public;
revoke all on function public.update_freelancer_rating() from public;

-- ---------------------------------------------------------------------------
-- 6. Realtime para notificaciones
-- ---------------------------------------------------------------------------

do $migration$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$migration$;

commit;
