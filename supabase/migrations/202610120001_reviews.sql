-- KREATIVA: calificaciones seguras para comisiones completadas.
-- Ejecutar DESPUES de 202607280002_creative_profile_avatar.sql.

begin;

-- La tabla ya existe en el esquema actual. Esta definicion permite instalar
-- la unidad de forma independiente en un entorno nuevo sin duplicarla.
create table if not exists public.reviews (
  id            bigserial primary key,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  client_id     uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  rating        integer not null,
  comment       text,
  created_at    timestamptz not null default now()
);

-- Refuerza las reglas aunque la tabla proviniera del esquema base.
do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_rating_check'
  ) then
    alter table public.reviews
      add constraint reviews_rating_check
      check (rating between 1 and 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_comment_length_check'
  ) then
    alter table public.reviews
      add constraint reviews_comment_length_check
      check (comment is null or char_length(comment) <= 500);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_distinct_participants_check'
  ) then
    alter table public.reviews
      add constraint reviews_distinct_participants_check
      check (client_id <> freelancer_id);
  end if;
end
$migration$;

create unique index if not exists reviews_one_per_commission_idx
  on public.reviews(commission_id);

create index if not exists reviews_freelancer_created_idx
  on public.reviews(freelancer_id, created_at desc);

alter table public.reviews enable row level security;

grant select on table public.reviews to anon, authenticated;
revoke insert, update, delete on table public.reviews from anon, authenticated;

drop policy if exists "Reviews visibles para todos" on public.reviews;
drop policy if exists "public_select_reviews" on public.reviews;
drop policy if exists "clients_insert_completed_commission_reviews" on public.reviews;

create policy "public_select_reviews"
  on public.reviews
  for select
  to anon, authenticated
  using (true);

-- Unidad B reemplaza esta implementacion por una lectura directa de
-- profiles.account_status. Mientras esa columna no exista, una cuenta con
-- perfil se considera activa para conservar compatibilidad entre unidades.
create or replace function public.is_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    (
      select coalesce(
        (to_jsonb(profile) ->> 'account_status') = 'active',
        true
      )
      from public.profiles as profile
      where profile.id = (select auth.uid())
    ),
    false
  );
$function$;

revoke all on function public.is_account_active() from public;
grant execute on function public.is_account_active() to authenticated;

create or replace function public.create_review(
  p_commission_id bigint,
  p_rating integer,
  p_comment text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_client_id uuid;
  v_freelancer_id uuid;
  v_commission_status text;
  v_review_id bigint;
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para publicar una resena.'
      using errcode = '42501';
  end if;

  if not public.is_account_active() then
    raise exception 'Tu cuenta no esta activa y no puede publicar resenas.'
      using errcode = '42501';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'La calificacion debe ser un numero entero entre 1 y 5.'
      using errcode = '22023';
  end if;

  if v_comment is not null and char_length(v_comment) > 500 then
    raise exception 'El comentario no puede superar 500 caracteres.'
      using errcode = '22023';
  end if;

  select commission.client_id, commission.freelancer_id, commission.status
  into v_client_id, v_freelancer_id, v_commission_status
  from public.commissions as commission
  where commission.id = p_commission_id;

  if not found then
    raise exception 'La comision indicada no existe.'
      using errcode = 'P0002';
  end if;

  if v_client_id <> v_user_id then
    raise exception 'Solo el cliente de la comision puede calificarla.'
      using errcode = '42501';
  end if;

  if v_client_id = v_freelancer_id then
    raise exception 'No puedes calificarte a ti mismo.'
      using errcode = '42501';
  end if;

  if v_commission_status <> 'completed' then
    raise exception 'La comision debe estar completada antes de calificarla.'
      using errcode = '22023';
  end if;

  insert into public.reviews (
    commission_id,
    client_id,
    freelancer_id,
    rating,
    comment
  )
  values (
    p_commission_id,
    v_client_id,
    v_freelancer_id,
    p_rating,
    v_comment
  )
  returning id into v_review_id;

  return v_review_id;
exception
  when unique_violation then
    raise exception 'Esta comision ya tiene una resena.'
      using errcode = '23505';
end;
$function$;

revoke all on function public.create_review(bigint, integer, text) from public;
grant execute on function public.create_review(bigint, integer, text) to authenticated;

-- El trigger corre como propietario de la funcion para que RLS no impida
-- actualizar el promedio agregado en freelancer_profiles.
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

do $migration$
declare
  v_trigger record;
begin
  for v_trigger in
    select trigger_row.tgname
    from pg_trigger as trigger_row
    join pg_proc as procedure_row on procedure_row.oid = trigger_row.tgfoid
    join pg_namespace as namespace_row on namespace_row.oid = procedure_row.pronamespace
    where trigger_row.tgrelid = 'public.reviews'::regclass
      and not trigger_row.tgisinternal
      and namespace_row.nspname = 'public'
      and procedure_row.proname = 'update_freelancer_rating'
  loop
    execute format(
      'drop trigger if exists %I on public.reviews',
      v_trigger.tgname
    );
  end loop;
end
$migration$;

create trigger on_review_created_update_rating
  after insert on public.reviews
  for each row execute function public.update_freelancer_rating();

-- La notificacion ya existia. Se reemplaza la funcion y se conserva un solo
-- trigger para evitar mensajes duplicados en instalaciones parciales.
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
    'Recibiste una nueva resena',
    coalesce(v_client_name, 'Un cliente') || ' califico tu trabajo con ' ||
      new.rating::text || ' de 5 estrellas.',
    'review',
    new.id
  );

  return new;
end;
$function$;

do $migration$
declare
  v_trigger record;
begin
  for v_trigger in
    select trigger_row.tgname
    from pg_trigger as trigger_row
    join pg_proc as procedure_row on procedure_row.oid = trigger_row.tgfoid
    join pg_namespace as namespace_row on namespace_row.oid = procedure_row.pronamespace
    where trigger_row.tgrelid = 'public.reviews'::regclass
      and not trigger_row.tgisinternal
      and namespace_row.nspname = 'public'
      and procedure_row.proname = 'notify_new_review'
  loop
    execute format(
      'drop trigger if exists %I on public.reviews',
      v_trigger.tgname
    );
  end loop;
end
$migration$;

create trigger on_review_created_notify
  after insert on public.reviews
  for each row execute function public.notify_new_review();

revoke all on function public.update_freelancer_rating() from public;
revoke all on function public.notify_new_review() from public;

notify pgrst, 'reload schema';

commit;
