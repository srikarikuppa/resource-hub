import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yloahvttwadlsxugobmo.supabase.co';
const supabaseAnonKey = 'sb_publishable_rZ4557v2F_A1-v3evHL39w_f-x0mDEq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
