-- Complete ZedQuiz Database Setup Script
-- Run this in your Supabase SQL Editor to set up all required tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'parent', 'super-admin')),
    grade_level TEXT,
    school_name TEXT,
    province TEXT,
    phone_number TEXT,
    availability_text TEXT,
    hourly_rate TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TUTOR APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.tutor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    cv_url TEXT NOT NULL,
    certificates_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GAMIFICATION TABLES
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    points_required INTEGER NOT NULL,
    UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source VARCHAR(100) NOT NULL,
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUIZ SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    publish_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('Multiple-Choice', 'True/False', 'Short-Answer')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKING SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_datetime TIMESTAMPTZ NOT NULL,
    student_message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PARENT-CHILD RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.parent_child_relationships (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    UNIQUE (parent_id, child_id)
);

CREATE TABLE IF NOT EXISTS public.performance_reports (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly'))
);

-- 7. MONETIZATION TABLES
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RATING SYSTEM
CREATE TABLE IF NOT EXISTS public.content_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('quiz', 'lesson', 'teacher')),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TUTOR CONTRIBUTION TRACKING
CREATE TABLE IF NOT EXISTS public.tutor_contribution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contribution_type TEXT NOT NULL,
    description TEXT,
    points_awarded INTEGER DEFAULT 0,
    related_content_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_user_id ON tutor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_status ON tutor_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_grade_subject ON quizzes(grade_level, subject);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_child_id ON parent_child_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_performance_reports_student_id ON performance_reports(student_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_contribution_log ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User Points
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
CREATE POLICY "Users can view their own points" ON user_points FOR SELECT USING (auth.uid() = user_id);

-- User Badges
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- Point Transactions
DROP POLICY IF EXISTS "Users can view their own point transactions" ON point_transactions;
CREATE POLICY "Users can view their own point transactions" ON point_transactions FOR SELECT USING (auth.uid() = user_id);

-- Quizzes (public read, teachers can create)
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
CREATE POLICY "Anyone can view published quizzes" ON quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can create quizzes" ON quizzes;
CREATE POLICY "Teachers can create quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Questions (public read, quiz authors can create)
DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);

-- Quiz Attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
CREATE POLICY "Users can view their own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own attempts" ON quiz_attempts;
CREATE POLICY "Users can create their own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Parent-Child Relationships
DROP POLICY IF EXISTS "Parents can manage their own relationships" ON parent_child_relationships;
CREATE POLICY "Parents can manage their own relationships" ON parent_child_relationships FOR ALL USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Children can view their pending relationships" ON parent_child_relationships;
CREATE POLICY "Children can view their pending relationships" ON parent_child_relationships FOR SELECT USING (auth.uid() = child_id);

-- Performance Reports
DROP POLICY IF EXISTS "Parents can view reports of their linked children" ON performance_reports;
CREATE POLICY "Parents can view reports of their linked children" ON performance_reports FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM parent_child_relationships
        WHERE parent_child_relationships.child_id = performance_reports.student_id
        AND parent_child_relationships.parent_id = auth.uid()
        AND parent_child_relationships.status = 'approved'
    )
);

-- CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('tutor-applications', 'tutor-applications', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('question_images', 'question_images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile_pictures', 'profile_pictures', true) ON CONFLICT DO NOTHING;

-- STORAGE POLICIES
DROP POLICY IF EXISTS "Users can upload to tutor-applications" ON storage.objects;
CREATE POLICY "Users can upload to tutor-applications" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tutor-applications');

DROP POLICY IF EXISTS "Users can view tutor-applications" ON storage.objects;
CREATE POLICY "Users can view tutor-applications" ON storage.objects FOR SELECT USING (bucket_id = 'tutor-applications');

DROP POLICY IF EXISTS "Anyone can view question images" ON storage.objects;
CREATE POLICY "Anyone can view question images" ON storage.objects FOR SELECT USING (bucket_id = 'question_images');

DROP POLICY IF EXISTS "Teachers can upload question images" ON storage.objects;
CREATE POLICY "Teachers can upload question images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'question_images');

-- INSERT SAMPLE DATA
-- Sample subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Basic', 'Perfect for individual students', 9.99, 99.99, '["Unlimited quizzes", "Progress tracking", "Basic analytics"]'),
('Premium', 'Great for serious learners', 19.99, 199.99, '["All Basic features", "Advanced analytics", "Priority support", "Custom quiz creation"]'),
('Pro', 'For educators and institutions', 39.99, 399.99, '["All Premium features", "Unlimited custom quizzes", "Dedicated account manager", "API access"]')
ON CONFLICT DO NOTHING;

-- Sample badges
INSERT INTO badges (name, description, points_required) VALUES
('First Steps', 'Complete your first quiz', 10),
('Quiz Master', 'Complete 10 quizzes', 100),
('Perfect Score', 'Get 100% on a quiz', 50),
('Streak Champion', 'Complete quizzes for 7 days in a row', 200),
('Knowledge Seeker', 'Earn 500 points', 500),
('Academic Star', 'Earn 1000 points', 1000)
ON CONFLICT DO NOTHING;

-- FUNCTIONS FOR LEADERBOARD
CREATE OR REPLACE FUNCTION get_leaderboard(
    grade_filter TEXT DEFAULT NULL,
    province_filter TEXT DEFAULT NULL,
    from_date TIMESTAMPTZ DEFAULT '2023-01-01',
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    school_name TEXT,
    points INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.school_name,
        COALESCE(up.points, 0) as points
    FROM profiles p
    LEFT JOIN user_points up ON p.id = up.user_id
    WHERE 
        (grade_filter IS NULL OR p.grade_level = grade_filter)
        AND (province_filter IS NULL OR p.province = province_filter)
        AND p.role = 'student'
    ORDER BY COALESCE(up.points, 0) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- FUNCTIONS FOR BOOKING MANAGEMENT
CREATE OR REPLACE FUNCTION confirm_booking(booking_id_to_update UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE bookings 
    SET status = 'confirmed', updated_at = NOW()
    WHERE id = booking_id_to_update;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reject_booking(booking_id_to_update UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE bookings 
    SET status = 'rejected', updated_at = NOW()
    WHERE id = booking_id_to_update;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'ZedQuiz database setup completed successfully!' as message;