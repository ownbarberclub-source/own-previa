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

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            Minutagem Manual de Assinaturas
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Insira os minutos acumulados dos barbeiros para o ciclo {cycle.month_year}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-red-600/20"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {feedback && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          feedback.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {feedback.type === 'success' ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(barber => (
          <div key={barber.id} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50 focus-within:border-red-500/50 transition-colors">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              {barber.name}
            </label>
            <div className="relative">
              <input
                type="number"
                value={editingMinutes[barber.id] || ''}
                onChange={(e) => setEditingMinutes(prev => ({ ...prev, [barber.id]: parseInt(e.target.value) || 0 }))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="0"
              />
              <span className="absolute right-3 top-2 text-zinc-500 text-sm">min</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-200/80 leading-relaxed">
          <strong>Regra de Cálculo:</strong> Se você inserir minutos aqui, o sistema irá ignorar automaticamente o tempo carregado via planilha para este barbeiro no cálculo do POT. Deixe em zero para continuar usando os dados da planilha.
        </p>
      </div>
    </div>
  );
}
