import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvjbtlsxibcpahpizksd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('month_year', { ascending: false });
  const activeCycle = cycles[0];
  console.log('Active cycle:', activeCycle.month_year);

  const { data: records } = await supabase.from('previa_records').select('*');
  const { data: barbers } = await supabase.from('previa_barbers').select('*').eq('is_hidden_crm', false);
  const { data: manualMinutes } = await supabase.from('previa_manual_minutes').select('*');

  // APP.TSX LOGIC
  const appBarbers = barbers.map(barber => {
    const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
    const barberRecords = records.filter(r => r.barber_name === barber.name && r.unit_id === barber.unit_id && (r.service_date?.startsWith(activeCycle.month_year) || r.cycle_id === activeCycle.id));
    
    let subMins = 0;
    let avulsoCount = 0;
    let avulsoRev = 0;
    barberRecords.forEach(rec => {
      if (rec.category === 'assinatura') { subMins += rec.duration_minutes; }
      if (rec.category === 'avulso') { avulsoCount++; avulsoRev += rec.value; }
    });

    const actualMinutes = manual ? manual.minutes : subMins;
    return { name: barber.name, appMins: actualMinutes, appAvulso: avulsoCount, appRev: avulsoRev };
  });

  // CLOSING.TS LOGIC
  const cycleRecords = records.filter(r => r.cycle_id === activeCycle.id);
  const resultsMap = {};
  cycleRecords.forEach(rec => {
    const key = `${rec.barber_name}-${rec.unit_id}`;
    if (!resultsMap[key]) {
      resultsMap[key] = { sMins: 0, aCnt: 0, aRev: 0 };
    }
    if (rec.category === 'assinatura') { resultsMap[key].sMins += rec.duration_minutes; }
    if (rec.category === 'avulso') { resultsMap[key].aCnt++; resultsMap[key].aRev += rec.value; }
  });

  const closingBarbers = barbers.map(barber => {
    const key = `${barber.name}-${barber.unit_id}`;
    const data = resultsMap[key] || { sMins: 0, aCnt: 0, aRev: 0 };
    const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
    const actualMinutes = manual ? manual.minutes : data.sMins;
    return { name: barber.name, closingMins: actualMinutes, closingAvulso: data.aCnt, closingRev: data.aRev };
  });

  let hasDiff = false;
  appBarbers.forEach(a => {
    const c = closingBarbers.find(b => b.name === a.name);
    if (a.appMins !== c.closingMins || a.appAvulso !== c.closingAvulso || a.appRev !== c.closingRev) {
      console.log(`Diff for ${a.name}: \n  App(Mins:${a.appMins}, Avulso:${a.appAvulso}, Rev:${a.appRev}) \n  Closing(Mins:${c.closingMins}, Avulso:${c.closingAvulso}, Rev:${c.closingRev})`);
      hasDiff = true;
    }
  });

  if (!hasDiff) console.log("No differences found!");
}

run();
