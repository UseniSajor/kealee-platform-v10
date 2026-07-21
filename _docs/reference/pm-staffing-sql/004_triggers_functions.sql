-- Triggers and functions for automated processes

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables
create trigger update_projects_updated_at before update on projects
  for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_orgs_updated_at before update on orgs
  for each row execute function update_updated_at_column();

-- Function to mark invoice as overdue
create or replace function check_invoice_overdue()
returns trigger as $$
begin
  if new.due_date < current_date and new.status = 'PENDING' then
    new.status = 'OVERDUE';
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to check invoice overdue status
create trigger check_kealee_service_invoice_overdue before insert or update on kealee_service_invoices
  for each row execute function check_invoice_overdue();

-- Function to check if project can be activated (first invoice must be paid)
create or replace function check_project_activation()
returns trigger as $$
declare
  first_invoice_status text;
begin
  if new.status = 'ACTIVE' and (old.status is null or old.status != 'ACTIVE') then
    -- Check if first invoice exists and is paid
    select status into first_invoice_status
    from kealee_service_invoices
    where project_id = new.id
    order by created_at asc
    limit 1;
    
    if first_invoice_status is null or first_invoice_status != 'PAID' then
      raise exception 'Project cannot be activated until first service invoice is paid';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to check project activation
create trigger check_project_activation_trigger before update on projects
  for each row execute function check_project_activation();

-- Note: Escalation checks should be run via scheduled jobs or application code
-- The functions above handle real-time checks on insert/update

