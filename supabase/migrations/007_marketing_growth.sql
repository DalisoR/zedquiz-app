-- Phase 6C: Marketing Tools & Growth Features
-- Adds discount codes, referral programs, free trials, and promotional campaigns

-- Create discount_codes table for promotional campaigns
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, free_trial
    discount_value DECIMAL(10,2) NOT NULL, -- percentage (0-100) or fixed amount
    currency VARCHAR(3) DEFAULT 'ZMW',
    
    -- Applicability
    applicable_plans JSONB DEFAULT '["premium", "pro"]'::jsonb, -- which plans this applies to
    minimum_amount DECIMAL(10,2) DEFAULT 0, -- minimum purchase amount
    maximum_discount DECIMAL(10,2), -- max discount for percentage codes
    
    -- Usage limits
    usage_limit INTEGER, -- total usage limit (null = unlimited)
    usage_limit_per_user INTEGER DEFAULT 1, -- per-user usage limit
    current_usage INTEGER DEFAULT 0,
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    campaign_name VARCHAR(100), -- for grouping codes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discount_code_usage table to track usage
CREATE TABLE IF NOT EXISTS discount_code_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    payment_id VARCHAR(100) REFERENCES payments(id),
    
    -- Usage details
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(discount_code_id, user_id, payment_id)
);

-- Create referral_program table
CREATE TABLE IF NOT EXISTS referral_program (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Referral rewards
    referrer_reward_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, free_months, points
    referrer_reward_value DECIMAL(10,2) NOT NULL,
    referee_reward_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, free_months, points
    referee_reward_value DECIMAL(10,2) NOT NULL,
    
    -- Conditions
    minimum_referee_payment DECIMAL(10,2) DEFAULT 0, -- minimum payment by referee to trigger reward
    reward_cap DECIMAL(10,2), -- maximum reward per referrer
    
    -- Validity
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table to track individual referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_program_id UUID REFERENCES referral_program(id) ON DELETE CASCADE,
    
    -- Referral parties
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- person who referred
    referee_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- person who was referred
    
    -- Referral details
    referral_code VARCHAR(50) UNIQUE NOT NULL, -- unique code for this referral
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded, expired
    
    -- Tracking
    referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE, -- when referee made qualifying purchase
    rewarded_at TIMESTAMP WITH TIME ZONE, -- when rewards were given
    
    -- Rewards given
    referrer_reward_amount DECIMAL(10,2) DEFAULT 0,
    referee_reward_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    referral_source VARCHAR(100), -- email, social, direct, etc.
    ip_address INET,
    user_agent TEXT,
    
    UNIQUE(referrer_id, referee_id)
);

-- Create free_trials table
CREATE TABLE IF NOT EXISTS free_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    
    -- Trial configuration
    trial_days INTEGER NOT NULL DEFAULT 7,
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, expired, converted, cancelled
    converted_at TIMESTAMP WITH TIME ZONE, -- when trial converted to paid
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Conversion tracking
    payment_id VARCHAR(100) REFERENCES payments(id), -- payment that converted trial
    conversion_discount_code_id UUID REFERENCES discount_codes(id),
    
    -- Metadata
    trial_source VARCHAR(100), -- landing_page, referral, discount_code, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, plan_id)
);

-- Create promotional_campaigns table
CREATE TABLE IF NOT EXISTS promotional_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) NOT NULL, -- discount, referral, free_trial, seasonal
    
    -- Campaign configuration
    target_audience JSONB DEFAULT '{}'::jsonb, -- targeting criteria
    campaign_goals JSONB DEFAULT '{}'::jsonb, -- conversion goals, revenue targets
    
    -- Associated resources
    discount_codes JSONB DEFAULT '[]'::jsonb, -- array of discount code IDs
    referral_program_id UUID REFERENCES referral_program(id),
    
    -- Campaign period
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Budget and limits
    budget DECIMAL(12,2),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    
    -- Performance tracking
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed, cancelled
    created_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Engagement metrics
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    social_shares INTEGER DEFAULT 0,
    
    -- Conversion funnel
    landing_page_visits INTEGER DEFAULT 0,
    signup_conversions INTEGER DEFAULT 0,
    trial_starts INTEGER DEFAULT 0,
    trial_conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(campaign_id, date)
);

-- Create student_discounts table for educational discounts
CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Verification details
    student_email VARCHAR(255) NOT NULL, -- .edu email or institutional email
    institution_name VARCHAR(200),
    student_id VARCHAR(100),
    verification_document_url TEXT, -- URL to uploaded verification document
    
    -- Discount details
    discount_percentage DECIMAL(5,2) DEFAULT 50.00, -- 50% student discount
    applicable_plans JSONB DEFAULT '["premium", "pro"]'::jsonb,
    
    -- Status and validity
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES profiles(id), -- admin who verified
    expires_at TIMESTAMP WITH TIME ZONE, -- when discount expires
    
    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Enable RLS on all marketing tables
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies for marketing tables

