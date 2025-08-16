-- Phase 5: Payments and Subscriptions System (Final Version)
-- Adds PesaPal payment processing and subscription management
-- Handles existing shared functions properly

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

-- Enable RLS (only if not already enabled)
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

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
DROP POLICY IF EXISTS "System can update payments" ON payments;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;

DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "System can manage usage" ON subscription_usage;

DROP POLICY IF EXISTS "Admin can manage webhooks" ON payment_webhooks;

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payments" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage subscriptions" ON subscriptions
    FOR ALL USING (true);

-- Usage policies
CREATE POLICY "Users can view their own usage" ON subscription_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage usage" ON subscription_usage
    FOR ALL USING (true);

-- Webhook policies (admin only)
CREATE POLICY "Admin can manage webhooks" ON payment_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super-admin'
        )
    );

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_pesapal_tracking ON payments(pesapal_tracking_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_date ON subscription_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- Function to check subscription status
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

-- Function to record subscription usage
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

-- Function to cancel subscription
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

-- Function to expire subscriptions (run daily)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
    v_subscription RECORD;
BEGIN
    -- Find expired subscriptions
    FOR v_subscription IN
        SELECT id, user_id
        FROM subscriptions
        WHERE status = 'active'
        AND end_date <= NOW()
    LOOP
        -- Update subscription status
        UPDATE subscriptions
        SET status = 'expired',
            updated_at = NOW()
        WHERE id = v_subscription.id;
        
        -- Update profile to free tier
        UPDATE profiles
        SET subscription_tier = 'free',
            subscription_status = 'expired'
        WHERE id = v_subscription.user_id;
        
        v_expired_count := v_expired_count + 1;
    END LOOP;
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or reuse the update_updated_at_column function
-- Only create if it doesn't exist (it might be shared with other tables)
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

-- Add update triggers (drop first if they exist)
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

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_payment_method'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_payment_method VARCHAR(50);
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment and subscription system migration completed successfully!';
    RAISE NOTICE 'Tables created: payments, subscriptions, subscription_usage, payment_webhooks';
    RAISE NOTICE 'Functions created: check_user_subscription, record_subscription_usage, cancel_subscription, expire_subscriptions';
    RAISE NOTICE 'All RLS policies and indexes have been applied.';
END $$;