import React, { useState, useEffect } from 'react';

import { useToastNotification } from '../hooks/useToastNotification';
import { supabase } from '../supabaseClient';

function SubscriptionMetricsDashboard({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalMRR: 0,
    totalARR: 0,
    averageCLV: 0,
    churnRate: 0,
    growthRate: 0
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [cohortData, setCohortData] = useState([]);
  const [planBreakdown, setPlanBreakdown] = useState({});
  const [filter, setFilter] = useState('all'); // all, active, cancelled, at-risk

  const { showError } = useToastNotification();

  useEffect(() => {
    if (currentUser?.role === 'super-admin' || currentUser?.role === 'admin') {
      fetchSubscriptionMetrics();
    }
  }, [currentUser, filter]);

  const fetchSubscriptionMetrics = async () => {
    try {
      setLoading(true);

      // Fetch subscription metrics
      let query = supabase.from('subscription_metrics').select(`
          *,
          profiles!subscription_metrics_user_id_fkey(full_name, email, created_at),
          subscriptions!subscription_metrics_subscription_id_fkey(status, created_at, cancelled_at)
        `);

      if (filter === 'active') {
        query = query.eq('subscriptions.status', 'active');
      } else if (filter === 'cancelled') {
        query = query.eq('subscriptions.status', 'cancelled');
      } else if (filter === 'at-risk') {
        query = query.gte('churn_risk_score', 70);
      }

      const { data: subscriptionData, error: subError } = await query.order(
        'customer_lifetime_value',
        { ascending: false }
      );

      if (subError) throw subError;
      setSubscriptions(subscriptionData || []);

      // Calculate aggregate metrics
      const totalMRR =
        subscriptionData?.reduce(
          (sum, sub) => sum + parseFloat(sub.monthly_recurring_revenue || 0),
          0
        ) || 0;
      const totalARR =
        subscriptionData?.reduce(
          (sum, sub) => sum + parseFloat(sub.annual_recurring_revenue || 0),
          0
        ) || 0;
      const averageCLV =
        subscriptionData?.length > 0
          ? subscriptionData.reduce(
              (sum, sub) => sum + parseFloat(sub.customer_lifetime_value || 0),
              0
            ) / subscriptionData.length
          : 0;

      // Calculate churn rate
      const activeCount =
        subscriptionData?.filter(sub => sub.subscriptions?.status === 'active').length || 0;
      const cancelledCount =
        subscriptionData?.filter(sub => sub.subscriptions?.status === 'cancelled').length || 0;
      const churnRate =
        activeCount + cancelledCount > 0
          ? (cancelledCount / (activeCount + cancelledCount)) * 100
          : 0;

      setMetrics({
        totalMRR,
        totalARR,
        averageCLV,
        churnRate,
        growthRate: 0 // Would need historical data to calculate
      });

      // Plan breakdown
      const planStats =
        subscriptionData?.reduce((acc, sub) => {
          const plan = sub.plan_id;
          if (!acc[plan]) {
            acc[plan] = { count: 0, mrr: 0, arr: 0 };
          }
          acc[plan].count++;
          acc[plan].mrr += parseFloat(sub.monthly_recurring_revenue || 0);
          acc[plan].arr += parseFloat(sub.annual_recurring_revenue || 0);
          return acc;
        }, {}) || {};

      setPlanBreakdown(planStats);

      // Fetch cohort analysis
      const { data: cohortAnalysis, error: cohortError } = await supabase
        .from('cohort_analysis')
        .select('*')
        .order('cohort_month', { ascending: false })
        .limit(12);

      if (cohortError) throw cohortError;
      setCohortData(cohortAnalysis || []);
    } catch (err) {
      console.error('Error fetching subscription metrics:', err);
      showError('Failed to load subscription metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPercentage = value => {
    return `${(value || 0).toFixed(1)}%`;
  };

  const getChurnRiskColor = score => {
    if (score >= 80) return '#ef4444'; // High risk
    if (score >= 50) return '#f59e0b'; // Medium risk
    return '#10b981'; // Low risk
  };

  const getChurnRiskLabel = score => {
    if (score >= 80) return 'High Risk';
    if (score >= 50) return 'Medium Risk';
    return 'Low Risk';
  };

  const renderMetricCard = (title, value, subtitle, color = '#3b82f6') => (
    <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#666' }}>{title}</h3>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color, marginBottom: '0.5rem' }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: '0.875rem', color: '#666' }}>{subtitle}</div>}
    </div>
  );

  const renderPlanBreakdown = () => (
    <div className='card'>
      <h3>Plan Distribution</h3>
      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {Object.entries(planBreakdown).map(([plan, data]) => {
          const planNames = { free: 'Free', premium: 'Premium', pro: 'Pro' };
          const planColors = { free: '#6b7280', premium: '#3b82f6', pro: '#8b5cf6' };

          return (
            <div
              key={plan}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: `2px solid ${planColors[plan] || '#e5e7eb'}`,
                borderRadius: '8px',
                background: `${planColors[plan] || '#f3f4f6'}10`
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                  {planNames[plan] || plan}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{data.count} subscribers</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{formatCurrency(data.mrr)}/mo</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {formatCurrency(data.arr)}/yr
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubscriptionTable = () => (
    <div className='card'>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}
      >
        <h3>Subscription Details</h3>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
        >
          <option value='all'>All Subscriptions</option>
          <option value='active'>Active Only</option>
          <option value='cancelled'>Cancelled Only</option>
          <option value='at-risk'>At Risk (Churn Score ≥70%)</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Plan</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>MRR</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>CLV</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Engagement</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Churn Risk</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.slice(0, 20).map((sub, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{sub.profiles?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>{sub.profiles?.email}</div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background:
                        sub.plan_id === 'pro'
                          ? '#8b5cf6'
                          : sub.plan_id === 'premium'
                          ? '#3b82f6'
                          : '#6b7280',
                      color: 'white'
                    }}
                  >
                    {sub.plan_id?.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(sub.monthly_recurring_revenue)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(sub.customer_lifetime_value)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      margin: '0 auto',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${sub.engagement_score || 0}%`,
                        height: '100%',
                        background:
                          sub.engagement_score >= 70
                            ? '#10b981'
                            : sub.engagement_score >= 40
                            ? '#f59e0b'
                            : '#ef4444',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    {Math.round(sub.engagement_score || 0)}%
                  </div>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: getChurnRiskColor(sub.churn_risk_score),
                      color: 'white'
                    }}
                  >
                    {getChurnRiskLabel(sub.churn_risk_score)}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: sub.subscriptions?.status === 'active' ? '#10b981' : '#ef4444',
                      color: 'white'
                    }}
                  >
                    {sub.subscriptions?.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!currentUser || (currentUser.role !== 'super-admin' && currentUser.role !== 'admin')) {
    return (
      <div className='main-container'>
        <div className='card'>
          <h3>Access Denied</h3>
          <p>You don't have permission to view subscription metrics.</p>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading subscription metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Subscription Metrics</h2>
        <button className='back-button' onClick={() => setPage('revenue-analytics')}>
          Back to Revenue Analytics
        </button>
      </header>

      <div className='content-body'>
        {/* Key Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          {renderMetricCard(
            'Monthly Recurring Revenue',
            formatCurrency(metrics.totalMRR),
            'Total MRR',
            '#10b981'
          )}
          {renderMetricCard(
            'Annual Recurring Revenue',
            formatCurrency(metrics.totalARR),
            'Total ARR',
            '#3b82f6'
          )}
          {renderMetricCard(
            'Average Customer LTV',
            formatCurrency(metrics.averageCLV),
            'Lifetime Value',
            '#8b5cf6'
          )}
          {renderMetricCard(
            'Churn Rate',
            formatPercentage(metrics.churnRate),
            'Monthly churn',
            metrics.churnRate > 10 ? '#ef4444' : '#f59e0b'
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}
        >
          {/* Plan Breakdown */}
          {renderPlanBreakdown()}

          {/* Quick Stats */}
          <div className='card'>
            <h3>Quick Stats</h3>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Subscribers:</span>
                <span style={{ fontWeight: 600 }}>{subscriptions.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Subscriptions:</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                  {subscriptions.filter(s => s.subscriptions?.status === 'active').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cancelled Subscriptions:</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>
                  {subscriptions.filter(s => s.subscriptions?.status === 'cancelled').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>High Churn Risk:</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                  {subscriptions.filter(s => s.churn_risk_score >= 70).length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg Engagement Score:</span>
                <span style={{ fontWeight: 600 }}>
                  {subscriptions.length > 0
                    ? Math.round(
                        subscriptions.reduce((sum, s) => sum + (s.engagement_score || 0), 0) /
                          subscriptions.length
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Table */}
        {renderSubscriptionTable()}

        {/* Actions */}
        <div className='card'>
          <h3>Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchSubscriptionMetrics()}
              style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
            >
              Refresh Data
            </button>
            <button
              onClick={() => setPage('revenue-analytics')}
              style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#3b82f6' }}
            >
              Revenue Dashboard
            </button>
            <button
              onClick={() => {
                // Export functionality
                alert('Export functionality coming soon!');
              }}
              style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
            >
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionMetricsDashboard;
