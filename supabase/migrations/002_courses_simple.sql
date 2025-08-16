-- Simple course system without any quiz integration initially
-- We'll add quizzes later once the basic structure is working

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
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
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
    unlock_score_required INTEGER DEFAULT 70,
    estimated_duration INTEGER,
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
    lesson_type VARCHAR(50) DEFAULT 'mixed',
    content_blocks JSONB DEFAULT '[]'::jsonb,
    notes_content TEXT,
    estimated_duration INTEGER,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_id, order_index)
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
    payment_status VARCHAR(20) DEFAULT 'pending',
    UNIQUE(student_id, course_id)
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completion_status VARCHAR(20) DEFAULT 'not_started',
    time_spent INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Teachers can manage their courses" ON courses
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Published courses are viewable by all" ON courses
    FOR SELECT USING (is_published = true);

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher_subject ON courses(teacher_id, subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_chapters_course_order ON chapters(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_order ON lessons(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_course ON student_progress(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_course_enrollments(student_id);

-- Create function to update chapter count
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

-- Create trigger
DROP TRIGGER IF EXISTS update_course_chapter_count_trigger ON chapters;
CREATE TRIGGER update_course_chapter_count_trigger
    AFTER INSERT OR DELETE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_course_chapter_count();