-- Create evaluations table with unique constraint for date-based UPSERT
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    weight FLOAT NOT NULL,
    height FLOAT NOT NULL,
    bmi FLOAT NOT NULL,
    body_fat FLOAT NOT NULL,
    fat_mass FLOAT NOT NULL,
    lean_mass FLOAT NOT NULL,
    perimeters JSONB NOT NULL DEFAULT '{}',
    folds JSONB NOT NULL DEFAULT '{}',
    posture_data JSONB NOT NULL DEFAULT '{}',
    cardio_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, created_at)
);

-- Enable RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Policy for trainers to manage their own evaluations
-- Note: This assumes evaluations are linked to students which are linked to trainers.
-- For simplicity, we'll allow authenticated users for now if they have access to the student.
CREATE POLICY "Trainers can manage evaluations of their students" 
ON evaluations FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM students 
        WHERE students.id = evaluations.student_id 
        AND students.trainer_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM students 
        WHERE students.id = evaluations.student_id 
        AND students.trainer_id = auth.uid()
    )
);
