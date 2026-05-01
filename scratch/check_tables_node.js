
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log("--- Checking Channels ---");
  const { data: channels, error: cErr } = await supabase.from('channels').select('*').limit(1);
  if (cErr) console.error("Channels Error:", cErr.message);
  else console.log("Channels Data length:", channels.length);

  console.log("--- Checking Reviews ---");
  const { data: reviews, error: rErr } = await supabase.from('reviews').select('*').limit(1);
  if (rErr) console.error("Reviews Error:", rErr.message);
  else console.log("Reviews Data length:", reviews.length);
}

checkTables();
