import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yloahvttwadlsxugobmo.supabase.co';
const supabaseAnonKey = 'sb_publishable_rZ4557v2F_A1-v3evHL39w_f-x0mDEq';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Fetching from messages...');
  const { data, error } = await supabase.from('messages').select('*');
  console.log("Error:", error);
  console.log("Data length:", data?.length);
  if (data?.length) {
    console.log("First item:", data[0]);
  }
}

test();
