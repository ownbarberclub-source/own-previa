import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Settings, Users, Upload, LogOut, Scissors, TrendingUp, Trophy, UserCog, Clock, Building2, ChevronDown, LayoutGrid } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Barber, ServiceType, Settings as SettingsType, Cycle, CommissionRecord, BarberResult, UserProfile, Unit, ManualMinutes } from './types';
import { getWorkingHours, formatCurrency, currentMonthYear } from './utils';

import { LoginPage } from './components/LoginPage';
import { BarbersSettings } from './components/BarbersSettings';
import { ServicesSettings } from './components/ServicesSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { CycleManager } from './components/CycleManager';
import { PreviewDashboard } from './components/PreviewDashboard';
import { RankingPanel } from './components/RankingPanel';
import { UsersSettings } from './components/UsersSettings';
import { UnitsSettings } from './components/UnitsSettings';

type Tab = 'preview' | 'ranking' | 'upload' | 'settings';
type SettingsTab = 'barbers' | 'services' | 'general' | 'users' | 'units';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('barbers');

  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | 'consolidated'>('');
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [appSettings, setAppSettings] = useState<SettingsType | null>(null);
  // Para consolidated, precisaremos de múltiplos settings
  const [allUnitsSettings, setAllUnitsSettings] = useState<SettingsType[]>([]);
  
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [manualMinutes, setManualMinutes] = useState<ManualMinutes[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeCycle = useMemo(() => cycles.find(c => c.id === activeCycleId) || cycles[0] || null, [cycles, activeCycleId]);

  // 1. Gerenciamento de Sessão e Perfil
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data: p } = await supabase.from('commission_profiles').select('*').eq('id', userId).single();
    if (p) setProfile(p);

    // Carregar unidades permitidas
    const { data: u } = await supabase.from('commission_units').select('*, commission_user_units!inner(user_id)').eq('commission_user_units.user_id', userId);
    if (u) {
      setUnits(u);
      if (u.length > 0 && !activeUnitId) {
        const stored = localStorage.getItem('@own-previa:last-unit');
        const defaultUnit = u.find(x => x.id === stored) || u[0];
        setActiveUnitId(defaultUnit.id);
      }
    }
    setLoading(false);
  };

  // 2. Carregamento Inicial e Realtime
  useEffect(() => {
    if (!session || !profile?.is_authorized || !activeUnitId) return;
    
    localStorage.setItem('@own-previa:last-unit', activeUnitId);
    loadAll();

    const channel = supabase.channel('app-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => loadAll())
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
      { data: rec }
    ] = await Promise.all([
      supabase.from('commission_barbers').select('*').in('unit_id', unitIds).order('name'),
      supabase.from('commission_settings').select('*').in('unit_id', unitIds),
      supabase.from('commission_manual_minutes').select('*'),
      supabase.from('commission_services').select('*').in('unit_id', unitIds).order('item_name'),
      supabase.from('commission_cycles').select('*').order('month_year', { ascending: false }),
      // Importante: Para o cálculo do POT Global, carregamos TODAS as assinaturas da rede para o mês,
      // além de todos os registros da(s) unidade(s) selecionada(s).
      supabase.from('commission_records').select('*').or(`unit_id.in.(${unitIds.join(',')}),category.eq.assinatura`).order('service_date'),
    ]);

    if (b) setBarbers(b);
    if (s) {
      setAllUnitsSettings(s);
      setAppSettings(s.find(x => x.unit_id === activeUnitId) || s[0] || null);
    }
    if (manual) setManualMinutes(manual);
    if (st) setServiceTypes(st);
    
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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const barberResultsData = useMemo(() => {
    if (!activeCycle || barbers.length === 0) return { results: [], metrics: null };

    const isConsolidated = activeUnitId === 'consolidated';
    const currentMonth = activeCycle.month_year;
    
    const cycleRecords = isConsolidated 
      ? records.filter(r => r.service_date.startsWith(currentMonth))
      : records.filter(r => r.cycle_id === activeCycle.id);

    const globalSettings = allUnitsSettings.find(s => s.unit_id === 'd1af48cb-14e6-4ae7-a6d2-e28207deeafa') || allUnitsSettings[0];
    const potGlobal = (activeCycle.subscription_total || 0) * (globalSettings?.pot_rate || 0.40);
    
    // NOVO: Cálculo de minutos totais da rede considerando lançamentos MANUAIS
    const totalNetworkMinutes = barbers.reduce((sum, barber) => {
      const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
      if (manual) return sum + manual.minutes;
      
      const sheetMinutes = records
        .filter(r => r.barber_name === barber.name && r.category === 'assinatura' && r.service_date.startsWith(currentMonth))
        .reduce((s, r) => s + r.duration_minutes, 0);
      return sum + sheetMinutes;
    }, 0);
      
    const valuePorMinutoGlobal = totalNetworkMinutes > 0 ? potGlobal / totalNetworkMinutes : 0;

    const unitResultsMap: Record<string, any> = {};

    cycleRecords.forEach(rec => {
      const key = isConsolidated ? rec.barber_name : `${rec.barber_name}-${rec.unit_id}`;
      if (!unitResultsMap[key]) {
        unitResultsMap[key] = { 
          subscriptionMinutes: 0, avulsoRevenue: 0, extraRevenue: 0, productRevenue: 0, bebidaRevenue: 0,
          avulsoComm: 0, extraComm: 0, productComm: 0, bebidaComm: 0,
          avulsoCount: 0, extraCount: 0, productCount: 0, bebidaCount: 0,
          barberName: rec.barber_name, unitId: rec.unit_id 
        };
      }
      const bd = unitResultsMap[key];
      if (rec.category === 'assinatura') {
        bd.subscriptionMinutes += rec.duration_minutes;
      } else if (rec.category === 'avulso') {
        bd.avulsoRevenue += rec.value;
        bd.avulsoComm += (rec.commission || 0);
        bd.avulsoCount++;
      } else if (rec.category === 'extra') {
        bd.extraRevenue += rec.value;
        bd.extraComm += (rec.commission || 0);
        bd.extraCount++;
      } else if (rec.category === 'produto') {
        bd.productRevenue += rec.value;
        bd.productComm += (rec.commission || 0);
        bd.productCount++;
      } else if (rec.category === 'bebida') {
        bd.bebidaRevenue += rec.value;
        bd.bebidaComm += (rec.commission || 0);
        bd.bebidaCount++;
      }
    });

    const finalResults: BarberResult[] = [];
    const { elapsed, total } = getWorkingHours(currentMonth);
    const projectionFactor = elapsed > 0 ? total / elapsed : 1;

    Object.values(unitResultsMap).forEach((data: any) => {
      const barber = barbers.find(b => b.name === data.barberName && (isConsolidated ? true : b.unit_id === data.unitId));
      if (!barber) return;

      const manual = manualMinutes.find(m => m.barber_id === barber.id && m.cycle_id === activeCycle.id);
      
      // Se tiver manual, usa o manual. Senão, usa o acumulado da planilha.
      const actualMinutes = manual ? manual.minutes : data.subscriptionMinutes;

      const subscriptionCommission = actualMinutes * valuePorMinutoGlobal;
      const totalCommission = subscriptionCommission + data.avulsoComm + data.extraComm + data.productComm + data.bebidaComm;

      finalResults.push({
        barber,
        unit_name: units.find(u => u.id === barber.unit_id)?.name,
        ...data,
        subscriptionMinutes: actualMinutes, // Atualiza para o dashboard mostrar o valor manual se existir
        subscriptionCommission,
        avulsoCommission: data.avulsoComm,
        extraCommission: data.extraComm,
        productCommission: data.productComm,
        bebidaCommission: data.bebidaComm,
        totalCommission,
        projectedCommission: totalCommission * projectionFactor,
      });
    });

    let results = finalResults;
    if (isConsolidated) {
      const grouped: Record<string, BarberResult> = {};
      finalResults.forEach(r => {
        if (!grouped[r.barber.name]) {
          grouped[r.barber.name] = { ...r, unit_name: 'Consolidado' };
        } else {
          const g = grouped[r.barber.name];
          g.subscriptionMinutes += r.subscriptionMinutes;
          g.avulsoRevenue += r.avulsoRevenue;
          g.extraRevenue += r.extraRevenue;
          g.productRevenue += r.productRevenue;
          g.subscriptionCommission += r.subscriptionCommission;
          g.avulsoCommission += r.avulsoCommission;
          g.extraCommission += r.extraCommission;
          g.productCommission += r.productCommission;
          g.bebidaCommission += r.bebidaCommission;
          g.avulsoCount += r.avulsoCount;
          g.extraCount += r.extraCount;
          g.productCount += r.productCount;
          g.bebidaCount += r.bebidaCount;
          g.totalCommission += r.totalCommission;
          g.projectedCommission += r.projectedCommission;
        }
      });
      results = Object.values(grouped).sort((a, b) => b.totalCommission - a.totalCommission);
    } else {
      results = finalResults.sort((a, b) => b.totalCommission - a.totalCommission);
    }

    const metrics = {
      totalSubscriptions: activeCycle.subscription_total || 0,
      potRate: globalSettings?.pot_rate || 0.40,
      potBaseValue: potGlobal,
      totalMinutes: totalNetworkMinutes,
      valuePerMinute: valuePorMinutoGlobal
    };

    return { results, metrics };
  }, [records, barbers, allUnitsSettings, activeCycle, activeUnitId, units, cycles, manualMinutes]);

  // 3. Renderização Condicional (Auth e Permissões)
  if (!session) return <LoginPage />;

  if (!profile || !profile.is_authorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 450, textAlign: 'center', backgroundColor: '#18181b', padding: 40, borderRadius: 24, border: '1px solid #27272a' }}>
          <div style={{ width: 64, height: 64, backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={32} color="#eab308" />
          </div>
          <h2 style={{ color: '#f4f4f5', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Acesso Pendente</h2>
          <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Sua conta foi criada com sucesso, mas você precisa ser autorizado e vinculado a uma unidade por um administrador.
          </p>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', color: '#f4f4f5', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
            Sair e Voltar
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';
  const canEdit = profile.role === 'admin' || profile.role === 'editor';
  const currentUnit = units.find(u => u.id === activeUnitId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#18181b', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, backgroundColor: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scissors size={16} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#f4f4f5', letterSpacing: '-0.02em', fontFamily: 'Space Grotesk' }}>
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
          <RankingPanel barberResults={barberResultsData.results} activeCycle={activeCycle} />
        )}
        {activeTab === 'upload' && canEdit && activeUnitId !== 'consolidated' && (
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
                { id: 'users', label: 'Usuários', icon: UserCog },
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
            {settingsTab === 'users' && <UsersSettings />}
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
