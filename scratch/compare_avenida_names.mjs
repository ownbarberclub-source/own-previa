import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*');
  const aprilCycle = cycles.find(c => c.month_year === '2026-04');
  
  const { data: units } = await supabase.from('previa_units').select('*');
  const avenida = units.find(u => u.name.toLowerCase().includes('avenida'));
  
  const { data: records } = await supabase.from('previa_records').select('*').eq('cycle_id', aprilCycle.id).eq('unit_id', avenida.id);
  const { data: barbers } = await supabase.from('previa_barbers').select('*').eq('unit_id', avenida.id);
  
  const recordNames = [...new Set(records.map(r => r.barber_name))];
  const barberNames = barbers.map(b => b.name);
  
  console.log("Record Names in Avenida:", recordNames);
  console.log("Barber Names in Avenida DB:", barberNames);

  recordNames.forEach(rn => {
    if (!barberNames.includes(rn)) {
      console.log(`❌ Record Name "${rn}" NOT IN Barbers DB! (Length: ${rn.length})`);
    } else {
      console.log(`✅ "${rn}" exactly matches.`);
    }
  });

  barberNames.forEach(bn => {
    if (!recordNames.includes(bn)) {
      console.log(`⚠️ Barber "${bn}" has NO RECORDS.`);
    }
  });
}
run();
