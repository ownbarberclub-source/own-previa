import React, { useState, useEffect } from 'react';
import { Save, Clock, History, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Barber, ManualMinutes, Cycle } from '../types';

interface ManualMinutesEditorProps {
  cycle: Cycle;
  barbers: Barber[];
  initialManualMinutes: ManualMinutes[];
  onSave: () => void;
}

export function ManualMinutesEditor({ cycle, barbers, initialManualMinutes, onSave }: ManualMinutesEditorProps) {
  const [editingMinutes, setEditingMinutes] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const initial: Record<string, number> = {};
    barbers.forEach(b => {
      const existing = initialManualMinutes.find(m => m.barber_id === b.id && m.cycle_id === cycle.id);
      initial[b.id] = existing ? existing.minutes : 0;
    });
    setEditingMinutes(initial);
  }, [barbers, initialManualMinutes, cycle]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    
    try {
      const upserts = barbers.map(b => ({
        cycle_id: cycle.id,
        barber_id: b.id,
        minutes: editingMinutes[b.id] || 0
      }));

      const { error } = await supabase
        .from('commission_manual_minutes')
        .upsert(upserts, { onConflict: 'cycle_id,barber_id' });

      if (error) throw error;

      setFeedback({ type: 'success', msg: 'Minutos salvos com sucesso!' });
      onSave();
    } catch (err: any) {
      console.error('Erro ao salvar minutos:', err);
      setFeedback({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const cardStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 24, marginTop: 24 };
  const inputStyle = {
    width: '100%', padding: '10px 14px', backgroundColor: '#09090b', border: '1px solid #3f3f46',
    borderRadius: 8, color: '#f4f4f5', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, margin: 0 }}>
            <Clock size={20} color="var(--brand)" /> Minutagem Manual de Assinaturas
          </h3>
          <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4, marginBottom: 0 }}>
            Insira os minutos acumulados dos barbeiros para o ciclo {cycle.month_year}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            backgroundColor: saving ? '#52525b' : 'var(--brand)', 
            color: '#fff', border: 'none',
            borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700,
            boxShadow: saving ? 'none' : '0 4px 14px 0 rgba(225, 6, 0, 0.39)', transition: 'background 0.2s'
          }}
        >
          {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {feedback && (
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 8, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: feedback.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: feedback.type === 'success' ? '#4ade80' : '#f87171',
          border: '1px solid currentColor'
        }}>
          {feedback.type === 'success' ? <Save size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {barbers.map(barber => (
          <div key={barber.id} style={{
            backgroundColor: 'rgba(9,9,11,0.5)', padding: 16, borderRadius: 12, border: '1px solid rgba(63,63,70,0.5)'
          }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f4f4f5', marginBottom: 8 }}>
              {barber.name}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={editingMinutes[barber.id] || ''}
                onChange={(e) => setEditingMinutes(prev => ({ ...prev, [barber.id]: parseInt(e.target.value) || 0 }))}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="0"
              />
              <span style={{ position: 'absolute', right: 12, top: 10, color: '#71717a', fontSize: 13 }}>min</span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: 24, display: 'flex', alignItems: 'flex-start', gap: 12,
        backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', padding: 16, borderRadius: 12
      }}>
        <AlertCircle size={20} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, color: 'rgba(191,219,254,0.8)', margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: '#60a5fa' }}>Regra de Cálculo:</strong> Se você inserir minutos aqui, o sistema irá ignorar automaticamente o tempo carregado via planilha para este barbeiro no cálculo do POT. Deixe em zero (ou vazio) para continuar usando os dados da planilha.
        </p>
      </div>
      
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
