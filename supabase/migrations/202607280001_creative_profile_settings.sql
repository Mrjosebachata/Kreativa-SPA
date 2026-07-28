-- KREATIVA: perfil creativo reutilizable + publicación simplificada.
-- Ejecutar DESPUÉS de 202607230002_publishing_and_notifications.sql.

begin;

-- ---------------------------------------------------------------------------
-- 1. Lectura privada del perfil creativo del usuario autenticado
-- ---------------------------------------------------------------------------

create or replace function public.get_my_creative_profile()
returns table (
  bio text,
  full_bio text,
  location text,
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

-- ---------------------------------------------------------------------------
-- 2. Escritura transaccional del perfil, habilidades y portafolio
-- ---------------------------------------------------------------------------

create or replace function public.save_creative_profile(
  p_bio text,
  p_full_bio text,
  p_location text,
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
  v_label text;
  v_skill_id bigint;
  v_url text;
  v_position integer := 0;
  v_seen_urls text[] := array[]::text[];
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para configurar tu perfil.'
      using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_bio, ''))) not between 20 and 240 then
    raise exception 'La biografía corta debe tener entre 20 y 240 caracteres.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_full_bio, ''))) not between 40 and 1200 then
    raise exception 'La presentación debe tener entre 40 y 1200 caracteres.'
      using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_location, ''))) > 120 then
    raise exception 'La ubicación no puede superar 120 caracteres.'
      using errcode = '22023';
  end if;

  if cardinality(coalesce(p_skills, array[]::text[])) not between 1 and 10 then
    raise exception 'Agrega entre 1 y 10 habilidades.'
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

  delete from public.freelancer_skills
  where freelancer_id = v_user_id;

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

  if not exists (
    select 1
    from public.freelancer_skills as freelancer_skill
    where freelancer_skill.freelancer_id = v_user_id
  ) then
    raise exception 'Agrega al menos una habilidad válida.'
      using errcode = '22023';
  end if;

  delete from public.portfolio_images
  where freelancer_id = v_user_id;

  foreach v_url in array coalesce(p_portfolio_urls, array[]::text[])
  loop
    if v_url = any(v_seen_urls) then
      continue;
    end if;

    v_seen_urls := array_append(v_seen_urls, v_url);
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
end;
$function$;

revoke all on function public.save_creative_profile(
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
  text[],
  text[]
) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Publicación: solo recibe información propia del servicio
-- ---------------------------------------------------------------------------

drop function if exists public.publish_service(
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
);

create or replace function public.publish_service(
  p_title text,
  p_description text,
  p_category_id bigint,
  p_price numeric,
  p_cover_image_url text,
  p_tags text[]
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

  if not exists (
    select 1
    from public.freelancer_profiles as freelancer
    where freelancer.profile_id = v_user_id
      and char_length(trim(coalesce(freelancer.bio, ''))) between 20 and 240
      and char_length(trim(coalesce(freelancer.full_bio, ''))) between 40 and 1200
      and exists (
        select 1
        from public.freelancer_skills as freelancer_skill
        where freelancer_skill.freelancer_id = v_user_id
      )
  ) then
    raise exception 'Completa tu perfil creativo antes de publicar.'
      using errcode = '22023';
  end if;

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
  text[]
) from public;

grant execute on function public.publish_service(
  text,
  text,
  bigint,
  numeric,
  text,
  text[]
) to authenticated;

notify pgrst, 'reload schema';

commit;
