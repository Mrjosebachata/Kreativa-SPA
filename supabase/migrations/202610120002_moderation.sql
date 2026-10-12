-- KREATIVA: reportes, moderacion y estado operativo de las cuentas.
-- Ejecutar DESPUES de 202610120001_reviews.sql.

begin;

-- ---------------------------------------------------------------------------
-- 1. Estado de cuenta y consulta privada del perfil autenticado
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists account_status_reason text,
  add column if not exists account_status_changed_at timestamptz not null default now();

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_account_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_status_check
      check (account_status in ('active', 'suspended', 'blocked'));
  end if;
end
$migration$;

create index if not exists profiles_account_status_idx
  on public.profiles(account_status);

create or replace function public.is_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.account_status = 'active'
  );
$function$;

revoke all on function public.is_account_active() from public;
grant execute on function public.is_account_active() to authenticated;

drop function if exists public.get_my_profile();

create function public.get_my_profile()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  marketplace_role text,
  account_role text,
  location text,
  phone text,
  account_status text,
  account_status_reason text,
  account_status_changed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    profile.id,
    profile.email,
    profile.full_name,
    profile.avatar_url,
    profile.role as marketplace_role,
    profile.account_role,
    profile.location,
    profile.phone,
    profile.account_status,
    profile.account_status_reason,
    profile.account_status_changed_at
  from public.profiles as profile
  where profile.id = (select auth.uid());
$function$;

revoke all on function public.get_my_profile() from public;
grant execute on function public.get_my_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Reportes y bitacora inmutable de moderacion
-- ---------------------------------------------------------------------------

create table if not exists public.reports (
  id               bigserial primary key,
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  service_id       bigint references public.gigs(id) on delete set null,
  reason           text not null
                     check (
                       reason in (
                         'insults',
                         'threats',
                         'discrimination',
                         'inappropriate_content',
                         'harassment',
                         'impersonation',
                         'privacy_misuse',
                         'other'
                       )
                     ),
  details          text
                     check (details is null or char_length(details) <= 500),
  status           text not null default 'open'
                     check (status in ('open', 'resolved', 'dismissed')),
  resolved_by      uuid references public.profiles(id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now(),
  constraint reports_no_self_report_check
    check (reporter_id <> reported_user_id)
);

drop index if exists public.reports_one_open_profile_idx;
drop index if exists public.reports_one_open_service_idx;

create unique index if not exists reports_one_open_target_idx
  on public.reports(reporter_id, reported_user_id)
  where status = 'open';

create index if not exists reports_status_created_idx
  on public.reports(status, created_at desc);

create index if not exists reports_reported_user_idx
  on public.reports(reported_user_id, created_at desc);

create table if not exists public.moderation_actions (
  id                 bigserial primary key,
  admin_id           uuid not null references public.profiles(id) on delete restrict,
  target_user_id     uuid not null references public.profiles(id) on delete cascade,
  report_id          bigint references public.reports(id) on delete set null,
  action             text not null
                       check (
                         action in (
                           'dismiss_report',
                           'warn',
                           'suspend',
                           'block',
                           'reactivate',
                           'hide_service',
                           'delete_service',
                           'remove_portfolio_image'
                         )
                       ),
  note               text
                       check (note is null or char_length(note) <= 500),
  service_id         bigint references public.gigs(id) on delete set null,
  portfolio_image_id bigint,
  created_at         timestamptz not null default now()
);

create index if not exists moderation_actions_target_created_idx
  on public.moderation_actions(target_user_id, created_at desc);

create index if not exists moderation_actions_report_idx
  on public.moderation_actions(report_id, created_at desc);

alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

revoke all on table public.reports from anon;
revoke insert, update, delete on table public.reports from authenticated;
grant select on table public.reports to authenticated;
grant insert (reporter_id, reported_user_id, service_id, reason, details)
  on table public.reports to authenticated;
grant usage, select on sequence public.reports_id_seq to authenticated;

revoke all on table public.moderation_actions from anon;
revoke insert, update, delete on table public.moderation_actions from authenticated;
grant select on table public.moderation_actions to authenticated;

drop policy if exists "Usuarios ven sus propios reportes y administradores ven todos" on public.reports;
drop policy if exists "Usuarios activos crean sus propios reportes" on public.reports;
drop policy if exists "Administradores ven la bitacora de moderacion" on public.moderation_actions;

create policy "Usuarios ven sus propios reportes y administradores ven todos"
  on public.reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or public.is_admin()
  );

