-- Add subscription fields to agencies table
alter table public.agencies 
add column if not exists subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
add column if not exists subscription_status text default 'active',
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text;

-- Function to get agency subscription status for a user
create or replace function public.get_user_agency_subscription(user_uuid uuid)
returns table (
  subscription_tier text,
  subscription_status text,
  is_owner boolean
) as $$
declare
  v_agency_id uuid;
  v_role text;
begin
  -- Get agency_id and role for the user
  select agency_id, role::text into v_agency_id, v_role
  from public.agency_users
  where auth_user_id = user_uuid
  limit 1;

  if v_agency_id is null then
    -- User doesn't belong to an agency, return free/inactive
    return query select 'free'::text, 'inactive'::text, false;
  else
    -- Return the agency's subscription status
    return query 
    select 
      a.subscription_tier, 
      a.subscription_status,
      (v_role = 'owner') as is_owner
    from public.agencies a
    where a.id = v_agency_id;
  end if;
end;
$$ language plpgsql security definer;

-- Enable RLS on agencies if not enabled (it was false in the list)
alter table public.agencies enable row level security;

-- Policy for reading agencies: Users can read their own agency
create policy "Users can view their own agency" on public.agencies
  for select
  using (
    id in (
      select agency_id 
      from public.agency_users 
      where auth_user_id = auth.uid()
    )
  );

-- Policy for updating agencies: Only owners can update
create policy "Owners can update their agency" on public.agencies
  for update
  using (
    id in (
      select agency_id 
      from public.agency_users 
      where auth_user_id = auth.uid() 
      and role = 'owner'
    )
  );
