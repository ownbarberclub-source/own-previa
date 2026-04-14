import React, { useState } from 'react';
import { Scissors, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (data.user) {
      // Criar o perfil inicial
      await supabase.from('commission_profiles').insert([{
        id: data.user.id,
        email: data.user.email,
        role: 'viewer',
        is_authorized: false
      }]);
      setMessage('Conta criada com sucesso! Aguarde a autorização de um administrador para acessar o sistema.');
      setMode('login');
    }
    setLoading(false);
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
          <p style={{ color: '#71717a', fontSize: 14, marginTop: 6 }}>
            {mode === 'login' ? 'Entre na sua conta' : 'Solicite seu acesso'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', fontWeight: 500, marginBottom: 6 }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
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

          {message && (
            <p style={{ color: '#4ade80', fontSize: 13, backgroundColor: 'rgba(34,197,94,0.1)', padding: '10px 14px', borderRadius: 8 }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px', backgroundColor: 'var(--brand)',
              color: 'white', border: 'none', borderRadius: 10, fontSize: 15,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(225,6,0,0.3)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Aguarde...' : (
              <>
                {mode === 'login' ? <Lock size={16} /> : <UserPlus size={16} />}
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto'
            }}
          >
            {mode === 'login' ? (
              <>Não tem uma conta? <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Cadastre-se</span> <ArrowRight size={14} /></>
            ) : (
              <>Já tem uma conta? <span style={{ color: 'var(--brand)', fontWeight: 600 }}>Faça Login</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
