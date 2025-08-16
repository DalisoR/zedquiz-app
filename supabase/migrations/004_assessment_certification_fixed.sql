-- Phase 4: Assessment & Certification System
-- Adds chapter quizzes, course completion tracking, and certificates

-- Create chapter_quizzes table (course-specific quizzes)
CREATE TABLE IF NOT EXISTS chapter_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INTEGER, -- minutes, null for no limit
    max_attempts INTEGER DEFAULT 3,
    passing_score INTEGER DEFAULT 70, -- percentage
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapter_quiz_questions table
CREATE TABLE IF NOT EXISTS chapter_quiz_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES chapter_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- multiple_choice, true_false, short_answer
    options JSONB, -- for multiple choice questions
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, order_index)
);

-- Create chapter_quiz_attempts table
CREATE TABLE IF NOT EXISTS chapter_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES chapter_quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT false, -- true if score >= passing_score
    attempt_number INTEGER DEFAULT 1,
    time_taken INTEGER, -- seconds
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, quiz_id, attempt_number)
);

-- Create course_certificates table
CREATE TABLE IF NOT EXISTS course_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    final_score DECIMAL(5,2), -- overall course score
    time_spent_hours DECIMAL(8,2), -- total time spent on course
    certificate_url TEXT, -- URL to generated certificate PDF
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

-- Create learning_achievements table for badges and milestones
CREATE TABLE IF NOT EXISTS learning_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- course_completion, perfect_score, fast_learner, etc.
    achievement_data JSONB DEFAULT '{}'::jsonb,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points_awarded INTEGER DEFAULT 0
);

-- Create learning_analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS learning_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL, -- time_spent, quiz_score, video_completion, etc.
    metric_value DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE chapter_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- Chapter quiz policies
CREATE POLICY "Teachers can manage chapter quizzes in their courses" ON chapter_quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN courses ON courses.id = chapters.course_id
            WHERE chapters.id = chapter_quizzes.chapter_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view published chapter quizzes of enrolled courses" ON chapter_quizzes
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN student_course_enrollments ON student_course_enrollments.course_id = chapters.course_id
            WHERE chapters.id = chapter_quizzes.chapter_id 
            AND student_course_enrollments.student_id = auth.uid()
        )
    );

-- Chapter quiz questions policies
CREATE POLICY "Teachers can manage chapter quiz questions in their courses" ON chapter_quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chapter_quizzes 
            JOIN chapters ON chapters.id = chapter_quizzes.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE chapter_quizzes.id = chapter_quiz_questions.quiz_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view chapter quiz questions of enrolled courses" ON chapter_quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chapter_quizzes 
            JOIN chapters ON chapters.id = chapter_quizzes.chapter_id
            JOIN student_course_enrollments ON student_course_enrollments.course_id = chapters.course_id
            WHERE chapter_quizzes.id = chapter_quiz_questions.quiz_id 
            AND student_course_enrollments.student_id = auth.uid()
            AND chapter_quizzes.is_published = true
        )
    );

-- Quiz attempts policies
CREATE POLICY "Students can manage their own quiz attempts" ON chapter_quiz_attempts
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view quiz attempts in their courses" ON chapter_quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN courses ON courses.id = chapters.course_id
            WHERE chapters.id = chapter_quiz_attempts.chapter_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Certificate policies
