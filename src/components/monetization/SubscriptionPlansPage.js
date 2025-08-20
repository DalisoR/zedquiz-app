import React, { useState } from 'react';

import { useToastNotification } from '../../hooks/useToastNotification';

function SubscriptionPlansPage({
  currentUser,
  setPage,
  setSelectedPlan,
  setBillingCycle: setGlobalBillingCycle
}) {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const { showError } = useToastNotification();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      description: 'Perfect for getting started with basic learning',
      features: [
        '3 quizzes per day',
        'Basic progress tracking',
        'Access to free courses',
        'Community support'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price_monthly: 9.99,
      price_yearly: 99.99,
      description: 'Ideal for serious learners and students',
      features: [
        'Unlimited quizzes',
        'All premium courses',
        'Advanced analytics',
        'Priority support',
        'Downloadable certificates',
        'Ad-free experience'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price_monthly: 19.99,
      price_yearly: 199.99,
      description: 'Best for teachers and educational institutions',
      features: [
        'Everything in Premium',
        'Create unlimited courses',
        'Advanced teacher tools',
        'Student management',
        'Custom branding',
        'API access',
        'Dedicated support'
      ],
      popular: false
    }
  ];

  const handleSubscribe = async plan => {
    if (!currentUser) {
      showError('Please log in to subscribe');
      setPage('login');
      return;
    }

    if (plan.id === 'free') {
      showError('You are already on the free plan');
      return;
    }

    if (currentUser.subscription_tier === plan.id) {
      showError(`You are already subscribed to the ${plan.name} plan`);
      return;
    }

    // Set selected plan and billing cycle for payment processing
    if (setSelectedPlan) setSelectedPlan(plan);
    if (setGlobalBillingCycle) setGlobalBillingCycle(billingCycle);

    // Navigate to payment processing
    setPage('payment-processing');
  };

  const getPlanPrice = plan => {
    return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  };

  const getSavings = plan => {
    if (billingCycle === 'yearly' && plan.price_yearly > 0) {
      const monthlyCost = plan.price_monthly * 12;
      const savings = monthlyCost - plan.price_yearly;
      return Math.round(savings);
    }
    return 0;
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Choose Your Plan</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        {/* Billing Toggle */}
        <div className='card'>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h3>Select Billing Cycle</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1rem'
              }}
            >
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: billingCycle === 'monthly' ? '#3b82f6' : '#f3f4f6',
                  color: billingCycle === 'monthly' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '8px 0 0 8px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: billingCycle === 'yearly' ? '#3b82f6' : '#f3f4f6',
                  color: billingCycle === 'yearly' ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                Yearly (Save up to 20%)
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}
        >
          {plans.map(plan => {
            const price = getPlanPrice(plan);
            const savings = getSavings(plan);
            const isCurrentPlan = currentUser?.subscription_tier === plan.id;

            return (
              <div
                key={plan.id}
                className='card'
                style={{
                  position: 'relative',
                  border: plan.popular ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  background: plan.popular ? '#f8faff' : 'white'
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#3b82f6',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {plan.name}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.875rem' }}>{plan.description}</p>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2c3e50' }}>
                    {price === 0 ? 'Free' : `K${price}`}
                  </div>
                  {price > 0 && (
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      per {billingCycle === 'yearly' ? 'year' : 'month'}
                    </div>
                  )}
                  {savings > 0 && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#10b981',
                        fontWeight: 600,
                        marginTop: '0.25rem'
                      }}
                    >
                      Save K{savings} per year!
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    What's included:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                          fontSize: '0.875rem'
                        }}
                      >
                        <span
                          style={{ color: '#10b981', marginRight: '0.75rem', fontSize: '1rem' }}
                        >
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  {isCurrentPlan ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#e5e7eb',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'not-allowed'
                      }}
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: plan.popular ? '#3b82f6' : '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading
                        ? 'Processing...'
                        : plan.id === 'free'
                        ? 'Current Plan'
                        : 'Subscribe with PesaPal'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className='card'>
          <h3>🔒 Secure Payment with PesaPal</h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            We use PesaPal, Zambia's trusted payment gateway, to process all transactions securely.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Mobile Money</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>MTN, Airtel Money</p>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏦</div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Bank Transfer</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Direct bank transfer</p>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>Card Payment</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>Visa, Mastercard</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='card'>
          <h3>Frequently Asked Questions</h3>

          <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Can I change plans later?</h4>
              <p style={{ margin: 0, color: '#666' }}>
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect
                immediately.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Do you offer student discounts?
              </h4>
              <p style={{ margin: 0, color: '#666' }}>
                Yes, we offer a 50% discount for students with a valid student ID. Contact support
                for verification.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                What payment methods do you accept?
              </h4>
              <p style={{ margin: 0, color: '#666' }}>
                We accept Mobile Money (MTN, Airtel), Visa, Mastercard, and bank transfers through
                PesaPal.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Can I cancel anytime?</h4>
              <p style={{ margin: 0, color: '#666' }}>
                Yes, you can cancel your subscription at any time. You'll continue to have access
                until the end of your billing period.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Is my payment information secure?
              </h4>
              <p style={{ margin: 0, color: '#666' }}>
                Absolutely! All payments are processed through PesaPal's secure, PCI-compliant
                platform. We never store your payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPlansPage;
