-- Combined Migration: Payment System + Revenue Analytics
-- This migration includes both payment processing and analytics systems
-- Run this if you haven't run the payment migration yet

-- ============================================================================
-- PART 1: PAYMENT SYSTEM (from 005_payments_subscriptions_final.sql)
-- ============================================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(100) PRIMARY KEY, -- PesaPal order ID
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZMW',
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
    payment_method VARCHAR(50) DEFAULT 'pesapal',
    payment_data JSONB DEFAULT '{}'::jsonb,
    
    -- PesaPal specific fields
    pesapal_tracking_id VARCHAR(100),
    pesapal_merchant_reference VARCHAR(100),
    pesapal_status VARCHAR(100),
    pesapal_status_code INTEGER,
    payment_method_used VARCHAR(100),
    payment_account VARCHAR(100),
    confirmation_code VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, suspended
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZMW',
    payment_method VARCHAR(50) DEFAULT 'pesapal',
    
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    payment_id VARCHAR(100) REFERENCES payments(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, plan_id, start_date)
);

-- Create subscription_usage table for tracking usage
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    usage_type VARCHAR(50) NOT NULL, -- quiz_taken, course_enrolled, video_watched, etc.
    usage_count INTEGER DEFAULT 1,
    usage_date DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, subscription_id, usage_type, usage_date)
);

-- Create payment_webhooks table for PesaPal IPN
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id VARCHAR(100) REFERENCES payments(id),
    webhook_type VARCHAR(50) NOT NULL, -- pesapal_ipn
    webhook_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on payment tables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'payments' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'subscriptions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'subscription_usage' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'payment_webhooks' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Payment system policies
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
DROP POLICY IF EXISTS "System can update payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "System can manage usage" ON subscription_usage;
DROP POLICY IF EXISTS "Admin can manage webhooks" ON payment_webhooks;

CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payments" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (true);

CREATE POLICY "Users can view their own usage" ON subscription_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage usage" ON subscription_usage
    FOR ALL USING (true);

CREATE POLICY "Admin can manage webhooks" ON payment_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super-admin'
        )
    );

-- Payment system indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_pesapal_tracking ON payments(pesapal_tracking_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_date ON subscription_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- ============================================================================
-- PART 2: REVENUE ANALYTICS SYSTEM
-- ============================================================================

-- Create revenue_analytics table for daily/monthly aggregations
CREATE TABLE IF NOT EXISTS revenue_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
    
    -- Revenue metrics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    subscription_revenue DECIMAL(12,2) DEFAULT 0,
    one_time_revenue DECIMAL(12,2) DEFAULT 0,
    refund_amount DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Subscription metrics
    new_subscriptions INTEGER DEFAULT 0,
    cancelled_subscriptions INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    churned_subscriptions INTEGER DEFAULT 0,
    reactivated_subscriptions INTEGER DEFAULT 0,
    
    -- Plan breakdown
    free_users INTEGER DEFAULT 0,
    premium_users INTEGER DEFAULT 0,
    pro_users INTEGER DEFAULT 0,
    
    -- Payment method breakdown
    mobile_money_revenue DECIMAL(12,2) DEFAULT 0,
    card_revenue DECIMAL(12,2) DEFAULT 0,
    bank_transfer_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- User metrics
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    
    -- Usage metrics
    total_quizzes_taken INTEGER DEFAULT 0,
    total_courses_enrolled INTEGER DEFAULT 0,
    total_videos_watched INTEGER DEFAULT 0,
    total_certificates_earned INTEGER DEFAULT 0,
    
    -- Geographic data
    country_code VARCHAR(3) DEFAULT 'ZM',
    region VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, period_type, country_code, region)
);

