-- KREATIVA: acento predeterminado morado para nuevos perfiles.
-- No modifica los colores personalizados que ya existan.

begin;

alter table public.profiles
  alter column theme_primary set default '#c06cff';

notify pgrst, 'reload schema';
commit;
