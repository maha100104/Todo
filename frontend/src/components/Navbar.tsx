import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCheckSquare, FiLogOut } from 'react-icons/fi';
import { ConfirmLogoutModal } from './ConfirmLogoutModal';
import toast from 'react-hot-toast';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 text-white transition-colors">
        <div className="max-w-6xl mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-3 group shrink-0">
            <div className="bg-gradient-to-tr from-indigo-500 to-teal-400 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
              <FiCheckSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <span className="font-extrabold text-sm sm:text-xl tracking-tight text-slate-900 dark:text-white inline-block">
                TaskFlow
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-teal-500/20 text-slate-950 dark:text-teal-400 font-extrabold border border-teal-500/40">
                Todo
              </span>
            </div>
          </Link>

          {user && (
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              <Link
                to="/profile"
                className={`flex items-center space-x-1.5 sm:space-x-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  location.pathname === '/profile'
                    ? 'bg-teal-500/20 text-slate-950 dark:text-teal-300 border-teal-500/40 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-900 dark:text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-500/20 text-slate-950 dark:text-teal-400 flex items-center justify-center font-extrabold text-[10px] sm:text-xs border border-teal-500/40 shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-bold">{user.name}</span>
              </Link>

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-400 hover:text-rose-400 bg-slate-800/60 hover:bg-rose-500/10 border border-slate-700/60 hover:border-rose-500/30 rounded-lg sm:rounded-xl transition-all"
                title="Logout"
              >
                <FiLogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900 dark:text-slate-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};
