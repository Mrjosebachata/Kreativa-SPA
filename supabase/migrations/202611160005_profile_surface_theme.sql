-- KREATIVA: superficie y texto interno personalizables del perfil.
-- Ejecutar después de 202611160003_profile_contact_links.sql.

begin;

alter table public.profiles
  add column if not exists theme_surface text not null default '#1c1c21',
  add column if not exists theme_surface_text text not null default '#f8f8f8';

grant select (theme_surface, theme_surface_text)
  on table public.profiles to anon, authenticated;

alter table public.profiles
  drop constraint if exists profiles_theme_surface_check,
  drop constraint if exists profiles_theme_surface_text_check;

alter table public.profiles
  add constraint profiles_theme_surface_check
    check (theme_surface ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint profiles_theme_surface_text_check
    check (theme_surface_text ~ '^#[0-9A-Fa-f]{6}$');

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
  theme_text text,
  theme_surface text,
  theme_surface_text text,
  contact_links jsonb,
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
    coalesce(profile.theme_primary, '#c06cff'),
    coalesce(profile.theme_background, '#121216'),
    coalesce(profile.theme_text, '#f8f8f8'),
    coalesce(profile.theme_surface, '#1c1c21'),
    coalesce(profile.theme_surface_text, '#f8f8f8'),
    coalesce(profile.contact_links, '[]'::jsonb),
    coalesce(
      (select array_agg(skill.name order by lower(skill.name), skill.id)
       from public.freelancer_skills as freelancer_skill
       join public.skills as skill on skill.id = freelancer_skill.skill_id
       where freelancer_skill.freelancer_id = profile.id),
      array[]::text[]
    ),
    coalesce(
      (select array_agg(portfolio.image_url order by portfolio.display_order, portfolio.id)
       from public.portfolio_images as portfolio
       where portfolio.freelancer_id = profile.id),
      array[]::text[]
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
  p_theme_text text,
  p_theme_surface text,
  p_theme_surface_text text,
  p_contact_links jsonb,
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
  v_surface text := lower(trim(coalesce(p_theme_surface, '#1c1c21')));
  v_surface_text text := lower(trim(coalesce(p_theme_surface_text, '#f8f8f8')));
begin
  if v_surface !~ '^#[0-9a-f]{6}$'
     or v_surface_text !~ '^#[0-9a-f]{6}$' then
    raise exception 'Los colores de las tarjetas deben usar formato hexadecimal de seis caracteres.' using errcode = '22023';
  end if;

  perform public.save_creative_profile(
    p_bio, p_full_bio, p_location, p_avatar_url, p_banner_url,
    p_theme_primary, p_theme_background, p_theme_text,
    p_contact_links, p_skills, p_portfolio_urls
  );

  update public.profiles
  set theme_surface = v_surface,
      theme_surface_text = v_surface_text,
      updated_at = now()
  where id = v_user_id;
end;
$function$;

revoke all on function public.save_creative_profile(
  text, text, text, text, text, text, text, text, text, text, jsonb, text[], text[]
) from public;
grant execute on function public.save_creative_profile(
  text, text, text, text, text, text, text, text, text, text, jsonb, text[], text[]
) to authenticated;

notify pgrst, 'reload schema';
commit;
