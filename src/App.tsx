import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Settings, Users, Upload, LogOut, Scissors, TrendingUp, Trophy } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Barber, ServiceType, Settings as SettingsType, Cycle, CommissionRecord, BarberResult } from './types';
import { getWorkingHours, formatCurrency, currentMonthYear } from './utils';

import { LoginPage } from './components/LoginPage';
import { BarbersSettings } from './components/BarbersSettings';
import { ServicesSettings } from './components/ServicesSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { CycleManager } from './components/CycleManager';
import { PreviewDashboard } from './components/PreviewDashboard';
import { RankingPanel } from './components/RankingPanel';

const ADMIN_EMAIL = 'admin@ownbarberclub.com';
const ADMIN_PASSWORD = 'OwnPrevia2026!';

type Tab = 'preview' | 'ranking' | 'upload' | 'settings';
type SettingsTab = 'barbers' | 'services' | 'general';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('barbers');

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [appSettings, setAppSettings] = useState<SettingsType | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);

  const activeCycle = useMemo(() => cycles.find(c => c.id === activeCycleId) || cycles[0] || null, [cycles, activeCycleId]);

  useEffect(() => {
    const stored = localStorage.getItem('@own-previa:logged');
    if (stored === 'true') setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadAll();
  }, [isLoggedIn]);

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
    if (cy) { setCycles(cy); if (cy.length > 0) setActiveCycleId(cy[0].id); }
    if (rec) setRecords(rec);
  };

  const handleLogin = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('@own-previa:logged', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('@own-previa:logged');
  };

  // ─── Lógica Principal de Cálculo ────────────────────────────────────────────────
  const barberResults = useMemo((): BarberResult[] => {
    if (!activeCycle || !appSettings || barbers.length === 0) return [];

    const cycleRecords = records.filter(r => r.cycle_id === activeCycle.id);

    const pot = activeCycle.subscription_total * appSettings.pot_rate;

    // Mapear serviços por barbeiro
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

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

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
              {([
                { id: 'preview', label: 'Prévia', icon: BarChart3 },
                { id: 'ranking', label: 'Ranking', icon: Trophy },
                { id: 'upload', label: 'Ciclo & Upload', icon: Upload },
                { id: 'settings', label: 'Configurações', icon: Settings },
              ] as { id: Tab; label: string; icon: React.ComponentType<{size?: number}> }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
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

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 8 }} title="Sair">
            <LogOut size={18} />
          </button>
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
        {activeTab === 'upload' && (
          <CycleManager
            cycles={cycles}
            activeCycleId={activeCycle?.id || null}
            serviceTypes={serviceTypes}
            records={records}
            onSelectCycle={setActiveCycleId}
            onRefresh={loadAll}
          />
        )}
        {activeTab === 'settings' && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid #27272a', paddingBottom: 16 }}>
              {([
                { id: 'barbers', label: 'Barbeiros', icon: Users },
                { id: 'services', label: 'Serviços', icon: Scissors },
                { id: 'general', label: 'Taxas Gerais', icon: TrendingUp },
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
          </div>
        )}
      </main>
    </div>
  );
}
