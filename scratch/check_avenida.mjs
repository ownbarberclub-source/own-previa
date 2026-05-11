import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: units } = await supabase.from('previa_units').select('*');
  const avenida = units.find(u => u.name.toLowerCase().includes('avenida'));
  
  const { data: cycles } = await supabase.from('previa_cycles').select('*');
  const aprilCycle = cycles.find(c => c.month_year === '2026-04');
  
  const { data: records } = await supabase.from('previa_records').select('*').eq('unit_id', avenida.id).eq('cycle_id', aprilCycle.id);
  
  console.log(`Total records in Avenida for April cycle: ${records.length}`);
  if (records.length > 0) {
    console.log("Categories present:", [...new Set(records.map(r => r.category))]);
    console.log("Sample:", records[0]);
  } else {
    // Check if there are any records for Avenida at all
    const { data: allRecords } = await supabase.from('previa_records').select('*').eq('unit_id', avenida.id);
    console.log(`Total records in Avenida for ALL cycles: ${allRecords.length}`);
    if (allRecords.length > 0) {
      console.log("Cycle IDs present:", [...new Set(allRecords.map(r => r.cycle_id))]);
    }
  }
}
run();
