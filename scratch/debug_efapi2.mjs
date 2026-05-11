import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: records } = await supabase.from('previa_records').select('*');
  const { data: barbers } = await supabase.from('previa_barbers').select('*').eq('is_hidden_crm', false);
  
  const resultsMap = {};
  records.forEach(rec => {
    const key = `${rec.barber_name}-${rec.unit_id}`;
    if (!resultsMap[key]) {
      resultsMap[key] = { name: rec.barber_name, unit: rec.unit_id };
    }
  });

  let errorCount = 0;
  Object.keys(resultsMap).forEach(key => {
    const bd = resultsMap[key];
    const barber = barbers.find(b => b.name === bd.name && b.unit_id === bd.unit);
    if (!barber) {
      errorCount++;
      console.log(`[!] Record found for Barber: "${bd.name}", but NO ACTIVE BARBER found in database with this exact name & unit.`);
    }
  });

  if (errorCount === 0) console.log("All record names perfectly match active barbers.");
}
run();
