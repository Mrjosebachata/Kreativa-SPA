-- KREATIVA: foto de perfil compartida en el perfil creativo.
-- Ejecutar DESPUÉS de 202607280001_creative_profile_settings.sql.

begin;

-- La función ya existe con cinco columnas. PostgreSQL requiere eliminarla
-- antes de ampliar su tipo de retorno.
drop function if exists public.get_my_creative_profile();

create function public.get_my_creative_profile()
returns table (
  bio text,
  full_bio text,
  location text,
  avatar_url text,
  skills text[],
  portfolio_urls text[]
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    coalesce(freelancer.bio, ''),
    coalesce(freelancer.full_bio, ''),
    coalesce(profile.location, ''),
    coalesce(profile.avatar_url, ''),
    coalesce(
      (
        select array_agg(skill.name order by lower(skill.name), skill.id)
        from public.freelancer_skills as freelancer_skill
        join public.skills as skill
          on skill.id = freelancer_skill.skill_id
        where freelancer_skill.freelancer_id = profile.id
      ),
      array[]::text[]
    ),
    coalesce(
      (
        select array_agg(
          portfolio.image_url
          order by portfolio.display_order, portfolio.id
        )
        from public.portfolio_images as portfolio
        where portfolio.freelancer_id = profile.id
      ),
      array[]::text[]
    )
  from public.profiles as profile
  left join public.freelancer_profiles as freelancer
    on freelancer.profile_id = profile.id
  where profile.id = (select auth.uid());
$function$;

revoke all on function public.get_my_creative_profile() from public;
grant execute on function public.get_my_creative_profile() to authenticated;

-- Esta sobrecarga conserva la operación transaccional anterior y agrega la
-- actualización segura de avatar_url. Las imágenes siguen usando el bucket
-- service-images y la carpeta privada de escritura de cada usuario.
create or replace function public.save_creative_profile(
  p_bio text,
  p_full_bio text,
  p_location text,
  p_avatar_url text,
  p_skills text[],
  p_portfolio_urls text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_current_avatar_url text;
  v_next_avatar_url text := nullif(trim(coalesce(p_avatar_url, '')), '');
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para configurar tu perfil.'
      using errcode = '42501';
  end if;

  select profile.avatar_url
  into v_current_avatar_url
  from public.profiles as profile
  where profile.id = v_user_id;

  if v_next_avatar_url is not null
     and v_next_avatar_url is distinct from v_current_avatar_url
     and position(
       '/service-images/' || v_user_id::text || '/'
       in v_next_avatar_url
     ) = 0 then
    raise exception 'La foto de perfil no pertenece al usuario autenticado.'
      using errcode = '22023';
  end if;

  perform public.save_creative_profile(
    p_bio,
    p_full_bio,
    p_location,
    p_skills,
    p_portfolio_urls
  );

  update public.profiles
  set
    avatar_url = v_next_avatar_url,
    updated_at = now()
  where id = v_user_id;
end;
$function$;

revoke all on function public.save_creative_profile(
  text,
  text,
  text,
  text,
  text[],
  text[]
) from public;

grant execute on function public.save_creative_profile(
  text,
  text,
  text,
  text,
  text[],
  text[]
) to authenticated;

notify pgrst, 'reload schema';

commit;
