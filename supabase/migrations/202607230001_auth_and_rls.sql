-- KREATIVA: Supabase Auth, roles administrativos y RLS real.
-- Ejecutar una sola vez DESPUÉS del esquema base y de las políticas temporales.

begin;

-- ---------------------------------------------------------------------------
-- 1. El rol comercial existente se conserva.
--    account_role controla únicamente el acceso normal/admin.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists account_role text not null default 'user';

update public.profiles
set account_role = 'admin'
where role = 'admin' and account_role <> 'admin';

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_account_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_role_check
      check (account_role in ('user', 'admin'))
      not valid;
  end if;
end
$migration$;

alter table public.profiles
  validate constraint profiles_account_role_check;

-- Las filas semilla existentes pueden seguir funcionando como catálogo aunque
-- no tengan una cuenta en auth.users. Toda fila nueva sí debe corresponder a
-- una identidad real de Supabase Auth.
do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and confrelid = 'auth.users'::regclass
      and contype = 'f'
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_id_fkey
      foreign key (id)
      references auth.users(id)
      on delete cascade
      not valid;
  end if;
end
$migration$;

-- ---------------------------------------------------------------------------
-- 2. Perfil automático al registrarse.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    account_role
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    ),
    'client',
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Funciones seguras para consultar el acceso del usuario actual.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
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
      and profile.account_role = 'admin'
  );
$function$;

create or replace function public.get_my_profile()
returns table (
  id uuid,
  email text,
  full_name text,
  avatar_url text,
  marketplace_role text,
  account_role text,
  location text,
  phone text
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
    profile.phone
  from public.profiles as profile
  where profile.id = (select auth.uid());
$function$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.get_my_profile() from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_my_profile() to authenticated;

-- El catálogo solo necesita campos públicos de profiles. Email, teléfono y
-- account_role se obtienen únicamente mediante get_my_profile().
revoke select on table public.profiles from anon, authenticated;

grant select (
  id,
  full_name,
  avatar_url,
  role,
  location,
  created_at,
  updated_at
) on table public.profiles to anon, authenticated;

-- Evita que un usuario se asigne account_role='admin' desde el navegador.
revoke update on table public.profiles from anon, authenticated;

grant update (
  full_name,
  avatar_url,
  location,
  phone,
  updated_at
) on table public.profiles to authenticated;

drop policy if exists "Usuario edita su propio perfil" on public.profiles;
drop policy if exists "user_updates_own_profile" on public.profiles;

create policy "user_updates_own_profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- 4. Sustituir políticas temporales por autorización por participante.
-- ---------------------------------------------------------------------------

alter table public.commissions enable row level security;
alter table public.commission_attachments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.conversation_reads enable row level security;

drop policy if exists "temp_select_commissions" on public.commissions;
drop policy if exists "temp_insert_commissions" on public.commissions;
drop policy if exists "temp_select_commission_attachments" on public.commission_attachments;
drop policy if exists "temp_insert_commission_attachments" on public.commission_attachments;
drop policy if exists "temp_select_conversations" on public.conversations;
drop policy if exists "temp_insert_conversations" on public.conversations;
drop policy if exists "temp_update_conversations" on public.conversations;
drop policy if exists "temp_select_messages" on public.messages;
drop policy if exists "temp_insert_messages" on public.messages;
drop policy if exists "temp_select_message_attachments" on public.message_attachments;
drop policy if exists "temp_insert_message_attachments" on public.message_attachments;

-- También limpia los nombres usados por la propuesta incompleta, por si se
-- alcanzó a ejecutar parcialmente.
drop policy if exists "Participantes ven su comisión" on public.commissions;
drop policy if exists "Cliente autenticado crea su comisión" on public.commissions;
drop policy if exists "Participantes ven adjuntos de su comisión" on public.commission_attachments;
drop policy if exists "Cliente adjunta referencias a su propia comisión" on public.commission_attachments;
drop policy if exists "Participantes ven su conversación" on public.conversations;
drop policy if exists "Participante crea conversación donde participa" on public.conversations;
drop policy if exists "Participante actualiza su conversación" on public.conversations;
drop policy if exists "Participantes ven mensajes de su conversación" on public.messages;
drop policy if exists "Participante envía mensajes en su conversación" on public.messages;
drop policy if exists "Participantes ven adjuntos de mensajes" on public.message_attachments;
drop policy if exists "Participante adjunta archivos a su propio mensaje" on public.message_attachments;
drop policy if exists "Usuario gestiona su propio estado de lectura" on public.conversation_reads;

drop policy if exists "participants_select_commissions" on public.commissions;
drop policy if exists "clients_insert_commissions" on public.commissions;
drop policy if exists "participants_select_commission_attachments" on public.commission_attachments;
drop policy if exists "clients_insert_commission_attachments" on public.commission_attachments;
drop policy if exists "participants_select_conversations" on public.conversations;
drop policy if exists "participants_insert_conversations" on public.conversations;
drop policy if exists "participants_update_conversations" on public.conversations;
drop policy if exists "participants_select_messages" on public.messages;
drop policy if exists "participants_insert_messages" on public.messages;
drop policy if exists "participants_select_message_attachments" on public.message_attachments;
drop policy if exists "senders_insert_message_attachments" on public.message_attachments;
drop policy if exists "users_manage_own_conversation_reads" on public.conversation_reads;

create policy "participants_select_commissions"
  on public.commissions
  for select
  to authenticated
  using (
    (select auth.uid()) = client_id
    or (select auth.uid()) = freelancer_id
    or public.is_admin()
  );

create policy "clients_insert_commissions"
  on public.commissions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = client_id
    and client_id <> freelancer_id
    and exists (
      select 1
      from public.gigs as gig
      where gig.id = commissions.gig_id
        and gig.freelancer_id = commissions.freelancer_id
    )
  );

