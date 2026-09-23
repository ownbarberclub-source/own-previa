const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tvjbtlsxibcpahpizksd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2amJ0bHN4aWJjcGFocGl6a3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ1NTgsImV4cCI6MjA5MjM0MDU1OH0.8QaQgTRnxknyjj9uoTOZdc46Tr1Rv0eXwSyShZnh90M'
);

async function run() {
  console.log('Buscando ciclo ativo...');
  const { data: cycles } = await supabase.from('previa_cycles').select('*').order('created_at', { ascending: false }).limit(1);
  const activeCycle = cycles[0];
  console.log(`Ciclo ativo: ${activeCycle.month_year} (${activeCycle.id})`);

  let allRecords = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('previa_records')
      .select('*')
      .eq('cycle_id', activeCycle.id)
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRecords = allRecords.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Total de lançamentos no ciclo: ${allRecords.length}`);

  // Mapear menor valor unitário por item
  const minPrices = {};
  allRecords.forEach(r => {
    const norm = (r.item_name || '').trim().toLowerCase();
    if (r.value > 0) {
      if (!minPrices[norm] || r.value < minPrices[norm]) minPrices[norm] = r.value;
    }
  });

  const recordsToDelete = [];
  const recordsToInsert = [];

  allRecords.forEach(r => {
    if (r.category !== 'bebida' && r.category !== 'produto') return;
    const norm = (r.item_name || '').trim().toLowerCase();
    const unitPrice = minPrices[norm] || 0;

    if (unitPrice > 0 && r.value > unitPrice) {
      const ratio = r.value / unitPrice;
      const rounded = Math.round(ratio);
      if (Math.abs(ratio - rounded) < 0.05 && rounded > 1) {
        recordsToDelete.push(r.id);
        const unitVal = Number((r.value / rounded).toFixed(2));
        const unitComm = Number(((r.commission || 0) / rounded).toFixed(2));
        for (let q = 0; q < rounded; q++) {
          const thisVal = (q === rounded - 1) ? Number((r.value - unitVal * (rounded - 1)).toFixed(2)) : unitVal;
          const thisComm = (q === rounded - 1) ? Number(((r.commission || 0) - unitComm * (rounded - 1)).toFixed(2)) : unitComm;
          recordsToInsert.push({
            cycle_id: r.cycle_id,
            unit_id: r.unit_id,
            barber_name: r.barber_name,
            item_name: r.item_name,
            category: r.category,
            value: thisVal,
            commission: thisComm,
            duration_minutes: r.duration_minutes || 0,
            service_date: r.service_date
          });
        }
      }
    }
  });

  console.log(`Encontrados ${recordsToDelete.length} lançamentos múltiplos.`);
  if (recordsToDelete.length > 0) {
    console.log(`Desmembrando em ${recordsToInsert.length} lançamentos unitários...`);
    
    // Deleta os registros antigos agrupados
    for (let i = 0; i < recordsToDelete.length; i += 100) {
      const chunk = recordsToDelete.slice(i, i + 100);
      const { error: delErr } = await supabase.from('previa_records').delete().in('id', chunk);
      if (delErr) throw delErr;
    }

    // Insere os novos registros desmembrados
    for (let i = 0; i < recordsToInsert.length; i += 100) {
      const chunk = recordsToInsert.slice(i, i + 100);
      const { error: insErr } = await supabase.from('previa_records').insert(chunk);
      if (insErr) throw insErr;
    }

    console.log('✅ Concluído com sucesso! Todos os registros múltiplos foram ajustados.');
  } else {
    console.log('Nenhum registro precisou de ajuste.');
  }
}

run().catch(console.error);
