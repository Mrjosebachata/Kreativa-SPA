-- KREATIVA: corrige la lectura publica del catalogo tras agregar moderacion.
-- Ejecutar DESPUES de 202610120003_reminders.sql.

begin;

-- La politica de gigs no debe consultar profiles con los permisos del
-- visitante: account_status es privado y no se concede como columna publica.
-- Esta funcion encapsula exclusivamente la comprobacion booleana necesaria.
create or replace function public.is_catalog_profile_active(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = p_profile_id
      and profile.account_status = 'active'
  );
$function$;

revoke all on function public.is_catalog_profile_active(uuid) from public;
grant execute on function public.is_catalog_profile_active(uuid)
  to anon, authenticated;

drop policy if exists "Gigs activos visibles para todos" on public.gigs;
drop policy if exists "public_select_active_gigs" on public.gigs;

create policy "public_select_active_gigs"
  on public.gigs
  for select
  to anon, authenticated
  using (
    status = 'active'
    and public.is_catalog_profile_active(freelancer_id)
  );

notify pgrst, 'reload schema';

commit;