create policy "Usuarios activos crean sus propios reportes"
  on public.reports
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and reporter_id = (select auth.uid())
    and reported_user_id <> (select auth.uid())
    and (
      service_id is null
      or exists (
        select 1
        from public.gigs as reported_gig
        where reported_gig.id = reports.service_id
          and reported_gig.freelancer_id = reports.reported_user_id
      )
    )
  );

create policy "Administradores ven la bitacora de moderacion"
  on public.moderation_actions
  for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Tipos de notificacion para acciones de cuenta
-- ---------------------------------------------------------------------------

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'commission_requested',
      'commission_status_changed',
      'review_received',
      'service_published',
      'moderation_warning',
      'account_suspended',
      'account_blocked',
      'account_reactivated'
    )
  );

alter table public.notifications
  drop constraint if exists notifications_entity_type_check;

alter table public.notifications
  add constraint notifications_entity_type_check
  check (
    entity_type is null
    or entity_type in ('commission', 'review', 'service', 'account')
  );

-- ---------------------------------------------------------------------------
-- 4. Operaciones seguras de reportes y moderacion
-- ---------------------------------------------------------------------------

create or replace function public.create_report(
  p_reported_user_id uuid,
  p_service_id bigint,
  p_reason text,
  p_details text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_service_owner_id uuid;
  v_report_id bigint;
  v_details text := nullif(trim(coalesce(p_details, '')), '');
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para crear un reporte.'
      using errcode = '42501';
  end if;

  if not public.is_account_active() then
    raise exception 'Tu cuenta no esta activa y no puede crear reportes.'
      using errcode = '42501';
  end if;

  if p_reported_user_id is null or not exists (
    select 1 from public.profiles as profile
    where profile.id = p_reported_user_id
  ) then
    raise exception 'La cuenta reportada no existe.'
      using errcode = '23503';
  end if;

  if p_reported_user_id = v_user_id then
    raise exception 'No puedes reportar tu propia cuenta.'
      using errcode = '42501';
  end if;

  if p_reason not in (
    'insults',
    'threats',
    'discrimination',
    'inappropriate_content',
    'harassment',
    'impersonation',
    'privacy_misuse',
    'other'
  ) then
    raise exception 'Selecciona un motivo de reporte valido.'
      using errcode = '22023';
  end if;

  if v_details is not null and char_length(v_details) > 500 then
    raise exception 'Los detalles no pueden superar 500 caracteres.'
      using errcode = '22023';
  end if;

  if p_service_id is not null then
    select gig.freelancer_id
    into v_service_owner_id
    from public.gigs as gig
    where gig.id = p_service_id;

    if not found or v_service_owner_id <> p_reported_user_id then
      raise exception 'El servicio no pertenece a la cuenta reportada.'
        using errcode = '22023';
    end if;
  end if;

  insert into public.reports (
    reporter_id,
    reported_user_id,
    service_id,
    reason,
    details
  )
  values (
    v_user_id,
    p_reported_user_id,
    p_service_id,
    p_reason,
    v_details
  )
  returning id into v_report_id;

  return v_report_id;
exception
  when unique_violation then
    raise exception 'Ya tienes un reporte abierto para este objetivo.'
      using errcode = '23505';
end;
$function$;

create or replace function public.get_moderation_reports(
  p_status text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede consultar la moderacion.'
      using errcode = '42501';
  end if;

  if p_status is not null
     and p_status not in ('open', 'resolved', 'dismissed') then
    raise exception 'El filtro de estado no es valido.'
      using errcode = '22023';
  end if;

  select coalesce(
    jsonb_agg(report_data.payload order by report_data.created_at desc),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      report.created_at,
      jsonb_build_object(
        'id', report.id,
        'reason', report.reason,
        'details', report.details,
        'status', report.status,
        'createdAt', report.created_at,
        'resolvedAt', report.resolved_at,
        'reporterId', report.reporter_id,
        'reporterName', reporter.full_name,
        'reportedUserId', report.reported_user_id,
        'reportedUserName', target.full_name,
        'reportedUserAvatar', target.avatar_url,
        'accountStatus', target.account_status,
        'accountStatusReason', target.account_status_reason,
        'accountStatusChangedAt', target.account_status_changed_at,
        'serviceId', report.service_id,
        'serviceTitle', reported_service.title,
        'resolvedByName', resolver.full_name,
        'warningCount', (
          select count(*)
          from public.moderation_actions as warning
          where warning.target_user_id = report.reported_user_id
            and warning.action = 'warn'
        ),
        'actions', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', action.id,
                'action', action.action,
                'note', action.note,
                'adminName', administrator.full_name,
                'serviceId', action.service_id,
                'portfolioImageId', action.portfolio_image_id,
                'createdAt', action.created_at
              )
              order by action.created_at desc
            )
            from public.moderation_actions as action
            left join public.profiles as administrator
              on administrator.id = action.admin_id
            where action.target_user_id = report.reported_user_id
          ),
          '[]'::jsonb
        ),
        'services', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', service.id,
                'title', service.title,
                'status', service.status
              )
              order by service.created_at desc, service.id desc
            )
            from public.gigs as service
            where service.freelancer_id = report.reported_user_id
          ),
          '[]'::jsonb
        ),
        'portfolioImages', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', portfolio.id,
                'url', portfolio.image_url,
                'displayOrder', portfolio.display_order
              )
              order by portfolio.display_order, portfolio.id
            )
            from public.portfolio_images as portfolio
            where portfolio.freelancer_id = report.reported_user_id
          ),
          '[]'::jsonb
        )
      ) as payload
    from public.reports as report
    join public.profiles as reporter on reporter.id = report.reporter_id
    join public.profiles as target on target.id = report.reported_user_id
    left join public.gigs as reported_service on reported_service.id = report.service_id
    left join public.profiles as resolver on resolver.id = report.resolved_by
    where p_status is null or report.status = p_status
  ) as report_data;

  return v_result;
