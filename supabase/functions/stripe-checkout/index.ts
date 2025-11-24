import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not found')
    }

    const { priceId, returnUrl } = await req.json()

    // Get user's agency and role
    const { data: agencyUser, error: agencyError } = await supabaseClient
      .from('agency_users')
      .select('agency_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (agencyError || !agencyUser) {
      throw new Error('User does not belong to an agency')
    }

    if (agencyUser.role !== 'owner') {
      throw new Error('Only the agency owner can subscribe')
    }

    // Get or create customer for the agency
    const { data: agency } = await supabaseClient
      .from('agencies')
      .select('stripe_customer_id, id')
      .eq('id', agencyUser.agency_id)
      .single()

    let customerId = agency?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          agencyId: agency.id, // Store agency ID in Stripe metadata
          supabaseUUID: user.id,
        },
      })
      customerId = customer.id
      
      await supabaseClient
        .from('agencies')
        .update({ stripe_customer_id: customerId })
        .eq('id', agency.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
