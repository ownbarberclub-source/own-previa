import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('month_year', { ascending: false });
  const closedCycle = cycles.find(c => c.status === 'closed');
  
  const { data: units } = await supabase.from('previa_units').select('*');
  const { data: hr } = await supabase.from('previa_historical_results').select('*').eq('cycle_id', closedCycle.id);
  const { data: records } = await supabase.from('previa_records').select('*').eq('cycle_id', closedCycle.id);

  units.forEach(unit => {
    const hrUnit = hr.filter(h => h.unit_id === unit.id);
    let hrAvulso = 0;
    let hrProduto = 0;
    hrUnit.forEach(r => {
      hrAvulso += Number(r.avulso_revenue || 0);
      hrProduto += Number(r.product_revenue || 0);
    });

    const recUnit = records.filter(r => r.unit_id === unit.id);
    let recAvulso = 0;
    let recProduto = 0;
    recUnit.forEach(r => {
      if (r.category === 'avulso') recAvulso += Number(r.value || 0);
      if (r.category === 'produto') recProduto += Number(r.value || 0);
    });

    console.log(`\nUnit: ${unit.name}`);
    console.log(`HR says -> Avulso: ${hrAvulso}, Produto: ${hrProduto}`);
    console.log(`Records say -> Avulso: ${recAvulso}, Produto: ${recProduto}`);
    
    if (hrAvulso !== recAvulso || hrProduto !== recProduto) {
      console.log(`⚠️ DISCREPANCY IN ${unit.name}!`);
    }
  });
}
run();