-- Discount codes - admin can manage, users can view active codes
CREATE POLICY "Admin can manage discount codes" ON discount_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Users can view active discount codes" ON discount_codes
    FOR SELECT USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

-- Discount code usage - users can view their own usage, admin can view all
CREATE POLICY "Users can view their own discount usage" ON discount_code_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all discount usage" ON discount_code_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "System can create discount usage" ON discount_code_usage
    FOR INSERT WITH CHECK (true);

-- Referral program - admin can manage, users can view active programs
CREATE POLICY "Admin can manage referral programs" ON referral_program
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Users can view active referral programs" ON referral_program
    FOR SELECT USING (is_active = true);

-- Referrals - users can view their own referrals, admin can view all
CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Users can create referrals" ON referrals
    FOR INSERT WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Admin can manage all referrals" ON referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Free trials - users can view their own trials, admin can view all
CREATE POLICY "Users can view their own free trials" ON free_trials
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage free trials" ON free_trials
    FOR ALL USING (true);

-- Student discounts - users can manage their own, admin can manage all
CREATE POLICY "Users can manage their own student discount" ON student_discounts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all student discounts" ON student_discounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Campaigns - admin only
CREATE POLICY "Admin can manage campaigns" ON promotional_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can view campaign analytics" ON campaign_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user ON discount_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_free_trials_user ON free_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_status ON free_trials(status);
CREATE INDEX IF NOT EXISTS idx_free_trials_end ON free_trials(trial_end);
CREATE INDEX IF NOT EXISTS idx_student_discounts_user ON student_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_discounts_status ON student_discounts(verification_status);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, date);

-- Function to validate and apply discount code
CREATE OR REPLACE FUNCTION apply_discount_code(
    p_code VARCHAR(50),
    p_user_id UUID,
    p_plan_id VARCHAR(50),
    p_original_amount DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
    v_discount RECORD;
    v_usage_count INTEGER;
    v_discount_amount DECIMAL(10,2);
    v_final_amount DECIMAL(10,2);
    v_result JSONB;
BEGIN
    -- Get discount code details
    SELECT * INTO v_discount
    FROM discount_codes
    WHERE code = p_code
    AND is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until >= NOW());
    
    IF v_discount IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired discount code');
    END IF;
    
    -- Check if plan is applicable
    IF NOT (v_discount.applicable_plans @> to_jsonb(p_plan_id)) THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Discount code not applicable to this plan');
    END IF;
    
    -- Check minimum amount
    IF p_original_amount < v_discount.minimum_amount THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Minimum purchase amount not met');
    END IF;
    
    -- Check total usage limit
    IF v_discount.usage_limit IS NOT NULL AND v_discount.current_usage >= v_discount.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Discount code usage limit exceeded');
    END IF;
    
    -- Check per-user usage limit
    SELECT COUNT(*) INTO v_usage_count
    FROM discount_code_usage
    WHERE discount_code_id = v_discount.id AND user_id = p_user_id;
    
    IF v_usage_count >= v_discount.usage_limit_per_user THEN
        RETURN jsonb_build_object('valid', false, 'error', 'You have already used this discount code');
    END IF;
    
    -- Calculate discount amount
    IF v_discount.discount_type = 'percentage' THEN
        v_discount_amount := (p_original_amount * v_discount.discount_value / 100);
        IF v_discount.maximum_discount IS NOT NULL THEN
            v_discount_amount := LEAST(v_discount_amount, v_discount.maximum_discount);
        END IF;
    ELSIF v_discount.discount_type = 'fixed_amount' THEN
        v_discount_amount := LEAST(v_discount.discount_value, p_original_amount);
    ELSE
        v_discount_amount := 0; -- For free_trial type, no immediate discount
    END IF;
    
    v_final_amount := GREATEST(0, p_original_amount - v_discount_amount);
    
    -- Return validation result
    v_result := jsonb_build_object(
        'valid', true,
        'discount_id', v_discount.id,
        'discount_type', v_discount.discount_type,
        'discount_value', v_discount.discount_value,
        'original_amount', p_original_amount,
        'discount_amount', v_discount_amount,
        'final_amount', v_final_amount,
        'savings_percentage', CASE WHEN p_original_amount > 0 THEN (v_discount_amount / p_original_amount * 100) ELSE 0 END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_referrer_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_code VARCHAR(50);
    v_exists BOOLEAN;
    v_counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate code based on user ID and random string
        v_code := 'REF-' || UPPER(SUBSTRING(p_referrer_id::TEXT FROM 1 FOR 8)) || '-' || 
                  UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referrals WHERE referral_code = v_code) INTO v_exists;
        
        -- If unique, return the code
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
        
        -- Prevent infinite loop
        v_counter := v_counter + 1;
        IF v_counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique referral code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral reward
