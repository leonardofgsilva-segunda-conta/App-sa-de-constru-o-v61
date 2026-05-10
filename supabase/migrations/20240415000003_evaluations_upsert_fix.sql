-- Update evaluations table for precise daily UPSERT
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS evaluation_date DATE DEFAULT CURRENT_DATE;

-- Drop old constraint if exists (we previously used student_id, created_at)
-- Finding the constraint name might be tricky, usually it's evaluations_student_id_created_at_key
-- But we can just add the new one.
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_student_id_created_at_key;

-- Add new unique constraint
ALTER TABLE evaluations ADD CONSTRAINT evaluations_student_id_evaluation_date_key UNIQUE (student_id, evaluation_date);
