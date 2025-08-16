import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function PaymentStatusPage({ currentUser, setPage }) {
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Checking payment status...');

  useEffect(() => {
    let timer;

    const run = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('pesapal_order') || '{}');
        if (!saved.orderTrackingId) {
          setStatus('NONE');
          setMessage('No payment found.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('pesapal-check-status', {
          body: { order_tracking_id: saved.orderTrackingId }
        });
        if (error) throw error;

        // Pesapal returns a status like COMPLETED, FAILED, PENDING, INVALID etc.
        const state = (data?.status || data?.payment_status_description || '').toUpperCase();
        setStatus(state);

        if (state === 'COMPLETED' || state === 'PAID' || state === 'COMPLETED_PAYMENT') {
          setMessage('Payment completed! Upgrading your account...');
          // Update user subscription/role/entitlements as appropriate
          const { error: upErr } = await supabase
            .from('profiles')
            .update({ subscription_tier: 'premium', subscription_status: 'active' })
            .eq('id', currentUser.id);
          if (upErr) throw upErr;
          setMessage('Upgrade successful. Redirecting to Dashboard...');
          setTimeout(() => setPage('dashboard'), 1500);
          return;
        }

        if (state === 'FAILED' || state === 'CANCELLED' || state === 'INVALID') {
          setMessage('Payment not completed. You can try again.');
          setLoading(false);
          return;
        }

        // Still pending — schedule another poll
        setMessage('Payment still pending. We will check again shortly...');
        timer = setTimeout(run, 3000);
      } catch (err) {
        console.error('Payment status check failed', err);
        setMessage('Could not retrieve payment status. Please try again later.');
        setLoading(false);
      }
    };

    run();
    return () => timer && clearTimeout(timer);
  }, [currentUser, setPage]);

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Payment Status</h2>
        <button className="back-button" onClick={() => setPage('upgrade')}>Back</button>
      </header>
      <div className="content-body">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Status: {status}</div>
          <p style={{ color: '#6b7280' }}>{message}</p>
          {!loading && (
            <div style={{ marginTop: '1rem' }}>
              <button type="button" onClick={() => setPage('upgrade')} style={{ width: 'auto', background: '#6b7280' }}>Go back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentStatusPage;
