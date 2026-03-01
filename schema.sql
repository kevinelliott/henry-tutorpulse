-- TutorPulse Database Schema

CREATE TABLE IF NOT EXISTS tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  business_name TEXT DEFAULT '',
  hourly_default NUMERIC(10,2) DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_name TEXT DEFAULT '',
  parent_email TEXT DEFAULT '',
  grade_level TEXT DEFAULT '',
  subjects JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','graduated','dropped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_rate NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min INTEGER DEFAULT 60,
  prep_time_min INTEGER DEFAULT 0,
  travel_time_min INTEGER DEFAULT 0,
  rate NUMERIC(10,2) DEFAULT 0,
  materials_cost NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled','completed','no_show','cancelled')),
  skill_scores JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutors_select_own" ON tutors FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "tutors_insert_own" ON tutors FOR INSERT WITH CHECK (auth_id = auth.uid());
CREATE POLICY "tutors_update_own" ON tutors FOR UPDATE USING (auth_id = auth.uid());

CREATE OR REPLACE FUNCTION current_tutor_id() RETURNS UUID AS $$
  SELECT id FROM tutors WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "students_select_own" ON students FOR SELECT USING (tutor_id = current_tutor_id());
CREATE POLICY "students_insert_own" ON students FOR INSERT WITH CHECK (tutor_id = current_tutor_id());
CREATE POLICY "students_update_own" ON students FOR UPDATE USING (tutor_id = current_tutor_id());
CREATE POLICY "students_delete_own" ON students FOR DELETE USING (tutor_id = current_tutor_id());

CREATE POLICY "subjects_select_own" ON subjects FOR SELECT USING (tutor_id = current_tutor_id());
CREATE POLICY "subjects_insert_own" ON subjects FOR INSERT WITH CHECK (tutor_id = current_tutor_id());
CREATE POLICY "subjects_update_own" ON subjects FOR UPDATE USING (tutor_id = current_tutor_id());
CREATE POLICY "subjects_delete_own" ON subjects FOR DELETE USING (tutor_id = current_tutor_id());

CREATE POLICY "sessions_select_own" ON sessions FOR SELECT USING (tutor_id = current_tutor_id());
CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT WITH CHECK (tutor_id = current_tutor_id());
CREATE POLICY "sessions_update_own" ON sessions FOR UPDATE USING (tutor_id = current_tutor_id());
CREATE POLICY "sessions_delete_own" ON sessions FOR DELETE USING (tutor_id = current_tutor_id());