CREATE POLICY "Students can view their own certificates" ON course_certificates
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view certificates for their courses" ON course_certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_certificates.course_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Achievement policies
CREATE POLICY "Students can view their own achievements" ON learning_achievements
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view achievements in their courses" ON learning_achievements
    FOR SELECT USING (
        course_id IS NULL OR
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = learning_achievements.course_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Analytics policies
CREATE POLICY "Students can view their own analytics" ON learning_analytics
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Teachers can view analytics for their courses" ON learning_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = learning_analytics.course_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics" ON learning_analytics
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_quizzes_chapter ON chapter_quizzes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_quiz_questions_quiz_order ON chapter_quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapter_quiz_attempts_student_quiz ON chapter_quiz_attempts(student_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_course_certificates_student ON course_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_achievements_student ON learning_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_student_course ON learning_analytics(student_id, course_id);

-- Function to check if student can access next chapter (updated)
CREATE OR REPLACE FUNCTION can_access_chapter(
    p_student_id UUID,
    p_chapter_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_chapter_order INTEGER;
    v_course_id UUID;
    v_previous_chapter_id UUID;
    v_required_score INTEGER;
    v_best_score DECIMAL;
    v_has_quiz BOOLEAN;
BEGIN
    -- Get chapter info
    SELECT order_index, course_id, unlock_score_required
    INTO v_chapter_order, v_course_id, v_required_score
    FROM chapters 
    WHERE id = p_chapter_id;
    
    -- First chapter is always accessible
    IF v_chapter_order = 1 THEN
        RETURN TRUE;
    END IF;
    
    -- Get previous chapter
    SELECT id INTO v_previous_chapter_id
    FROM chapters 
    WHERE course_id = v_course_id 
    AND order_index = v_chapter_order - 1;
    
    -- Check if previous chapter has a quiz
    SELECT EXISTS(
        SELECT 1 FROM chapter_quizzes 
        WHERE chapter_id = v_previous_chapter_id 
        AND is_published = true
    ) INTO v_has_quiz;
    
    -- If no quiz, check lesson completion
    IF NOT v_has_quiz THEN
        RETURN EXISTS(
            SELECT 1 FROM student_progress sp
            JOIN lessons l ON l.id = sp.lesson_id
            WHERE sp.student_id = p_student_id
            AND l.chapter_id = v_previous_chapter_id
            AND sp.completion_status = 'completed'
        );
    END IF;
    
    -- Check if previous chapter quiz was passed
    SELECT MAX(score) INTO v_best_score
    FROM chapter_quiz_attempts cqa
    JOIN chapter_quizzes cq ON cq.id = cqa.quiz_id
    WHERE cqa.student_id = p_student_id 
    AND cq.chapter_id = v_previous_chapter_id
    AND cqa.passed = true;
    
    RETURN COALESCE(v_best_score, 0) >= v_required_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate course completion percentage
CREATE OR REPLACE FUNCTION calculate_course_completion(
    p_student_id UUID,
    p_course_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_total_chapters INTEGER;
    v_completed_chapters INTEGER;
    v_completion_percentage DECIMAL;
BEGIN
    -- Get total published chapters
    SELECT COUNT(*) INTO v_total_chapters
    FROM chapters 
    WHERE course_id = p_course_id 
    AND is_published = true;
    
    -- Get completed chapters (either quiz passed or all lessons completed)
    SELECT COUNT(*) INTO v_completed_chapters
    FROM chapters c
    WHERE c.course_id = p_course_id 
    AND c.is_published = true
    AND (
        -- Chapter has quiz and student passed it
        EXISTS(
            SELECT 1 FROM chapter_quizzes cq
            JOIN chapter_quiz_attempts cqa ON cqa.quiz_id = cq.id
            WHERE cq.chapter_id = c.id 
            AND cq.is_published = true
            AND cqa.student_id = p_student_id
            AND cqa.passed = true
        )
        OR
        -- Chapter has no quiz but all lessons are completed
        (
            NOT EXISTS(
                SELECT 1 FROM chapter_quizzes 
                WHERE chapter_id = c.id 
                AND is_published = true
            )
            AND NOT EXISTS(
                SELECT 1 FROM lessons l
                LEFT JOIN student_progress sp ON sp.lesson_id = l.id AND sp.student_id = p_student_id
                WHERE l.chapter_id = c.id
                AND (sp.completion_status IS NULL OR sp.completion_status != 'completed')
            )
        )
    );
    
    -- Calculate percentage
    IF v_total_chapters = 0 THEN
        v_completion_percentage := 0;
    ELSE
        v_completion_percentage := (v_completed_chapters::DECIMAL / v_total_chapters) * 100;
    END IF;
    
    -- Update enrollment record
    UPDATE student_course_enrollments 
    SET completion_percentage = v_completion_percentage,
        last_accessed = NOW()
    WHERE student_id = p_student_id 
    AND course_id = p_course_id;
    
    RETURN v_completion_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate course certificate
CREATE OR REPLACE FUNCTION generate_course_certificate(
    p_student_id UUID,
    p_course_id UUID
) RETURNS UUID AS $$
DECLARE
    v_certificate_id UUID;
    v_certificate_number VARCHAR(50);
    v_completion_percentage DECIMAL;
    v_total_time_hours DECIMAL;
    v_student_name TEXT;
    v_course_title TEXT;
BEGIN
    -- Check if course is 100% complete
    SELECT calculate_course_completion(p_student_id, p_course_id) INTO v_completion_percentage;
    
    IF v_completion_percentage < 100 THEN
        RAISE EXCEPTION 'Course not completed. Completion: %', v_completion_percentage;
    END IF;
    
    -- Check if certificate already exists
    SELECT id INTO v_certificate_id
    FROM course_certificates
    WHERE student_id = p_student_id AND course_id = p_course_id;
    
    IF v_certificate_id IS NOT NULL THEN
        RETURN v_certificate_id;
    END IF;
    
    -- Get student and course info
    SELECT full_name INTO v_student_name
    FROM profiles WHERE id = p_student_id;
    
    SELECT title INTO v_course_title
    FROM courses WHERE id = p_course_id;
    
    -- Calculate total time spent
    SELECT COALESCE(SUM(time_spent), 0) / 60.0 INTO v_total_time_hours
    FROM student_progress
    WHERE student_id = p_student_id AND course_id = p_course_id;
    
    -- Generate certificate number
    v_certificate_number := 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                           LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || '-' ||
                           SUBSTRING(p_student_id::TEXT, 1, 8);
    
    -- Create certificate record
    INSERT INTO course_certificates (
        student_id, course_id, certificate_number, 
        final_score, time_spent_hours
    ) VALUES (
        p_student_id, p_course_id, v_certificate_number,
        v_completion_percentage, v_total_time_hours
    ) RETURNING id INTO v_certificate_id;
    
    -- Award achievement
    INSERT INTO learning_achievements (
        student_id, achievement_type, achievement_data,
        course_id, points_awarded
    ) VALUES (
        p_student_id, 'course_completion',
        jsonb_build_object(
            'course_title', v_course_title,
            'completion_date', NOW(),
            'certificate_number', v_certificate_number
        ),
        p_course_id, 100
    );
    
    -- Update user points
    UPDATE profiles 
    SET points_balance = COALESCE(points_balance, 0) + 100
    WHERE id = p_student_id;
    
    RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record learning analytics (fixed parameter order)
CREATE OR REPLACE FUNCTION record_learning_metric(
    p_student_id UUID,
    p_course_id UUID,
    p_metric_type VARCHAR(50),
    p_metric_value DECIMAL,
    p_chapter_id UUID DEFAULT NULL,
    p_lesson_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO learning_analytics (
        student_id, course_id, chapter_id, lesson_id,
        metric_type, metric_value, metadata
    ) VALUES (
        p_student_id, p_course_id, p_chapter_id, p_lesson_id,
        p_metric_type, p_metric_value, p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update course completion when quiz is passed
CREATE OR REPLACE FUNCTION update_course_completion_on_quiz()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on successful quiz completion
    IF NEW.passed = true AND (OLD.passed IS NULL OR OLD.passed = false) THEN
        -- Update course completion percentage
        PERFORM calculate_course_completion(NEW.student_id, (
            SELECT course_id FROM chapters WHERE id = NEW.chapter_id
        ));
        
        -- Record analytics
        PERFORM record_learning_metric(
            NEW.student_id,
            (SELECT course_id FROM chapters WHERE id = NEW.chapter_id),
            'quiz_passed',
            NEW.score,
            NEW.chapter_id,
            NULL,
            jsonb_build_object(
                'quiz_id', NEW.quiz_id,
                'attempt_number', NEW.attempt_number,
                'time_taken', NEW.time_taken
            )
        );
        
        -- Check if course is now complete and generate certificate
        IF (SELECT calculate_course_completion(NEW.student_id, (
            SELECT course_id FROM chapters WHERE id = NEW.chapter_id
        ))) >= 100 THEN
            PERFORM generate_course_certificate(
                NEW.student_id,
                (SELECT course_id FROM chapters WHERE id = NEW.chapter_id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for course completion updates
DROP TRIGGER IF EXISTS update_course_completion_on_quiz_trigger ON chapter_quiz_attempts;
CREATE TRIGGER update_course_completion_on_quiz_trigger
    AFTER INSERT OR UPDATE ON chapter_quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_course_completion_on_quiz();