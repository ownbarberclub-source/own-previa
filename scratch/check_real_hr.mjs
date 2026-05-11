import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('month_year', { ascending: false });
  // Find a closed cycle
  const closedCycle = cycles.find(c => c.status === 'closed');
  if (!closedCycle) {
    console.log("No closed cycles found.");
    return;
  }
  console.log("Checking Closed Cycle:", closedCycle.month_year);

  const { data: hr } = await supabase.from('previa_historical_results').select('*').eq('cycle_id', closedCycle.id);
  
  let totalAvulsoRev = 0;
  let totalProdutoRev = 0;
  hr.forEach(r => {
    totalAvulsoRev += Number(r.avulso_revenue || 0);
    totalProdutoRev += Number(r.product_revenue || 0);
  });

  console.log(`Historical Results in ${closedCycle.month_year}:`);
  console.log(`Avulso Revenue: ${totalAvulsoRev}`);
  console.log(`Produto Revenue: ${totalProdutoRev}`);

  if (totalAvulsoRev === 0 && totalProdutoRev === 0) {
    console.log("They are ZERO! Why?");
    // Let's check records for this cycle
    const { data: records } = await supabase.from('previa_records').select('*').eq('cycle_id', closedCycle.id);
    let recAvulso = 0;
    let recProduto = 0;
    records.forEach(r => {
      if (r.category === 'avulso') recAvulso += Number(r.value || 0);
      if (r.category === 'produto') recProduto += Number(r.value || 0);
    });
    console.log(`But Records say -> Avulso: ${recAvulso}, Produto: ${recProduto}`);
  }
}
run();