-- Create subscription_metrics table for detailed subscription analytics
CREATE TABLE IF NOT EXISTS subscription_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Subscription lifecycle
    plan_id VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    subscription_start DATE NOT NULL,
    subscription_end DATE,
    
    -- Financial metrics
    monthly_recurring_revenue DECIMAL(10,2) NOT NULL,
    annual_recurring_revenue DECIMAL(10,2) NOT NULL,
    customer_lifetime_value DECIMAL(10,2),
    total_paid DECIMAL(10,2) DEFAULT 0,
    
    -- Behavioral metrics
    days_active INTEGER DEFAULT 0,
    last_activity_date DATE,
    engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100 score
    
    -- Churn prediction
    churn_risk_score DECIMAL(5,2) DEFAULT 0, -- 0-100 probability
    churn_factors JSONB DEFAULT '[]'::jsonb,
    
    -- Usage patterns
    avg_daily_usage DECIMAL(8,2) DEFAULT 0,
    peak_usage_day VARCHAR(10), -- monday, tuesday, etc.
    preferred_content_type VARCHAR(50), -- quiz, video, course
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, subscription_id)
);

-- Create payment_analytics table for payment method performance
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    
    -- Transaction metrics
    total_transactions INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    pending_transactions INTEGER DEFAULT 0,
    
    -- Financial metrics
    total_amount DECIMAL(12,2) DEFAULT 0,
    successful_amount DECIMAL(12,2) DEFAULT 0,
    failed_amount DECIMAL(12,2) DEFAULT 0,
    average_transaction_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Performance metrics
    success_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    average_processing_time INTEGER DEFAULT 0, -- seconds
    
    -- Geographic breakdown
    country_code VARCHAR(3) DEFAULT 'ZM',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, payment_method, country_code)
);

-- Create user_behavior_analytics table
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Activity metrics
    session_count INTEGER DEFAULT 0,
    total_session_duration INTEGER DEFAULT 0, -- minutes
    pages_visited INTEGER DEFAULT 0,
    
    -- Learning metrics
    quizzes_taken INTEGER DEFAULT 0,
    quiz_success_rate DECIMAL(5,2) DEFAULT 0,
    courses_enrolled INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0,
    video_completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Engagement metrics
    feature_usage JSONB DEFAULT '{}'::jsonb, -- track which features are used
    time_spent_learning INTEGER DEFAULT 0, -- minutes
    streak_days INTEGER DEFAULT 0,
    
    -- Conversion metrics
    subscription_tier VARCHAR(20) DEFAULT 'free',
    upgrade_events INTEGER DEFAULT 0,
    payment_attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Create cohort_analysis table for user cohorts
CREATE TABLE IF NOT EXISTS cohort_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cohort_month DATE NOT NULL, -- first month user signed up
    period_number INTEGER NOT NULL, -- months since signup (0, 1, 2, etc.)
    
    -- Cohort metrics
    cohort_size INTEGER NOT NULL, -- total users in this cohort
    active_users INTEGER DEFAULT 0, -- users active in this period
    retained_users INTEGER DEFAULT 0, -- users still subscribed
    churned_users INTEGER DEFAULT 0, -- users who cancelled
    
    -- Financial metrics
    cohort_revenue DECIMAL(12,2) DEFAULT 0,
    cumulative_revenue DECIMAL(12,2) DEFAULT 0,
    average_revenue_per_user DECIMAL(10,2) DEFAULT 0,
    
    -- Retention rates
    retention_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    churn_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(cohort_month, period_number)
);

-- Enable RLS on all analytics tables
ALTER TABLE revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;

-- Analytics policies
DROP POLICY IF EXISTS "Admin can view all revenue analytics" ON revenue_analytics;
DROP POLICY IF EXISTS "Admin can manage revenue analytics" ON revenue_analytics;
DROP POLICY IF EXISTS "Admin can view subscription metrics" ON subscription_metrics;
DROP POLICY IF EXISTS "Users can view their own subscription metrics" ON subscription_metrics;
DROP POLICY IF EXISTS "Admin can view payment analytics" ON payment_analytics;
DROP POLICY IF EXISTS "Users can view their own behavior analytics" ON user_behavior_analytics;
DROP POLICY IF EXISTS "Admin can view all behavior analytics" ON user_behavior_analytics;
DROP POLICY IF EXISTS "Admin can view cohort analysis" ON cohort_analysis;

