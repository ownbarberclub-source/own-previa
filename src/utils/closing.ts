import { supabase } from '../supabaseClient';
import { Cycle } from '../types';

export const closeCycle = async (cycle: Cycle) => {
  if (!window.confirm('Tem certeza? Isso fechará o mês de forma definitiva para TODAS as unidades e congelará as métricas!')) return false;

  try {
    // 1. Fetch all data for this cycle
    const [
      { data: records },
      { data: barbers },
      { data: settings },
      { data: manualMinutes }
    ] = await Promise.all([
      supabase.from('previa_records').select('*').eq('cycle_id', cycle.id),
      supabase.from('previa_barbers').select('*'),
      supabase.from('previa_settings').select('*'),
      supabase.from('previa_manual_minutes').select('*').eq('cycle_id', cycle.id)
    ]);

    if (!records || !barbers || !settings) throw new Error('Data fetch failed');

    // 2. Calculate POT Global
    const globalSettings = settings.find(s => s.unit_id === 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa') || settings[0];
    const potGlobal = (cycle.subscription_total || 0) * (globalSettings?.pot_rate || 0.42);

    const totalNetworkMinutes = barbers.reduce((sum, barber) => {
      const manual = manualMinutes?.find(m => m.barber_id === barber.id);
      if (manual) return sum + manual.minutes;
      
      const sheetMinutes = records
        .filter(r => r.barber_name === barber.name && r.unit_id === barber.unit_id && r.category === 'assinatura')
        .reduce((s, r) => s + r.duration_minutes, 0);
      return sum + sheetMinutes;
    }, 0);

    const valuePorMinutoGlobal = totalNetworkMinutes > 0 ? potGlobal / totalNetworkMinutes : 0;

    // 3. Group metrics per barber
    const resultsMap: Record<string, any> = {};

    records.forEach(rec => {
      const key = `${rec.barber_name}-${rec.unit_id}`;
      if (!resultsMap[key]) {
        resultsMap[key] = { 
          sMins: 0, sCnt: 0, aRev: 0, aComm: 0, aCnt: 0,
          eRev: 0, eComm: 0, eCnt: 0, pRev: 0, pComm: 0, pCnt: 0,
          bRev: 0, bComm: 0, bCnt: 0, barberName: rec.barber_name, unitId: rec.unit_id 
        };
      }
      const bd = resultsMap[key];
      if (rec.category === 'assinatura') { bd.sMins += rec.duration_minutes; bd.sCnt++; }
      else if (rec.category === 'avulso') { bd.aRev += rec.value; bd.aComm += (rec.commission || 0); bd.aCnt++; }
      else if (rec.category === 'extra') { bd.eRev += rec.value; bd.eComm += (rec.commission || 0); bd.eCnt++; }
      else if (rec.category === 'produto') { bd.pRev += rec.value; bd.pComm += (rec.commission || 0); bd.pCnt++; }
      else if (rec.category === 'bebida') { bd.bRev += rec.value; bd.bComm += (rec.commission || 0); bd.bCnt++; }
    });

    // 4. Generate final insert objects
    const insertPayload = barbers.map(barber => {
      const key = `${barber.name}-${barber.unit_id}`;
      const data = resultsMap[key] || { 
        sMins: 0, sCnt: 0, aRev: 0, aComm: 0, aCnt: 0,
        eRev: 0, eComm: 0, eCnt: 0, pRev: 0, pComm: 0, pCnt: 0,
        bRev: 0, bComm: 0, bCnt: 0 
      };

      const manual = manualMinutes?.find(m => m.barber_id === barber.id);
      const actualMinutes = manual ? manual.minutes : data.sMins;
      const actualSCnt = manual ? Math.round(actualMinutes / 30) : data.sCnt;
      
      const sComm = actualMinutes * valuePorMinutoGlobal;
      const totalComm = sComm + data.aComm + data.eComm + data.pComm + data.bComm;

      return {
        // Required payload for historical
        cycle_id: cycle.id,
        barber_id: barber.id,
        unit_id: barber.unit_id,
        subscription_minutes: actualMinutes,
        subscription_count: actualSCnt,
        subscription_commission: sComm,
        avulso_revenue: data.aRev,
        avulso_commission: data.aComm,
        avulso_count: data.aCnt,
        extra_revenue: data.eRev,
        extra_commission: data.eComm,
        extra_count: data.eCnt,
        product_revenue: data.pRev,
        product_commission: data.pComm,
        product_count: data.pCnt,
        bebida_revenue: data.bRev,
        bebida_commission: data.bComm,
        bebida_count: data.bCnt,
        total_commission: totalComm
      };
    });

    // Filtra barbeiros que não venderam nem trabalharam para n poluir (opcional, mas bom pra evitar 0s)
    const validPayload = insertPayload.filter(p => p.total_commission > 0 || p.subscription_minutes > 0 || p.avulso_count > 0);

    // 5. Insert into Supabase
    if (validPayload.length > 0) {
      const { error: insErr } = await supabase.from('previa_historical_results').insert(validPayload);
      if (insErr) throw insErr;
    }

    // 6. Update cycle
    const { error: updErr } = await supabase.from('previa_cycles').update({ status: 'closed' }).eq('id', cycle.id);
    if (updErr) throw updErr;

    alert('Mês fechado com sucesso!');
    return true;

  } catch (error: any) {
    console.error(error);
    alert('Erro ao fechar mês: ' + error.message);
    return false;
  }
};

export const reopenCycle = async (cycle: Cycle) => {
  if (!window.confirm('Atenção: Ao reabrir, os rankings dinâmicos voltarão a usar as taxas atuais, substituindo os dados fechados. Tem certeza?')) return false;

  try {
    const { error: delErr } = await supabase.from('previa_historical_results').delete().eq('cycle_id', cycle.id);
    if (delErr) throw delErr;

    const { error: updErr } = await supabase.from('previa_cycles').update({ status: 'open' }).eq('id', cycle.id);
    if (updErr) throw updErr;

    alert('Mês reaberto!');
    return true;
  } catch (error: any) {
    console.error(error);
    alert('Erro ao reabrir mês: ' + error.message);
    return false;
  }
};
