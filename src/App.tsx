import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Settings, Users, Upload, LogOut, Scissors, TrendingUp, Trophy, UserCog, Clock, Building2, ChevronDown, LayoutGrid, Lock, Database } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Barber, ServiceType, Settings as SettingsType, Cycle, CommissionRecord, BarberResult, UserProfile, Unit, ManualMinutes, HistoricalResult } from './types';
import { getWorkingHours, formatCurrency, currentMonthYear } from './utils';

import { BarbersSettings } from './components/BarbersSettings';
import { ServicesSettings } from './components/ServicesSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { CycleManager } from './components/CycleManager';
import { PreviewDashboard } from './components/PreviewDashboard';
import { RankingPanel } from './components/RankingPanel';
import { UnitsSettings } from './components/UnitsSettings';
import Logo from './assets/logo.png';

type Tab = 'preview' | 'ranking' | 'upload' | 'settings';
type SettingsTab = 'barbers' | 'services' | 'general' | 'units';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('barbers');

  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | 'consolidated'>('');
  const [debugError, setDebugError] = useState<string>('');

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [appSettings, setAppSettings] = useState<SettingsType | null>(null);
  // Para consolidated, precisaremos de múltiplos settings
  const [allUnitsSettings, setAllUnitsSettings] = useState<SettingsType[]>([]);
  
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [historicalResults, setHistoricalResults] = useState<HistoricalResult[]>([]);
  const [manualMinutes, setManualMinutes] = useState<ManualMinutes[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [crossSiteData, setCrossSiteData] = useState<{ evaluations: any[], referrals: any[] }>({ evaluations: [], referrals: [] });
  const [loading, setLoading] = useState(true);

  const activeCycle = useMemo(() => cycles.find(c => c.id === activeCycleId) || cycles[0] || null, [cycles, activeCycleId]);

  // 1. Gerenciamento de Sessão e Perfil
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const searchParams = new URLSearchParams(window.location.search);
      const hubUser = searchParams.get('hub_user');
      const hubPass = searchParams.get('hub_pass');
      
      if (hubUser && hubPass) {
        setLoading(true);
        const { data: { session: newSession }, error: authError } = await supabase.auth.signInWithPassword({ 
          email: hubUser, 
          password: atob(hubPass) 
        });
        
        if (authError) setDebugError("Auth error: " + authError.message);

        if (!authError && newSession) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setSession(newSession);
          loadProfile(newSession.user.id);
          return;
        }
      }

      if (error || !session) {
        setLoading(false);
      } else {
        setSession(session);
        loadProfile(session.user.id);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, curSession) => {
      setSession(curSession);
      if (curSession) loadProfile(curSession.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Busca perfil global do hub para saber nome e role global, ou podemos só forçar is_authorized
      const { data: p, error: pErr } = await supabase.from('hub_profiles').select('*').eq('id', userId).single();
      if (pErr) setDebugError(prev => prev + " | HubProfileErr: " + pErr.message);

      // Auth bypass Incondicional se houver acesso ao JWT/Supabase
      const userRole = p ? p.role : 'operator';
      setProfile({ id: userId, user_id: userId, email: '', name: p?.name || 'Operador', role: userRole as any, is_authorized: true, created_at: p?.created_at || '' } as UserProfile);

      // Carregar todas as unidades da barbearia
      const { data: u, error: uErr } = await supabase.from('previa_units').select('*');
      if (uErr) setDebugError(prev => prev + " | PreviaUnitsErr: " + uErr.message);
        
      if (u) {
        setUnits(u);
        if (u.length > 0 && !activeUnitId) {
          const stored = localStorage.getItem('@own-previa:last-unit');
          const defaultUnitId = stored === 'consolidated' ? 'consolidated' : (u.find(x => x.id === stored)?.id || u[0].id);
          setActiveUnitId(defaultUnitId);
        }
      }
    } catch (e: any) {
      setDebugError(prev => prev + " | Catch: " + e.message);
    }
    setLoading(false);
  };

  // 2. Carregamento Inicial e Realtime
  useEffect(() => {
    if (!session || !profile?.is_authorized || !activeUnitId) return;
    
    localStorage.setItem('@own-previa:last-unit', activeUnitId);
    loadAll();

    const channel = supabase.channel('app-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_units' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_barbers' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_cycles' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_settings' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_manual_minutes' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'previa_historical_results' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_evaluations' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_records' }, () => loadAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, profile?.is_authorized, activeUnitId]);

  const loadAll = async () => {
    const isConsolidated = activeUnitId === 'consolidated';
    const unitIds = isConsolidated ? units.map(u => u.id) : [activeUnitId];

    const [
      { data: b }, 
      { data: s }, 
      { data: manual },
      { data: st }, 
      { data: cy }, 
      { data: rec },
      { data: allB },
      { data: hist },
      { data: evals },
      { data: refs }
    ] = await Promise.all([
      supabase.from('previa_barbers').select('*').in('unit_id', unitIds).order('name'),
      supabase.from('previa_settings').select('*').in('unit_id', unitIds),
      supabase.from('previa_manual_minutes').select('*'),
      supabase.from('previa_service_types').select('*').in('unit_id', unitIds).order('item_name'),
      supabase.from('previa_cycles').select('*').order('month_year', { ascending: false }),
      supabase.from('previa_records').select('*').order('service_date'),
      supabase.from('previa_barbers').select('*'),
      supabase.from('previa_historical_results').select('*'),
      supabase.from('feedback_evaluations').select('*'),
      supabase.from('referral_records').select('barberId, barberName, contacts, createdAt')
    ]);

    if (b) setBarbers(b);
    if (s) {
      setAllUnitsSettings(s);
      setAppSettings(s.find(x => x.unit_id === activeUnitId) || s[0] || null);
    }
    if (manual) setManualMinutes(manual);
    if (st) setServiceTypes(st);
    if (allB) setAllBarbers(allB);
    if (hist) setHistoricalResults(hist);
    
    if (cy) {
      setCycles(cy);
      if (cy.length > 0) {
        if (!activeCycleId) {
          setActiveCycleId(cy[0].id);
        } else if (!cy.find(c => c.id === activeCycleId)) {
          setActiveCycleId(cy[0].id);
        }
      }
    }
    
    if (rec) setRecords(rec);

    setCrossSiteData({ 
      evaluations: evals || [], 
      referrals: refs || [] 
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };  const { barberResultsData, annualResultsData } = useMemo(() => {
    if (!activeCycle || barbers.length === 0) return { barberResultsData: { results: [], metrics: null }, annualResultsData: [] };

    const isConsolidated = activeUnitId === 'consolidated';
    const currentMonth = activeCycle.month_year;
    const globalSettings = allUnitsSettings.find(s => s.unit_id === 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa') || allUnitsSettings[0];
    const activeYear = activeCycle.month_year.split('-')[0] || new Date().getFullYear().toString();

    // 1. CALCULATE NETWORK WIDE MONTH RESULTS
    let networkMonthResults: BarberResult[] = [];
    let potBaseValue = 0;
    let totalNetworkMinutes = 0;
    let valuePorMinutoGlobal = 0;
    let potGlobal = 0;
    
    if (activeCycle.status === 'closed') {
      let totalCommissionSigs = 0;

      historicalResults.filter(hr => hr.cycle_id === activeCycle.id).forEach(hr => {
        totalNetworkMinutes += hr.subscription_minutes;
        totalCommissionSigs += hr.subscription_commission;

        let barber = allBarbers.find(b => b.id === hr.barber_id);
        const nameToUse = barber?.name || hr.barber_name || 'Ex-Barbeiro';
        
        if (!barber) {
          // Create dummy barber for deleted ones
          barber = { id: hr.barber_id || 'deleted', name: nameToUse, unit_id: hr.unit_id, avulso_rate: 0 } as Barber;
        }

        networkMonthResults.push({
          barber: { ...barber }, unit_name: units.find(u => u.id === hr.unit_id)?.name || 'Unidade',
          subscriptionMinutes: hr.subscription_minutes, subscriptionCount: hr.subscription_count,
          avulsoRevenue: hr.avulso_revenue, extraRevenue: hr.extra_revenue, productRevenue: hr.product_revenue, bebidaRevenue: hr.bebida_revenue,
          subscriptionCommission: hr.subscription_commission, avulsoCommission: hr.avulso_commission, extraCommission: hr.extra_commission, productCommission: hr.product_commission, bebidaCommission: hr.bebida_commission,
          avulsoCount: hr.avulso_count, extraCount: hr.extra_count, productCount: hr.product_count, bebidaCount: hr.bebida_count,
          totalCommission: hr.total_commission, projectedCommission: hr.total_commission
        } as BarberResult);
      });
      
      potBaseValue = totalCommissionSigs;
      valuePorMinutoGlobal = totalNetworkMinutes > 0 ? totalCommissionSigs / totalNetworkMinutes : 0;
    } else {
      // OPEN CYCLE
      potGlobal = (activeCycle.subscription_total || 0) * (globalSettings?.pot_rate || 0.42);
      potBaseValue = potGlobal;
      
      totalNetworkMinutes = allBarbers.reduce((sum, barber) => {
        const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
        if (manual) return sum + manual.minutes;
        return sum + records.filter(r => r.barber_name === barber.name && r.unit_id === barber.unit_id && r.category === 'assinatura' && (r.service_date.startsWith(currentMonth) || r.cycle_id === activeCycle.id)).reduce((s, r) => s + r.duration_minutes, 0);
      }, 0);
        
      valuePorMinutoGlobal = totalNetworkMinutes > 0 ? potGlobal / totalNetworkMinutes : 0;
      const { elapsed, total } = getWorkingHours(currentMonth);
      const projectionFactor = elapsed > 0 ? total / elapsed : 1;

      allBarbers.forEach(barber => {
        const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
        const barberRecords = records.filter(r => r.barber_name === barber.name && r.unit_id === barber.unit_id && (r.service_date.startsWith(currentMonth) || r.cycle_id === activeCycle.id));
        
        const data = {
          subscriptionMinutes: 0, subscriptionCount: 0,
          avulsoRevenue: 0, avulsoComm: 0, avulsoCount: 0,
          extraRevenue: 0, extraComm: 0, extraCount: 0,
          productRevenue: 0, productComm: 0, productCount: 0,
          bebidaRevenue: 0, bebidaComm: 0, bebidaCount: 0
        };

        barberRecords.forEach(rec => {
          if (rec.category === 'assinatura') { data.subscriptionMinutes += rec.duration_minutes; data.subscriptionCount++; }
          else if (rec.category === 'avulso') { data.avulsoRevenue += rec.value; data.avulsoComm += (rec.commission || 0); data.avulsoCount++; }
          else if (rec.category === 'extra') { data.extraRevenue += rec.value; data.extraComm += (rec.commission || 0); data.extraCount++; }
          else if (rec.category === 'produto') { data.productRevenue += rec.value; data.productComm += (rec.commission || 0); data.productCount++; }
          else if (rec.category === 'bebida') { data.bebidaRevenue += rec.value; data.bebidaComm += (rec.commission || 0); data.bebidaCount++; }
        });

        const actualMinutes = manual ? manual.minutes : data.subscriptionMinutes;
        const actualCount = manual ? Math.round(actualMinutes / 30) : data.subscriptionCount;
        const subscriptionCommission = actualMinutes * valuePorMinutoGlobal;
        const totalCommission = subscriptionCommission + data.avulsoComm + data.extraComm + data.productComm + data.bebidaComm;

        networkMonthResults.push({
          barber: { ...barber }, unit_name: units.find(u => u.id === barber.unit_id)?.name || 'Unidade',
          subscriptionMinutes: actualMinutes, subscriptionCount: actualCount,
          avulsoRevenue: data.avulsoRevenue, avulsoCommission: data.avulsoComm, avulsoCount: data.avulsoCount,
          extraRevenue: data.extraRevenue, extraCommission: data.extraComm, extraCount: data.extraCount,
          productRevenue: data.productRevenue, productCommission: data.productComm, productCount: data.productCount,
          bebidaRevenue: data.bebidaRevenue, bebidaCommission: data.bebidaComm, bebidaCount: data.bebidaCount,
          subscriptionCommission, totalCommission, projectedCommission: totalCommission * projectionFactor,
        });
      });
    }

    // Sort to apply Rank Network
    networkMonthResults.sort((a, b) => b.totalCommission - a.totalCommission);
    networkMonthResults.forEach((r, i) => r.rankNetwork = i + 1);


    // 2. CALCULATE NETWORK WIDE ANNUAL RESULTS (Always grouped by name)
    const groupedAnnual: Record<string, BarberResult> = {};
    const processAnnual = (res: any) => {
      if (!groupedAnnual[res.barber.name]) {
        groupedAnnual[res.barber.name] = { ...res, unit_name: 'Consolidado' };
      } else {
        const g = groupedAnnual[res.barber.name];
        g.subscriptionMinutes += res.subscriptionMinutes; g.subscriptionCount += res.subscriptionCount;
        g.avulsoRevenue += res.avulsoRevenue; g.avulsoCommission += res.avulsoCommission; g.avulsoCount += res.avulsoCount;
        g.extraRevenue += res.extraRevenue; g.extraCommission += res.extraCommission; g.extraCount += res.extraCount;
        g.productRevenue += res.productRevenue; g.productCommission += res.productCommission; g.productCount += res.productCount;
        g.bebidaRevenue += res.bebidaRevenue; g.bebidaCommission += res.bebidaCommission; g.bebidaCount += res.bebidaCount;
        g.subscriptionCommission += res.subscriptionCommission; g.totalCommission += res.totalCommission; g.projectedCommission += res.projectedCommission;
      }
    };

    historicalResults.forEach(hr => {
       const cycle = cycles.find(c => c.id === hr.cycle_id);
       if (!cycle || !cycle.month_year.startsWith(activeYear)) return;
       let barber = allBarbers.find(b => b.id === hr.barber_id);
       const nameToUse = barber?.name || hr.barber_name || 'Ex-Barbeiro';

       if (!barber) {
         barber = { id: hr.barber_id || 'deleted', name: nameToUse, unit_id: hr.unit_id, avulso_rate: 0 } as Barber;
       }

       processAnnual({
          barber: { ...barber },
          subscriptionMinutes: hr.subscription_minutes, subscriptionCount: hr.subscription_count,
          avulsoRevenue: hr.avulso_revenue, avulsoCommission: hr.avulso_commission, avulsoCount: hr.avulso_count,
          extraRevenue: hr.extra_revenue, extraCommission: hr.extra_commission, extraCount: hr.extra_count,
          productRevenue: hr.product_revenue, productCommission: hr.product_commission, productCount: hr.product_count,
          bebidaRevenue: hr.bebida_revenue, bebidaCommission: hr.bebida_commission, bebidaCount: hr.bebida_count,
          subscriptionCommission: hr.subscription_commission, totalCommission: hr.total_commission, projectedCommission: hr.total_commission
       });
    });

    if (activeCycle.status !== 'closed') {
       networkMonthResults.forEach(r => processAnnual(r));
    }

    const networkAnnualResults = Object.values(groupedAnnual).sort((a,b) => b.totalCommission - a.totalCommission);
    networkAnnualResults.forEach((r, i) => r.rankAnnual = i + 1);

    // Apply Annual Ranks to Month Results (using name match)
    networkMonthResults.forEach(r => {
      const bAnnual = networkAnnualResults.find(a => a.barber.name === r.barber.name);
      if (bAnnual) r.rankAnnual = bAnnual.rankAnnual;
    });


    // 3. FINAL FILTER AND CONSOLIDATION
    let finalMonthResults = networkMonthResults;
    let finalAnnualResults = networkAnnualResults;

    if (isConsolidated) {
      // Group networkMonthResults by name
      const groupedMonth: Record<string, BarberResult> = {};
      networkMonthResults.forEach(r => {
        if (!groupedMonth[r.barber.name]) {
          groupedMonth[r.barber.name] = { ...r, unit_name: 'Consolidado' };
        } else {
          const g = groupedMonth[r.barber.name];
          g.subscriptionMinutes += r.subscriptionMinutes; g.subscriptionCount += r.subscriptionCount;
          g.avulsoRevenue += r.avulsoRevenue; g.avulsoCommission += r.avulsoCommission; g.avulsoCount += r.avulsoCount;
          g.extraRevenue += r.extraRevenue; g.extraCommission += r.extraCommission; g.extraCount += r.extraCount;
          g.productRevenue += r.productRevenue; g.productCommission += r.productCommission; g.productCount += r.productCount;
          g.bebidaRevenue += r.bebidaRevenue; g.bebidaCommission += r.bebidaCommission; g.bebidaCount += r.bebidaCount;
          g.subscriptionCommission += r.subscriptionCommission; g.totalCommission += r.totalCommission; g.projectedCommission += r.projectedCommission;
        }
      });
      finalMonthResults = Object.values(groupedMonth).sort((a, b) => b.totalCommission - a.totalCommission);
      // annual results are already grouped by name
    } else {
      // Individual unit filter
      finalMonthResults = networkMonthResults.filter(r => r.barber.unit_id === activeUnitId);
      finalAnnualResults = networkAnnualResults.filter(r => 
        allBarbers.filter(b => b.unit_id === activeUnitId).some(b => b.name === r.barber.name)
      );
    }
    
    // Assign Unit Rank
    finalMonthResults.forEach((r, i) => r.rankUnit = i + 1);

    // 4. INTEGRATE CROSS-SITE DATA (Matching by Name)
    const integrateCrossSite = (resList: BarberResult[]) => {
      resList.forEach(r => {
        const bEvals = crossSiteData.evaluations.filter(e => 
          String(e.barber_id) === String(r.barber.id) || 
          String(e.barberId) === String(r.barber.id)
        );
        
        if (bEvals.length > 0) {
          const totalScore = bEvals.reduce((acc, curr) => acc + (Number(curr.satisfaction_level) || Number(curr.rating) || 0), 0);
          r.evaluationRating = totalScore / bEvals.length;
          r.evaluationCount = bEvals.length;
        }

        const bRefs = crossSiteData.referrals.filter(ref => 
          ref.barberId === r.barber.id || 
          (ref.barberName || '').toLowerCase() === r.barber.name.toLowerCase()
        );
        r.referralConversions = bRefs.reduce((acc, curr) => {
          const closed = (curr.contacts || []).filter((c: any) => c.subscriptionClosed).length;
          return acc + closed;
        }, 0);
      });
    };

    integrateCrossSite(finalMonthResults);
    integrateCrossSite(finalAnnualResults);

    return { 
      barberResultsData: { 
        results: finalMonthResults, 
        metrics: { 
          totalSubscriptions: activeCycle.subscription_total || 0, 
          potRate: globalSettings?.pot_rate || 0.42, 
          potBaseValue: potBaseValue, 
          totalMinutes: totalNetworkMinutes, 
          valuePerMinute: valuePorMinutoGlobal 
        } 
      }, 
      annualResultsData: finalAnnualResults 
    };
  }, [records, barbers, activeCycle, activeUnitId, allUnitsSettings, manualMinutes, historicalResults, allBarbers, units, cycles, crossSiteData]);

  // 3. Renderização Condicional (Auth e Permissões)
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', backgroundColor: '#18181b', padding: 40, borderRadius: 24, border: '1px solid #27272a' }}>
          <Lock size={48} color="#52525b" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', marginBottom: 16 }}>Acesso Restrito</h2>
          <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Você precisa estar logado pelo OWN Hub para acessar este sistema.
          </p>
          <a 
            href="https://ownpainel.vercel.app"
            style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#f4f4f5', color: '#09090b', fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}
          >
            Ir para o Hub
          </a>
          {debugError && <div style={{marginTop: 20, color: '#ef4444', fontSize: 12}}>{debugError}</div>}
        </div>
      </div>
    );
  }

  if (!profile || !profile.is_authorized || units.length === 0) {
    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>Sincronizando Nuvem...</div>;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', backgroundColor: '#18181b', padding: 40, borderRadius: 24, border: '1px solid #27272a' }}>
          <Database size={48} color="#52525b" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', marginBottom: 16 }}>Carregando dados...</h2>
          <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Sua conta tem acesso global via Hub, mas as planilhas da semana ainda estão carregando ou nenhuma unidade foi cadastrada no sistema.
          </p>
          {debugError && <div style={{marginTop: 20, color: '#ef4444', fontSize: 12, textAlign: 'left', background: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 8}}>{debugError}</div>}
          <button onClick={() => window.location.href = 'https://ownpainel.vercel.app/'} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', color: '#f4f4f5', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            Voltar ao Hub
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const canEdit = profile.role === 'admin' || profile.role === 'editor' || profile.role === 'operator';
  const currentUnit = units.find(u => u.id === activeUnitId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#18181b', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, backgroundColor: '#09090b', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a', padding: 4, overflow: 'hidden' }}>
                <img src={Logo} alt="OWN" style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
              <span style={{ fontWeight: 900, fontSize: 16, color: '#f4f4f5', letterSpacing: '-0.02em', fontFamily: 'Space Grotesk', textTransform: 'uppercase', fontStyle: 'italic' }}>
                OWN <span style={{ color: 'var(--brand)' }}>PRÉVIA</span>
              </span>
            </div>

            {/* Unit Selector */}
            <div style={{ 
              position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', 
              backgroundColor: '#09090b', borderRadius: 12, border: '1px solid',
              borderColor: activeUnitId === 'consolidated' ? 'var(--brand)' : '#27272a',
              transition: 'all 0.2s',
              boxShadow: activeUnitId === 'consolidated' ? '0 0 15px rgba(225,6,0,0.1)' : 'none'
            }}>
              {activeUnitId === 'consolidated' ? <Trophy size={14} color="var(--brand)" /> : <Building2 size={14} color="#71717a" />}
              <select 
                value={activeUnitId} 
                onChange={(e) => setActiveUnitId(e.target.value)}
                style={{ background: 'none', border: 'none', color: activeUnitId === 'consolidated' ? 'white' : '#f4f4f5', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer', paddingRight: 4 }}
              >
                {units.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#18181b', color: 'white' }}>{u.name}</option>)}
                {units.length > 1 && <option value="consolidated" style={{ backgroundColor: '#18181b', color: 'var(--brand)', fontWeight: 700 }}>🏆 Visão Consolidada</option>}
              </select>
            </div>

            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'preview', label: 'Prévia', icon: BarChart3, show: true },
                { id: 'ranking', label: 'Ranking', icon: Trophy, show: true },
                { id: 'upload', label: 'Ciclo & Upload', icon: Upload, show: canEdit && activeUnitId !== 'consolidated' },
                { id: 'settings', label: 'Configurações', icon: Settings, show: isAdmin },
              ].filter(t => t.show).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500, backgroundColor: activeTab === id ? '#27272a' : 'transparent',
                    color: activeTab === id ? 'var(--brand)' : '#a1a1aa', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 8 }} title="Sair">
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'preview' && (
          <PreviewDashboard
            barberResults={barberResultsData.results}
            potMetrics={barberResultsData.metrics}
            activeCycle={activeCycle}
            cycles={cycles}
            onSelectCycle={setActiveCycleId}
          />
        )}
        {activeTab === 'ranking' && (
          <RankingPanel
            barberResults={barberResultsData.results}
            annualResults={annualResultsData}
            activeCycle={activeCycle}
          />
        )}
        {activeTab === 'upload' && canEdit && activeUnitId !== 'consolidated' && (
          <CycleManager
            cycles={cycles}
            activeCycleId={activeCycle?.id || null}
            serviceTypes={serviceTypes}
            barbers={barbers}
            records={records}
            onSelectCycle={setActiveCycleId}
            onRefresh={loadAll}
            unitId={activeUnitId}
            manualMinutes={manualMinutes}
          />
        )}
        {activeTab === 'settings' && isAdmin && (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #27272a', paddingBottom: 16 }}>
              {( [
                { id: 'units', label: 'Unidades', icon: Building2 },
                { id: 'barbers', label: 'Barbeiros (' + (currentUnit?.name || '...') + ')', icon: Users, disabled: activeUnitId === 'consolidated' },
                { id: 'services', label: 'Serviços e Produtos (' + (currentUnit?.name || '...') + ')', icon: Scissors, disabled: activeUnitId === 'consolidated' },
                { id: 'general', label: 'Taxas Gerais', icon: TrendingUp, disabled: activeUnitId === 'consolidated' },
              ] as any[]).map(({ id, label, icon: Icon, disabled }) => (
                <button
                  key={id}
                  disabled={disabled}
                  onClick={() => setSettingsTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 500, backgroundColor: settingsTab === id ? '#27272a' : 'transparent',
                    color: settingsTab === id ? 'var(--brand)' : '#a1a1aa', transition: 'all 0.15s', opacity: disabled ? 0.3 : 1
                  }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>

            {settingsTab === 'units' && <UnitsSettings onRefresh={loadAll} />}
            {activeUnitId !== 'consolidated' && (
              <>
                {settingsTab === 'barbers' && <BarbersSettings barbers={barbers} onRefresh={loadAll} unitId={activeUnitId} />}
                {settingsTab === 'services' && <ServicesSettings serviceTypes={serviceTypes} onRefresh={loadAll} unitId={activeUnitId} />}
                {settingsTab === 'general' && <GeneralSettings settings={appSettings} onRefresh={loadAll} unitId={activeUnitId} />}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
