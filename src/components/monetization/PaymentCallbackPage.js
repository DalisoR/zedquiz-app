import React, { useState, useEffect } from 'react';

import { useToastNotification } from '../hooks/useToastNotification';
import pesapalService from '../services/pesapalService';
import { supabase } from '../supabaseClient';

function PaymentCallbackPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState('');

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const orderTrackingId = urlParams.get('OrderTrackingId');
      const merchantReference = urlParams.get('OrderMerchantReference');

      if (!orderTrackingId) {
        throw new Error('Missing payment tracking information');
      }

      // Check payment status with PesaPal
      const statusResult = await pesapalService.checkTransactionStatus(orderTrackingId);

      if (!statusResult.success) {
        throw new Error(statusResult.error);
      }

      // Update payment record in database
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('pesapal_tracking_id', orderTrackingId)
        .single();

      if (fetchError) {
        console.error('Error fetching payment record:', fetchError);
        throw new Error('Payment record not found');
      }

      // Determine payment status
      const isSuccessful = statusResult.statusCode === 1; // 1 = Completed
      const isPending = statusResult.statusCode === 2; // 2 = Pending
      const isFailed = statusResult.statusCode === 3; // 3 = Failed

      let newStatus = 'pending';
      if (isSuccessful) {
        newStatus = 'completed';
      } else if (isFailed) {
        newStatus = 'failed';
      }

      // Update payment record
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: newStatus,
          pesapal_status: statusResult.paymentStatus,
          pesapal_status_code: statusResult.statusCode,
          payment_method_used: statusResult.paymentMethod,
          payment_account: statusResult.paymentAccount,
          confirmation_code: statusResult.confirmationCode,
          completed_at: isSuccessful ? new Date().toISOString() : null
        })
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
      }

      // If payment successful, update user subscription
      if (isSuccessful) {
        const subscriptionEndDate = new Date();
        if (paymentRecord.billing_cycle === 'yearly') {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        }

        const { error: subscriptionError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: paymentRecord.plan_id,
            subscription_status: 'active',
            subscription_end_date: subscriptionEndDate.toISOString(),
            subscription_payment_method: 'pesapal'
          })
          .eq('id', currentUser.id);

        if (subscriptionError) {
          console.error('Error updating subscription:', subscriptionError);
        }

        // Create subscription record
        await supabase.from('subscriptions').insert({
          user_id: currentUser.id,
          plan_id: paymentRecord.plan_id,
          status: 'active',
          billing_cycle: paymentRecord.billing_cycle,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          payment_method: 'pesapal',
          start_date: new Date().toISOString(),
          end_date: subscriptionEndDate.toISOString(),
          payment_id: paymentRecord.id
        });
      }

      setPaymentStatus(newStatus);
      setPaymentDetails({
        amount: statusResult.amount,
        currency: statusResult.currency,
        paymentMethod: statusResult.paymentMethod,
        paymentAccount: statusResult.paymentAccount,
        confirmationCode: statusResult.confirmationCode,
        planName: paymentRecord.payment_data?.planName || 'Unknown Plan',
        billingCycle: paymentRecord.billing_cycle
      });

      if (isSuccessful) {
        showSuccess('Payment successful! Your subscription is now active.');
      } else if (isPending) {
        showError('Payment is still pending. Please check back later.');
      } else if (isFailed) {
        showError('Payment failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Payment callback error:', err);
      setError(err.message || 'Failed to process payment callback');
      showError('Failed to verify payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (paymentStatus === 'completed') {
      setPage('dashboard');
    } else {
      setPage('subscriptions');
    }
  };

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h3>Verifying Payment...</h3>
            <p style={{ color: '#666' }}>Please wait while we confirm your payment with PesaPal.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='main-container'>
        <div className='card'>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
            <h3>Payment Verification Failed</h3>
            <p style={{ color: '#666', marginBottom: '2rem' }}>{error}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setPage('subscriptions')} style={{ width: 'auto' }}>
                Back to Plans
              </button>
              <button
                onClick={() => setPage('dashboard')}
                style={{ width: 'auto', background: '#6b7280' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Payment Status</h2>
      </header>

      <div className='content-body'>
        <div className='card'>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            {paymentStatus === 'completed' && (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Payment Successful!</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Congratulations! Your subscription to {paymentDetails?.planName} is now active.
                </p>
              </>
            )}

            {paymentStatus === 'pending' && (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
                <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>Payment Pending</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Your payment is being processed. This may take a few minutes to complete.
                </p>
              </>
            )}

            {paymentStatus === 'failed' && (
              <>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>Payment Failed</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Your payment could not be processed. Please try again or contact support.
                </p>
              </>
            )}
          </div>

          {paymentDetails && (
            <div
              style={{
                background: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '8px',
                marginBottom: '2rem'
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>Payment Details</h4>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Plan:</span>
                  <span style={{ fontWeight: 600 }}>{paymentDetails.planName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Billing:</span>
                  <span style={{ fontWeight: 600 }}>
                    {paymentDetails.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Amount:</span>
                  <span style={{ fontWeight: 600 }}>
                    {paymentDetails.currency} {paymentDetails.amount}
                  </span>
                </div>
                {paymentDetails.paymentMethod && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Payment Method:</span>
                    <span style={{ fontWeight: 600 }}>{paymentDetails.paymentMethod}</span>
                  </div>
                )}
                {paymentDetails.paymentAccount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Account:</span>
                    <span style={{ fontWeight: 600 }}>{paymentDetails.paymentAccount}</span>
                  </div>
                )}
                {paymentDetails.confirmationCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Confirmation:</span>
                    <span style={{ fontWeight: 600 }}>{paymentDetails.confirmationCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleContinue}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                background: paymentStatus === 'completed' ? '#10b981' : '#3b82f6'
              }}
            >
              {paymentStatus === 'completed' ? 'Continue to Dashboard' : 'Back to Plans'}
            </button>
          </div>

          {paymentStatus === 'completed' && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1rem',
                background: '#e8f5e9',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <p style={{ margin: 0, color: '#2e7d32', fontSize: '0.875rem' }}>
                🎉 Welcome to ZedQuiz {paymentDetails?.planName}! You now have access to all premium
                features.
              </p>
            </div>
          )}
        </div>

        {/* Support Information */}
        <div className='card'>
          <h3>Need Help?</h3>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            If you have any questions about your payment or subscription, please contact our support
            team.
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <strong>Email:</strong> support@zedquiz.com
            </div>
            <div>
              <strong>Phone:</strong> +260 977 123 456
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;
