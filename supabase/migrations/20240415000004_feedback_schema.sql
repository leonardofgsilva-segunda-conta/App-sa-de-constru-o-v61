-- Migration to create feedback_treino table for biomechanical risk mapping
CREATE TABLE IF NOT EXISTS feedback_treino (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    pain_level INTEGER CHECK (pain_level >= 1 AND pain_level <= 10),
    pain_location TEXT NOT NULL, -- 'Joelho', 'Lombar', 'Ombro', etc.
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback_treino ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view feedback of their students" 
ON feedback_treino FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM students 
        WHERE students.id = feedback_treino.student_id 
        AND students.trainer_id = auth.uid()
    )
);

CREATE POLICY "Trainers can insert feedback for their students" 
ON feedback_treino FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM students 
        WHERE students.id = feedback_treino.student_id 
        AND students.trainer_id = auth.uid()
    )
);