CREATE POLICY "Admin can view all revenue analytics" ON revenue_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can manage revenue analytics" ON revenue_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can view subscription metrics" ON subscription_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Users can view their own subscription metrics" ON subscription_metrics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view payment analytics" ON payment_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Users can view their own behavior analytics" ON user_behavior_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all behavior analytics" ON user_behavior_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can view cohort analysis" ON cohort_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period ON revenue_analytics(period_type);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_user ON subscription_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_plan ON subscription_metrics(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_method ON payment_analytics(payment_method);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_date ON user_behavior_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_month ON cohort_analysis(cohort_month);

-- ============================================================================
-- PART 3: FUNCTIONS (Payment System + Analytics)
-- ============================================================================

-- Payment system functions
CREATE OR REPLACE FUNCTION check_user_subscription(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_subscription RECORD;
    v_result JSONB;
BEGIN
    -- Get active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1;
    
    IF v_subscription IS NULL THEN
        -- Check profile for legacy subscription info
        SELECT subscription_tier, subscription_status, subscription_end_date
        INTO v_subscription
        FROM profiles
        WHERE id = p_user_id;
        
        v_result := jsonb_build_object(
            'has_active_subscription', COALESCE(v_subscription.subscription_status = 'active' AND v_subscription.subscription_end_date > NOW(), false),
            'plan_id', COALESCE(v_subscription.subscription_tier, 'free'),
            'status', COALESCE(v_subscription.subscription_status, 'free'),
            'end_date', v_subscription.subscription_end_date,
            'source', 'profile'
        );
    ELSE
        v_result := jsonb_build_object(
            'has_active_subscription', true,
            'plan_id', v_subscription.plan_id,
            'status', v_subscription.status,
            'billing_cycle', v_subscription.billing_cycle,
            'end_date', v_subscription.end_date,
            'next_billing_date', v_subscription.next_billing_date,
            'source', 'subscription'
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_subscription_usage(
    p_user_id UUID,
    p_usage_type VARCHAR(50),
    p_usage_count INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- Get active subscription
    SELECT id INTO v_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1;
    
    -- Record usage if subscription exists
    IF v_subscription_id IS NOT NULL THEN
        INSERT INTO subscription_usage (
            user_id, subscription_id, usage_type, usage_count, metadata
        ) VALUES (
            p_user_id, v_subscription_id, p_usage_type, p_usage_count, p_metadata
        )
        ON CONFLICT (user_id, subscription_id, usage_type, usage_date)
        DO UPDATE SET
            usage_count = subscription_usage.usage_count + p_usage_count,
            metadata = p_metadata;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cancel_subscription(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- Get active subscription
    SELECT id INTO v_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    ORDER BY end_date DESC
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Cancel subscription (but keep access until end date)
    UPDATE subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        next_billing_date = NULL,
        updated_at = NOW()
    WHERE id = v_subscription_id;
    
    -- Update profile
    UPDATE profiles
    SET subscription_status = 'cancelled'
    WHERE id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Analytics functions
CREATE OR REPLACE FUNCTION calculate_daily_revenue_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    v_total_revenue DECIMAL(12,2);
    v_subscription_revenue DECIMAL(12,2);
    v_new_subscriptions INTEGER;
    v_cancelled_subscriptions INTEGER;
    v_active_subscriptions INTEGER;
    v_free_users INTEGER;
    v_premium_users INTEGER;
    v_pro_users INTEGER;
    v_new_users INTEGER;
    v_active_users INTEGER;
    v_total_users INTEGER;
BEGIN
    -- Calculate revenue metrics
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)
    INTO v_total_revenue, v_subscription_revenue
    FROM payments 
    WHERE DATE(created_at) = target_date;
    
    -- Calculate subscription metrics
    SELECT COUNT(*) INTO v_new_subscriptions
    FROM subscriptions 
    WHERE DATE(created_at) = target_date;
    
    SELECT COUNT(*) INTO v_cancelled_subscriptions
    FROM subscriptions 
    WHERE DATE(cancelled_at) = target_date;
    
    SELECT COUNT(*) INTO v_active_subscriptions
    FROM subscriptions 
    WHERE status = 'active' AND end_date > NOW();
    
    -- Calculate user metrics by plan
    SELECT 
        COUNT(CASE WHEN subscription_tier = 'free' THEN 1 END),
        COUNT(CASE WHEN subscription_tier = 'premium' THEN 1 END),
        COUNT(CASE WHEN subscription_tier = 'pro' THEN 1 END),
        COUNT(*)
    INTO v_free_users, v_premium_users, v_pro_users, v_total_users
    FROM profiles;
    
    -- Calculate new users
    SELECT COUNT(*) INTO v_new_users
    FROM profiles 
    WHERE DATE(created_at) = target_date;
    
    -- Calculate active users (simplified)
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM subscription_usage 
    WHERE usage_date = target_date;
    
    -- Insert or update analytics record
    INSERT INTO revenue_analytics (
        date, period_type, total_revenue, subscription_revenue,
        new_subscriptions, cancelled_subscriptions, active_subscriptions,
        free_users, premium_users, pro_users,
        new_users, active_users, total_users
    ) VALUES (
        target_date, 'daily', v_total_revenue, v_subscription_revenue,
        v_new_subscriptions, v_cancelled_subscriptions, v_active_subscriptions,
        v_free_users, v_premium_users, v_pro_users,
        v_new_users, v_active_users, v_total_users
    )
    ON CONFLICT (date, period_type, country_code, region)
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        subscription_revenue = EXCLUDED.subscription_revenue,
        new_subscriptions = EXCLUDED.new_subscriptions,
        cancelled_subscriptions = EXCLUDED.cancelled_subscriptions,
        active_subscriptions = EXCLUDED.active_subscriptions,
        free_users = EXCLUDED.free_users,
        premium_users = EXCLUDED.premium_users,
        pro_users = EXCLUDED.pro_users,
        new_users = EXCLUDED.new_users,
        active_users = EXCLUDED.active_users,
        total_users = EXCLUDED.total_users,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_revenue_dashboard(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_total_revenue DECIMAL(12,2);
    v_mrr DECIMAL(12,2);
    v_arr DECIMAL(12,2);
    v_active_subs INTEGER;
    v_churn_rate DECIMAL(5,2);
BEGIN
    -- Calculate total revenue
    SELECT COALESCE(SUM(total_revenue), 0) INTO v_total_revenue
    FROM revenue_analytics
    WHERE date BETWEEN start_date AND end_date
    AND period_type = 'daily';
    
    -- Calculate MRR (Monthly Recurring Revenue)
    SELECT COALESCE(SUM(monthly_recurring_revenue), 0) INTO v_mrr
    FROM subscription_metrics sm
    JOIN subscriptions s ON sm.subscription_id = s.id
    WHERE s.status = 'active';
    
    -- Calculate ARR (Annual Recurring Revenue)
    v_arr := v_mrr * 12;
    
    -- Get active subscriptions
    SELECT COUNT(*) INTO v_active_subs
    FROM subscriptions
    WHERE status = 'active' AND end_date > NOW();
    
    -- Calculate churn rate (simplified)
    SELECT 
        CASE 
            WHEN total_subs > 0 THEN (churned_subs::DECIMAL / total_subs) * 100
            ELSE 0
        END INTO v_churn_rate
    FROM (
        SELECT 
            COUNT(*) as total_subs,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as churned_subs
        FROM subscriptions
        WHERE created_at >= start_date - INTERVAL '30 days'
    ) churn_calc;
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'total_revenue', v_total_revenue,
        'monthly_recurring_revenue', v_mrr,
        'annual_recurring_revenue', v_arr,
        'active_subscriptions', v_active_subs,
        'churn_rate', v_churn_rate,
        'period_start', start_date,
        'period_end', end_date
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or reuse the update_updated_at_column function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Add update triggers
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Payment System Tables: payments, subscriptions, subscription_usage, payment_webhooks';
    RAISE NOTICE 'Analytics Tables: revenue_analytics, subscription_metrics, payment_analytics, user_behavior_analytics, cohort_analysis';
    RAISE NOTICE 'Functions: check_user_subscription, record_subscription_usage, cancel_subscription, calculate_daily_revenue_analytics, get_revenue_dashboard';
    RAISE NOTICE 'All RLS policies, indexes, and triggers have been applied.';
    RAISE NOTICE 'Your ZedQuiz platform now has complete payment processing and revenue analytics!';
END $$;