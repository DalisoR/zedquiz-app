import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Pesapal API endpoints and env
const PESA_BASE = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';
const PESA_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY') || '';
const PESA_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET') || '';
const CALLBACK_URL = Deno.env.get('PESAPAL_CALLBACK_URL') || 'https://example.com/payment-callback';

async function getAccessToken() {
  const res = await fetch(`${PESA_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consumer_key: PESA_CONSUMER_KEY, consumer_secret: PESA_CONSUMER_SECRET })
  });
  if (!res.ok) throw new Error(`Pesapal token failed: ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error('Missing Pesapal token');
  return data.token as string;
}

async function createOrder(token: string, payload: Record<string, unknown>) {
  const res = await fetch(`${PESA_BASE}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pesapal order failed: ${res.status} ${data?.message || ''}`);
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const body = await req.json();
    const { amount, currency = 'ZMW', description, email, phone_number, reference } = body || {};

    if (!amount || !description || !reference) {
      return new Response(JSON.stringify({ error: 'Missing amount, description or reference' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = await getAccessToken();

    // Pesapal order payload
    const order = {
      id: crypto.randomUUID(), // merchant order id
      currency,
      amount,
      description,
      callback_url: CALLBACK_URL,
      billing_address: {
        email_address: email || '',
        phone_number: phone_number || '',
        country_code: 'ZM',
        first_name: 'ZedQuiz',
        last_name: 'Student',
      },
      account_number: reference,
    };

    const resp = await createOrder(token, order);

    // Expected: redirect_url and order_tracking_id
    return new Response(JSON.stringify({
      redirect_url: resp.redirect_url,
      order_tracking_id: resp.order_tracking_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('pesapal-create-order error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
