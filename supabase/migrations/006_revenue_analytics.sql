-- Phase 6B: Revenue Analytics & Business Intelligence
-- Comprehensive analytics system for financial and user insights

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create policies (admin and super-admin only for most analytics)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_date ON revenue_analytics(date);
CREATE INDEX IF NOT EXISTS idx_revenue_analytics_period ON revenue_analytics(period_type);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_user ON subscription_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_plan ON subscription_metrics(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_method ON payment_analytics(payment_method);
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_date ON user_behavior_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_month ON cohort_analysis(cohort_month);

-- Function to calculate daily revenue analytics
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
    
    -- Calculate active users (users who did something today)
    SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM (
        SELECT user_id FROM quiz_history WHERE DATE(created_at) = target_date
        UNION
        SELECT user_id FROM subscription_usage WHERE usage_date = target_date
        UNION
        SELECT user_id FROM payments WHERE DATE(created_at) = target_date
    ) active_today;
    
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

-- Function to calculate subscription metrics
CREATE OR REPLACE FUNCTION calculate_subscription_metrics(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subscription RECORD;
    v_mrr DECIMAL(10,2);
    v_arr DECIMAL(10,2);
    v_clv DECIMAL(10,2);
    v_total_paid DECIMAL(10,2);
    v_engagement_score DECIMAL(5,2);
BEGIN
    -- Get active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_subscription IS NULL THEN
        RETURN;
    END IF;
    
    -- Calculate MRR and ARR
    IF v_subscription.billing_cycle = 'monthly' THEN
        v_mrr := v_subscription.amount;
        v_arr := v_subscription.amount * 12;
    ELSE
        v_mrr := v_subscription.amount / 12;
        v_arr := v_subscription.amount;
    END IF;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE user_id = p_user_id AND status = 'completed';
    
    -- Calculate simple CLV (total paid so far)
    v_clv := v_total_paid;
    
    -- Calculate engagement score (0-100 based on recent activity)
    SELECT 
        LEAST(100, 
            (COALESCE(quiz_count, 0) * 10) + 
            (COALESCE(course_count, 0) * 20) + 
            (COALESCE(video_count, 0) * 5)
        ) INTO v_engagement_score
    FROM (
        SELECT 
            COUNT(CASE WHEN usage_type = 'quiz_taken' THEN 1 END) as quiz_count,
            COUNT(CASE WHEN usage_type = 'course_enrolled' THEN 1 END) as course_count,
            COUNT(CASE WHEN usage_type = 'video_watched' THEN 1 END) as video_count
        FROM subscription_usage
        WHERE user_id = p_user_id
        AND usage_date >= CURRENT_DATE - INTERVAL '30 days'
    ) usage_stats;
    
    -- Insert or update subscription metrics
    INSERT INTO subscription_metrics (
        user_id, subscription_id, plan_id, billing_cycle,
        subscription_start, monthly_recurring_revenue, annual_recurring_revenue,
        customer_lifetime_value, total_paid, engagement_score
    ) VALUES (
        p_user_id, v_subscription.id, v_subscription.plan_id, v_subscription.billing_cycle,
        v_subscription.start_date::DATE, v_mrr, v_arr, v_clv, v_total_paid, v_engagement_score
    )
    ON CONFLICT (user_id, subscription_id)
    DO UPDATE SET
        monthly_recurring_revenue = EXCLUDED.monthly_recurring_revenue,
        annual_recurring_revenue = EXCLUDED.annual_recurring_revenue,
        customer_lifetime_value = EXCLUDED.customer_lifetime_value,
        total_paid = EXCLUDED.total_paid,
        engagement_score = EXCLUDED.engagement_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue dashboard data
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

-- Add triggers for automatic analytics updates
CREATE OR REPLACE FUNCTION update_analytics_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics when payment status changes
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM calculate_daily_revenue_analytics(DATE(NEW.completed_at));
        PERFORM calculate_subscription_metrics(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analytics_on_payment ON payments;
CREATE TRIGGER trigger_update_analytics_on_payment
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_on_payment();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Revenue Analytics system created successfully!';
    RAISE NOTICE 'Tables: revenue_analytics, subscription_metrics, payment_analytics, user_behavior_analytics, cohort_analysis';
    RAISE NOTICE 'Functions: calculate_daily_revenue_analytics, calculate_subscription_metrics, get_revenue_dashboard';
    RAISE NOTICE 'Automatic analytics triggers enabled.';
END $$;