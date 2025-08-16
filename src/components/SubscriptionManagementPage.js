import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function SubscriptionManagementPage({ currentUser, setPage, setSelectedPlan, setBillingCycle }) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

  const { showSuccess, showError, showWarning } = useToastNotification();

  const plans = {
    'free': {
      name: 'Free',
      limits: {
        quiz_taken: 3,
        course_enrolled: 1,
        video_watched: 10
      }
    },
    'premium': {
      name: 'Premium',
      price_monthly: 9.99,
      price_yearly: 99.99,
      limits: {
        quiz_taken: -1, // unlimited
        course_enrolled: -1,
        video_watched: -1
      }
    },
    'pro': {
      name: 'Pro',
      price_monthly: 19.99,
      price_yearly: 199.99,
      limits: {
        quiz_taken: -1,
        course_enrolled: -1,
        video_watched: -1,
        course_created: -1
      }
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [currentUser]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Check subscription status using the database function
      const { data: subscriptionStatus, error: statusError } = await supabase
        .rpc('check_user_subscription', { p_user_id: currentUser.id });

      if (statusError) throw statusError;

      // Fetch detailed subscription info if active
      if (subscriptionStatus.has_active_subscription && subscriptionStatus.source === 'subscription') {
        const { data: subscriptionData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (subError && subError.code !== 'PGRST116') throw subError;
        setSubscription(subscriptionData);
      } else {
        // Use profile data for legacy subscriptions
        setSubscription({
          plan_id: subscriptionStatus.plan_id,
          status: subscriptionStatus.status,
          end_date: subscriptionStatus.end_date,
          source: 'profile'
        });
      }

      // Fetch usage data
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('usage_type, usage_count, usage_date')
        .eq('user_id', currentUser.id)
        .eq('usage_date', new Date().toISOString().split('T')[0]);

      if (usageError && usageError.code !== 'PGRST116') throw usageError;

      // Process usage data
      const usageMap = {};
      if (usageData) {
        usageData.forEach(item => {
          usageMap[item.usage_type] = item.usage_count;
        });
      }
      setUsage(usageMap);

    } catch (err) {
      console.error('Error fetching subscription data:', err);
      showError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      showError('Please provide a reason for cancellation');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('cancel_subscription', { 
          p_user_id: currentUser.id,
          p_reason: cancelReason 
        });

      if (error) throw error;

      if (data) {
        showSuccess('Subscription cancelled successfully. You will retain access until the end of your billing period.');
        setShowCancelModal(false);
        fetchSubscriptionData(); // Refresh data
      } else {
        showError('No active subscription found to cancel');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      showError('Failed to cancel subscription');
    }
  };

  const handleUpgrade = (newPlan, billingCycle) => {
    setSelectedPlan(newPlan);
    setBillingCycle(billingCycle);
    setPage('payment-processing');
  };

  const getUsagePercentage = (usageType) => {
    const currentUsage = usage[usageType] || 0;
    const limit = plans[subscription?.plan_id]?.limits?.[usageType] || 0;
    
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No access
    
    return Math.min((currentUsage / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = () => {
    if (!subscription?.end_date) return null;
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading subscription information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = plans[subscription?.plan_id] || plans.free;
  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Subscription Management</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="content-body">
        {/* Current Subscription */}
        <div className="card">
          <h3>Current Subscription</h3>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#2c3e50' }}>
                {currentPlan.name} Plan
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: subscription?.status === 'active' ? '#e8f5e9' : 
                               subscription?.status === 'cancelled' ? '#fff3e0' : '#fee2e2',
                    color: subscription?.status === 'active' ? '#2e7d32' : 
                           subscription?.status === 'cancelled' ? '#ef6c00' : '#dc2626'
                  }}
                >
                  {subscription?.status?.toUpperCase() || 'FREE'}
                </span>
                {subscription?.billing_cycle && (
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    ({subscription.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'})
                  </span>
                )}
              </div>
              
              {subscription?.end_date && (
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {subscription.status === 'cancelled' ? 'Access ends' : 'Renews'} on {formatDate(subscription.end_date)}
                  {daysUntilExpiry !== null && (
                    <span style={{ 
                      marginLeft: '0.5rem',
                      color: daysUntilExpiry <= 7 ? '#ef4444' : '#666',
                      fontWeight: daysUntilExpiry <= 7 ? 600 : 'normal'
                    }}>
                      ({daysUntilExpiry} days)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {subscription?.plan_id !== 'pro' && (
                <button
                  onClick={() => setShowUpgradeOptions(true)}
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    fontSize: '0.875rem'
                  }}
                >
                  Upgrade Plan
                </button>
              )}
              
              {subscription?.status === 'active' && subscription?.source !== 'profile' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: '#ef4444',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel Subscription
                </button>
              )}
              
              <button
                onClick={() => setPage('payment-history')}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  fontSize: '0.875rem'
                }}
              >
                Payment History
              </button>
            </div>
          </div>

          {/* Expiry Warning */}
          {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
            <div style={{
              padding: '1rem',
              background: '#fff3e0',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#ef6c00' }}>Subscription Expiring Soon</strong>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#ef6c00', fontSize: '0.875rem' }}>
                    Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. 
                    Renew now to continue enjoying premium features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage Tracking */}
        <div className="card">
          <h3>Today's Usage</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.entries(currentPlan.limits || {}).map(([usageType, limit]) => {
              const currentUsage = usage[usageType] || 0;
              const percentage = getUsagePercentage(usageType);
              const isUnlimited = limit === -1;
              
              const usageLabels = {
                quiz_taken: 'Quizzes Taken',
                course_enrolled: 'Courses Enrolled',
                video_watched: 'Videos Watched',
                course_created: 'Courses Created'
              };

              return (
                <div key={usageType} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      {usageLabels[usageType] || usageType}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {currentUsage} {isUnlimited ? '' : `/ ${limit}`}
                      {isUnlimited && <span style={{ color: '#10b981', fontWeight: 600 }}> (Unlimited)</span>}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: getUsageColor(percentage),
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  )}
                  
                  {!isUnlimited && percentage >= 90 && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      ⚠️ Approaching limit
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {subscription?.plan_id === 'free' && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
                🚀 Upgrade to Premium or Pro for unlimited access to all features!
              </p>
              <button
                onClick={() => setPage('subscriptions')}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6'
                }}
              >
                View Plans
              </button>
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        {showUpgradeOptions && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Upgrade Options</h3>
              <button
                onClick={() => setShowUpgradeOptions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {Object.entries(plans).filter(([planId]) => 
                planId !== 'free' && planId !== subscription?.plan_id
              ).map(([planId, plan]) => (
                <div
                  key={planId}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: 'white'
                  }}
                >
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
                    {plan.name}
                  </h4>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                      K{plan.price_monthly}/month
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      or K{plan.price_yearly}/year (save 20%)
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Features:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.875rem' }}>
                      <li>Unlimited quizzes</li>
                      <li>Unlimited courses</li>
                      <li>Unlimited videos</li>
                      {planId === 'pro' && <li>Create courses</li>}
                      <li>Priority support</li>
                      <li>Advanced analytics</li>
                    </ul>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleUpgrade({ id: planId, ...plan }, 'monthly')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        background: '#3b82f6'
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleUpgrade({ id: planId, ...plan }, 'yearly')}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        background: '#10b981'
                      }}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>
              Cancel Subscription
            </h3>
            
            <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
              We're sorry to see you go! Your subscription will remain active until {formatDate(subscription?.end_date)}, 
              and you'll continue to have access to all premium features until then.
            </p>
            
            <div className="form-group">
              <label>Please tell us why you're cancelling (optional):</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              >
                <option value="">Select a reason</option>
                <option value="too_expensive">Too expensive</option>
                <option value="not_using_enough">Not using it enough</option>
                <option value="missing_features">Missing features I need</option>
                <option value="technical_issues">Technical issues</option>
                <option value="found_alternative">Found a better alternative</option>
                <option value="temporary_break">Taking a temporary break</option>
                <option value="other">Other</option>
              </select>
              
              {cancelReason === 'other' && (
                <textarea
                  placeholder="Please specify..."
                  value={cancelReason === 'other' ? '' : cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280'
                }}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#ef4444'
                }}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManagementPage;