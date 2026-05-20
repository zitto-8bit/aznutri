import React from 'react';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
  currentPath: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">NutriSystem <span>A-Z</span></div>
      </div>

      <nav className="sidebar-nav">
        <a 
          href="/dashboard" 
          className={`nav-item ${currentPath === '/dashboard' || currentPath === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </a>
        <a 
          href="/pacientes" 
          className={`nav-item ${currentPath === '/pacientes' ? 'active' : ''}`}
        >
          <Users size={20} />
          Pacientes
        </a>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
