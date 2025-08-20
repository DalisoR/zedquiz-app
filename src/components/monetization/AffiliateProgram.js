import React, { useState, useCallback } from 'react';

const AffiliateProgram = ({ currentUser, setPage }) => {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAffiliate, setIsAffiliate] = useState(false);

  // Mock data for demo purposes
  const affiliateInfo = {
    total_earnings: 150.75,
    paid_out: 100.0,
    pending_payouts: 50.75
  };

  const referrals = [
    {
      id: 1,
      referred_user: { email: 'john@example.com' },
      status: 'completed',
      commission_amount: 25.5,
      created_at: '2024-01-15'
    },
    {
      id: 2,
      referred_user: { email: 'jane@example.com' },
      status: 'pending',
      commission_amount: 25.25,
      created_at: '2024-01-20'
    }
  ];

  // Stats calculation with fallbacks
  const stats = {
    totalEarnings: affiliateInfo?.total_earnings || 0,
    pendingPayout: (affiliateInfo?.total_earnings || 0) - (affiliateInfo?.paid_out || 0),
    totalReferrals: referrals?.length || 0,
    conversionRate:
      referrals?.length > 0
        ? (
            (referrals.filter(r => r.status === 'completed').length / referrals.length) *
            100
          ).toFixed(1)
        : 0,
    activeReferrals: referrals?.filter(r => r.status === 'active').length || 0,
    pendingPayouts: (affiliateInfo?.pending_payouts || 0).toFixed(2)
  };

  // Mock function for getting affiliate link
  const getAffiliateLink = useCallback(() => {
    if (!currentUser) return '';
    return `${window.location.origin}?ref=${currentUser.id}`;
  }, [currentUser]);

  const handleSignUp = async () => {
    if (!currentUser) {
      setPage('login');
      return;
    }

    setIsSigningUp(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsAffiliate(true);
      setSuccess('Successfully enrolled in the affiliate program!');
    } catch (error) {
      console.error('Affiliate signup error:', error);
      setError('Failed to sign up for the affiliate program. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const copyToClipboard = () => {
    const link = getAffiliateLink();
    if (link) {
      navigator.clipboard
        .writeText(link)
        .then(() => {
          setIsCopied(true);
          setSuccess('Link copied to clipboard!');
          setTimeout(() => {
            setIsCopied(false);
            setSuccess('');
          }, 3000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setError('Failed to copy link. Please try again.');
        });
    } else {
      setError('Unable to generate affiliate link. Please try again later.');
    }
  };

  return (
    <div className='main-container'>
      <header className='main-header'>
        <h2>Affiliate Program</h2>
        <button className='back-button' onClick={() => setPage('dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <div className='content-body'>
        {error && (
          <div
            style={{
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '1rem',
              background: '#d1fae5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              color: '#065f46',
              marginBottom: '1rem'
            }}
          >
            {success}
          </div>
        )}

        {!isAffiliate ? (
          <div
            className='card'
            style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤝</div>
            <h3 style={{ margin: '0 0 1rem 0' }}>Join Our Affiliate Program</h3>
            <p style={{ margin: '0 0 2rem 0', fontSize: '1.125rem', color: '#666' }}>
              Earn 20% commission on every paid subscription you refer. Help others learn while
              earning money!
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}
            >
              <div style={{ padding: '1.5rem', background: '#f0f9ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>20% Commission</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                  On every successful referral
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Real-time Tracking</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                  Monitor your earnings
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: '#fefce8', borderRadius: '8px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚀</div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Easy Sharing</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                  Simple referral links
                </p>
              </div>
            </div>

            <button
              onClick={handleSignUp}
              disabled={isSigningUp}
              style={{
                width: 'auto',
                padding: '1rem 2rem',
                background: isSigningUp ? '#9ca3af' : '#3b82f6',
                fontSize: '1.125rem',
                fontWeight: 600
              }}
            >
              {isSigningUp ? 'Signing Up...' : 'Join Affiliate Program'}
            </button>
          </div>
        ) : (
          <div>
            {/* Stats Overview */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}
            >
              <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#10b981' }}>
                  K{stats.totalEarnings.toFixed(2)}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Total Earnings</p>
              </div>

              <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#f59e0b' }}>
                  K{stats.pendingPayout.toFixed(2)}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Pending Payout</p>
              </div>

              <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#3b82f6' }}>
                  {stats.totalReferrals}
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Total Referrals</p>
              </div>

              <div className='card' style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#8b5cf6' }}>
                  {stats.conversionRate}%
                </h3>
                <p style={{ margin: 0, color: '#666' }}>Conversion Rate</p>
              </div>
            </div>

            {/* Referral Link */}
            <div className='card'>
              <h3>Your Referral Link</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type='text'
                  readOnly
                  value={getAffiliateLink()}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px 0 0 6px',
                    background: '#f9fafb'
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    width: 'auto',
                    padding: '0.75rem 1.5rem',
                    background: isCopied ? '#10b981' : '#6b7280',
                    borderRadius: '0 6px 6px 0'
                  }}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Referrals Table */}
            <div className='card'>
              <h3>Your Referrals</h3>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Commission</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length > 0 ? (
                      referrals.map(ref => (
                        <tr key={ref.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem' }}>
                            {ref.referred_user?.email || 'Anonymous'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background:
                                  ref.status === 'completed'
                                    ? '#d1fae5'
                                    : ref.status === 'pending'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                color:
                                  ref.status === 'completed'
                                    ? '#065f46'
                                    : ref.status === 'pending'
                                    ? '#92400e'
                                    : '#dc2626'
                              }}
                            >
                              {ref.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                            K{ref.commission_amount?.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {new Date(ref.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan='4'
                          style={{ padding: '2rem', textAlign: 'center', color: '#666' }}
                        >
                          No referrals yet. Share your link to start earning!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How It Works */}
            <div className='card'>
              <h3>How It Works</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}
              >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1️⃣</div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Share Your Link</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    Copy and share your unique referral link with friends and family
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2️⃣</div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>They Subscribe</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    When someone signs up and subscribes using your link
                  </p>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3️⃣</div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Earn Commission</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    You earn 20% commission on their subscription payment
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AffiliateProgram;
