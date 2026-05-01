
import { supabase } from './src/lib/supabase.js';

async function checkTables() {
  console.log("--- Checking Channels ---");
  const { data: channels, error: cErr } = await supabase.from('channels').select('*').limit(1);
  if (cErr) console.error("Channels Error:", cErr.message);
  else console.log("Channels Data:", channels);

  console.log("--- Checking Reviews ---");
  const { data: reviews, error: rErr } = await supabase.from('reviews').select('*').limit(1);
  if (rErr) console.error("Reviews Error:", rErr.message);
  else console.log("Reviews Data:", reviews);
}

checkTables();
