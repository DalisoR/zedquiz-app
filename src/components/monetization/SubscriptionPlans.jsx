import React, { useState, useEffect } from 'react';
import { useMonetization } from '../../contexts/MonetizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiZap, FiAward, FiStar, FiArrowRight } from 'react-icons/fi';

const SubscriptionPlans = ({ currentUser, setPage }) => {
  const { 
    subscriptionPlans, 
    isLoading, 
    subscription,  // Get subscription from context
    subscribe,     // Get subscribe function from context
    addToast       // Get addToast function from context
  } = useMonetization();
  
  const { user } = useAuth?.() || {}; // Handle case where auth might not be available
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If currentUser is passed as prop, use it as fallback
    if (!user && currentUser) {
      // Handle case where we have the user from props but not from context
      // This is a workaround and ideally we should use context consistently
    }
  }, [user, currentUser]);

  const handleSubscribe = async (plan) => {
    if (!user && !currentUser) {
      // Redirect to login if no user is available
      setPage?.('login') || navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // Use the subscribe function from context
      const result = await subscribe(plan.id, 'mock_payment_method');
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Show success message using alert for now since addToast is not available
      alert(`Successfully subscribed to ${plan.name}!`);
      
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanPrice = (plan) => {
    return billingCycle === 'yearly' && plan.price_yearly 
      ? plan.price_yearly 
      : plan.price_monthly;
  };

  const getBillingPeriod = () => {
    return billingCycle === 'yearly' ? 'year' : 'month';
  };

  const getPlanFeatures = (plan) => {
    const baseFeatures = [
      'Unlimited quizzes',
      'Progress tracking',
      'Basic analytics'
    ];

    if (plan.name.toLowerCase().includes('premium')) {
      baseFeatures.push('Advanced analytics');
      baseFeatures.push('Priority support');
      baseFeatures.push('Custom quiz creation');
    }

    if (plan.name.toLowerCase().includes('pro')) {
      baseFeatures.push('All Premium features');
      baseFeatures.push('Unlimited custom quizzes');
      baseFeatures.push('Dedicated account manager');
    }

    return baseFeatures;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          Choose Your Plan
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
          Select the plan that's right for you. Cancel or switch plans anytime.
        </p>
        
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 text-sm font-medium rounded-l-md ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 text-sm font-medium rounded-r-md ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Yearly Billing (Save 20%)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
        {subscriptionPlans.map((plan) => {
          const isCurrentPlan = subscription?.plan_id === plan.id;
          const isPopular = plan.name.toLowerCase().includes('premium');
          const price = getPlanPrice(plan);
          const period = getBillingPeriod();
          
          return (
            <div 
              key={plan.id}
              className={`relative p-8 bg-white border-2 ${
                isPopular ? 'border-blue-500' : 'border-gray-200'
              } rounded-2xl shadow-sm flex flex-col`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${price}
                  </span>
                  <span className="ml-1 text-lg font-medium text-gray-500">
                    /{period}
                  </span>
                </div>
                
                <p className="mt-4 text-sm text-gray-500">
                  {plan.description}
                </p>
                
                <ul className="mt-6 space-y-4">
                  {getPlanFeatures(plan).map((feature, index) => (
                    <li key={index} className="flex">
                      <FiCheck className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 py-2 px-4 border border-transparent rounded-md text-sm font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isProcessing}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isPopular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isPopular ? 'focus:ring-blue-500' : 'focus:ring-indigo-500'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Subscribe Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Can I change plans later?</h4>
            <p className="mt-1 text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Your subscription will be prorated accordingly.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">Do you offer discounts for students?</h4>
            <p className="mt-1 text-gray-600">
              Yes, we offer a 50% discount for students with a valid .edu email address. Contact support to verify your student status.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900">What payment methods do you accept?</h4>
            <p className="mt-1 text-gray-600">
              We accept all major credit cards including Visa, Mastercard, American Express, and Discover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
