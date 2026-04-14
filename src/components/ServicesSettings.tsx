import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Scissors, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ServiceType } from '../types';

interface ServicesSettingsProps {
  serviceTypes: ServiceType[];
  onRefresh: () => void;
  unitId: string;
}

const CATEGORIES = [
  { value: 'assinatura', label: 'Assinatura (POT)' },
  { value: 'avulso', label: 'Avulso (corte/barba)' },
  { value: 'extra', label: 'Extra (sobrancelha etc.)' },
  { value: 'produto', label: 'Produto' },
  { value: 'bebida', label: 'Bebida' },
  { value: 'ignorar', label: 'Ignorar (não contabilizar)' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  assinatura: { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa' },
  avulso:     { bg: 'rgba(225,6,0,0.1)',    text: 'var(--brand)' },
  extra:      { bg: 'rgba(168,85,247,0.1)', text: '#c084fc' },
  produto:    { bg: 'rgba(34,197,94,0.1)',  text: '#4ade80' },
  ignorar:    { bg: 'rgba(113,113,122,0.1)', text: '#71717a' },
};

export function ServicesSettings({ serviceTypes, onRefresh, unitId }: ServicesSettingsProps) {
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ServiceType['category']>('assinatura');
  const [duration, setDuration] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState('');
  const [editCategory, setEditCategory] = useState<ServiceType['category']>('assinatura');
  const [editDuration, setEditDuration] = useState('');

  const filteredServices = serviceTypes.filter(s => 
    s.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !unitId) return;
    await supabase.from('commission_services').insert([{
      id: crypto.randomUUID(),
      unit_id: unitId,
      item_name: itemName.trim(),
      category,
      duration_minutes: parseInt(duration) || 0,
    }]);
    setItemName(''); setCategory('assinatura'); setDuration('');
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este serviço?')) return;
    await supabase.from('commission_services').delete().eq('id', id);
    onRefresh();
  };

  const startEdit = (s: ServiceType) => {
    setEditingId(s.id);
    setEditItem(s.item_name);
    setEditCategory(s.category);
    setEditDuration(String(s.duration_minutes));
  };

  const handleSaveEdit = async (id: string) => {
    await supabase.from('commission_services').update({
      item_name: editItem.trim(),
      category: editCategory,
      duration_minutes: parseInt(editDuration) || 0,
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
      {/* Alert */}
      <div style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ color: '#93c5fd', fontSize: 13, lineHeight: 1.6 }}>
          ⚠️ <strong>Importante:</strong> O campo "Nome do Item" deve ser exatamente igual ao texto que aparece na coluna <strong>Item</strong> da planilha exportada do AppBarber. O sistema usa esse texto para classificar cada linha automaticamente.
        </p>
      </div>

      {/* Add Form */}
      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="var(--brand)" /> Cadastrar Serviço ou Produto
          </h3>
        </div>
        <div style={{ padding: 24 }}>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 220px 160px auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>Nome do Item (exato da planilha)</label>
              <input style={input} value={itemName} onChange={e => setItemName(e.target.value)} placeholder='Ex: Corte, Cerveja Heineken, Pomada...' required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>Categoria</label>
              <select style={{ ...input }} value={category} onChange={e => setCategory(e.target.value as ServiceType['category'])}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 6 }}>Duração (min)</label>
              <input style={input} type="number" min="0" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex: 45" />
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
            <Scissors size={18} color="var(--brand)" /> Itens Mapeados ({serviceTypes.length})
          </h3>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} color="#71717a" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              style={{ ...input, paddingLeft: 36, height: 36 }} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Pesquisar item ou categoria..." 
            />
          </div>
        </div>
        <div>
          {filteredServices.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#52525b', padding: '40px 24px', fontSize: 14 }}>
              {searchTerm ? 'Nenhum item encontrado com esse termo.' : 'Nenhum serviço ou produto mapeado. Adicione os itens da sua planilha do AppBarber acima.'}
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(9,9,11,0.5)' }}>
                  {['Nome do Item', 'Categoria', 'Duração', ''].map(h => (
                    <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, color: '#52525b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                 {filteredServices.map(s => (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderTop: '1px solid #27272a' }}>
                      <td style={{ padding: '14px 24px', color: '#e4e4e7', fontWeight: 500, fontSize: 13 }}>{s.item_name}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{
                          backgroundColor: CATEGORY_COLORS[s.category]?.bg || '#27272a',
                          color: CATEGORY_COLORS[s.category]?.text || '#a1a1aa',
                          padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        }}>
                          {CATEGORIES.find(c => c.value === s.category)?.label || s.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#a1a1aa', fontSize: 13 }}>
                        {s.category === 'assinatura' ? `${s.duration_minutes} min` : '—'}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => startEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }}><Edit2 size={15} /></button>
                          <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                    {editingId === s.id && (
                      <tr style={{ borderTop: '1px solid rgba(225,6,0,0.2)', backgroundColor: 'rgba(225,6,0,0.03)' }}>
                        <td colSpan={4} style={{ padding: 20 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 4 }}>Item (exato)</label>
                              <input style={input} value={editItem} onChange={e => setEditItem(e.target.value)} />
                            </div>
                            <div style={{ width: 200 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 4 }}>Categoria</label>
                              <select style={{ ...input }} value={editCategory} onChange={e => setEditCategory(e.target.value as ServiceType['category'])}>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                              </select>
                            </div>
                            <div style={{ width: 120 }}>
                              <label style={{ display: 'block', fontSize: 12, color: '#71717a', marginBottom: 4 }}>Min</label>
                              <input style={input} type="number" value={editDuration} onChange={e => setEditDuration(e.target.value)} />
                            </div>
                            <button onClick={() => handleSaveEdit(s.id)} style={{ padding: '10px 14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={14} /> Salvar
                            </button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '10px 14px', backgroundColor: '#27272a', color: '#a1a1aa', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <X size={14} />
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
