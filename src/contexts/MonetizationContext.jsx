import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Create the context
const MonetizationContext = createContext(null);

// Export the custom hook
export const useMonetization = () => {
  const context = useContext(MonetizationContext);
  if (!context) {
    throw new Error('useMonetization must be used within a MonetizationProvider');
  }
  return context;
};

export const MonetizationProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [affiliateInfo, setAffiliateInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [referrals, setReferrals] = useState([]);
  
  // These will be provided by the AuthProvider and ToastProvider in App.js
  const { user } = {}; // This will be overridden by the actual AuthContext
  const addToast = (message, options) => console.log(message, options); // Default implementation



  // Fetch subscription plans
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setSubscriptionPlans(data || []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      addToast('Failed to load subscription plans', { type: 'error' });
    }
  }, [addToast]);

  // Fetch user's subscription
  const fetchUserSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      if (data) {
        // Get plan details
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', data.plan_id)
          .single();
        
        setSubscription({
          ...data,
          plan: planData
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      addToast('Failed to load subscription information', { type: 'error' });
    }
  }, [user, addToast]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      addToast('Failed to load products', { type: 'error' });
    }
  }, [addToast]);

  // Fetch affiliate info
  const fetchAffiliateInfo = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setIsAffiliate(true);
        setAffiliateInfo(data);
        
        // Fetch referrals
        const { data: refData, error: refError } = await supabase
          .from('affiliate_referrals')
          .select('*, referred_user:referred_user_id(email, full_name)')
          .eq('affiliate_id', data.id);
          
        if (!refError) {
          setReferrals(refData || []);
        }
      } else {
        setIsAffiliate(false);
        setAffiliateInfo(null);
        setReferrals([]);
      }
    } catch (error) {
      console.error('Error fetching affiliate info:', error);
      addToast('Failed to load affiliate information', { type: 'error' });
    }
  }, [user, addToast]);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSubscriptionPlans(),
        fetchProducts(),
        fetchUserSubscription(),
        fetchAffiliateInfo()
      ]);
      setIsLoading(false);
    };

    init();
  }, [fetchSubscriptionPlans, fetchProducts, fetchUserSubscription, fetchAffiliateInfo]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('user_subscription_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSubscription(null);
          } else {
            fetchUserSubscription();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, fetchUserSubscription]);

  // Handle subscription
  const subscribe = async (planId, paymentMethod) => {
    if (!user) {
      addToast('You must be logged in to subscribe', { type: 'error' });
      return { error: 'Not authenticated' };
    }

    try {
      // In a real app, you would integrate with Stripe here
      // This is a simplified version
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Create subscription in your database
      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          stripe_customer_id: 'mock_customer_id', // Replace with actual Stripe customer ID
          stripe_subscription_id: 'mock_subscription_id' // Replace with actual Stripe subscription ID
        }, {
          onConflict: 'user_id,status',
          returning: 'representation'
        });

      if (error) throw error;

      // Update local state
      await fetchUserSubscription();
      addToast(`Successfully subscribed to ${plan.name}`, { type: 'success' });
      
      return { success: true };
    } catch (error) {
      console.error('Subscription error:', error);
      addToast('Failed to process subscription', { type: 'error' });
      return { error: error.message };
    }
  };

  // Handle purchase
  const purchaseProduct = async (productId, quantity = 1) => {
    if (!user) {
      addToast('You must be logged in to make a purchase', { type: 'error' });
      return { error: 'Not authenticated' };
    }

    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      // In a real app, you would integrate with Stripe here
      const { data, error } = await supabase
        .from('user_purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          amount: product.price * quantity,
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: `mock_tx_${Date.now()}`,
          metadata: { quantity }
        })
        .select()
        .single();

      if (error) throw error;

      addToast(`Successfully purchased ${product.name}`, { type: 'success' });
      
      // Refresh products in case of limited quantity
      await fetchProducts();
      
      return { success: true, purchase: data };
    } catch (error) {
      console.error('Purchase error:', error);
      addToast('Failed to process purchase', { type: 'error' });
      return { error: error.message };
    }
  };

  // Handle affiliate signup
  const signUpAsAffiliate = async () => {
    if (!user) {
      addToast('You must be logged in to become an affiliate', { type: 'error' });
      return { error: 'Not authenticated' };
    }

    if (isAffiliate) {
      return { success: true, isAlreadyAffiliate: true };
    }

    try {
      // Generate a unique referral code
      const referralCode = `${user.username || user.email.split('@')[0]}_${Math.random().toString(36).substr(2, 6)}`;
      
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.id,
          referral_code: referralCode.toLowerCase(),
          commission_rate: 10.00 // Default commission rate
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateInfo(data);
      setIsAffiliate(true);
      addToast('Successfully signed up for the affiliate program!', { type: 'success' });
      
      return { success: true, isNewAffiliate: true, affiliate: data };
    } catch (error) {
      console.error('Affiliate signup error:', error);
      addToast('Failed to sign up for the affiliate program', { type: 'error' });
      return { error: error.message };
    }
  };

  // Get affiliate link
  const getAffiliateLink = () => {
    if (!isAffiliate || !affiliateInfo) return null;
    return `${window.location.origin}/signup?ref=${affiliateInfo.referral_code}`;
  };

  const value = {
    // Subscription
    subscription,
    subscriptionPlans,
    subscribe,
    cancelSubscription: async () => {
      if (subscription) {
        try {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'canceled' })
            .eq('id', subscription.id);
          
          setSubscription(null);
          addToast('Your subscription has been canceled', { type: 'success' });
          return { success: true };
        } catch (error) {
          console.error('Error canceling subscription:', error);
          addToast('Failed to cancel subscription', { type: 'error' });
          return { error: error.message };
        }
      }
      return { error: 'No active subscription found' };
    },
    
    // Products & Purchases
    products,
    purchaseProduct,
    getUserPurchases: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from('user_purchases')
          .select('*, product:product_id(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching purchases:', error);
        addToast('Failed to load purchase history', { type: 'error' });
        return [];
      }
    },
    
    // Affiliate Program
    isAffiliate,
    affiliateInfo,
    referrals,
    signUpAsAffiliate,
    getAffiliateLink,
    
    // Loading state
    isLoading,
    
    // Data fetching functions
    fetchSubscriptionPlans,
    fetchUserSubscription,
    fetchProducts,
    fetchAffiliateInfo
  };

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
};

export default MonetizationProvider;
