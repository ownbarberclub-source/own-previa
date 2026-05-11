import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*');
  const aprilCycle = cycles.find(c => c.month_year === '2026-04');
  
  const { data: units } = await supabase.from('previa_units').select('*');
  const avenida = units.find(u => u.name.toLowerCase().includes('avenida'));
  
  const { data: hr } = await supabase.from('previa_historical_results').select('*').eq('cycle_id', aprilCycle.id).eq('unit_id', avenida.id);
  
  console.log(`Historical results for Avenida in April: ${hr.length}`);
  if (hr.length > 0) {
    console.log("Counts:", hr.map(h => ({ name: h.barber_name, aCnt: h.avulso_count, pCnt: h.product_count, eCnt: h.extra_count, subs: h.subscription_count })));
  }
}
run();
