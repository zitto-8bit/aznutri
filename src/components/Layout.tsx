import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const currentPath = window.location.pathname;

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
