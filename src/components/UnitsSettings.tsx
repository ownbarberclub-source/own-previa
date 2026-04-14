import React, { useState, useEffect } from 'react';
import { Building2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Unit } from '../types';

interface UnitsSettingsProps {
  onRefresh: () => void;
}

export function UnitsSettings({ onRefresh }: UnitsSettingsProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    const { data } = await supabase.from('commission_units').select('*').order('name');
    if (data) setUnits(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const unitId = crypto.randomUUID();
    const { error } = await supabase.from('commission_units').insert([{
      id: unitId,
      name: name.trim(),
    }]);

    if (!error) {
      // Criar configurações padrão para a nova unidade
      await supabase.from('commission_settings').insert([{
        unit_id: unitId,
        pot_rate: 0.40,
        extra_rate: 0.30,
        product_rate: 0.10
      }]);
      
      setName('');
      loadUnits();
      onRefresh();
    }
  };

  const handleDelete = async (id: string, unitName: string) => {
    if (unitName === 'Matriz') {
      alert('A unidade Matriz não pode ser removida.');
      return;
    }
    if (!window.confirm(`Remover a unidade "${unitName}"? Isso não apagará os dados vinculados, mas eles ficarão inacessíveis.`)) return;
    await supabase.from('commission_units').delete().eq('id', id);
    loadUnits();
    onRefresh();
  };

  const handleSaveEdit = async (id: string) => {
    await supabase.from('commission_units').update({ name: editName.trim() }).eq('id', id);
    setEditingId(null);
    loadUnits();
    onRefresh();
  };

  const card = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' as const };
  const input = {
    padding: '10px 14px', backgroundColor: '#09090b', border: '1px solid #3f3f46',
    borderRadius: 8, color: '#f4f4f5', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="var(--brand)" /> Cadastrar Nova Unidade
          </h3>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>Nome da Unidade</label>
              <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Filial Shopping" required />
            </div>
            <button type="submit" style={{
              padding: '10px 20px', backgroundColor: 'var(--brand)', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Plus size={16} /> Adicionar
            </button>
          </form>
        </div>
      </div>

      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="var(--brand)" /> Unidades Cadastradas
          </h3>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(9,9,11,0.5)' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase' }}>Nome</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 12, color: '#52525b', fontWeight: 600 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderTop: '1px solid #27272a' }}>
                    <td style={{ padding: '14px 24px', color: '#e4e4e7', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditingId(u.id); setEditName(u.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(u.id, u.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr style={{ borderTop: '1px solid rgba(225,6,0,0.2)', backgroundColor: 'rgba(225,6,0,0.03)' }}>
                      <td colSpan={2} style={{ padding: 20 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <input style={input} value={editName} onChange={e => setEditName(e.target.value)} />
                          <button onClick={() => handleSaveEdit(u.id)} style={{ padding: '8px 14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '8px 14px', backgroundColor: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: 8, cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
