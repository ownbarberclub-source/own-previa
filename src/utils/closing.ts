import { supabase } from '../supabaseClient';
import { Cycle } from '../types';

export const closeCycle = async (cycle: Cycle) => {
  if (!window.confirm('Tem certeza? Isso fechará o mês de forma definitiva para TODAS as unidades e congelará as métricas!')) return false;

  try {
    // 1. Fetch all data for this cycle
    let allRecords: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('previa_records')
        .select('*')
        .eq('cycle_id', cycle.id)
        .range(from, from + 999);
      if (error) throw error;
      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        from += 1000;
        if (data.length < 1000) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    const [
      { data: barbers },
      { data: settings },
      { data: manualMinutes }
    ] = await Promise.all([
      supabase.from('previa_barbers').select('*').eq('is_hidden_crm', false),
      supabase.from('previa_settings').select('*'),
      supabase.from('previa_manual_minutes').select('*').eq('cycle_id', cycle.id)
    ]);

    const records = allRecords;

    if (!records || !barbers || !settings) throw new Error('Data fetch failed');

    // Deduplica barbeiros por (unidade + nome normalizado)
    const uniqueBarbers: typeof barbers = [];
    const seenKeys = new Set<string>();
    
    // Ordena barbeiros ativos primeiro
    const sortedBarbers = [...barbers].sort((a, b) => {
      if (a.is_active !== false && b.is_active === false) return -1;
      if (a.is_active === false && b.is_active !== false) return 1;
      return 0;
    });

    sortedBarbers.forEach(b => {
      const key = `${b.unit_id}_${b.name.trim().toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueBarbers.push(b);
      }
    });

    // 2. Calculate POT Global
    const globalSettings = settings.find(s => s.unit_id === 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa') || settings[0];
    const potGlobal = (cycle.subscription_total || 0) * (globalSettings?.pot_rate || 0.42);

    const findManual = (b: any) => {
      return manualMinutes?.find(m => 
        m.barber_id === b.id || barbers.some(ab => ab.id === m.barber_id && ab.unit_id === b.unit_id && ab.name.trim().toLowerCase() === b.name.trim().toLowerCase())
      );
    };

    const totalNetworkMinutes = uniqueBarbers.reduce((sum, barber) => {
      const manual = findManual(barber);
      if (manual) return sum + manual.minutes;
      
      const sheetMinutes = records
        .filter(r => r.barber_name.trim().toLowerCase() === barber.name.trim().toLowerCase() && r.unit_id === barber.unit_id && r.category === 'assinatura' && (r.commission || 0) === 0)
        .reduce((s, r) => s + r.duration_minutes, 0);
      return sum + sheetMinutes;
    }, 0);

    const valuePorMinutoGlobal = totalNetworkMinutes > 0 ? potGlobal / totalNetworkMinutes : 0;

    // 3. Group metrics per barber (chave normalizada: unit_id + nome)
    const resultsMap: Record<string, any> = {};

    records.forEach(rec => {
      const effectiveCategory = (rec.category === 'assinatura' && (rec.commission || 0) > 0) ? 'avulso' : rec.category;
      const key = `${rec.unit_id}_${rec.barber_name.trim().toLowerCase()}`;
      if (!resultsMap[key]) {
        resultsMap[key] = { 
          sMins: 0, sCnt: 0, aRev: 0, aComm: 0, aCnt: 0,
          eRev: 0, eComm: 0, eCnt: 0, pRev: 0, pComm: 0, pCnt: 0,
          bRev: 0, bComm: 0, bCnt: 0, barberName: rec.barber_name, unitId: rec.unit_id 
        };
      }
      const bd = resultsMap[key];
      if (effectiveCategory === 'assinatura') { bd.sMins += rec.duration_minutes; bd.sCnt++; }
      else if (effectiveCategory === 'avulso') { bd.aRev += rec.value; bd.aComm += (rec.commission || 0); bd.aCnt++; }
      else if (effectiveCategory === 'extra') { bd.eRev += rec.value; bd.eComm += (rec.commission || 0); bd.eCnt++; }
      else if (effectiveCategory === 'produto') { bd.pRev += rec.value; bd.pComm += (rec.commission || 0); bd.pCnt++; }
      else if (effectiveCategory === 'bebida') { bd.bRev += rec.value; bd.bComm += (rec.commission || 0); bd.bCnt++; }
    });

    // 4. Generate final insert objects usando uniqueBarbers
    const insertPayload = uniqueBarbers.map(barber => {
      const key = `${barber.unit_id}_${barber.name.trim().toLowerCase()}`;
      const data = resultsMap[key] || { 
        sMins: 0, sCnt: 0, aRev: 0, aComm: 0, aCnt: 0,
        eRev: 0, eComm: 0, eCnt: 0, pRev: 0, pComm: 0, pCnt: 0,
        bRev: 0, bComm: 0, bCnt: 0 
      };

      const manual = findManual(barber);
      const actualMinutes = manual ? manual.minutes : data.sMins;
      const actualSCnt = manual ? (manual.attendances || 0) : data.sCnt;
      
      const sComm = actualMinutes * valuePorMinutoGlobal;
      const totalComm = sComm + data.aComm + data.eComm + data.pComm + data.bComm;

      return {
        cycle_id: cycle.id,
        barber_id: barber.id,
        barber_name: barber.name,
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

    // Filtra apenas barbeiros que tiveram produção na unidade
    const validPayload = insertPayload.filter(p => p.total_commission > 0 || p.subscription_minutes > 0 || p.avulso_count > 0 || p.extra_count > 0 || p.product_count > 0 || p.bebida_count > 0 || p.avulso_revenue > 0 || p.extra_revenue > 0 || p.product_revenue > 0 || p.bebida_revenue > 0);

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
