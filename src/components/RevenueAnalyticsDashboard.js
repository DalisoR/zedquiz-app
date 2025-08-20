import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function RevenueAnalyticsDashboard({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState([]);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const { showError } = useToastNotification();

  useEffect(() => {
    if (currentUser?.role === 'super-admin' || currentUser?.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [currentUser, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Get dashboard summary
      const { data: dashboardSummary, error: dashboardError } = await supabase.rpc(
        'get_revenue_dashboard',
        {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      );

      if (dashboardError) throw dashboardError;
      setDashboardData(dashboardSummary);

      // Get daily revenue data
      const { data: revenueAnalytics, error: revenueError } = await supabase
        .from('revenue_analytics')
        .select('*')
        .eq('period_type', 'daily')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (revenueError) throw revenueError;
      setRevenueData(revenueAnalytics || []);

      // Get subscription metrics
      const { data: subMetrics, error: subError } = await supabase
        .from('subscription_metrics')
        .select(
          `
          *,
          profiles!subscription_metrics_user_id_fkey(full_name, email)
        `
        )
        .order('customer_lifetime_value', { ascending: false })
        .limit(10);

      if (subError) throw subError;
      setSubscriptionMetrics(subMetrics || []);

      // Get payment analytics
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (paymentError) throw paymentError;
      setPaymentAnalytics(paymentData || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      showError('Failed to load analytics data');
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

  const calculateGrowthRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getMetricColor = (value, isPositive = true) => {
    if (value > 0) return isPositive ? '#10b981' : '#ef4444';
    if (value < 0) return isPositive ? '#ef4444' : '#10b981';
    return '#6b7280';
  };

  const renderMetricCard = (title, value, subtitle, trend, icon) => (
    <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#666' }}>{title}</h3>
      <div
        style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '0.5rem' }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
          {subtitle}
        </div>
      )}
      {trend !== undefined && (
        <div
          style={{
            fontSize: '0.875rem',
            color: getMetricColor(trend),
            fontWeight: 600
          }}
        >
          {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {formatPercentage(Math.abs(trend))}
        </div>
      )}
    </div>
  );

  const renderRevenueChart = () => {
    if (!revenueData.length) return <p>No revenue data available</p>;

    const maxRevenue = Math.max(...revenueData.map(d => d.total_revenue || 0));

    return (
      <div style={{ padding: '1rem' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>Daily Revenue Trend</h4>
        <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '200px' }}>
          {revenueData.map((day, index) => {
            const height = maxRevenue > 0 ? (day.total_revenue / maxRevenue) * 180 : 0;
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${height}px`,
                  background: '#3b82f6',
                  borderRadius: '2px 2px 0 0',
                  position: 'relative',
                  minHeight: '2px'
                }}
                title={`${day.date}: ${formatCurrency(day.total_revenue)}`}
              />
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#666'
          }}
        >
          <span>{revenueData[0]?.date}</span>
          <span>{revenueData[revenueData.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  const renderTopCustomers = () => (
    <div className='card'>
      <h3>Top Customers by Lifetime Value</h3>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
        {subscriptionMetrics.slice(0, 5).map((customer, index) => (
          <div
            key={customer.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              background: '#f9fafb',
              borderRadius: '6px'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                #{index + 1} {customer.profiles?.full_name || 'Unknown'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {customer.plan_id} • {customer.billing_cycle}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>
                {formatCurrency(customer.customer_lifetime_value)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                {formatCurrency(customer.monthly_recurring_revenue)}/mo
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaymentMethodAnalytics = () => {
    const paymentMethods = paymentAnalytics.reduce((acc, day) => {
      if (!acc[day.payment_method]) {
        acc[day.payment_method] = {
          total_amount: 0,
          total_transactions: 0,
          success_rate: 0
        };
      }
      acc[day.payment_method].total_amount += parseFloat(day.total_amount || 0);
      acc[day.payment_method].total_transactions += day.total_transactions || 0;
      acc[day.payment_method].success_rate = day.success_rate || 0;
      return acc;
    }, {});

    return (
      <div className='card'>
        <h3>Payment Method Performance</h3>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {Object.entries(paymentMethods).map(([method, data]) => (
            <div
              key={method}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                  {method.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {data.total_transactions} transactions
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{formatCurrency(data.total_amount)}</div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color:
                      data.success_rate >= 95
                        ? '#10b981'
                        : data.success_rate >= 90
                        ? '#f59e0b'
                        : '#ef4444'
                  }}
                >
                  {formatPercentage(data.success_rate)} success
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentUser || (currentUser.role !== 'super-admin' && currentUser.role !== 'admin')) {
    return (
      <div className='main-container'>
        <div className='card'>
          <h3>Access Denied</h3>
          <p>You don't have permission to view revenue analytics.</p>
          <button onClick={() => setPage('dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='main-container'>
        <div className='card'>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Revenue Analytics</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
          >
            <option value='7'>Last 7 days</option>
            <option value='30'>Last 30 days</option>
            <option value='90'>Last 90 days</option>
            <option value='365'>Last year</option>
          </select>
          <button className='back-button' onClick={() => setPage('super-admin')}>
            Back to Admin
          </button>
        </div>
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
            'Total Revenue',
            formatCurrency(dashboardData?.total_revenue),
            `Last ${dateRange} days`,
            null,
            '💰'
          )}
          {renderMetricCard(
            'Monthly Recurring Revenue',
            formatCurrency(dashboardData?.monthly_recurring_revenue),
            'Current MRR',
            null,
            '📈'
          )}
          {renderMetricCard(
            'Active Subscriptions',
            dashboardData?.active_subscriptions || 0,
            'Current subscribers',
            null,
            '👥'
          )}
          {renderMetricCard(
            'Churn Rate',
            formatPercentage(dashboardData?.churn_rate),
            'Monthly churn',
            null,
            '📉'
          )}
        </div>

        {/* Revenue Chart */}
        <div className='card'>{renderRevenueChart()}</div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem'
          }}
        >
          {/* Top Customers */}
          {renderTopCustomers()}

          {/* Payment Method Analytics */}
          {renderPaymentMethodAnalytics()}
        </div>

        {/* Detailed Analytics Table */}
        <div className='card'>
          <h3>Daily Revenue Breakdown</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>New Subs</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cancelled</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Active Users</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>New Users</th>
                </tr>
              </thead>
              <tbody>
                {revenueData
                  .slice(-10)
                  .reverse()
                  .map((day, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(day.total_revenue)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {day.new_subscriptions || 0}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {day.cancelled_subscriptions || 0}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {day.active_users || 0}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {day.new_users || 0}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='card'>
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchAnalyticsData()}
              style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
            >
              Refresh Data
            </button>
            <button
              onClick={() => {
                // Export functionality could be added here
                alert('Export functionality coming soon!');
              }}
              style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#10b981' }}
            >
              Export Report
            </button>
            <button
              onClick={() => setPage('subscription-management')}
              style={{ width: 'auto', padding: '0.75rem 1.5rem', background: '#3b82f6' }}
            >
              Manage Subscriptions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueAnalyticsDashboard;
