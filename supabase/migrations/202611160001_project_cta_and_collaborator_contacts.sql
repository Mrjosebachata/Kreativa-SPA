-- KREATIVA: CTA principal de proyectos y contactos opcionales de colaboradores.
-- Ejecutar después de 202611150002_projects.sql.

begin;

alter table public.projects
  add column if not exists project_url text
  check (project_url is null or char_length(trim(project_url)) <= 500);

alter table public.project_collaborators
  add column if not exists contact_url text
  check (contact_url is null or char_length(trim(contact_url)) <= 500);

notify pgrst, 'reload schema';

commit;
