import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('month_year', { ascending: false });
  const activeCycle = cycles[0];
  console.log('Active cycle:', activeCycle.month_year);

  const { data: units } = await supabase.from('previa_units').select('*');
  const avenida = units.find(u => u.name.toLowerCase().includes('avenida'));
  const efapi = units.find(u => u.name.toLowerCase().includes('efapi'));

  console.log("Avenida Unit:", avenida?.id);
  console.log("Efapi Unit:", efapi?.id);

  const { data: records } = await supabase.from('previa_records').select('*').eq('cycle_id', activeCycle.id).in('unit_id', [avenida?.id, efapi?.id].filter(Boolean));
  
  console.log("Total records found for these units:", records.length);
  
  let totalAvulso = 0;
  let totalProduto = 0;
  records.forEach(r => {
    if (r.category === 'avulso') totalAvulso++;
    if (r.category === 'produto') totalProduto++;
  });
  console.log(`Avulso count: ${totalAvulso}, Produto count: ${totalProduto}`);

  // Test the resultsMap logic
  const resultsMap = {};
  records.forEach(rec => {
    const key = `${rec.barber_name}-${rec.unit_id}`;
    if (!resultsMap[key]) {
      resultsMap[key] = { aCnt: 0, pCnt: 0 };
    }
    const bd = resultsMap[key];
    if (rec.category === 'avulso') bd.aCnt++;
    if (rec.category === 'produto') bd.pCnt++;
  });

  const { data: barbers } = await supabase.from('previa_barbers').select('*').eq('is_hidden_crm', false);
  
  Object.keys(resultsMap).forEach(key => {
    const [bName, uId] = key.split('-');
    const bd = resultsMap[key];
    const barber = barbers.find(b => b.name === bName && b.unit_id === uId);
    console.log(`Barber Name from Record: "${bName}", Unit: ${uId}`);
    if (!barber) {
      console.log(`  -> ⚠️ ERROR: Barber NOT FOUND in database with this exact name and unit!`);
    } else {
      console.log(`  -> Found barber: ${barber.name} (id: ${barber.id})`);
    }
  });
}
run();
