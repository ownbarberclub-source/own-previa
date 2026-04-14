import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Barber } from '../types';

interface BarbersSettingsProps {
  barbers: Barber[];
  onRefresh: () => void;
  unitId: string;
}

export function BarbersSettings({ barbers, onRefresh, unitId }: BarbersSettingsProps) {
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');

  const filteredBarbers = barbers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rate || !unitId) return;
    await supabase.from('commission_barbers').insert([{
      id: crypto.randomUUID(),
      unit_id: unitId,
      name: name.trim(),
      avulso_rate: parseFloat(rate) / 100,
    }]);
    setName(''); setRate('');
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este barbeiro?')) return;
    await supabase.from('commission_barbers').delete().eq('id', id);
    onRefresh();
  };

  const startEdit = (b: Barber) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditRate(String(Math.round(b.avulso_rate * 100)));
  };

  const handleSaveEdit = async (id: string) => {
    await supabase.from('commission_barbers').update({
      name: editName.trim(),
      avulso_rate: parseFloat(editRate) / 100,
    }).eq('id', id);
    setEditingId(null);
    onRefresh();
  };

  const card = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' };
  const input = {
    padding: '10px 14px', backgroundColor: '#09090b', border: '1px solid #3f3f46',
    borderRadius: 8, color: '#f4f4f5', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add Form */}
      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="var(--brand)" /> Cadastrar Barbeiro
          </h3>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>Nome do Barbeiro</label>
              <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Guilherme" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>% Comissão Serviços (Avulsos/Extras)</label>
              <input style={input} type="number" min="0" max="100" value={rate} onChange={e => setRate(e.target.value)} placeholder="Ex: 30" required />
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

      {/* List */}
      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--brand)" /> Barbeiros Cadastrados
          </h3>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              style={{ ...input, paddingLeft: 36, height: 36 }} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Pesquisar barbeiro..." 
            />
          </div>
        </div>
        <div>
          {filteredBarbers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#52525b', padding: '40px 24px', fontSize: 14 }}>
              {searchTerm ? 'Nenhum barbeiro encontrado com esse nome.' : 'Nenhum barbeiro cadastrado ainda.'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(9,9,11,0.5)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>% Serviços</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 12, color: '#52525b', fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBarbers.map(b => (
                  <React.Fragment key={b.id}>
                    <tr style={{ borderTop: '1px solid #27272a' }}>
                      <td style={{ padding: '14px 24px', color: '#e4e4e7', fontWeight: 500 }}>{b.name}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ backgroundColor: 'rgba(225,6,0,0.1)', color: 'var(--brand)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, border: '1px solid rgba(225,6,0,0.2)' }}>
                          {Math.round(b.avulso_rate * 100)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }} title="Editar">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }} title="Remover">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === b.id && (
                      <tr style={{ borderTop: '1px solid rgba(225,6,0,0.2)', backgroundColor: 'rgba(225,6,0,0.03)' }}>
                        <td colSpan={3} style={{ padding: 20 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 4 }}>Nome</label>
                              <input style={input} value={editName} onChange={e => setEditName(e.target.value)} />
                            </div>
                            <div style={{ width: 160 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 4 }}>% Serviços</label>
                              <input style={input} type="number" min="0" max="100" value={editRate} onChange={e => setEditRate(e.target.value)} />
                            </div>
                            <button onClick={() => handleSaveEdit(b.id)} style={{ padding: '8px 14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
                              <Check size={14} /> Salvar
                            </button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '8px 14px', backgroundColor: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
