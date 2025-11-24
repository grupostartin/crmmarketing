-- Reset all agencies to FREE for testing
update public.agencies
set 
  subscription_tier = 'free',
  subscription_status = 'active',
  stripe_customer_id = null,
  stripe_subscription_id = null;

-- Check the result
select name, subscription_tier from public.agencies;