create policy "participants_select_commission_attachments"
  on public.commission_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.commissions as commission
      where commission.id = commission_attachments.commission_id
        and (
          commission.client_id = (select auth.uid())
          or commission.freelancer_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "clients_insert_commission_attachments"
  on public.commission_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.commissions as commission
      where commission.id = commission_attachments.commission_id
        and commission.client_id = (select auth.uid())
    )
  );

create policy "participants_select_conversations"
  on public.conversations
  for select
  to authenticated
  using (
    (select auth.uid()) = client_id
    or (select auth.uid()) = freelancer_id
    or public.is_admin()
  );

create policy "participants_insert_conversations"
  on public.conversations
  for insert
  to authenticated
  with check (
    (
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

-- La aplicación solo necesita actualizar last_message_at.
revoke update on table public.conversations from authenticated;
grant update (last_message_at) on table public.conversations to authenticated;

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
    (select auth.uid()) = client_id
    or (select auth.uid()) = freelancer_id
    or public.is_admin()
  );

create policy "participants_select_messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations as conversation
      where conversation.id = messages.conversation_id
        and (
          conversation.client_id = (select auth.uid())
          or conversation.freelancer_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "participants_insert_messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
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

create policy "participants_select_message_attachments"
  on public.message_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages as message
      join public.conversations as conversation
        on conversation.id = message.conversation_id
      where message.id = message_attachments.message_id
        and (
          conversation.client_id = (select auth.uid())
          or conversation.freelancer_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "senders_insert_message_attachments"
  on public.message_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.messages as message
      where message.id = message_attachments.message_id
        and message.sender_id = (select auth.uid())
    )
  );

create policy "users_manage_own_conversation_reads"
  on public.conversation_reads
  for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = conversation_reads.conversation_id
        and (
          conversation.client_id = (select auth.uid())
          or conversation.freelancer_id = (select auth.uid())
        )
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.conversations as conversation
      where conversation.id = conversation_reads.conversation_id
        and (
          conversation.client_id = (select auth.uid())
          or conversation.freelancer_id = (select auth.uid())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Storage: solo usuarios autenticados suben dentro de su carpeta.
-- ---------------------------------------------------------------------------

drop policy if exists "temp_insert_commission_files" on storage.objects;
drop policy if exists "temp_insert_message_files" on storage.objects;
drop policy if exists "temp_select_uploaded_files" on storage.objects;
drop policy if exists "Usuarios autenticados suben referencias de comisión" on storage.objects;
drop policy if exists "Usuarios autenticados suben adjuntos de chat" on storage.objects;
drop policy if exists "users_insert_commission_files" on storage.objects;
drop policy if exists "users_insert_message_files" on storage.objects;
drop policy if exists "public_select_uploaded_files" on storage.objects;

create policy "users_insert_commission_files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'commission-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users_insert_message_files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'message-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Los buckets actuales usan URLs públicas. Esta política conserva ese diseño
-- para no romper adjuntos existentes; ver la guía para la alternativa privada.
create policy "public_select_uploaded_files"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('commission-attachments', 'message-attachments')
  );

commit;
