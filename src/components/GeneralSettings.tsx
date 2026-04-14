import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, Percent } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Settings } from '../types';

interface GeneralSettingsProps {
  settings: Settings | null;
  onRefresh: () => void;
}

export function GeneralSettings({ settings, onRefresh }: GeneralSettingsProps) {
  const [potRate, setPotRate] = useState('');
  const [extraRate, setExtraRate] = useState('');
  const [productRate, setProductRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (settings) {
      setPotRate(String(Math.round(settings.pot_rate * 100)));
      setExtraRate(String(Math.round(settings.extra_rate * 100)));
      setProductRate(String(Math.round(settings.product_rate * 100)));
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const newSettings = {
      pot_rate: parseFloat(potRate) / 100,
      extra_rate: parseFloat(extraRate) / 100,
      product_rate: parseFloat(productRate) / 100,
    };

    try {
      if (settings?.id) {
        await supabase.from('commission_settings').update(newSettings).eq('id', settings.id);
      } else {
        await supabase.from('commission_settings').insert([{ id: crypto.randomUUID(), ...newSettings }]);
      }
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      onRefresh();
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setLoading(false);
    }
  };

  const card = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' as const };
  const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: 8 };
  const inputStyle = {
    padding: '12px 16px', backgroundColor: '#09090b', border: '1px solid #3f3f46',
    borderRadius: 10, color: '#f4f4f5', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--brand)" /> Taxas e Comissões Gerais
          </h3>
        </div>
        
        <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={inputGroup}>
            <label style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>
              Porcentagem das Assinaturas para o POT (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                style={inputStyle} 
                type="number" 
                value={potRate} 
                onChange={e => setPotRate(e.target.value)} 
                placeholder="Ex: 40" 
                required 
              />
              <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><Percent size={14} /></span>
            </div>
            <p style={{ fontSize: 12, color: '#52525b' }}>Define quanto do valor total arrecadado das assinaturas será dividido entre os barbeiros no POT.</p>
          </div>

          <div style={inputGroup}>
            <label style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>
              Comissão Geral para Serviços Extras (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                style={inputStyle} 
                type="number" 
                value={extraRate} 
                onChange={e => setExtraRate(e.target.value)} 
                placeholder="Ex: 10" 
                required 
              />
              <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><Percent size={14} /></span>
            </div>
            <p style={{ fontSize: 12, color: '#52525b' }}>Taxa de comissão padrão para serviços como sobrancelha, depilação, etc.</p>
          </div>

          <div style={inputGroup}>
            <label style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>
              Comissão Geral para Produtos e Bebidas (%)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                style={inputStyle} 
                type="number" 
                value={productRate} 
                onChange={e => setProductRate(e.target.value)} 
                placeholder="Ex: 10" 
                required 
              />
              <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }}><Percent size={14} /></span>
            </div>
            <p style={{ fontSize: 12, color: '#52525b' }}>Taxa de comissão padrão para venda de pomadas, refrigerantes, cervejas, etc.</p>
          </div>

          {message.text && (
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: 8, 
              fontSize: 14,
              backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '14px', backgroundColor: 'var(--brand)', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(225,6,0,0.2)',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
