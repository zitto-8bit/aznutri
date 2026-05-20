import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src="/logo.png" alt="NutriSystem A-Z" className="logo-image" />
          <h1 className="logo-text">NutriSystem <span>A-Z</span></h1>
        </div>
        <h2 className="auth-title">{title}</h2>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
