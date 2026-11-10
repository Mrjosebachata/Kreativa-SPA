-- KREATIVA: gestión privada de tickets desde el tablero del freelancer.
-- Ejecutar DESPUÉS de 202610120003_reminders.sql y 202610120002_moderation.sql.

begin;

grant update (status) on table public.commissions to authenticated;

drop policy if exists "freelancers_update_own_commissions" on public.commissions;
create policy "freelancers_update_own_commissions"
  on public.commissions
  for update
  to authenticated
  using (
    public.is_account_active()
    and freelancer_id = (select auth.uid())
  )
  with check (
    public.is_account_active()
    and freelancer_id = (select auth.uid())
    and status in ('pending', 'accepted', 'in_progress', 'delivered', 'completed', 'cancelled')
  );

-- El freelancer puede adjuntar avances o entregables a sus propios tickets.
drop policy if exists "freelancers_insert_commission_attachments" on public.commission_attachments;
create policy "freelancers_insert_commission_attachments"
  on public.commission_attachments
  for insert
  to authenticated
  with check (
    public.is_account_active()
    and exists (
      select 1
      from public.commissions as commission
      where commission.id = commission_attachments.commission_id
        and commission.freelancer_id = (select auth.uid())
    )
  );

notify pgrst, 'reload schema';

commit;
