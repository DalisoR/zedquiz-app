-- Check which tables currently exist in your database
-- Run this to see what's already been created

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('payments', 'subscriptions', 'subscription_usage', 'payment_webhooks') 
        THEN 'Payment System'
        WHEN table_name IN ('revenue_analytics', 'subscription_metrics', 'payment_analytics', 'user_behavior_analytics', 'cohort_analysis') 
        THEN 'Analytics System'
        ELSE 'Other'
    END as system_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'payments', 
    'subscriptions', 
    'subscription_usage', 
    'payment_webhooks',
    'revenue_analytics',
    'subscription_metrics',
    'payment_analytics',
    'user_behavior_analytics',
    'cohort_analysis'
)
ORDER BY system_type, table_name;

-- Also check which functions exist
SELECT 
    proname as function_name,
    CASE 
        WHEN proname IN ('check_user_subscription', 'record_subscription_usage', 'cancel_subscription') 
        THEN 'Payment System'
        WHEN proname IN ('calculate_daily_revenue_analytics', 'get_revenue_dashboard') 
        THEN 'Analytics System'
        ELSE 'Other'
    END as system_type
FROM pg_proc 
WHERE proname IN (
    'check_user_subscription',
    'record_subscription_usage', 
    'cancel_subscription',
    'calculate_daily_revenue_analytics',
    'get_revenue_dashboard'
)
ORDER BY system_type, function_name;