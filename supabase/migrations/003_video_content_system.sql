-- Phase 2: Video Content and Rich Content System
-- Extends the basic course system with video lessons and content management

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

-- Create lesson_attachments table for downloadable resources
CREATE TABLE IF NOT EXISTS lesson_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, doc, image, etc.
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_notes table for personal notes
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    video_id UUID REFERENCES video_content(id) ON DELETE SET NULL,
    note_content TEXT NOT NULL,
    timestamp_seconds INTEGER, -- for video-linked notes
    is_highlight BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_interactions table for tracking engagement
CREATE TABLE IF NOT EXISTS lesson_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- view, download, note, bookmark, etc.
    interaction_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_interactions ENABLE ROW LEVEL SECURITY;

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

-- Video progress policies
CREATE POLICY "Students can manage their own video progress" ON video_progress
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view video progress of their course students" ON video_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM video_content
            JOIN lessons ON lessons.id = video_content.lesson_id
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE video_content.id = video_progress.video_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Lesson attachments policies
CREATE POLICY "Teachers can manage attachments in their courses" ON lesson_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE lessons.id = lesson_attachments.lesson_id 
            AND courses.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view attachments of enrolled courses" ON lesson_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN student_course_enrollments ON student_course_enrollments.course_id = chapters.course_id
            WHERE lessons.id = lesson_attachments.lesson_id 
            AND student_course_enrollments.student_id = auth.uid()
        )
    );

-- Student notes policies
CREATE POLICY "Students can manage their own notes" ON student_notes
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view notes in their courses" ON student_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE lessons.id = student_notes.lesson_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Lesson interactions policies
CREATE POLICY "Students can manage their own interactions" ON lesson_interactions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view interactions in their courses" ON lesson_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lessons 
            JOIN chapters ON chapters.id = lessons.chapter_id
            JOIN courses ON courses.id = chapters.course_id
            WHERE lessons.id = lesson_interactions.lesson_id 
            AND courses.teacher_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_content_lesson ON video_content(lesson_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_student_video ON video_progress(student_id, video_id);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_lesson ON student_notes(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_interactions_student_lesson ON lesson_interactions(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_interactions_type ON lesson_interactions(interaction_type);

-- Function to update video progress and check completion
CREATE OR REPLACE FUNCTION update_video_progress(
    p_student_id UUID,
    p_video_id UUID,
    p_current_position INTEGER,
    p_watch_time INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_duration INTEGER;
    v_mandatory_percentage INTEGER;
    v_completion_percentage DECIMAL;
    v_mandatory_completed BOOLEAN := false;
    v_result JSONB;
BEGIN
    -- Get video duration and mandatory percentage
    SELECT duration, mandatory_watch_percentage
    INTO v_duration, v_mandatory_percentage
    FROM video_content
    WHERE id = p_video_id;
    
    -- Calculate completion percentage
    IF v_duration > 0 THEN
        v_completion_percentage := (p_watch_time::DECIMAL / v_duration) * 100;
        v_mandatory_completed := v_completion_percentage >= v_mandatory_percentage;
    END IF;
    
    -- Update or insert video progress
    INSERT INTO video_progress (
        student_id, video_id, watch_time, completion_percentage, 
        last_position, mandatory_completed
    ) VALUES (
        p_student_id, p_video_id, p_watch_time, v_completion_percentage,
        p_current_position, v_mandatory_completed
    )
    ON CONFLICT (student_id, video_id) 
    DO UPDATE SET
        watch_time = GREATEST(video_progress.watch_time, p_watch_time),
        completion_percentage = GREATEST(video_progress.completion_percentage, v_completion_percentage),
        last_position = p_current_position,
        mandatory_completed = v_mandatory_completed OR video_progress.mandatory_completed,
        updated_at = NOW();
    
    -- Return progress info
    SELECT jsonb_build_object(
        'completion_percentage', v_completion_percentage,
        'mandatory_completed', v_mandatory_completed,
        'watch_time', p_watch_time,
        'duration', v_duration
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if all mandatory content in a lesson is completed
CREATE OR REPLACE FUNCTION check_lesson_completion(
    p_student_id UUID,
    p_lesson_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_total_mandatory_videos INTEGER;
    v_completed_mandatory_videos INTEGER;
BEGIN
    -- Count total mandatory videos in lesson
    SELECT COUNT(*)
    INTO v_total_mandatory_videos
    FROM video_content
    WHERE lesson_id = p_lesson_id;
    
    -- Count completed mandatory videos
    SELECT COUNT(*)
    INTO v_completed_mandatory_videos
    FROM video_content vc
    JOIN video_progress vp ON vp.video_id = vc.id
    WHERE vc.lesson_id = p_lesson_id
    AND vp.student_id = p_student_id
    AND vp.mandatory_completed = true;
    
    -- Return true if all mandatory videos are completed
    RETURN v_total_mandatory_videos = 0 OR v_completed_mandatory_videos >= v_total_mandatory_videos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lesson progress based on video completion
CREATE OR REPLACE FUNCTION update_lesson_progress_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lesson progress when video progress changes
    IF NEW.mandatory_completed = true AND (OLD.mandatory_completed IS NULL OR OLD.mandatory_completed = false) THEN
        -- Check if lesson is now complete
        IF check_lesson_completion(NEW.student_id, (
            SELECT lesson_id FROM video_content WHERE id = NEW.video_id
        )) THEN
            -- Update student progress for this lesson
            INSERT INTO student_progress (
                student_id, 
                course_id, 
                chapter_id, 
                lesson_id, 
                completion_status,
                last_accessed
            )
            SELECT 
                NEW.student_id,
                c.id,
                ch.id,
                l.id,
                'completed',
                NOW()
            FROM video_content vc
            JOIN lessons l ON l.id = vc.lesson_id
            JOIN chapters ch ON ch.id = l.chapter_id
            JOIN courses c ON c.id = ch.course_id
            WHERE vc.id = NEW.video_id
            ON CONFLICT (student_id, lesson_id)
            DO UPDATE SET
                completion_status = 'completed',
                last_accessed = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lesson progress updates
DROP TRIGGER IF EXISTS update_lesson_progress_on_video_completion ON video_progress;
CREATE TRIGGER update_lesson_progress_on_video_completion
    AFTER UPDATE ON video_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_progress_trigger();