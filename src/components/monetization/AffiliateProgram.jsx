import React, { useState, useEffect, useCallback } from 'react';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import { 
  FiCopy, 
  FiExternalLink, 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp, 
  FiUserCheck,
  FiArrowRight
} from 'react-icons/fi';

const AffiliateProgram = ({ currentUser, setPage }) => {
  const { isAffiliate = false, affiliateInfo = {}, referrals = [], isLoading } = useMonetization();
  const { user } = useAuth?.() || {}; // Handle case where auth might not be available
  const history = useHistory();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Use currentUser from props if available
  const activeUser = user || currentUser;
  
  // Mock function for getting affiliate link - replace with actual implementation
  const getAffiliateLink = useCallback(() => {
    if (!activeUser) return '';
    return `${window.location.origin}/signup?ref=${activeUser.id}`;
  }, [activeUser]);

  // Stats calculation with fallbacks
  const stats = {
    totalEarnings: affiliateInfo?.total_earnings || 0,
    pendingPayout: (affiliateInfo?.total_earnings || 0) - (affiliateInfo?.paid_out || 0),
    totalReferrals: referrals?.length || 0,
    conversionRate: referrals?.length > 0 
      ? ((referrals.filter(r => r.status === 'completed').length / referrals.length) * 100).toFixed(1)
      : 0,
    // Mock data for demo purposes
    activeReferrals: referrals?.filter(r => r.status === 'active').length || 0,
    pendingPayouts: (affiliateInfo?.pending_payouts || 0).toFixed(2)
  };

  const handleSignUp = async () => {
    if (!activeUser) {
      // Redirect to login if no user is available
      setPage?.('login');
      history.push('/login', { state: { from: '/affiliate' } });
      return;
    }
    
    setIsSigningUp(true);
    setError('');
    setSuccess('');
    
    try {
      // In a real implementation, this would call the API to sign up as an affiliate
      console.log('Signing up as affiliate...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Successfully enrolled in the affiliate program!');
      // In a real app, you would update the affiliate status via context
    } catch (error) {
      console.error('Affiliate signup error:', error);
      setError(error.message || 'Failed to sign up for the affiliate program. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const copyToClipboard = () => {
    const link = getAffiliateLink();
    if (link) {
      navigator.clipboard.writeText(link)
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Affiliate Program</h1>
      
      {!isAffiliate ? (
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Join Our Affiliate Program</h2>
          <p className="mb-8">Earn 20% commission on every paid subscription you refer.</p>
          <button
            onClick={handleSignUp}
            disabled={isSigningUp}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isSigningUp ? 'Signing Up...' : 'Join Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Earnings', value: `$${stats.totalEarnings.toFixed(2)}`, icon: <FiDollarSign /> },
              { label: 'Pending Payout', value: `$${stats.pendingPayout.toFixed(2)}`, icon: <FiDollarSign /> },
              { label: 'Total Referrals', value: stats.totalReferrals, icon: <FiUsers /> },
              { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: <FiTrendingUp /> }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="text-gray-500 text-sm">{stat.label}</div>
                <div className="text-2xl font-bold mt-1">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Referral Link */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Your Referral Link</h3>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={getAffiliateLink()}
                className="flex-1 border rounded-l-lg px-4 py-2"
              />
              <button
                onClick={copyToClipboard}
                className="bg-gray-100 px-4 py-2 rounded-r-lg border border-l-0 hover:bg-gray-200"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Referrals</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="pb-2">User</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Commission</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length > 0 ? (
                      referrals.map((ref) => (
                        <tr key={ref.id} className="border-b">
                          <td className="py-3">
                            {ref.referred_user?.email || 'Anonymous'}
                          </td>
                          <td>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              ref.status === 'completed' ? 'bg-green-100 text-green-800' :
                              ref.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td>${ref.commission_amount?.toFixed(2)}</td>
                          <td>{new Date(ref.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">
                          No referrals yet. Share your link to start earning!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateProgram;
