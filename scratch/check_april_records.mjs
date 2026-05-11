import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: records } = await supabase.from('previa_records').select('*');
  
  // Find any records that have service_date starting with 2026-04 but cycle_id is NOT the April cycle
  const { data: cycles } = await supabase.from('previa_cycles').select('*');
  const aprilCycle = cycles.find(c => c.month_year === '2026-04');

  const weirdRecords = records.filter(r => r.service_date?.startsWith('2026-04') && r.cycle_id !== aprilCycle.id);
  console.log(`Found ${weirdRecords.length} records that have service_date in April but are NOT in the April cycle.`);
  
  let weirdAvenida = 0;
  let weirdEfapi = 0;
  
  const { data: units } = await supabase.from('previa_units').select('*');
  const avenida = units.find(u => u.name.toLowerCase().includes('avenida'));
  const efapi = units.find(u => u.name.toLowerCase().includes('efapi'));

  weirdRecords.forEach(r => {
    if (r.unit_id === avenida.id) weirdAvenida++;
    if (r.unit_id === efapi.id) weirdEfapi++;
  });
  
  console.log(`Of those: ${weirdAvenida} in Avenida, ${weirdEfapi} in Efapi.`);
  if (weirdRecords.length > 0) {
    console.log("Sample weird record:", weirdRecords[0]);
  }
}
run();
