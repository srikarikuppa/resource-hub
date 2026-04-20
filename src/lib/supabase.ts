import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = 'sb_publishable_rZ4557v2F_A1-v3evHL39w_f-x0mDEq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
