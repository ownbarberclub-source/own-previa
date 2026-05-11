import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('month_year', { ascending: false });
  const activeCycle = cycles[0]; // May
  
  const { data: records } = await supabase.from('previa_records').select('*');
  
  const weirdRecords = records.filter(r => r.cycle_id !== activeCycle.id && r.service_date?.startsWith(activeCycle.month_year));
  
  console.log(`Found ${weirdRecords.length} records that have service_date in ${activeCycle.month_year} but belong to a DIFFERENT cycle.`);
  if (weirdRecords.length > 0) {
    console.log("Example:", weirdRecords[0]);
  }

  const weirdRecords2 = records.filter(r => r.cycle_id === activeCycle.id && !r.service_date?.startsWith(activeCycle.month_year));
  console.log(`Found ${weirdRecords2.length} records that belong to ${activeCycle.month_year} cycle but have a DIFFERENT service_date.`);
  if (weirdRecords2.length > 0) {
    console.log("Example:", weirdRecords2[0]);
  }
}
run();
