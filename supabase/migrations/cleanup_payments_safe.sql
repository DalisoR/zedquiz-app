-- Safe cleanup script for payments and subscriptions
-- This version preserves shared functions and triggers used by other tables

-- WARNING: This will delete payment and subscription data!
-- Only run this in development/testing environments

-- Drop payment-specific policies first
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
DROP POLICY IF EXISTS "System can update payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their own usage" ON subscription_usage;
DROP POLICY IF EXISTS "System can manage usage" ON subscription_usage;
DROP POLICY IF EXISTS "Admin can manage webhooks" ON payment_webhooks;

-- Drop payment-specific triggers (but keep the shared function)
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_course_completion_on_quiz_trigger ON chapter_quiz_attempts;

-- Drop payment-specific functions (but NOT the shared update_updated_at_column function)
DROP FUNCTION IF EXISTS check_user_subscription(UUID);
DROP FUNCTION IF EXISTS record_subscription_usage(UUID, VARCHAR(50), INTEGER, JSONB);
DROP FUNCTION IF EXISTS cancel_subscription(UUID, TEXT);
DROP FUNCTION IF EXISTS expire_subscriptions();
DROP FUNCTION IF EXISTS update_course_completion_on_quiz();

-- NOTE: We're NOT dropping update_updated_at_column() because it's used by other tables

-- Drop tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS payment_webhooks;
DROP TABLE IF EXISTS subscription_usage;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS payments;

-- Drop assessment system tables if needed (uncomment if you want to reset these too)
-- DROP TABLE IF EXISTS chapter_quiz_attempts;
-- DROP TABLE IF EXISTS chapter_quiz_questions;
-- DROP TABLE IF EXISTS chapter_quizzes;
-- DROP TABLE IF EXISTS course_certificates;
-- DROP TABLE IF EXISTS learning_achievements;
-- DROP TABLE IF EXISTS learning_analytics;

-- Remove added columns from profiles (uncomment if needed)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_payment_method;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Safe payment system cleanup completed. Shared functions preserved.';
END $$;