CREATE OR REPLACE FUNCTION process_referral_reward(p_referral_id UUID, p_payment_amount DECIMAL(10,2))
RETURNS BOOLEAN AS $$
DECLARE
    v_referral RECORD;
    v_program RECORD;
    v_referrer_reward DECIMAL(10,2);
    v_referee_reward DECIMAL(10,2);
BEGIN
    -- Get referral details
    SELECT * INTO v_referral
    FROM referrals
    WHERE id = p_referral_id AND status = 'pending';
    
    IF v_referral IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get program details
    SELECT * INTO v_program
    FROM referral_program
    WHERE id = v_referral.referral_program_id AND is_active = true;
    
    IF v_program IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check minimum payment requirement
    IF p_payment_amount < v_program.minimum_referee_payment THEN
        RETURN false;
    END IF;
    
    -- Calculate rewards
    IF v_program.referrer_reward_type = 'percentage' THEN
        v_referrer_reward := p_payment_amount * v_program.referrer_reward_value / 100;
    ELSIF v_program.referrer_reward_type = 'fixed_amount' THEN
        v_referrer_reward := v_program.referrer_reward_value;
    ELSE
        v_referrer_reward := v_program.referrer_reward_value; -- points or free_months
    END IF;
    
    IF v_program.referee_reward_type = 'percentage' THEN
        v_referee_reward := p_payment_amount * v_program.referee_reward_value / 100;
    ELSIF v_program.referee_reward_type = 'fixed_amount' THEN
        v_referee_reward := v_program.referee_reward_value;
    ELSE
        v_referee_reward := v_program.referee_reward_value; -- points or free_months
    END IF;
    
    -- Apply reward cap if set
    IF v_program.reward_cap IS NOT NULL THEN
        v_referrer_reward := LEAST(v_referrer_reward, v_program.reward_cap);
    END IF;
    
    -- Update referral status and rewards
    UPDATE referrals
    SET status = 'completed',
        completed_at = NOW(),
        rewarded_at = NOW(),
        referrer_reward_amount = v_referrer_reward,
        referee_reward_amount = v_referee_reward
    WHERE id = p_referral_id;
    
    -- TODO: Actually give rewards (update user points, create discount codes, etc.)
    -- This would depend on the reward type and your implementation
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start free trial
CREATE OR REPLACE FUNCTION start_free_trial(
    p_user_id UUID,
    p_plan_id VARCHAR(50),
    p_trial_days INTEGER DEFAULT 7,
    p_source VARCHAR(100) DEFAULT 'direct'
)
RETURNS JSONB AS $$
DECLARE
    v_existing_trial RECORD;
    v_trial_id UUID;
    v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if user already has a trial for this plan
    SELECT * INTO v_existing_trial
    FROM free_trials
    WHERE user_id = p_user_id AND plan_id = p_plan_id;
    
    IF v_existing_trial IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User already has a trial for this plan',
            'existing_trial_id', v_existing_trial.id
        );
    END IF;
    
    -- Calculate trial end date
    v_trial_end := NOW() + (p_trial_days || ' days')::INTERVAL;
    
    -- Create free trial record
    INSERT INTO free_trials (
        user_id, plan_id, trial_days, trial_end, trial_source
    ) VALUES (
        p_user_id, p_plan_id, p_trial_days, v_trial_end, p_source
    ) RETURNING id INTO v_trial_id;
    
    -- Update user's subscription tier temporarily
    UPDATE profiles
    SET subscription_tier = p_plan_id,
        subscription_status = 'trial',
        subscription_end_date = v_trial_end
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'trial_id', v_trial_id,
        'trial_end', v_trial_end,
        'trial_days', p_trial_days
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add update triggers
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referral_program_updated_at ON referral_program;
CREATE TRIGGER update_referral_program_updated_at
    BEFORE UPDATE ON referral_program
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_free_trials_updated_at ON free_trials;
CREATE TRIGGER update_free_trials_updated_at
    BEFORE UPDATE ON free_trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotional_campaigns_updated_at ON promotional_campaigns;
CREATE TRIGGER update_promotional_campaigns_updated_at
    BEFORE UPDATE ON promotional_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_discounts_updated_at ON student_discounts;
CREATE TRIGGER update_student_discounts_updated_at
    BEFORE UPDATE ON student_discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== MARKETING & GROWTH SYSTEM CREATED ===';
    RAISE NOTICE 'Tables: discount_codes, referral_program, referrals, free_trials, promotional_campaigns, student_discounts';
    RAISE NOTICE 'Functions: apply_discount_code, generate_referral_code, process_referral_reward, start_free_trial';
    RAISE NOTICE 'Marketing tools ready: discount codes, referral programs, free trials, student discounts!';
END $$;