end;
$function$;

create or replace function public.moderate_report(
  p_report_id bigint,
  p_action text,
  p_note text default null,
  p_service_id bigint default null,
  p_portfolio_image_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_admin_id uuid := auth.uid();
  v_target_user_id uuid;
  v_report_service_id bigint;
  v_target_account_role text;
  v_note text := nullif(trim(coalesce(p_note, '')), '');
  v_effective_service_id bigint;
  v_notification_type text;
  v_notification_title text;
  v_notification_body text;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'Solo un administrador puede aplicar acciones de moderacion.'
      using errcode = '42501';
  end if;

  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'La nota no puede superar 500 caracteres.'
      using errcode = '22023';
  end if;

  select report.reported_user_id, report.service_id
  into v_target_user_id, v_report_service_id
  from public.reports as report
  where report.id = p_report_id
  for update;

  if not found then
    raise exception 'El reporte indicado no existe.'
      using errcode = 'P0002';
  end if;

  select profile.account_role
  into v_target_account_role
  from public.profiles as profile
  where profile.id = v_target_user_id
  for update;

  if p_action <> 'dismiss_report'
     and (v_target_user_id = v_admin_id or v_target_account_role = 'admin') then
    raise exception 'Un administrador no puede sancionarse ni sancionar a otro administrador.'
      using errcode = '42501';
  end if;

  case p_action
    when 'dismiss_report' then
      null;

    when 'warn' then
      if (
        select count(*) >= 2
        from public.moderation_actions as warning
        where warning.target_user_id = v_target_user_id
          and warning.action = 'warn'
      ) then
        raise exception 'La cuenta ya alcanzo el maximo de dos avisos. Considera suspenderla o bloquearla.'
          using errcode = '22023';
      end if;

      v_notification_type := 'moderation_warning';
      v_notification_title := 'Aviso de moderacion';
      v_notification_body := coalesce(
        v_note,
        'Revisa las normas de convivencia de KREATIVA antes de volver a publicar.'
      );

    when 'suspend' then
      update public.profiles
      set
        account_status = 'suspended',
        account_status_reason = coalesce(v_note, 'Cuenta suspendida por moderacion.'),
        account_status_changed_at = now(),
        updated_at = now()
      where id = v_target_user_id;

      v_notification_type := 'account_suspended';
      v_notification_title := 'Tu cuenta fue suspendida';
      v_notification_body := coalesce(
        v_note,
        'Puedes consultar el catalogo, pero las acciones privadas estan deshabilitadas.'
      );

    when 'block' then
      update public.profiles
      set
        account_status = 'blocked',
        account_status_reason = coalesce(v_note, 'Cuenta bloqueada por moderacion.'),
        account_status_changed_at = now(),
        updated_at = now()
      where id = v_target_user_id;

      v_notification_type := 'account_blocked';
      v_notification_title := 'Tu cuenta fue bloqueada';
      v_notification_body := coalesce(
        v_note,
        'Las acciones privadas de tu cuenta estan deshabilitadas.'
      );

    when 'reactivate' then
      update public.profiles
      set
        account_status = 'active',
        account_status_reason = null,
        account_status_changed_at = now(),
        updated_at = now()
      where id = v_target_user_id;

      v_notification_type := 'account_reactivated';
      v_notification_title := 'Tu cuenta fue reactivada';
      v_notification_body := coalesce(
        v_note,
        'Ya puedes volver a usar las funciones privadas de KREATIVA.'
      );

    when 'hide_service' then
      v_effective_service_id := coalesce(p_service_id, v_report_service_id);

      update public.gigs
      set status = 'inactive'
      where id = v_effective_service_id
        and freelancer_id = v_target_user_id;

      if not found then
        raise exception 'Selecciona un servicio que pertenezca a la cuenta reportada.'
          using errcode = '22023';
      end if;

    when 'delete_service' then
      v_effective_service_id := coalesce(p_service_id, v_report_service_id);

      update public.gigs
      set status = 'deleted'
      where id = v_effective_service_id
        and freelancer_id = v_target_user_id;

      if not found then
        raise exception 'Selecciona un servicio que pertenezca a la cuenta reportada.'
          using errcode = '22023';
      end if;

    when 'remove_portfolio_image' then
      if p_portfolio_image_id is null then
        raise exception 'Selecciona una imagen de portafolio.'
          using errcode = '22023';
      end if;

      delete from public.portfolio_images
      where id = p_portfolio_image_id
        and freelancer_id = v_target_user_id;

      if not found then
        raise exception 'La imagen no pertenece a la cuenta reportada.'
          using errcode = '22023';
      end if;

    else
      raise exception 'La accion de moderacion no es valida.'
        using errcode = '22023';
  end case;

  insert into public.moderation_actions (
    admin_id,
    target_user_id,
    report_id,
    action,
    note,
    service_id,
    portfolio_image_id
  )
  values (
    v_admin_id,
    v_target_user_id,
    p_report_id,
    p_action,
    v_note,
    v_effective_service_id,
    p_portfolio_image_id
  );

  update public.reports
  set
    status = case
      when p_action = 'dismiss_report' then 'dismissed'
      else 'resolved'
    end,
    resolved_by = v_admin_id,
    resolved_at = now()
  where id = p_report_id;

  if v_notification_type is not null then
    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      entity_type,
      entity_id
    )
    values (
      v_target_user_id,
      v_notification_type,
      v_notification_title,
      v_notification_body,
      'account',
      null
    );
  end if;
