begin;

create or replace function public.update_service(
  p_gig_id bigint,
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
  v_tag_id bigint;
  v_label text;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para editar un servicio.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.gigs
    where id = p_gig_id and freelancer_id = v_user_id
  ) then
    raise exception 'No tienes permiso para editar este servicio.' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_title, ''))) not between 10 and 120 then
    raise exception 'El título debe tener entre 10 y 120 caracteres.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_description, ''))) not between 40 and 1200 then
    raise exception 'La descripción debe tener entre 40 y 1200 caracteres.' using errcode = '22023';
  end if;

  if coalesce(p_price, 0) <= 0 then
    raise exception 'El precio debe ser mayor que cero.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.categories where id = p_category_id) then
    raise exception 'La categoría seleccionada no existe.' using errcode = '23503';
  end if;

  if p_cover_image_url is not null
     and position('/service-images/' || v_user_id::text || '/' in p_cover_image_url) = 0 then
    raise exception 'La portada no pertenece al usuario autenticado.' using errcode = '22023';
  end if;

  if cardinality(coalesce(p_tags, array[]::text[])) > 8 then
    raise exception 'Puedes agregar hasta 8 etiquetas.' using errcode = '22023';
  end if;

  update public.gigs
  set category_id = p_category_id,
      title = trim(p_title),
      description = trim(p_description),
      price = p_price,
      cover_image_url = coalesce(p_cover_image_url, cover_image_url),
      status = 'active',
      updated_at = now()
  where id = p_gig_id and freelancer_id = v_user_id;

  delete from public.gig_tags where gig_id = p_gig_id;

  foreach v_label in array coalesce(p_tags, array[]::text[])
  loop
    v_label := regexp_replace(trim(v_label), '\s+', ' ', 'g');
    if char_length(v_label) between 2 and 40 then
      select id into v_tag_id from public.tags
      where lower(name) = lower(v_label) limit 1;

      if v_tag_id is null then
        insert into public.tags (name) values (v_label)
        on conflict (name) do update set name = excluded.name
        returning id into v_tag_id;
      end if;

      insert into public.gig_tags (gig_id, tag_id)
      values (p_gig_id, v_tag_id)
      on conflict do nothing;
    end if;
  end loop;

  return p_gig_id;
end;
$function$;

create or replace function public.delete_service(p_gig_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesión para eliminar un servicio.' using errcode = '42501';
  end if;

  update public.gigs
  set status = 'deleted', updated_at = now()
  where id = p_gig_id and freelancer_id = v_user_id;

  if not found then
    raise exception 'No tienes permiso para eliminar este servicio.' using errcode = '42501';
  end if;

  return p_gig_id;
end;
$function$;

revoke all on function public.update_service(bigint, text, text, bigint, numeric, text, text[]) from public;
revoke all on function public.delete_service(bigint) from public;
grant execute on function public.update_service(bigint, text, text, bigint, numeric, text, text[]) to authenticated;
grant execute on function public.delete_service(bigint) to authenticated;

notify pgrst, 'reload schema';
commit;
