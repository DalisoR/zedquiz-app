import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';
import pesapalService from '../services/pesapalService';

function PaymentProcessingPage({ currentUser, selectedPlan, billingCycle, setPage }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('details'); // details, processing, success, error
  const [paymentData, setPaymentData] = useState({
    firstName: currentUser?.full_name?.split(' ')[0] || '',
    lastName: currentUser?.full_name?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: '',
    city: 'Lusaka',
    state: 'Lusaka',
    postalCode: '10101'
  });
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState('');

  const { showSuccess, showError, showInfo } = useToastNotification();

  useEffect(() => {
    // Validate PesaPal configuration on component mount
    const config = pesapalService.validateConfig();
    if (!config.isValid) {
      console.error('PesaPal Configuration Errors:', config.errors);
      setError('Payment system not properly configured. Please contact support.');
    }
  }, []);

  const calculateAmount = () => {
    if (!selectedPlan) return 0;
    return billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly;
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentData = () => {
    const errors = [];

    if (!paymentData.firstName.trim()) errors.push('First name is required');
    if (!paymentData.lastName.trim()) errors.push('Last name is required');
    if (!paymentData.email.trim()) errors.push('Email is required');
    if (!paymentData.phone.trim()) errors.push('Phone number is required');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (paymentData.email && !emailRegex.test(paymentData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Validate Zambian phone number
    const phoneRegex = /^(\+260|0)?[79]\d{8}$/;
    if (paymentData.phone && !phoneRegex.test(paymentData.phone)) {
      errors.push('Please enter a valid Zambian phone number');
    }

    return errors;
  };

  const handlePayment = async () => {
    const validationErrors = validatePaymentData();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      // Create payment record in database first
      const orderId = pesapalService.generateOrderId(currentUser.id, selectedPlan.id);
      const amount = calculateAmount();

      const { data: paymentRecord, error: dbError } = await supabase
        .from('payments')
        .insert({
          id: orderId,
          user_id: currentUser.id,
          plan_id: selectedPlan.id,
          amount: amount,
          currency: 'ZMW',
          billing_cycle: billingCycle,
          status: 'pending',
          payment_method: 'pesapal',
          payment_data: {
            ...paymentData,
            planName: selectedPlan.name
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Create PesaPal order
      const subscriptionData = {
        orderId: orderId,
        amount: pesapalService.formatAmount(amount),
        planName: selectedPlan.name,
        email: paymentData.email,
        phone: paymentData.phone,
        firstName: paymentData.firstName,
        lastName: paymentData.lastName,
        address: paymentData.address,
        city: paymentData.city,
        state: paymentData.state,
        postalCode: paymentData.postalCode
      };

      const orderResult = await pesapalService.createSubscriptionOrder(subscriptionData);

      if (orderResult.success) {
        // Store order details for tracking
        setOrderDetails({
          orderId: orderId,
          orderTrackingId: orderResult.orderTrackingId,
          merchantReference: orderResult.merchantReference
        });

        // Update payment record with tracking ID
        await supabase
          .from('payments')
          .update({
            pesapal_tracking_id: orderResult.orderTrackingId,
            pesapal_merchant_reference: orderResult.merchantReference
          })
          .eq('id', orderId);

        showInfo('Redirecting to PesaPal payment page...');

        // Redirect to PesaPal payment page
        window.location.href = orderResult.redirectUrl;
      } else {
        throw new Error(orderResult.error);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('details');
    setError('');
    setOrderDetails(null);
  };

  if (!selectedPlan) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>No plan selected. Please go back and select a subscription plan.</p>
          <button onClick={() => setPage('subscriptions')}>Back to Plans</button>
        </div>
      </div>
    );
  }

  const amount = calculateAmount();
  const paymentMethods = pesapalService.getSupportedPaymentMethods();

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Complete Your Subscription</h2>
        <button className='back-button' onClick={() => setPage('subscriptions')}>
          Back to Plans
        </button>
      </header>

      <div className='content-body'>
        {/* Order Summary */}
        <div className='card'>
          <h3>Order Summary</h3>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}
          >
            <div>
              <h4 style={{ margin: 0 }}>{selectedPlan.name} Plan</h4>
              <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.875rem' }}>
                {billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>K{amount}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {billingCycle === 'yearly' ? 'per year' : 'per month'}
              </div>
            </div>
          </div>

          {billingCycle === 'yearly' &&
            selectedPlan.price_yearly < selectedPlan.price_monthly * 12 && (
              <div
                style={{
                  padding: '0.75rem',
                  background: '#e8f5e9',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#2e7d32'
                }}
              >
                💰 You're saving K
                {(selectedPlan.price_monthly * 12 - selectedPlan.price_yearly).toFixed(2)} with
                annual billing!
              </div>
            )}
        </div>

        {/* Payment Methods */}
        <div className='card'>
          <h3>Supported Payment Methods</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            {paymentMethods.map(method => (
              <div
                key={method.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  background: '#f9fafb'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{method.icon}</div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{method.name}</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                  {method.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        {step === 'details' && (
          <div className='card'>
            <h3>Billing Information</h3>

            {error && (
              <div
                style={{
                  padding: '1rem',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                handlePayment();
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div className='form-group'>
                  <label>First Name *</label>
                  <input
                    type='text'
                    value={paymentData.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className='form-group'>
                  <label>Last Name *</label>
                  <input
                    type='text'
                    value={paymentData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className='form-group'>
                <label>Email Address *</label>
                <input
                  type='email'
                  value={paymentData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className='form-group'>
                <label>Phone Number *</label>
                <input
                  type='tel'
                  value={paymentData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder='e.g., +260977123456 or 0977123456'
                  required
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Enter your mobile money number for payment
                </small>
              </div>

              <div className='form-group'>
                <label>Address</label>
                <input
                  type='text'
                  value={paymentData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  placeholder='Street address (optional)'
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className='form-group'>
                  <label>City</label>
                  <input
                    type='text'
                    value={paymentData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <label>Province</label>
                  <select
                    value={paymentData.state}
                    onChange={e => handleInputChange('state', e.target.value)}
                  >
                    <option value='Lusaka'>Lusaka</option>
                    <option value='Copperbelt'>Copperbelt</option>
                    <option value='Central'>Central</option>
                    <option value='Eastern'>Eastern</option>
                    <option value='Luapula'>Luapula</option>
                    <option value='Northern'>Northern</option>
                    <option value='North-Western'>North-Western</option>
                    <option value='Southern'>Southern</option>
                    <option value='Western'>Western</option>
                    <option value='Muchinga'>Muchinga</option>
                  </select>
                </div>
                <div className='form-group'>
                  <label>Postal Code</label>
                  <input
                    type='text'
                    value={paymentData.postalCode}
                    onChange={e => handleInputChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button
                  type='submit'
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    background: loading ? '#ccc' : '#4caf50',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Processing...' : `Pay K${amount} with PesaPal`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <div className='card'>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <h3>Processing Payment...</h3>
              <p style={{ color: '#666' }}>
                Please wait while we redirect you to PesaPal to complete your payment.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className='card'>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <h3>Payment Failed</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={handleRetry} style={{ width: 'auto' }}>
                  Try Again
                </button>
                <button
                  onClick={() => setPage('subscriptions')}
                  style={{ width: 'auto', background: '#6b7280' }}
                >
                  Back to Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className='card'>
          <h3>🔒 Secure Payment</h3>
          <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
            Your payment is processed securely through PesaPal. We support Mobile Money (MTN,
            Airtel), bank transfers, and card payments. Your financial information is encrypted and
            never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentProcessingPage;
