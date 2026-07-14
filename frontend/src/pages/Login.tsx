import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export const LoginPage: React.FC = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const registeredEmail = location.state?.registeredEmail;

  // Show register toast once if just navigated from register
  React.useEffect(() => {
    if (registeredEmail) {
      showToast.success('Registration successful! Please login.');
    }
  }, [registeredEmail]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      await login(data.accessToken, data.refreshToken, email);
      showToast.success('Login Successful!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
      showToast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[var(--bg-app)] p-5 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-[440px] shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] to-purple-500" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)] text-slate-900 font-extrabold text-xl mb-4 shadow-lg" style={{boxShadow: '0 4px 14px rgba(20,184,166,0.35)'}}>A</div>
            <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-1">Welcome Back</h2>
            <p className="text-xs text-[var(--text-muted)]">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs mb-5 text-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-heading)]" htmlFor="login-email">Email Address</label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="login-email"
                  type="email"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-heading)]" htmlFor="login-password">Password</label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer transition-colors"
                >
                  {showPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[var(--primary)] text-slate-900 font-bold rounded-lg text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex justify-center items-center gap-2 mt-2"
              style={{boxShadow: '0 4px 12px rgba(20,184,166,0.25)'}}
              disabled={loading}
            >
              {loading ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Don't have an account?{' '}
            <span className="text-[var(--primary)] font-bold cursor-pointer hover:underline" onClick={() => navigate('/register')}>
              Sign Up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      localStorage.setItem(`user_name_${email.toLowerCase()}`, name);
      showToast.success('Registration successful!');
      navigate('/login', { state: { registeredEmail: email } });
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      showToast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[var(--bg-app)] p-5 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-[440px] shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--primary)] to-purple-500" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)] text-slate-900 font-extrabold text-xl mb-4 shadow-lg" style={{boxShadow: '0 4px 14px rgba(20,184,166,0.35)'}}>A</div>
            <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-1">Create Account</h2>
            <p className="text-xs text-[var(--text-muted)]">Get started with your new account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs mb-5 text-left">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-heading)]" htmlFor="register-name">Full Name</label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="register-name"
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="Maha Lakshmi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-heading)]" htmlFor="register-email">Email Address</label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="register-email"
                  type="email"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-[var(--text-heading)]" htmlFor="register-password">Password</label>
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer transition-colors"
                >
                  {showPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[var(--primary)] text-slate-900 font-bold rounded-lg text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex justify-center items-center gap-2 mt-2"
              style={{boxShadow: '0 4px 12px rgba(20,184,166,0.25)'}}
              disabled={loading}
            >
              {loading ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[var(--text-muted)]">
            Already have an account?{' '}
            <span className="text-[var(--primary)] font-bold cursor-pointer hover:underline" onClick={() => navigate('/login')}>
              Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
