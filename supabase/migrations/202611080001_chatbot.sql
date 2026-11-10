-- RF5.4: cuota diaria del buscador conversacional.
-- Ejecutar DESPUÉS de 202611040001_profile_favorites.sql.
-- No almacena mensajes ni información del perfil; solo un contador por día UTC.
begin;

create table if not exists public.chatbot_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, usage_date)
);

alter table public.chatbot_usage enable row level security;
revoke all on table public.chatbot_usage from public, anon, authenticated;

create or replace function public.consume_chatbot_quota(p_limit integer)
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
begin
  if v_user_id is null or not public.is_account_active() then
    raise exception 'Debes iniciar sesión con una cuenta activa.' using errcode = '42501';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'Límite diario inválido.' using errcode = '22023';
  end if;

  insert into public.chatbot_usage as usage (user_id, usage_date, count)
  values (v_user_id, (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_date) do update
    set count = usage.count + 1
    where usage.count < p_limit
  returning count into v_count;

  if v_count is null then
    return -1;
  end if;

  return greatest(p_limit - v_count, 0);
end;
$function$;

revoke all on function public.consume_chatbot_quota(integer) from public, anon;
grant execute on function public.consume_chatbot_quota(integer) to authenticated;

notify pgrst, 'reload schema';
commit;