end;
$function$;

revoke all on function public.create_report(uuid, bigint, text, text) from public;
revoke all on function public.get_moderation_reports(text) from public;
revoke all on function public.moderate_report(bigint, text, text, bigint, bigint) from public;

grant execute on function public.create_report(uuid, bigint, text, text) to authenticated;
grant execute on function public.get_moderation_reports(text) to authenticated;
grant execute on function public.moderate_report(bigint, text, text, bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Enforcement de cuentas suspendidas o bloqueadas
-- ---------------------------------------------------------------------------

drop policy if exists "clients_insert_commissions" on public.commissions;
create policy "clients_insert_commissions"
  on public.commissions
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and (select auth.uid()) = client_id
    and client_id <> freelancer_id
    and exists (
      select 1
      from public.gigs as gig
      where gig.id = commissions.gig_id
        and gig.freelancer_id = commissions.freelancer_id
    )
  );

drop policy if exists "clients_insert_commission_attachments" on public.commission_attachments;
create policy "clients_insert_commission_attachments"
  on public.commission_attachments
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and exists (
      select 1
      from public.commissions as commission
      where commission.id = commission_attachments.commission_id
        and commission.client_id = (select auth.uid())
    )
  );

drop policy if exists "participants_insert_conversations" on public.conversations;
create policy "participants_insert_conversations"
  on public.conversations
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and (
      (select auth.uid()) = client_id
      or (select auth.uid()) = freelancer_id
    )
    and (
      (
        commission_id is not null
        and exists (
          select 1
          from public.commissions as commission
          where commission.id = conversations.commission_id
            and commission.gig_id = conversations.gig_id
            and commission.client_id = conversations.client_id
            and commission.freelancer_id = conversations.freelancer_id
        )
      )
      or (
        commission_id is null
        and exists (
          select 1
          from public.gigs as gig
          where gig.id = conversations.gig_id
            and gig.freelancer_id = conversations.freelancer_id
        )
      )
    )
  );

