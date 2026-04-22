import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Scissors, Target, Users, Beer, Package } from 'lucide-react';
import { BarberResult, Cycle } from '../types';
import { formatCurrency } from '../utils';

function GoalSimulator({ result }: { result: BarberResult }) {
  const [target, setTarget] = useState<string>('');
  
  const current = result.totalCommission;
  const targetNum = parseFloat(target) || 0;
  const missing = Math.max(0, targetNum - current);
  
  // Médias de comissão do barbeiro (baseado na planilha atual)
  const avgSubscription = result.subscriptionCount > 0 ? result.subscriptionCommission / result.subscriptionCount : 0;
  const avgAvulso = result.avulsoCount > 0 ? result.avulsoCommission / result.avulsoCount : 0;
  const avgExtra = result.extraCount > 0 ? result.extraCommission / result.extraCount : 0;
  const avgProduct = result.productCount > 0 ? result.productCommission / result.productCount : 0;
  const avgBebida = result.bebidaCount > 0 ? result.bebidaCommission / result.bebidaCount : 0;

  const weightMap = {
    'ASSINATURAS': 10,
    'AVULSOS': 4,
    'EXTRAS': 3,
    'PRODUTOS': 2,
    'BEBIDAS': 1
  };

  const activeCategories = [
    { key: 'ASSINATURAS', avg: avgSubscription, icon: Scissors, color: 'var(--brand)', unit: 'atend.' },
    { key: 'AVULSOS', avg: avgAvulso, icon: Users, color: '#38bdf8', unit: 'atend.' },
    { key: 'EXTRAS', avg: avgExtra, icon: Target, color: '#c084fc', unit: 'vendas' },
    { key: 'PRODUTOS', avg: avgProduct, icon: Package, color: '#fbbf24', unit: 'vendas' },
    { key: 'BEBIDAS', avg: avgBebida, icon: Beer, color: '#4ade80', unit: 'unid.' }
  ].filter(item => item.avg > 0);

  const totalWeight = activeCategories.reduce((sum, cat) => sum + weightMap[cat.key as keyof typeof weightMap], 0);

  const comboPlan = activeCategories.map(cat => {
    const share = missing * (weightMap[cat.key as keyof typeof weightMap] / totalWeight);
    const qty = Math.ceil(share / cat.avg);
    return { ...cat, qty };
  });

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '2px dashed #27272a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Target size={16} color="var(--brand)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5' }}>Simulador de Meta</span>
      </div>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: 12, fontWeight: 700 }}>R$</span>
          <input 
            type="number" 
            placeholder="Qual sua meta total?" 
            value={target}
            onChange={e => setTarget(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 32px', backgroundColor: '#09090b', border: '1px solid #27272a',
              borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {missing > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 500 }}>
            Faltam <strong style={{color: 'var(--brand)'}}>{formatCurrency(missing)}</strong>. Sugestão de plano de ação combado:
          </p>
          
          {comboPlan.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              {comboPlan.map((item, idx) => (
                <React.Fragment key={item.key}>
                  <div style={{ flex: 1, minWidth: 100, padding: '10px 12px', backgroundColor: '#09090b', borderRadius: 10, border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <item.icon size={12} color={item.color} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>{item.key}</span>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5' }}>{item.qty} <span style={{fontSize: 10, color: '#52525b'}}>{item.unit}</span></p>
                  </div>
                  {idx < comboPlan.length - 1 && (
                    <span style={{ color: '#52525b', fontWeight: 800, fontSize: 16 }}>+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.1)', padding: 12, borderRadius: 8 }}>
              Gere seus primeiros atendimentos no sistema para podermos calcular suas médias e gerar esse plano de ação automático.
            </p>
          )}
        </div>
      ) : targetNum > 0 ? (
        <div style={{ padding: '12px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>🏆 Meta Atingida!</p>
        </div>
      ) : null}
    </div>
  );
}

interface PreviewDashboardProps {
  barberResults: BarberResult[];
  potMetrics: {
    totalSubscriptions: number;
    potRate: number;
    potBaseValue: number;
    totalMinutes: number;
    valuePerMinute: number;
  } | null;
  activeCycle: Cycle | null;
  cycles: Cycle[];
  onSelectCycle: (id: string) => void;
}

export function PreviewDashboard({ barberResults, potMetrics, activeCycle, cycles, onSelectCycle }: PreviewDashboardProps) {
  const [selectedBarberId, setSelectedBarberId] = useState('all');

  if (!activeCycle) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Calendar size={48} color="#27272a" style={{ marginBottom: 16, margin: '0 auto' }} />
        <h3 style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700 }}>Nenhum ciclo ativo selecionado</h3>
        <p style={{ color: '#71717a', marginTop: 8 }}>Vá em "Ciclo & Upload" para criar ou selecionar um mês de trabalho.</p>
      </div>
    );
  }

  const cardStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 20, overflow: 'hidden' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header com Filtro de Mês */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk' }}>
            PRÉVIA DE <span style={{ color: 'var(--brand)' }}>COMISSÕES</span>
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>Acompanhamento de desempenho acumulado</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {barberResults.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#18181b', padding: '8px 16px', borderRadius: 12, border: '1px solid #27272a' }}>
              <Users size={16} color="#71717a" />
              <select 
                value={selectedBarberId} 
                onChange={e => setSelectedBarberId(e.target.value)}
                style={{ background: 'none', border: 'none', color: '#f4f4f5', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                <option value="all" style={{ backgroundColor: '#18181b' }}>Visão Geral (Todos)</option>
                {barberResults.map(r => (
                  <option key={r.barber.id} value={r.barber.id} style={{ backgroundColor: '#18181b' }}>{r.barber.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#18181b', padding: '8px 16px', borderRadius: 12, border: '1px solid #27272a' }}>
            <Calendar size={16} color="#71717a" />
            <select 
              value={activeCycle.id} 
              onChange={e => onSelectCycle(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#f4f4f5', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id} style={{ backgroundColor: '#18181b' }}>
                  {c.month_year.split('-').reverse().join('/')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Métricas Globais do POT */}
      {potMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ ...cardStyle, padding: '20px', background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Faturamento Rede</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#f4f4f5', fontFamily: 'Space Grotesk', marginTop: 4 }}>{formatCurrency(potMetrics.totalSubscriptions)}</p>
          </div>
          <div style={{ ...cardStyle, padding: '20px', background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxa Repasse (POT)</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--brand)', fontFamily: 'Space Grotesk', marginTop: 4 }}>{(potMetrics.potRate * 100).toFixed(0)}%</p>
          </div>
          <div style={{ ...cardStyle, padding: '20px', background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comissão Base POT</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', fontFamily: 'Space Grotesk', marginTop: 4 }}>{formatCurrency(potMetrics.potBaseValue)}</p>
          </div>
          <div style={{ ...cardStyle, padding: '20px', background: 'var(--brand)', border: 'none' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor do Minuto</span>
            <p style={{ fontSize: 20, fontWeight: 900, color: 'white', fontFamily: 'Space Grotesk', marginTop: 4 }}>
              {potMetrics.valuePerMinute.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 })}/min
            </p>
          </div>
        </div>
      )}

      {/* Grid de Barbeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
        {barberResults.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#52525b' }}>Nenhum dado importado no período.</p>
        ) : (
          barberResults.filter(r => selectedBarberId === 'all' || r.barber.id === selectedBarberId).map(res => (
            <div key={res.barber.id} style={{ ...cardStyle, position: 'relative' }}>
              {/* Header do Card */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #27272a', backgroundColor: 'rgba(9,9,11,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{res.barber.name}</h3>
                    <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                      Comissão {Math.round(res.barber.avulso_rate)}%
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', color: '#a1a1aa', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>Unidade: {res.rankUnit || '-'}º</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, backgroundColor: 'rgba(225,6,0,0.05)', color: 'var(--brand)', fontWeight: 600, border: '1px solid rgba(225,6,0,0.2)' }}>Rede: {res.rankNetwork || '-'}º</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, backgroundColor: 'rgba(234,179,8,0.05)', color: '#eab308', fontWeight: 600, border: '1px solid rgba(234,179,8,0.2)' }}>Anual: {res.rankAnnual || '-'}º</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: '#71717a', fontWeight: 500, marginBottom: 2 }}>Total Acumulado</p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: '#f4f4f5', fontFamily: 'Space Grotesk' }}>{formatCurrency(res.totalCommission)}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes Categorizados */}
              <div style={{ padding: '24px 28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Assinatura */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 6, backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 8 }}>
                        <Users size={14} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Assinaturas (POT)</span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>{res.subscriptionMinutes} min de atendimento</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{formatCurrency(res.subscriptionCommission)}</span>
                  </div>

                  {/* Avulsos */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 6, backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--brand)', borderRadius: 8 }}>
                        <Scissors size={14} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Serviços Avulsos</span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>Faturado {formatCurrency(res.avulsoRevenue)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{formatCurrency(res.avulsoCommission)}</span>
                  </div>

                  {/* Bebidas */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 6, backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: 8 }}>
                        <Beer size={14} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Bebidas</span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>{res.bebidaCount} itens vendidos</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{formatCurrency(res.bebidaCommission)}</span>
                  </div>

                  {/* Produtos */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 6, backgroundColor: 'rgba(234,179,8,0.1)', color: '#fbbf24', borderRadius: 8 }}>
                        <Package size={14} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Produtos</span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>{res.productCount} itens vendidos</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{formatCurrency(res.productCommission)}</span>
                  </div>

                  {/* Extras */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 6, backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', borderRadius: 8 }}>
                        <Target size={14} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: 13, color: '#f4f4f5', fontWeight: 600 }}>Serviços Extras</span>
                        <span style={{ fontSize: 11, color: '#52525b' }}>{res.extraCount} serviços</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7' }}>{formatCurrency(res.extraCommission)}</span>
                  </div>
                </div>

                {/* Projeção do Mês */}
                <div style={{ marginTop: 28, padding: 18, backgroundColor: 'rgba(225,6,0,0.05)', borderRadius: 16, border: '1px solid rgba(225,6,0,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <TrendingUp size={14} color="var(--brand)" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projeção Final do Mês</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', fontFamily: 'Space Grotesk' }}>{formatCurrency(res.projectedCommission)}</p>
                    <p style={{ fontSize: 11, color: '#52525b', fontWeight: 500 }}>Baseado no ritmo atual</p>
                  </div>
                  <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(225,6,0,0.1)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                    <div style={{ width: '65%', height: '100%', backgroundColor: 'var(--brand)', borderRadius: 2 }}></div>
                  </div>
                </div>

                {/* Simulador de Meta */}
                <GoalSimulator result={res} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
