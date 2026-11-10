-- KREATIVA: personalización visual del perfil público (RF2.1).
-- Ejecutar después de 202607280002_creative_profile_avatar.sql.

begin;

alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists theme_primary text not null default '#c6ff00',
  add column if not exists theme_background text not null default '#121216';

-- Estos son los únicos campos de profiles que el catálogo público necesita leer.
grant select (
  id,
  full_name,
  avatar_url,
  banner_url,
  theme_primary,
  theme_background,
  role,
  location,
  created_at,
  updated_at
) on table public.profiles to anon, authenticated;

alter table public.profiles
  drop constraint if exists profiles_theme_primary_check,
  drop constraint if exists profiles_theme_background_check;

alter table public.profiles
  add constraint profiles_theme_primary_check
    check (theme_primary ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint profiles_theme_background_check
    check (theme_background ~ '^#[0-9A-Fa-f]{6}$');

drop function if exists public.get_my_creative_profile();
create function public.get_my_creative_profile()
returns table (
  bio text,
  full_bio text,
  location text,
  avatar_url text,
  banner_url text,
  theme_primary text,
  theme_background text,
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
    coalesce(profile.banner_url, ''),
    coalesce(profile.theme_primary, '#c6ff00'),
    coalesce(profile.theme_background, '#121216'),
    coalesce(
      (
        select array_agg(skill.name order by lower(skill.name), skill.id)
        from public.freelancer_skills as freelancer_skill
        join public.skills as skill on skill.id = freelancer_skill.skill_id
        where freelancer_skill.freelancer_id = profile.id
      ), array[]::text[]
    ),
    coalesce(
      (
        select array_agg(portfolio.image_url order by portfolio.display_order, portfolio.id)
        from public.portfolio_images as portfolio
        where portfolio.freelancer_id = profile.id
      ), array[]::text[]
    )
  from public.profiles as profile
  left join public.freelancer_profiles as freelancer on freelancer.profile_id = profile.id
  where profile.id = (select auth.uid());
$function$;

revoke all on function public.get_my_creative_profile() from public;
grant execute on function public.get_my_creative_profile() to authenticated;

create or replace function public.save_creative_profile(
  p_bio text,
  p_full_bio text,
  p_location text,
  p_avatar_url text,
  p_banner_url text,
  p_theme_primary text,
  p_theme_background text,
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
  v_primary text := lower(trim(coalesce(p_theme_primary, '#c6ff00')));
  v_background text := lower(trim(coalesce(p_theme_background, '#121216')));
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para configurar tu perfil.' using errcode = '42501';
  end if;

  if v_primary !~ '^#[0-9a-f]{6}$' or v_background !~ '^#[0-9a-f]{6}$' then
    raise exception 'Los colores deben usar formato hexadecimal de seis caracteres.' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_banner_url, '')), '') is not null
     and position('/service-images/' || v_user_id::text || '/' in p_banner_url) = 0 then
    raise exception 'El banner no pertenece al usuario autenticado.' using errcode = '22023';
  end if;

  -- Reutiliza la función existente para validar y guardar bio, habilidades y portafolio.
  perform public.save_creative_profile(
    p_bio, p_full_bio, p_location, p_avatar_url, p_skills, p_portfolio_urls
  );

  update public.profiles
  set
    banner_url = nullif(trim(coalesce(p_banner_url, '')), ''),
    theme_primary = v_primary,
    theme_background = v_background,
    updated_at = now()
  where id = v_user_id;
end;
$function$;

revoke all on function public.save_creative_profile(
  text, text, text, text, text, text, text, text[], text[]
) from public;
grant execute on function public.save_creative_profile(
  text, text, text, text, text, text, text, text[], text[]
) to authenticated;

notify pgrst, 'reload schema';
commit;
