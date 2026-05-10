-- Contacts Table for Leads and Inquiries
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'Novo', -- 'Novo', 'Em Atendimento', 'Convertido', 'Arquivado'
    trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a contact (public lead form)
CREATE POLICY "Anyone can create a contact" 
ON contacts FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- For now, allow anyone to read/manage contacts so the user can test without Auth
CREATE POLICY "Public access for testing" 
ON contacts FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
