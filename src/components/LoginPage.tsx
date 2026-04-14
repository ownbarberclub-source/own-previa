import React, { useState } from 'react';
import { Scissors, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(email, password);
    if (!ok) setError('E-mail ou senha incorretos.');
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#09090b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, padding: 40,
        backgroundColor: '#18181b', borderRadius: 20,
        border: '1px solid #27272a',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, backgroundColor: 'var(--brand)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(225,6,0,0.3)',
          }}>
            <Scissors size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>
            OWN <span style={{ color: 'var(--brand)' }}>PRÉVIA</span>
          </h1>
          <p style={{ color: '#71717a', fontSize: 14, marginTop: 6 }}>Sistema de Comissões — Admin</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', fontWeight: 500, marginBottom: 6 }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@ownbarberclub.com"
              style={{
                width: '100%', padding: '12px 16px', backgroundColor: '#09090b',
                border: '1px solid #3f3f46', borderRadius: 10, color: '#f4f4f5',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', fontWeight: 500, marginBottom: 6 }}>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', backgroundColor: '#09090b',
                border: '1px solid #3f3f46', borderRadius: 10, color: '#f4f4f5',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, backgroundColor: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: '13px', backgroundColor: 'var(--brand)',
              color: 'white', border: 'none', borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: 'pointer', marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(225,6,0,0.3)',
            }}
          >
            <Lock size={16} /> Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
