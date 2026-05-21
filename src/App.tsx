import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PerfilPaciente from './pages/PerfilPaciente';
import ErrorPage from './pages/ErrorPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If logged in and on login/register, go to dashboard
      if (session && (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/')) {
        window.history.pushState({}, '', '/dashboard');
        setCurrentPath('/dashboard');
      }
      // If logged out and not on register, go to login
      if (!session && window.location.pathname !== '/register') {
        window.history.pushState({}, '', '/login');
        setCurrentPath('/login');
      }
    });

    // 3. Handle browser back/forward buttons
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Update path manually for internal navigation
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Intercept all link clicks for internal navigation
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const path = link.getAttribute('href') || '/';
        navigate(path);
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--gray-50)' }}>
        <div style={{ border: '4px solid var(--gray-200)', borderTop: '4px solid var(--primary-green)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Rota de erro acessível independentemente da sessão
  if (currentPath === '/erro' || currentPath === '/error') {
    return <ErrorPage message="Ocorreu um erro no sistema. Sugerimos fazer login novamente." />;
  }

  // Auth Protection Logic
  if (!session) {
    if (currentPath === '/register') return <Register />;
    return <Login />;
  }

  // Logged in
  if (currentPath === '/pacientes') {
    return <Pacientes />;
  }

  if (currentPath.startsWith('/paciente/')) {
    const parts = currentPath.split('/');
    const pacienteId = parts[2];
    return <PerfilPaciente id={pacienteId} />;
  }

  if (currentPath === '/dashboard' || currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
    return <Dashboard />;
  }

  return <Dashboard />; // Default for authenticated users
}

export default App;
