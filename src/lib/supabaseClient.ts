import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzeolawytxzexobnbsgu.supabase.co';
const supabaseAnonKey = 'sb_publishable_FJDtGKEfgqT958C_voAkbg_hw3DBoI1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
