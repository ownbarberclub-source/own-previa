import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*');
  const aprilCycle = cycles.find(c => c.month_year === '2026-04');
  
  const { data: manual } = await supabase.from('previa_manual_minutes').select('*').eq('cycle_id', aprilCycle.id);
  console.log(`Found ${manual.length} manual minutes records.`);
  console.log(manual);
}
run();
