import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Custom hook for managing subscription limits and usage tracking
export const useSubscriptionLimits = (currentUser) => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);

  const planLimits = {
    'free': {
      quiz_taken: 3,
      course_enrolled: 1,
      video_watched: 10,
      course_created: 0,
      lesson_created: 0,
      quiz_created: 0
    },
    'premium': {
      quiz_taken: -1, // unlimited
      course_enrolled: -1,
      video_watched: -1,
      course_created: 0,
      lesson_created: 0,
      quiz_created: 0
    },
    'pro': {
      quiz_taken: -1,
      course_enrolled: -1,
      video_watched: -1,
      course_created: -1,
      lesson_created: -1,
      quiz_created: -1
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSubscriptionData();
    }
  }, [currentUser]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Get subscription status
      const { data: subscriptionStatus, error: statusError } = await supabase
        .rpc('check_user_subscription', { p_user_id: currentUser.id });

      if (statusError) throw statusError;

      setSubscription(subscriptionStatus);

      // Get today's usage
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('usage_type, usage_count')
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
    } finally {
      setLoading(false);
    }
  };

  const recordUsage = async (usageType, count = 1, metadata = {}) => {
    try {
      await supabase.rpc('record_subscription_usage', {
        p_user_id: currentUser.id,
        p_usage_type: usageType,
        p_usage_count: count,
        p_metadata: metadata
      });

      // Update local usage state
      setUsage(prev => ({
        ...prev,
        [usageType]: (prev[usageType] || 0) + count
      }));

    } catch (err) {
      console.error('Error recording usage:', err);
    }
  };

  const checkLimit = (usageType) => {
    const planId = subscription?.plan_id || 'free';
    const limit = planLimits[planId]?.[usageType] || 0;
    const currentUsage = usage[usageType] || 0;

    return {
      limit,
      currentUsage,
      isUnlimited: limit === -1,
      hasAccess: limit === -1 || currentUsage < limit,
      remainingUsage: limit === -1 ? -1 : Math.max(0, limit - currentUsage),
      usagePercentage: limit === -1 ? 0 : Math.min((currentUsage / limit) * 100, 100)
    };
  };

  const canPerformAction = (usageType) => {
    const limitCheck = checkLimit(usageType);
    return limitCheck.hasAccess;
  };

  const getLimitMessage = (usageType) => {
    const limitCheck = checkLimit(usageType);
    const planId = subscription?.plan_id || 'free';
    
    if (limitCheck.isUnlimited) {
      return `Unlimited ${usageType.replace('_', ' ')} with ${planLimits[planId]?.name || planId} plan`;
    }
    
    if (!limitCheck.hasAccess) {
      return `Daily limit reached (${limitCheck.limit}). Upgrade to Premium for unlimited access.`;
    }
    
    return `${limitCheck.remainingUsage} remaining today (${limitCheck.currentUsage}/${limitCheck.limit} used)`;
  };

  const getUpgradeMessage = (usageType) => {
    const planId = subscription?.plan_id || 'free';
    
    if (planId === 'free') {
      return 'Upgrade to Premium or Pro for unlimited access';
    }
    
    if (planId === 'premium' && ['course_created', 'lesson_created', 'quiz_created'].includes(usageType)) {
      return 'Upgrade to Pro to create unlimited courses and content';
    }
    
    return null;
  };

  const refreshUsage = () => {
    fetchSubscriptionData();
  };

  return {
    subscription,
    usage,
    loading,
    planLimits,
    recordUsage,
    checkLimit,
    canPerformAction,
    getLimitMessage,
    getUpgradeMessage,
    refreshUsage
  };
};

// Usage tracking wrapper component
export const withUsageTracking = (WrappedComponent, usageType) => {
  return function UsageTrackedComponent(props) {
    const { recordUsage } = useSubscriptionLimits(props.currentUser);
    
    const trackUsage = (metadata = {}) => {
      recordUsage(usageType, 1, metadata);
    };
    
    return <WrappedComponent {...props} trackUsage={trackUsage} />;
  };
};

export default useSubscriptionLimits;