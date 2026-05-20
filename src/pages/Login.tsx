import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) throw authError;
      
      // Redirect will be handled by App.tsx auth state listener
    } catch (err: any) {
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Bem-vinda de volta" subtitle="Acesse sua conta para gerenciar seus atendimentos.">
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <div className="input-wrapper">
            <Mail className="input-icon" />
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              type="password"
              className="form-input"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Entrando...' : (
            <>
              <span>Entrar</span>
              <LogIn size={20} />
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        Não tem conta? <a href="/register">Cadastre-se</a>
      </div>
    </AuthLayout>
  );
};

export default Login;
