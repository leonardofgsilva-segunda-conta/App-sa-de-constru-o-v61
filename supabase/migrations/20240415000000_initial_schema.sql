-- Initial Schema for KINETIC

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    goal TEXT,
    frequency TEXT,
    status TEXT DEFAULT 'Ativo',
    image_url TEXT,
    trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'anamnese', 'composicao', 'medidas'
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities Table (Agenda)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'PENDENTE', -- 'HOJE', 'PENDENTE', 'CONCLUIDO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policies for Students
CREATE POLICY "Trainers can manage their own students" 
ON students FOR ALL 
TO authenticated 
USING (trainer_id = auth.uid()) 
WITH CHECK (trainer_id = auth.uid());

-- Policies for Assessments
CREATE POLICY "Trainers can manage their own assessments" 
ON assessments FOR ALL 
TO authenticated 
USING (trainer_id = auth.uid()) 
WITH CHECK (trainer_id = auth.uid());

-- Policies for Activities
CREATE POLICY "Trainers can manage their own activities" 
ON activities FOR ALL 
TO authenticated 
USING (trainer_id = auth.uid()) 
WITH CHECK (trainer_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
