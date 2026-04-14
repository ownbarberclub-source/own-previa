import React, { useState } from 'react';
import { Upload, Calendar, Hash, FileSpreadsheet, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { Cycle, ServiceType, CommissionRecord, Barber, ManualMinutes } from '../types';
import { currentMonthYear, formatCurrency } from '../utils';
import { ManualMinutesEditor } from './ManualMinutesEditor';
import { closeCycle, reopenCycle } from '../utils/closing';

interface CycleManagerProps {
  cycles: Cycle[];
  activeCycleId: string | null;
  serviceTypes: ServiceType[];
  barbers: Barber[];
  records: CommissionRecord[];
  manualMinutes: ManualMinutes[];
  onSelectCycle: (id: string) => void;
  onRefresh: () => void;
  unitId: string;
}

export function CycleManager({ cycles, activeCycleId, serviceTypes, barbers, records, manualMinutes, onSelectCycle, onRefresh, unitId }: CycleManagerProps) {
  const [subTotal, setSubTotal] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', text: '' });

  const activeCycle = cycles.find(c => c.id === activeCycleId);

  const handleCreateCycle = async () => {
    const monthYear = currentMonthYear();
    // Ciclo é global
    if (cycles.some(c => c.month_year === monthYear)) {
      alert('O ciclo para este mês já existe.');
      return;
    }

    const { data, error } = await supabase.from('commission_cycles').insert([{
      id: crypto.randomUUID(),
      month_year: monthYear,
      subscription_total: 0
    }]).select();

    if (data) {
      onRefresh();
      onSelectCycle(data[0].id);
    }
  };

  const handleUpdateSubTotal = async () => {
    if (!activeCycleId || !subTotal) return;
    await supabase.from('commission_cycles').update({
      subscription_total: parseFloat(subTotal.replace(',', '.'))
    }).eq('id', activeCycleId);
    setSubTotal('');
    onRefresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCycleId || !unitId) return;

    setIsUploading(true);
    setUploadStatus({ type: 'info', text: 'Processando planilha...' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        // Processamento dos dados da planilha
        // Colunas esperadas: Data, Valor, Tipo, Item, Profissional, Cliente
        const newRecords: Omit<CommissionRecord, 'id' | 'created_at'>[] = [];

        for (const row of data) {
          const itemName = String(row['Item'] || '').trim();
          const barberName = String(row['Profissional'] || '').trim();
          const rawValue = row['Valor'];
          const rawComm = row['Comissão'] || 0;
          const dateStr = row['Data'];

          // 1. Verifica se o profissional na planilha existe no sistema PARA ESTA UNIDADE
          const barberExists = barbers.some(b => b.name === barberName && b.unit_id === unitId);
          if (!barberExists) continue;

          // 2. Busca mapeamento do serviço NESTA unidade
          const mapping = serviceTypes.find(s => s.item_name === itemName && s.unit_id === unitId);
          if (!mapping || mapping.category === 'ignorar') continue;

          // Função auxiliar para converter valores monetários da planilha
          const parseCurrency = (val: any) => {
            if (typeof val === 'string') {
              return parseFloat(val.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
            }
            return parseFloat(val) || 0;
          };

          const val = parseCurrency(rawValue);
          const comm = parseCurrency(rawComm);

          // Lógica Especial: Se for mapeado como Assinatura mas tiver comissão > 0, 
          // significa que foi cobrado de forma avulsa.
          const finalCategory = (mapping.category === 'assinatura' && comm > 0) ? 'avulso' : mapping.category;

          newRecords.push({
            cycle_id: activeCycleId,
            unit_id: unitId,
            barber_name: barberName,
            item_name: itemName,
            category: finalCategory,
            value: val,
            commission: comm,
            duration_minutes: finalCategory === 'assinatura' ? (mapping.duration_minutes || 0) : 0,
            service_date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
          });
        }

        if (newRecords.length > 0) {
          // Salva no Supabase
          const { error } = await supabase.from('commission_records').insert(newRecords);
          if (error) throw error;
          
          setUploadStatus({ type: 'success', text: `${newRecords.length} registros importados com sucesso!` });
          onRefresh();
        } else {
          setUploadStatus({ type: 'error', text: 'Nenhum registro compatível encontrado na planilha.' });
        }
      } catch (err) {
        console.error(err);
        setUploadStatus({ type: 'error', text: 'Erro ao ler arquivo. Verifique se o formato está correto.' });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClearRecords = async () => {
    if (!activeCycleId || !unitId) return;
    if (!window.confirm('Isso apagará OS REGISTROS DESTA UNIDADE para este ciclo. O faturamento de assinaturas e os dados de outras unidades serão mantidos. Continuar?')) return;
    
    await supabase.from('commission_records').delete().match({ 
      cycle_id: activeCycleId,
      unit_id: unitId 
    });
    onRefresh();
  };

  const cardStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' as const };
  const inputStyle = {
    padding: '10px 14px', backgroundColor: '#09090b', border: '1px solid #3f3f46',
    borderRadius: 8, color: '#f4f4f5', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Seletor de Ciclo */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--brand)" /> Ciclo Ativo
          </h3>
          <button onClick={handleCreateCycle} style={{
            padding: '8px 16px', backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid #27272a',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Plus size={14} /> Novo Mês
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {cycles.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCycle(c.id)}
              style={{
                position: 'relative',
                padding: '10px 20px', borderRadius: 10, border: '1px solid',
                cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                backgroundColor: activeCycleId === c.id ? '#27272a' : 'transparent',
                borderColor: activeCycleId === c.id ? 'var(--brand)' : '#27272a',
                color: activeCycleId === c.id ? 'white' : '#a1a1aa'
              }}
            >
              {c.month_year.split('-').reverse().join('/')}
              {c.status === 'closed' && (
                <span style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#10b981', color: 'white', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!activeCycle ? null : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {activeCycle.status === 'closed' ? (
                <button
                  onClick={async () => { if (await reopenCycle(activeCycle)) onRefresh(); }}
                  style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  ⚠️ Reabrir Mês (Desfazer)
                </button>
              ) : (
                <button
                  onClick={async () => { if (await closeCycle(activeCycle)) onRefresh(); }}
                  style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={16} /> Fechar Este Mês Definitivamente
                </button>
              )}
            </div>

            {activeCycle.status === 'closed' ? (
              <div style={{ ...cardStyle, padding: 32, textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: '#f4f4f5', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Mês Fechado e Consolidado</h3>
                <p style={{ color: '#a1a1aa', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>Os valores deste mês foram calculados globalmente e gravados permanentemente no Histórico.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Valor de Assinaturas */}
                    <div style={cardStyle}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Hash size={16} color="var(--brand)" /> Financeiro de Assinaturas
                        </h4>
                      </div>
                      <div style={{ padding: 24 }}>
                        <div style={{ marginBottom: 20 }}>
                          <p style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Total Acumulado Atual</p>
                          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', fontFamily: 'Space Grotesk' }}>
                            {formatCurrency(activeCycle.subscription_total)}
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            type="text"
                            placeholder="Novo valor total (ex: 12500,00)"
                            value={subTotal}
                            onChange={e => setSubTotal(e.target.value)}
                          />
                          <button
                            onClick={handleUpdateSubTotal}
                            style={{
                              padding: '10px 16px', backgroundColor: '#27272a', color: '#f4f4f5',
                              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13
                            }}
                          >
                            Atualizar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upload de Planilha */}
                    <div style={cardStyle}>
                      <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileSpreadsheet size={16} color="var(--brand)" /> Importar do AppBarber
                        </h4>
                      </div>
                      <div style={{ padding: 24 }}>
                        <label style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: 30, border: '2px dashed #27272a', borderRadius: 12, cursor: 'pointer',
                          backgroundColor: 'rgba(9,9,11,0.5)', transition: 'border-color 0.2s',
                          pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1
                        }}>
                          <Upload size={32} color="#52525b" style={{ marginBottom: 12 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#a1a1aa' }}>Clique para selecionar a planilha (.xlsx ou .csv)</span>
                          <span style={{ fontSize: 12, color: '#52525b', marginTop: 4 }}>Arraste o arquivo ou clique aqui</span>
                          <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>

                        {uploadStatus.text && (
                          <div style={{
                            marginTop: 16, padding: '12px 16px', borderRadius: 8, fontSize: 13,
                            display: 'flex', alignItems: 'center', gap: 8,
                            backgroundColor: uploadStatus.type === 'success' ? 'rgba(34,197,94,0.1)' : uploadStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                            color: uploadStatus.type === 'success' ? '#4ade80' : uploadStatus.type === 'error' ? '#f87171' : '#60a5fa',
                            border: '1px solid currentColor'
                          }}>
                            {uploadStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {uploadStatus.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Histórico/Ações do Ciclo */}
                  <div style={cardStyle}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ color: '#f4f4f5', fontWeight: 600 }}>Dados Importados</h4>
                        <p style={{ fontSize: 12, color: '#71717a' }}>
                          {records.filter(r => r.cycle_id === activeCycle.id && r.unit_id === unitId).length} lançamentos desta unidade neste ciclo
                        </p>
                      </div>
                      <button
                        onClick={handleClearRecords}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                          backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600
                        }}
                      >
                        <Trash2 size={14} /> Limpar Dados
                      </button>
                    </div>
                    <div style={{ padding: 24 }}>
                      <p style={{ color: '#52525b', fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>
                        Para atualizar o ranking semanal, basta fazer o upload da planilha atualizada. O sistema soma os dados novos ao que já foi importado. Se quiser recomeçar a semana, use o botão "Limpar Dados".
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={cardStyle}>
                  <ManualMinutesEditor
                    cycle={activeCycle}
                    barbers={barbers}
                    initialManualMinutes={manualMinutes}
                    onSave={onRefresh}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