drop policy if exists "participants_update_conversations" on public.conversations;
create policy "participants_update_conversations"
  on public.conversations
  for update
  to authenticated
  using (
    (select auth.uid()) = client_id
    or (select auth.uid()) = freelancer_id
    or public.is_admin()
  )
  with check (
    (
      public.is_account_active()
      and (
        (select auth.uid()) = client_id
        or (select auth.uid()) = freelancer_id
      )
    )
    or public.is_admin()
  );

drop policy if exists "participants_insert_messages" on public.messages;
create policy "participants_insert_messages"
  on public.messages
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = messages.conversation_id
        and (
          conversation.client_id = (select auth.uid())
          or conversation.freelancer_id = (select auth.uid())
        )
    )
  );

drop policy if exists "senders_insert_message_attachments" on public.message_attachments;
create policy "senders_insert_message_attachments"
  on public.message_attachments
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and exists (
      select 1
      from public.messages as message
      where message.id = message_attachments.message_id
        and message.sender_id = (select auth.uid())
    )
  );

create or replace function public.enforce_active_service_publisher()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is not null and not public.is_account_active() then
    raise exception 'Tu cuenta no esta activa y no puede publicar servicios.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists before_gig_insert_require_active_account on public.gigs;
create trigger before_gig_insert_require_active_account
  before insert on public.gigs
  for each row execute function public.enforce_active_service_publisher();

revoke all on function public.enforce_active_service_publisher() from public;

drop policy if exists "Gigs activos visibles para todos" on public.gigs;
drop policy if exists "public_select_active_gigs" on public.gigs;

create policy "public_select_active_gigs"
  on public.gigs
  for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.profiles as owner_profile
      where owner_profile.id = gigs.freelancer_id
        and owner_profile.account_status = 'active'
    )
  );

drop policy if exists "users_insert_commission_files" on storage.objects;
drop policy if exists "users_insert_message_files" on storage.objects;
drop policy if exists "users_insert_service_images" on storage.objects;

create policy "users_insert_commission_files"
  on storage.objects
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and bucket_id = 'commission-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users_insert_message_files"
  on storage.objects
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users_insert_service_images"
  on storage.objects
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and bucket_id = 'service-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';

commit;
