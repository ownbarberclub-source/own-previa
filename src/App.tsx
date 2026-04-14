import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Settings, Users, Upload, LogOut, Scissors, TrendingUp, Trophy, UserCog, Clock } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Barber, ServiceType, Settings as SettingsType, Cycle, CommissionRecord, BarberResult, UserProfile } from './types';
import { getWorkingHours, formatCurrency, currentMonthYear } from './utils';

import { LoginPage } from './components/LoginPage';
import { BarbersSettings } from './components/BarbersSettings';
import { ServicesSettings } from './components/ServicesSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { CycleManager } from './components/CycleManager';
import { PreviewDashboard } from './components/PreviewDashboard';
import { RankingPanel } from './components/RankingPanel';
import { UsersSettings } from './components/UsersSettings';

type Tab = 'preview' | 'ranking' | 'upload' | 'settings';
type SettingsTab = 'barbers' | 'services' | 'general' | 'users';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('barbers');

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [appSettings, setAppSettings] = useState<SettingsType | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
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
    const { data } = await supabase.from('commission_profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  // 2. Carregamento Inicial e Realtime
  useEffect(() => {
    if (!session || !profile?.is_authorized) return;
    
    loadAll();

    // Inscrição em tempo real para sincronização automática
    const channel = supabase.channel('app-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_barbers' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_settings' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_services' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_cycles' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_records' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_profiles', filter: `id=eq.${session.user.id}` }, (payload) => {
        setProfile(payload.new as UserProfile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, profile?.is_authorized]);

  const loadAll = async () => {
    const [{ data: b }, { data: s }, { data: st }, { data: cy }, { data: rec }] = await Promise.all([
      supabase.from('commission_barbers').select('*').order('name'),
      supabase.from('commission_settings').select('*').limit(1),
      supabase.from('commission_services').select('*').order('item_name'),
      supabase.from('commission_cycles').select('*').order('month_year', { ascending: false }),
      supabase.from('commission_records').select('*').order('service_date'),
    ]);

    if (b) setBarbers(b);
    if (s && s.length > 0) setAppSettings(s[0]);
    if (st) setServiceTypes(st);
    if (cy) { setCycles(cy); if (cy.length > 0 && !activeCycleId) setActiveCycleId(cy[0].id); }
    if (rec) setRecords(rec);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ─── Lógica Principal de Cálculo ────────────────────────────────────────────────
  const barberResults = useMemo((): BarberResult[] => {
    if (!activeCycle || !appSettings || barbers.length === 0) return [];

    const cycleRecords = records.filter(r => r.cycle_id === activeCycle.id);
    const pot = (activeCycle.subscription_total || 0) * (appSettings.pot_rate || 0);

    const barberData: Record<string, {
      subscriptionMinutes: number;
      avulsoRevenue: number;
      extraRevenue: number;
      productRevenue: number;
    }> = {};

    barbers.forEach(b => {
      barberData[b.name] = { subscriptionMinutes: 0, avulsoRevenue: 0, extraRevenue: 0, productRevenue: 0 };
    });

    let totalMinutes = 0;

    cycleRecords.forEach(rec => {
      if (!barberData[rec.barber_name]) {
        barberData[rec.barber_name] = { subscriptionMinutes: 0, avulsoRevenue: 0, extraRevenue: 0, productRevenue: 0 };
      }
      const bd = barberData[rec.barber_name];

      if (rec.category === 'assinatura') {
        bd.subscriptionMinutes += rec.duration_minutes;
        totalMinutes += rec.duration_minutes;
      } else if (rec.category === 'avulso') {
        bd.avulsoRevenue += rec.value;
      } else if (rec.category === 'extra') {
        bd.extraRevenue += rec.value;
      } else if (rec.category === 'produto') {
        bd.productRevenue += rec.value;
      }
    });

    const valuePorMinuto = totalMinutes > 0 ? pot / totalMinutes : 0;
    const { elapsed, total } = getWorkingHours(activeCycle.month_year);
    const projectionFactor = elapsed > 0 ? total / elapsed : 1;

    return barbers.map(barber => {
      const bd = barberData[barber.name] || { subscriptionMinutes: 0, avulsoRevenue: 0, extraRevenue: 0, productRevenue: 0 };

      const subscriptionCommission = bd.subscriptionMinutes * valuePorMinuto;
      const avulsoCommission = bd.avulsoRevenue * barber.avulso_rate;
      const extraCommission = bd.extraRevenue * appSettings.extra_rate;
      const productCommission = bd.productRevenue * appSettings.product_rate;
      const totalCommission = subscriptionCommission + avulsoCommission + extraCommission + productCommission;
      const projectedCommission = totalCommission * projectionFactor;

      return {
        barber,
        ...bd,
        subscriptionCommission,
        avulsoCommission,
        extraCommission,
        productCommission,
        totalCommission,
        projectedCommission,
      };
    }).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [records, barbers, appSettings, activeCycle]);

  // 3. Renderização Condicional (Auth e Permissões)
  if (!session) {
    return <LoginPage />;
  }

  if (!profile || !profile.is_authorized) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 450, textAlign: 'center', backgroundColor: '#18181b', padding: 40, borderRadius: 24, border: '1px solid #27272a' }}>
          <div style={{ width: 64, height: 64, backgroundColor: 'rgba(234,179,8,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={32} color="#eab308" />
          </div>
          <h2 style={{ color: '#f4f4f5', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Acesso Pendente</h2>
          <p style={{ color: '#a1a1aa', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Sua conta foi criada com sucesso, mas ainda não foi autorizada por um administrador. Você será notificado assim que seu acesso for liberado.
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#18181b',
        borderBottom: '1px solid #27272a',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
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

            <nav style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'preview', label: 'Prévia', icon: BarChart3, show: true },
                { id: 'ranking', label: 'Ranking', icon: Trophy, show: true },
                { id: 'upload', label: 'Ciclo & Upload', icon: Upload, show: canEdit },
                { id: 'settings', label: 'Configurações', icon: Settings, show: isAdmin },
              ].filter(t => t.show).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500,
                    backgroundColor: activeTab === id ? '#27272a' : 'transparent',
                    color: activeTab === id ? 'var(--brand)' : '#a1a1aa',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ textAlign: 'right', display: 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f4f4f5' }}>{profile.email}</div>
                <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase' }}>{profile.role}</div>
             </div>
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
            barberResults={barberResults}
            activeCycle={activeCycle}
            cycles={cycles}
            onSelectCycle={setActiveCycleId}
          />
        )}
        {activeTab === 'ranking' && (
          <RankingPanel barberResults={barberResults} activeCycle={activeCycle} />
        )}
        {activeTab === 'upload' && canEdit && (
          <CycleManager
            cycles={cycles}
            activeCycleId={activeCycle?.id || null}
            serviceTypes={serviceTypes}
            records={records}
            onSelectCycle={setActiveCycleId}
            onRefresh={loadAll}
          />
        )}
        {activeTab === 'settings' && isAdmin && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #27272a', paddingBottom: 16 }}>
              {( [
                { id: 'barbers', label: 'Barbeiros', icon: Users },
                { id: 'services', label: 'Serviços', icon: Scissors },
                { id: 'general', label: 'Taxas Gerais', icon: TrendingUp },
                { id: 'users', label: 'Usuários', icon: UserCog },
              ] as { id: SettingsTab; label: string; icon: React.ComponentType<{size?: number}> }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSettingsTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 14, fontWeight: 500,
                    backgroundColor: settingsTab === id ? '#27272a' : 'transparent',
                    color: settingsTab === id ? 'var(--brand)' : '#a1a1aa',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {settingsTab === 'barbers' && (
              <BarbersSettings barbers={barbers} onRefresh={loadAll} />
            )}
            {settingsTab === 'services' && (
              <ServicesSettings serviceTypes={serviceTypes} onRefresh={loadAll} />
            )}
            {settingsTab === 'general' && (
              <GeneralSettings settings={appSettings} onRefresh={loadAll} />
            )}
            {settingsTab === 'users' && (
              <UsersSettings onRefresh={loadAll} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
