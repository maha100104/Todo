import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaHome } from 'react-icons/fa';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-main)] p-6">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-red-500/5 rounded-full blur-3xl -z-10" />

      {/* Main glass card */}
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-teal-500" />

        {/* Lock Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-6 animate-bounce">
          <FaLock size={24} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-[var(--text-heading)] mb-2 tracking-tight">403</h1>
        <h2 className="text-lg font-bold text-[var(--text-heading)] mb-3">Access Denied</h2>
        
        {/* Description */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-8 max-w-sm mx-auto">
          You don't have authorization or sufficient permissions to access this restricted page. Please sign in with an administrator account or return to the main dashboard.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-slate-900 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[var(--primary-glow)]/10"
          >
            <FaHome /> Go to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-[var(--border-color)] text-[var(--text-main)] py-3 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
