import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const PESA_BASE = Deno.env.get('PESAPAL_BASE_URL') || 'https://pay.pesapal.com/v3';
const PESA_CONSUMER_KEY = Deno.env.get('PESAPAL_CONSUMER_KEY') || '';
const PESA_CONSUMER_SECRET = Deno.env.get('PESAPAL_CONSUMER_SECRET') || '';

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

async function checkStatus(token: string, trackingId: string) {
  const res = await fetch(`${PESA_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Pesapal status failed: ${res.status} ${data?.message || ''}`);
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const body = await req.json();
    const { order_tracking_id } = body || {};
    if (!order_tracking_id) {
      return new Response(JSON.stringify({ error: 'Missing order_tracking_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const token = await getAccessToken();
    const status = await checkStatus(token, order_tracking_id);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('pesapal-check-status error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
