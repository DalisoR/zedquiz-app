-- Create tutor_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tutor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    qualifications TEXT NOT NULL,
    cv_url TEXT NOT NULL,
    certificates_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'tutor_applications'::regclass AND attname = 'status') THEN
        ALTER TABLE tutor_applications ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tutor_applications_user_id ON tutor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_status ON tutor_applications(status);

-- Enable RLS if not enabled
ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;

-- Storage policies for tutor-applications bucket
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'tutor-applications') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('tutor-applications', 'tutor-applications', false);
    END IF;
    
    -- Set upload policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload to tutor-applications') THEN
        CREATE POLICY "Users can upload to tutor-applications"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'tutor-applications');
    END IF;
    
    -- Set read policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view tutor-applications') THEN
        CREATE POLICY "Users can view tutor-applications"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'tutor-applications');
    END IF;
END $$;
