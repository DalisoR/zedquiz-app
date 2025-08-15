-- Migration for Parent Performance Reports Feature

-- 1. Create table to link parent and child accounts
CREATE TABLE IF NOT EXISTS parent_child_relationships (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    UNIQUE (parent_id, child_id)
);

-- 2. Create table to store performance reports
CREATE TABLE IF NOT EXISTS performance_reports (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    report_type TEXT NOT NULL, -- 'weekly', 'monthly'
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES profiles(id)
);

-- 3. RLS Policies for parent_child_relationships
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can manage their own relationships" ON parent_child_relationships;
CREATE POLICY "Parents can manage their own relationships" ON parent_child_relationships
    FOR ALL
    USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Children can view their pending relationships" ON parent_child_relationships;
CREATE POLICY "Children can view their pending relationships" ON parent_child_relationships
    FOR SELECT
    USING (auth.uid() = child_id);

-- 4. RLS Policies for performance_reports
ALTER TABLE performance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view reports of their linked children" ON performance_reports;
CREATE POLICY "Parents can view reports of their linked children" ON performance_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM parent_child_relationships
            WHERE parent_child_relationships.child_id = performance_reports.student_id
            AND parent_child_relationships.parent_id = auth.uid()
            AND parent_child_relationships.status = 'approved'
        )
    );

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_parent_id ON parent_child_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_relationships_child_id ON parent_child_relationships(child_id);
CREATE INDEX IF NOT EXISTS idx_performance_reports_student_id ON performance_reports(student_id);
