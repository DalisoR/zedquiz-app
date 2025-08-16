-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    total_chapters INTEGER DEFAULT 0,
    estimated_hours DECIMAL(4,2),
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
    price DECIMAL(10,2) DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    unlock_score_required INTEGER DEFAULT 70, -- percentage needed to unlock
    estimated_duration INTEGER, -- minutes
    learning_objectives TEXT[],
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    lesson_type VARCHAR(50) DEFAULT 'mixed', -- video, text, interactive, mixed
    content_blocks JSONB DEFAULT '[]'::jsonb, -- flexible content structure
    notes_content TEXT,
    estimated_duration INTEGER, -- minutes
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_id, order_index)
);

-- Create video_content table
CREATE TABLE IF NOT EXISTS video_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- seconds
    file_size BIGINT,
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    transcription TEXT,
    mandatory_watch_percentage INTEGER DEFAULT 80, -- percentage required to mark as watched
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_course_enrollments table
CREATE TABLE IF NOT EXISTS student_course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    current_chapter_id UUID REFERENCES chapters(id),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, free
    UNIQUE(student_id, course_id)
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completion_status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
    time_spent INTEGER DEFAULT 0, -- minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(student_id, lesson_id)
);

-- Create video_progress table
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    video_id UUID REFERENCES video_content(id) ON DELETE CASCADE,
    watch_time INTEGER DEFAULT 0, -- seconds watched
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    last_position INTEGER DEFAULT 0, -- last playback position in seconds
    mandatory_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, video_id)
);

-- Create chapter_quizzes table (separate from the main quizzes system)
-- This allows us to have course-specific quizzes with UUID primary keys
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
-- Note: This references chapter_quizzes(id) which is UUID, not the old quizzes table
CREATE TABLE IF NOT EXISTS chapter_quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_quiz_id UUID REFERENCES chapter_quizzes(id) ON DELETE CASCADE, -- Changed from quiz_id to chapter_quiz_id
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT false, -- true if score >= passing_score
    attempt_number INTEGER DEFAULT 1,
    time_taken INTEGER, -- seconds
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, chapter_quiz_id, attempt_number) -- Updated constraint name
);

-- Add RLS policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Teachers can manage their courses" ON courses
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Published courses are viewable by all" ON courses
    FOR SELECT USING (is_published = true);

-- Chapters policies
CREATE POLICY "Teachers can manage chapters of their courses" ON chapters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = chapters.course_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view published chapters of enrolled courses" ON chapters
    FOR SELECT USING (
        is_published = true AND
        EXISTS (
            SELECT 1 FROM student_course_enrollments 
            WHERE student_course_enrollments.course_id = chapters.course_id 
            AND student_course_enrollments.student_id = auth.uid()
        )
    );

-- Lessons policies
CREATE POLICY "Teachers can manage lessons in their courses" ON lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN courses ON courses.id = chapters.course_id
            WHERE chapters.id = lessons.chapter_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view lessons of enrolled courses" ON lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chapters 
            JOIN student_course_enrollments ON student_course_enrollments.course_id = chapters.course_id
            WHERE chapters.id = lessons.chapter_id 
            AND student_course_enrollments.student_id = auth.uid()
        )
    );

-- Video content policies
CREATE POLICY "Teachers can manage video content in their courses" ON video_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE lessons.id = video_content.lesson_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view video content of enrolled courses" ON video_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN student_course_enrollments ON student_course_enrollments.course_id = chapters.course_id
            WHERE lessons.id = video_content.lesson_id 
            AND student_course_enrollments.student_id = auth.uid()
        )
    );

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

-- Student progress policies
CREATE POLICY "Students can manage their own progress" ON student_progress
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view progress of their course students" ON student_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = student_progress.course_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Video progress policies
CREATE POLICY "Students can manage their own video progress" ON video_progress
    FOR ALL USING (student_id = auth.uid());

-- Enrollment policies
CREATE POLICY "Students can manage their own enrollments" ON student_course_enrollments
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view enrollments in their courses" ON student_course_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = student_course_enrollments.course_id 
            AND courses.teacher_id = auth.uid()
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_subject ON courses(teacher_id, subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_chapters_course_order ON chapters(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_order ON lessons(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_course ON student_progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_student_video ON video_progress(student_id, video_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_quiz_questions_quiz_order ON chapter_quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapter_quiz_attempts_student_quiz ON chapter_quiz_attempts(student_id, chapter_quiz_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_course_chapter_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET total_chapters = (
        SELECT COUNT(*) 
        FROM chapters 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_course_chapter_count_trigger ON chapters;
CREATE TRIGGER update_course_chapter_count_trigger
    AFTER INSERT OR DELETE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_course_chapter_count();

-- Function to check if student can access next chapter
-- Updated to use chapter_quiz_attempts with chapter_quiz_id field
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
    
    -- Check if previous chapter quiz was passed
    -- Updated to use chapter_quiz_id instead of quiz_id
    SELECT MAX(score) INTO v_best_score
    FROM chapter_quiz_attempts
    WHERE student_id = p_student_id 
    AND chapter_id = v_previous_chapter_id;
    
    RETURN COALESCE(v_best_score, 0) >= v_required_score;
END;
$$ LANGUAGE plpgsql;