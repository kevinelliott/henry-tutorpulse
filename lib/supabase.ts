import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, anonKey);

export type Tutor = {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  business_name: string;
  hourly_default: number;
  created_at: string;
};

export type Student = {
  id: string;
  tutor_id: string;
  name: string;
  parent_name: string;
  parent_email: string;
  grade_level: string;
  subjects: string[];
  notes: string;
  status: 'active' | 'paused' | 'graduated' | 'dropped';
  created_at: string;
};

export type Session = {
  id: string;
  tutor_id: string;
  student_id: string;
  subject: string;
  date: string;
  duration_min: number;
  prep_time_min: number;
  travel_time_min: number;
  rate: number;
  materials_cost: number;
  status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  skill_scores: Record<string, number>;
  notes: string;
  created_at: string;
};

export type Subject = {
  id: string;
  tutor_id: string;
  name: string;
  default_rate: number;
  created_at: string;
};
