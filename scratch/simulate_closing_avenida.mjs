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
  
  const resultsMap = {};
  records.forEach(rec => {
    const key = `${rec.barber_name}-${rec.unit_id}`;
    if (!resultsMap[key]) {
      resultsMap[key] = { 
        sMins: 0, sCnt: 0, aRev: 0, aComm: 0, aCnt: 0,
        eRev: 0, eComm: 0, eCnt: 0, pRev: 0, pComm: 0, pCnt: 0,
        bRev: 0, bComm: 0, bCnt: 0 
      };
    }
    const bd = resultsMap[key];
    if (rec.category === 'assinatura') { bd.sMins += rec.duration_minutes; bd.sCnt++; }
    else if (rec.category === 'avulso') { bd.aRev += rec.value; bd.aComm += (rec.commission || 0); bd.aCnt++; }
    else if (rec.category === 'extra') { bd.eRev += rec.value; bd.eComm += (rec.commission || 0); bd.eCnt++; }
    else if (rec.category === 'produto') { bd.pRev += rec.value; bd.pComm += (rec.commission || 0); bd.pCnt++; }
    else if (rec.category === 'bebida') { bd.bRev += rec.value; bd.bComm += (rec.commission || 0); bd.bCnt++; }
  });

  console.log("Calculated resultsMap manually from records:");
  console.log(resultsMap);
}
run();
