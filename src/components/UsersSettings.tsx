import React, { useState, useEffect } from 'react';
import { Shield, User as UserIcon, Check, X, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { UserProfile, UserRole } from '../types';

interface UsersSettingsProps {
  onRefresh: () => void;
}

export function UsersSettings({ onRefresh }: UsersSettingsProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    
    // Realtime para perfis
    const channel = supabase.channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_profiles' }, () => {
        loadUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('commission_profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, is_authorized: boolean) => {
    await supabase.from('commission_profiles').update({ is_authorized }).eq('id', id);
  };

  const updateRole = async (id: string, role: UserRole) => {
    await supabase.from('commission_profiles').update({ role }).eq('id', id);
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Excluir este usuário permanentemente?')) return;
    await supabase.from('commission_profiles').delete().eq('id', id);
    // Nota: A exclusão no auth.users deve ser feita via Edge Function ou Painel se não houver trigger.
  };

  const card = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 16, overflow: 'hidden' as const };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: 'rgba(225,6,0,0.05)', border: '1px solid rgba(225,6,0,0.1)', borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.6 }}>
          💡 <strong>Controle de Acessos:</strong> Novos usuários aparecem como "Inativos". Você deve autorizá-los e definir seu nível de acesso antes que possam ver os dados.
        </p>
      </div>

      <div style={card}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: '#f4f4f5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="var(--brand)" /> Gerenciamento de Usuários
          </h3>
          <span style={{ fontSize: 12, color: '#71717a' }}>{users.length} usuários</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(9,9,11,0.5)' }}>
                {['Usuário', 'Nível de Acesso', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, color: '#52525b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid #27272a' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#e4e4e7', fontWeight: 500, fontSize: 13 }}>{u.email}</span>
                      <span style={{ color: '#52525b', fontSize: 11 }}>ID: {u.id.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <select 
                      value={u.role} 
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      style={{
                        backgroundColor: '#09090b', color: u.role === 'admin' ? 'var(--brand)' : '#a1a1aa',
                        border: '1px solid #3f3f46', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none'
                      }}
                    >
                      <option value="admin">Administrador</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Visualizador</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span style={{
                      backgroundColor: u.is_authorized ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: u.is_authorized ? '#4ade80' : '#f87171',
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    }}>
                      {u.is_authorized ? 'AUTORIZADO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {u.is_authorized ? (
                        <button onClick={() => updateStatus(u.id, false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center' }} title="Revogar Acesso"><X size={16} /></button>
                      ) : (
                        <button onClick={() => updateStatus(u.id, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', display: 'flex', alignItems: 'center' }} title="Autorizar"><Check size={16} /></button>
                      )}
                      <button onClick={() => deleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#52525b', fontSize: 14 }}>Nenhum usuário cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
