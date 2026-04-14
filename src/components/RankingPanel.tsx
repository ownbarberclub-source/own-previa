import React, { useState } from 'react';
import { Trophy, Crown, Calendar, CalendarDays, Users, Scissors, Target, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarberResult, Cycle } from '../types';
import { formatCurrency } from '../utils';

interface RankingPanelProps {
  barberResults: BarberResult[];
  annualResults: BarberResult[];
  activeCycle: Cycle | null;
}

export function RankingPanel({ barberResults, annualResults, activeCycle }: RankingPanelProps) {
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  
  const resultsToUse = viewMode === 'month' ? barberResults : annualResults;

  if (!activeCycle || resultsToUse.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Trophy size={48} color="#27272a" style={{ marginBottom: 16, margin: '0 auto' }} />
        <h3 style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700 }}>Nenhum dado para o ranking</h3>
        <p style={{ color: '#71717a', marginTop: 8 }}>Importe uma planilha para gerar a disputa entre os barbeiros.</p>
      </div>
    );
  }

  const leader = resultsToUse[0];
  const sortedByMinutes = [...resultsToUse].sort((a, b) => b.subscriptionMinutes - a.subscriptionMinutes);
  const sortedByExtraCount = [...resultsToUse].sort((a, b) => b.extraCount - a.extraCount);
  const sortedByProductCount = [...resultsToUse].sort((a, b) => b.productCount - a.productCount);
  const sortedByBebidaCount = [...resultsToUse].sort((a, b) => b.bebidaCount - a.bebidaCount);

  const cardStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 20, overflow: 'hidden' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk' }}>
            RANKING DE <span style={{ color: 'var(--brand)' }}>DISPUTA</span>
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>O placar operacional da barbearia</p>
        </div>
        <div style={{ display: 'flex', backgroundColor: '#18181b', padding: 4, borderRadius: 12, border: '1px solid #27272a' }}>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: viewMode === 'month' ? '#27272a' : 'transparent',
              color: viewMode === 'month' ? 'white' : '#a1a1aa',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={14} /> Mês
          </button>
          <button
            onClick={() => setViewMode('year')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: viewMode === 'year' ? '#27272a' : 'transparent',
              color: viewMode === 'year' ? 'white' : '#a1a1aa',
              transition: 'all 0.2s'
            }}
          >
            <CalendarDays size={14} /> Acumulado do Ano
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        {/* Placar Geral */}
        <div style={cardStyle}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={20} color="var(--brand)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5' }}>Pódio Geral (Comissão Acumulada)</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {resultsToUse.map((res, idx) => (
              <div 
                key={res.barber.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 28px', borderBottom: idx === resultsToUse.length - 1 ? 'none' : '1px solid #27272a',
                  backgroundColor: idx === 0 ? 'rgba(225,6,0,0.03)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                    backgroundColor: idx === 0 ? 'rgba(234,179,8,0.1)' : idx === 1 ? 'rgba(161,161,170,0.1)' : idx === 2 ? 'rgba(180,83,9,0.1)' : '#09090b',
                    color: idx === 0 ? '#eab308' : idx === 1 ? '#a1a1aa' : idx === 2 ? '#b45309' : '#52525b',
                    border: '1px solid currentColor'
                  }}>
                    {idx === 0 ? <Crown size={16} /> : idx + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: idx === 0 ? '#fff' : '#e4e4e7' }}>{res.barber.name}</p>
                    {idx > 0 && (
                      <p style={{ fontSize: 11, color: '#52525b', fontWeight: 600 }}>
                        {formatCurrency(leader.totalCommission - res.totalCommission)} atrás do 1º
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: idx === 0 ? 'var(--brand)' : '#f4f4f5', fontFamily: 'Space Grotesk' }}>
                    {formatCurrency(res.totalCommission)}
                  </p>
                  <div style={{ width: 120, height: 4, backgroundColor: '#27272a', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${(res.totalCommission / leader.totalCommission) * 100}%`, height: '100%', backgroundColor: idx === 0 ? 'var(--brand)' : '#52525b' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Rankings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Assinaturas */}
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 8 }}>
                <Users size={16} />
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rei das Assinaturas</h4>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{sortedByMinutes[0].barber.name}</p>
            <p style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>{sortedByMinutes[0].subscriptionMinutes} min atendidos</p>
          </div>

          {/* Top Bebidas (Qtd) */}
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: 8 }}>
                <Target size={16} />
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>Mestre das Bebidas</h4>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{sortedByBebidaCount[0].barber.name}</p>
            <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{sortedByBebidaCount[0].bebidaCount} itens vendidos</p>
          </div>

          {/* Top Produtos (Qtd) */}
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(234,179,8,0.1)', color: '#fbbf24', borderRadius: 8 }}>
                <ArrowUpRight size={16} />
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>Mestre dos Produtos</h4>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{sortedByProductCount[0].barber.name}</p>
            <p style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>{sortedByProductCount[0].productCount} itens vendidos</p>
          </div>

          {/* Top Extras (Qtd) */}
          <div style={{ ...cardStyle, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', borderRadius: 8 }}>
                <Target size={16} />
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>Mestre dos Extras</h4>
            </div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{sortedByExtraCount[0].barber.name}</p>
            <p style={{ fontSize: 13, color: '#c084fc', fontWeight: 600 }}>{sortedByExtraCount[0].extraCount} serviços extras</p>
          </div>

          {/* Insights de Projeção */}
          <div style={{ 
            padding: 24, borderRadius: 20, backgroundColor: '#09090b', border: '1px solid #27272a',
            backgroundImage: 'linear-gradient(to bottom right, rgba(225,6,0,0.05), transparent)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TrendingUp size={16} color="var(--brand)" />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase' }}>Fim do Mês</span>
            </div>
            <p style={{ fontSize: 14, color: '#e4e4e7', lineHeight: 1.5, fontWeight: 500 }}>
              No ritmo atual, <strong style={{color: '#fff'}}>{[...barberResults].sort((a,b) => b.projectedCommission - a.projectedCommission)[0].barber.name}</strong> faturará mais no fim do mês!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
