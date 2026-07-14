import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LogoutPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      await logout();
      navigate('/login');
    };
    doLogout();
  }, [logout, navigate]);
  return (
    <div className="flex justify-center items-center min-h-screen bg-radial-[circle_at_top_right] from-indigo-500/8 to-transparent via-transparent bg-[var(--bg-app)] p-5 relative overflow-hidden">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-10 w-full max-w-[440px] shadow-xl relative overflow-hidden transition-all duration-300 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[var(--primary)] before:to-purple-500 text-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 border-4 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
          <h2 className="text-xl font-bold text-[var(--text-heading)]">Signing Out</h2>
          <p className="text-xs text-[var(--text-muted)]">Safely clearing your session. Please wait...</p>
        </div>
      </div>
    </div>
  );
};
