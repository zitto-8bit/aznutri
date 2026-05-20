import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from '../components/AuthLayout';
import { User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [prefixo, setPrefixo] = useState('Dra.');
  const [pronome, setPronome] = useState('a');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      // 1. Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into nutricionistas table
        const { error: dbError } = await supabase
          .from('nutricionistas')
          .insert([
            { id: authData.user.id, nome, email, prefixo, pronome }
          ]);

        if (dbError) throw dbError;
        
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Conta criada!" subtitle="Sua conta foi criada com sucesso.">
        <div className="success-message">
          <CheckCircle size={20} />
          <span>Verifique seu email para confirmar o cadastro (se necessário) ou faça login.</span>
        </div>
        <a href="/login" className="btn-primary">Ir para Login</a>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crie sua conta" subtitle="Comece a gerenciar seus pacientes de forma profissional.">
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label className="form-label">Nome Completo</label>
          <div className="input-wrapper">
            <User className="input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Dra. Ana Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Prefixo Profissional</label>
            <select 
              className="form-select" 
              style={{ width: '100%', height: '42px', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff', outline: 'none' }}
              value={prefixo} 
              onChange={(e) => setPrefixo(e.target.value)}
            >
              <option value="Dra.">Dra.</option>
              <option value="Dr.">Dr.</option>
              <option value="Nutri.">Nutri.</option>
              <option value="">Nenhum prefixo</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tratamento / Pronome</label>
            <select 
              className="form-select" 
              style={{ width: '100%', height: '42px', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '0 12px', fontSize: '14px', backgroundColor: '#fff', outline: 'none' }}
              value={pronome} 
              onChange={(e) => setPronome(e.target.value)}
            >
              <option value="a">Bem-vinda</option>
              <option value="o">Bem-vindo</option>
              <option value="e">Bem-vinde</option>
              <option value="neutro">Olá (Sem gênero)</option>
            </select>
          </div>
        </div>

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
              placeholder="No mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirmar Senha</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              type="password"
              className="form-input"
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="auth-footer">
        Já tem conta? <a href="/login">Faça login</a>
      </div>
    </AuthLayout>
  );
};

export default Register;
