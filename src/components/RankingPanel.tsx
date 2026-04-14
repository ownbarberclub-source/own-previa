import React from 'react';
import { Trophy, Crown, TrendingUp, Users, Scissors, Target, ArrowUpRight } from 'lucide-react';
import { BarberResult, Cycle } from '../types';
import { formatCurrency } from '../utils';

interface RankingPanelProps {
  barberResults: BarberResult[];
  activeCycle: Cycle | null;
}

export function RankingPanel({ barberResults, activeCycle }: RankingPanelProps) {
  if (!activeCycle || barberResults.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Trophy size={48} color="#27272a" style={{ marginBottom: 16, margin: '0 auto' }} />
        <h3 style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 700 }}>Nenhum dado para o ranking</h3>
        <p style={{ color: '#71717a', marginTop: 8 }}>Importe uma planilha para gerar a disputa entre os barbeiros.</p>
      </div>
    );
  }

  const leader = barberResults[0];
  const sortedByMinutes = [...barberResults].sort((a, b) => b.subscriptionMinutes - a.subscriptionMinutes);
  const sortedByAvulso = [...barberResults].sort((a, b) => b.avulsoRevenue - a.avulsoRevenue);
  const sortedByExtra = [...barberResults].sort((a, b) => b.extraRevenue - a.extraRevenue);

  const cardStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 20, overflow: 'hidden' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f4f4f5', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk' }}>
          RANKING DE <span style={{ color: 'var(--brand)' }}>DISPUTA</span>
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: 14 }}>O placar operacional da barbearia</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>
        {/* Placar Geral */}
        <div style={cardStyle}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Trophy size={20} color="var(--brand)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f4f4f5' }}>Pódio Geral (Comissão Acumulada)</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {barberResults.map((res, idx) => (
              <div 
                key={res.barber.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 28px', borderBottom: idx === barberResults.length - 1 ? 'none' : '1px solid #27272a',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Assinaturas */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 8 }}>
                <Users size={16} />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rei das Assinaturas</h4>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#f4f4f5', marginBottom: 4 }}>{sortedByMinutes[0].barber.name}</p>
            <p style={{ fontSize: 14, color: '#60a5fa', fontWeight: 700 }}>{sortedByMinutes[0].subscriptionMinutes} minutos atendidos</p>
          </div>

          {/* Top Avulsos */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(225,6,0,0.1)', color: 'var(--brand)', borderRadius: 8 }}>
                <Scissors size={16} />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rei dos Avulsos</h4>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#f4f4f5', marginBottom: 4 }}>{sortedByAvulso[0].barber.name}</p>
            <p style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>Faturamento {formatCurrency(sortedByAvulso[0].avulsoRevenue)}</p>
          </div>

          {/* Top Extras */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 6, backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', borderRadius: 8 }}>
                <Target size={16} />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mestre dos Extras</h4>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#f4f4f5', marginBottom: 4 }}>{sortedByExtra[0].barber.name}</p>
            <p style={{ fontSize: 14, color: '#c084fc', fontWeight: 700 }}>Faturamento {formatCurrency(sortedByExtra[0].extraRevenue)}</p>
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
              No ritmo atual, <strong style={{color: '#fff'}}>{[...barberResults].sort((a,b) => b.projectedCommission - a.projectedCommission)[0].barber.name}</strong> é o favorito para terminar o mês no topo do pódio!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
