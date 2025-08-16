import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToastNotification } from '../hooks/useToastNotification';

function PaymentHistoryPage({ currentUser, setPage }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, completed, pending, failed
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    fetchPaymentData();
  }, [currentUser]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      setPayments(paymentsData || []);
      setSubscriptions(subscriptionsData || []);
    } catch (err) {
      console.error('Error fetching payment data:', err);
      showError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedPayments = () => {
    let filtered = payments;

    // Apply filter
    if (filter !== 'all') {
      filtered = payments.filter(payment => payment.status === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'amount_asc':
          return parseFloat(a.amount) - parseFloat(b.amount);
        case 'amount_desc':
          return parseFloat(b.amount) - parseFloat(a.amount);
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const getPlanName = (planId) => {
    const planNames = {
      'free': 'Free',
      'premium': 'Premium',
      'pro': 'Pro'
    };
    return planNames[planId] || planId;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const generateReceiptHTML = (payment) => {
    const subscription = subscriptions.find(sub => sub.payment_id === payment.id);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${payment.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .receipt-title { font-size: 20px; margin: 10px 0; }
          .receipt-info { display: flex; justify-content: space-between; margin: 20px 0; }
          .section { margin: 20px 0; }
          .section h3 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .detail-row:last-child { border-bottom: none; }
          .total { font-size: 18px; font-weight: bold; color: #10b981; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .status-completed { background: #e8f5e9; color: #2e7d32; }
          .status-pending { background: #fff3e0; color: #ef6c00; }
          .status-failed { background: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ZedQuiz</div>
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-info">
            <div><strong>Receipt #:</strong> ${payment.id}</div>
            <div><strong>Date:</strong> ${formatDate(payment.created_at)}</div>
          </div>
        </div>

        <div class="section">
          <h3>Customer Information</h3>
          <div class="detail-row">
            <span>Name:</span>
            <span>${currentUser.full_name}</span>
          </div>
          <div class="detail-row">
            <span>Email:</span>
            <span>${currentUser.email}</span>
          </div>
          <div class="detail-row">
            <span>Customer ID:</span>
            <span>${currentUser.id.substring(0, 8)}</span>
          </div>
        </div>

        <div class="section">
          <h3>Payment Details</h3>
          <div class="detail-row">
            <span>Plan:</span>
            <span>${getPlanName(payment.plan_id)} Subscription</span>
          </div>
          <div class="detail-row">
            <span>Billing Cycle:</span>
            <span>${payment.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}</span>
          </div>
          <div class="detail-row">
            <span>Payment Method:</span>
            <span>${payment.payment_method_used || 'PesaPal'}</span>
          </div>
          ${payment.payment_account ? `
          <div class="detail-row">
            <span>Payment Account:</span>
            <span>${payment.payment_account}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span>Status:</span>
            <span class="status status-${payment.status}">${payment.status.toUpperCase()}</span>
          </div>
          ${payment.confirmation_code ? `
          <div class="detail-row">
            <span>Confirmation Code:</span>
            <span>${payment.confirmation_code}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h3>Amount</h3>
          <div class="detail-row total">
            <span>Total Paid:</span>
            <span>${payment.currency} ${parseFloat(payment.amount).toFixed(2)}</span>
          </div>
        </div>

        ${subscription ? `
        <div class="section">
          <h3>Subscription Details</h3>
          <div class="detail-row">
            <span>Subscription Start:</span>
            <span>${formatDate(subscription.start_date)}</span>
          </div>
          <div class="detail-row">
            <span>Subscription End:</span>
            <span>${formatDate(subscription.end_date)}</span>
          </div>
          <div class="detail-row">
            <span>Status:</span>
            <span>${subscription.status.toUpperCase()}</span>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for choosing ZedQuiz!</p>
          <p>For support, contact us at support@zedquiz.com or +260 977 123 456</p>
          <p>This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintReceipt = () => {
    if (!selectedPayment) return;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(selectedPayment));
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleDownloadReceiptPDF = () => {
    if (!selectedPayment) return;
    
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(selectedPayment));
    receiptWindow.document.close();
  };

  const getPaymentSummary = () => {
    const completed = payments.filter(p => p.status === 'completed');
    const totalSpent = completed.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const averagePayment = completed.length > 0 ? totalSpent / completed.length : 0;
    
    return {
      totalPayments: payments.length,
      completedPayments: completed.length,
      totalSpent: totalSpent,
      averagePayment: averagePayment,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      failedPayments: payments.filter(p => p.status === 'failed').length
    };
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="card">
          <p>Loading payment history...</p>
        </div>
      </div>
    );
  }

  const filteredPayments = getFilteredAndSortedPayments();
  const summary = getPaymentSummary();

  return (
    <div className="main-container">
      <header className="main-header">
        <h2>Payment History</h2>
        <button className="back-button" onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className="content-body">
        {/* Payment Summary */}
        <div className="card">
          <h3>Payment Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {summary.totalPayments}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Payments</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {summary.completedPayments}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Successful</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                K{summary.totalSpent.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Spent</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                K{summary.averagePayment.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Average Payment</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: '0.5rem' }}>
                  Filter:
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                >
                  <option value="all">All Payments</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: '0.5rem' }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="amount_desc">Highest Amount</option>
                  <option value="amount_asc">Lowest Amount</option>
                </select>
              </div>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="card">
          <h3>Payment History</h3>
          
          {filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
              <h4>No payments found</h4>
              <p>
                {filter === 'all' 
                  ? "You haven't made any payments yet." 
                  : `No ${filter} payments found.`
                }
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setPage('subscriptions')}
                  style={{ width: 'auto', marginTop: '1rem' }}
                >
                  Subscribe Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                          {getStatusIcon(payment.status)}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '1.125rem' }}>
                          {getPlanName(payment.plan_id)} Subscription
                        </h4>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: payment.status === 'completed' ? '#e8f5e9' : 
                                       payment.status === 'pending' ? '#fff3e0' : '#fee2e2',
                            color: getStatusColor(payment.status)
                          }}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>
                        Payment ID: {payment.id}
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2c3e50' }}>
                        {payment.currency} {parseFloat(payment.amount).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {payment.billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                        Date
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        {formatDate(payment.created_at)}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                        Payment Method
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        {payment.payment_method_used || 'PesaPal'}
                      </div>
                    </div>
                    
                    {payment.payment_account && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                          Account
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                          {payment.payment_account}
                        </div>
                      </div>
                    )}
                    
                    {payment.confirmation_code && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                          Confirmation
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                          {payment.confirmation_code}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleDownloadReceipt(payment)}
                      style={{
                        width: 'auto',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        background: '#3b82f6'
                      }}
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
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
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Payment Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
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

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  ZedQuiz
                </div>
                <div style={{ fontSize: '1.125rem', margin: '0.5rem 0' }}>
                  Payment Receipt
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  Receipt #{selectedPayment.id}
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Plan:</span>
                  <span style={{ fontWeight: 600 }}>{getPlanName(selectedPayment.plan_id)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Amount:</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedPayment.currency} {parseFloat(selectedPayment.amount).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Date:</span>
                  <span>{formatDate(selectedPayment.created_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Status:</span>
                  <span style={{ color: getStatusColor(selectedPayment.status), fontWeight: 600 }}>
                    {selectedPayment.status.toUpperCase()}
                  </span>
                </div>
                {selectedPayment.confirmation_code && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Confirmation:</span>
                    <span style={{ fontWeight: 600 }}>{selectedPayment.confirmation_code}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={handlePrintReceipt}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#10b981'
                }}
              >
                Print Receipt
              </button>
              <button
                onClick={handleDownloadReceiptPDF}
                style={{
                  width: 'auto',
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6'
                }}
              >
                View Full Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryPage;