-- KREATIVA: enlaces de contacto y redes del perfil creativo.
-- Ejecutar después de 202611160002_profile_text_theme.sql.

begin;

alter table public.profiles
  add column if not exists contact_links jsonb not null default '[]'::jsonb;

grant select (contact_links) on table public.profiles to anon, authenticated;

alter table public.profiles
  drop constraint if exists profiles_contact_links_check;

alter table public.profiles
  add constraint profiles_contact_links_check
    check (jsonb_typeof(contact_links) = 'array');

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
    coalesce(profile.theme_primary, '#c6ff00'),
    coalesce(profile.theme_background, '#121216'),
    coalesce(profile.theme_text, '#f8f8f8'),
    coalesce(profile.contact_links, '[]'::jsonb),
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
  p_theme_text text,
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
  v_primary text := lower(trim(coalesce(p_theme_primary, '#c6ff00')));
  v_background text := lower(trim(coalesce(p_theme_background, '#121216')));
  v_text text := lower(trim(coalesce(p_theme_text, '#f8f8f8')));
  v_links jsonb := coalesce(p_contact_links, '[]'::jsonb);
  v_link jsonb;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para configurar tu perfil.' using errcode = '42501';
  end if;

  if v_primary !~ '^#[0-9a-f]{6}$'
     or v_background !~ '^#[0-9a-f]{6}$'
     or v_text !~ '^#[0-9a-f]{6}$' then
    raise exception 'Los colores deben usar formato hexadecimal de seis caracteres.' using errcode = '22023';
  end if;

  if jsonb_typeof(v_links) <> 'array'
     or jsonb_array_length(v_links) > 8 then
    raise exception 'Puedes agregar hasta 8 enlaces de contacto.' using errcode = '22023';
  end if;

  for v_link in select value from jsonb_array_elements(v_links) loop
    if jsonb_typeof(v_link) <> 'object'
       or char_length(trim(coalesce(v_link->>'label', ''))) = 0
       or char_length(trim(coalesce(v_link->>'url', ''))) = 0
       or char_length(trim(v_link->>'label')) > 40
       or char_length(trim(v_link->>'url')) > 500 then
      raise exception 'Cada enlace debe tener un nombre y una URL válida.' using errcode = '22023';
    end if;
  end loop;

  perform public.save_creative_profile(
    p_bio, p_full_bio, p_location, p_avatar_url, p_banner_url,
    p_theme_primary, p_theme_background, p_theme_text,
    p_skills, p_portfolio_urls
  );

  update public.profiles
  set contact_links = v_links,
      updated_at = now()
  where id = v_user_id;
end;
$function$;

revoke all on function public.save_creative_profile(
  text, text, text, text, text, text, text, text, jsonb, text[], text[]
) from public;
grant execute on function public.save_creative_profile(
  text, text, text, text, text, text, text, text, jsonb, text[], text[]
) to authenticated;

notify pgrst, 'reload schema';
commit;
