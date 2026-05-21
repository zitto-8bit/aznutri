import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, LogIn } from 'lucide-react';

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetErrorBoundary, message }) => {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Tenta deslogar do Supabase
      await supabase.auth.signOut();
      
      // Limpa os storages locais para garantir
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Erro ao efetuar sign out:', e);
    } finally {
      // Força recarregamento indo para a página de login
      window.location.href = '/login';
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF 100%)' }}>
      <div className="auth-card" style={{ maxWidth: '500px', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid #FEE2E2', animation: 'fadeIn 0.5s ease-out' }}>
        
        {/* Logo */}
        <div className="logo-container" style={{ marginBottom: '24px' }}>
          <img src="/logo.png" alt="NutriSystem A-Z" className="logo-image" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <h1 className="logo-text" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-green)' }}>
            NutriSystem <span style={{ color: 'var(--primary-orange)' }}>A-Z</span>
          </h1>
        </div>

        {/* Mascote / Ilustração de Erro */}
        <div style={{ position: 'relative', margin: '0 auto 24px auto', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: '#FEE2E2',
            borderRadius: '50%',
            animation: 'pulse 2s infinite',
            zIndex: 1
          }}></div>
          <img 
            src="/mascot.png" 
            alt="Mascote Nutri A-Z" 
            style={{ 
              width: '90px', 
              height: '90px', 
              objectFit: 'contain', 
              zIndex: 2, 
              filter: 'grayscale(0.3) contrast(0.9)',
              animation: 'float 3s ease-in-out infinite' 
            }} 
          />
          <div style={{
            position: 'absolute',
            bottom: '5px',
            right: '5px',
            backgroundColor: 'var(--error)',
            color: 'white',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 3
          }}>
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Título de Erro */}
        <h2 className="auth-title" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '10px' }}>
          Ops! Ocorreu um contratempo
        </h2>

        {/* Descrição e Detalhes */}
        <p className="auth-subtitle" style={{ fontSize: '14.5px', color: 'var(--gray-500)', lineHeight: '1.6', marginBottom: '24px' }}>
          {message || 'Algo deu errado durante a execução do aplicativo. Para sua segurança e consistência dos dados, sugerimos realizar o login novamente.'}
        </p>

        {error && (
          <div style={{ 
            backgroundColor: '#F9FAFB', 
            border: '1px solid var(--gray-200)', 
            borderRadius: '8px', 
            padding: '12px', 
            fontSize: '11px', 
            fontFamily: 'monospace', 
            color: '#D32F2F', 
            textAlign: 'left', 
            maxHeight: '120px', 
            overflowY: 'auto', 
            marginBottom: '24px',
            whiteSpace: 'pre-wrap'
          }}>
            <strong>Detalhes técnicos:</strong> {error.message}
          </div>
        )}

        {/* Botão de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleLogout} 
            disabled={loading}
            style={{ 
              backgroundColor: 'var(--primary-green)', 
              color: 'white', 
              padding: '14px', 
              borderRadius: '8px', 
              fontSize: '15px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              boxShadow: 'var(--shadow-md)',
              transition: 'var(--transition)'
            }}
          >
            <span>{loading ? 'Saindo...' : 'Fazer Login Novamente'}</span>
            <LogIn size={18} />
          </button>

          {resetErrorBoundary && (
            <button 
              type="button" 
              onClick={resetErrorBoundary}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-green)',
                fontWeight: '600',
                fontSize: '13.5px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default ErrorPage;
