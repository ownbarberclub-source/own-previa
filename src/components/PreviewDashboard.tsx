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
  const avgExtra = result.extraCount > 0 ? result.extraCommission / result.extraCount : 0;
  const avgProduct = result.productCount > 0 ? result.productCommission / result.productCount : 0;
  const avgBebida = result.bebidaCount > 0 ? result.bebidaCommission / result.bebidaCount : 0;

  const extrasNeeded = avgExtra > 0 ? Math.ceil(missing / avgExtra) : null;
  const productsNeeded = avgProduct > 0 ? Math.ceil(missing / avgProduct) : null;
  const bebidasNeeded = avgBebida > 0 ? Math.ceil(missing / avgBebida) : null;

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
            placeholder="Qual sua meta?" 
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
            Para ganhar mais <strong style={{color: 'var(--brand)'}}>{formatCurrency(missing)}</strong> e bater a meta:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#09090b', borderRadius: 10, border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Target size={12} color="#c084fc" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>EXTRAS</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5' }}>{extrasNeeded ?? '—'} <span style={{fontSize: 10, color: '#52525b'}}>vendas</span></p>
            </div>
            <div style={{ padding: '10px 12px', backgroundColor: '#09090b', borderRadius: 10, border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Package size={12} color="#fbbf24" />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>PRODUTOS</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5' }}>{productsNeeded ?? '—'} <span style={{fontSize: 10, color: '#52525b'}}>vendas</span></p>
            </div>
          </div>
          {bebidasNeeded !== null && (
             <div style={{ padding: '10px 12px', backgroundColor: '#09090b', borderRadius: 10, border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Beer size={12} color="#4ade80" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>OU BEBIDAS:</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#f4f4f5' }}>{bebidasNeeded} <span style={{fontSize: 10, color: '#52525b'}}>unid.</span></p>
             </div>
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
  activeCycle: Cycle | null;
  cycles: Cycle[];
  onSelectCycle: (id: string) => void;
}

export function PreviewDashboard({ barberResults, activeCycle, cycles, onSelectCycle }: PreviewDashboardProps) {
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

      {/* Grid de Barbeiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
        {barberResults.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#52525b' }}>Nenhum dado importado no período.</p>
        ) : (
          barberResults.map(res => (
            <div key={res.barber.id} style={{ ...cardStyle, position: 'relative' }}>
              {/* Header do Card */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #27272a', backgroundColor: 'rgba(9,9,11,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f4f4f5', marginBottom: 2 }}>{res.barber.name}</h3>
                    <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Comissão {Math.round(res.barber.avulso_rate * 100)}%
                    </span>
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
