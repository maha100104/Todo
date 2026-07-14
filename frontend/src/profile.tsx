import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface ProfileProps {
  user: {
    name: string;
    email: string;
    id?: string | number;
    role?: string;
  };
  onNameUpdate: (newName: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onNameUpdate }) => {
  const { fetchWithAuth } = useAuth();

  // Profile details state
  const [name, setName] = useState(user.name);
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setProfileLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetchWithAuth('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update profile');
      }

      // Save back to localStorage
      localStorage.setItem(`user_name_${user.email.toLowerCase()}`, name.trim());
      onNameUpdate(name.trim());
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password cannot be the same as the old password.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetchWithAuth('/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update password');
      }

      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'An error occurred while changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Top Profile Header Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-6 bg-white/[0.01] border-b border-[var(--border-color)]">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-glow)] text-[var(--primary)] font-extrabold text-base flex items-center justify-center tracking-wider">
            {getInitials(user.name)}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[var(--text-heading)]">{user.name}</h2>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
          </div>
        </div>

        <div className="p-6">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs mb-5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs mb-5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2 pb-4 border-b border-[var(--border-color)] md:border-b-0">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Full Name</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-4 py-3 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-heading)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all mt-1 font-semibold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                ) : (
                  <div className="text-sm font-semibold text-[var(--text-heading)]">{user.name}</div>
                )}
              </div>

              <div className="space-y-2 pb-4 border-b border-[var(--border-color)] md:border-b-0">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address</div>
                <div className="text-sm font-semibold text-[var(--text-heading)]">{user.email}</div>
              </div>

              <div className="space-y-2 pb-4 border-b border-[var(--border-color)] md:border-b-0">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Account Role</div>
                <div className="text-sm font-semibold text-[var(--text-main)]">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    user.role === 'admin'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-white/5 text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Standard User'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-[var(--border-color)] md:border-b-0">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Account Status</div>
                <div className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-[var(--border-color)] md:border-b-0">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Member Since</div>
                <div className="text-sm font-semibold text-[var(--text-heading)]">July 2026</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--border-color)]">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
                    onClick={() => {
                      setName(user.name);
                      setIsEditing(false);
                      setErrorMsg(null);
                    }}
                    disabled={profileLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 cursor-pointer transition-all"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-[var(--border-color)]">
          <h3 className="text-base font-bold text-[var(--text-heading)]">Security Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Update your account password regularly to keep your credentials secure.</p>
        </div>

        <div className="p-6">
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs mb-5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs mb-5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              <div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Old Password</div>
                <div className="relative flex items-center w-full mt-1.5">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-white cursor-pointer"
                  >
                    {showOldPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">New Password</div>
                <div className="relative flex items-center w-full mt-1.5">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-white cursor-pointer"
                  >
                    {showNewPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Confirm New Password</div>
                <div className="relative flex items-center w-full mt-1.5">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-[var(--text-muted)] hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-[var(--border-color)]">
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Saved Addresses Card */}
      <AddressSection fetchWithAuth={fetchWithAuth} />

      {/* Theme Settings Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-[var(--border-color)]">
          <h3 className="text-base font-bold text-[var(--text-heading)]">Theme Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Choose between Light and Dark mode templates.</p>
        </div>

        <div className="p-6">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex-1 p-5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all font-semibold ${
                theme === 'light'
                  ? 'border-[var(--primary)] bg-white text-slate-900 shadow-md shadow-white/5'
                  : 'border-[var(--border-color)] bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Light Mode
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 p-5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all font-semibold ${
                theme === 'dark'
                  ? 'border-[var(--primary)] bg-slate-900 text-slate-100 shadow-md shadow-cyan-500/5'
                  : 'border-[var(--border-color)] bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              Dark Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Address Management Component
const AddressSection: React.FC<{ fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response> }> = ({ fetchWithAuth }) => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/address');
      if (res.ok) setAddresses(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const resetForm = () => {
    setForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    setEditId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    const { fullName, phone, addressLine1, city, state, pincode } = form;
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      setFormError('Please fill all required fields.');
      return;
    }
    setFormLoading(true);
    try {
      const url = editId ? `/address/${editId}` : '/address';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isDefault: addresses.length === 0 ? 1 : 0 }),
      });
      if (res.ok) {
        await loadAddresses();
        resetForm();
        setSuccessMsg(editId ? 'Address updated!' : 'Address added!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const err = await res.json();
        setFormError(err?.message || 'Failed to save address.');
      }
    } catch {
      setFormError('Network error.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/address/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAddresses();
        setSuccessMsg('Address deleted.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/address/${id}/default`, { method: 'PATCH' });
      if (res.ok) await loadAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (addr: any) => {
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setEditId(addr.id);
    setShowForm(true);
    setFormError('');
  };

  const inputClass =
    "w-full px-3 py-2 text-xs rounded-md border border-[var(--border-color)] bg-[var(--bg-app)] text-[var(--text-main)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all";

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 pb-4 border-b border-[var(--border-color)] flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-[var(--text-heading)]">Saved Addresses</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Manage your delivery addresses (max 10).</p>
        </div>
        {!showForm && addresses.length < 10 && (
          <button
            className="px-3 py-1.5 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 cursor-pointer transition-all"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Address
          </button>
        )}
      </div>

      <div className="p-6">
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs mb-4">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {showForm && (
          <div className="flex flex-col gap-3 p-5 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl mb-5 space-y-1">
            <h4 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
              {editId ? 'Edit Address' : 'New Address'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Full Name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className={inputClass} placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <input className={inputClass} placeholder="Address Line 1 *" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
            <input className={inputClass} placeholder="Address Line 2 (Optional)" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputClass} placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className={inputClass} placeholder="State *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <input className={`${inputClass} max-w-[140px]`} placeholder="Pincode *" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            {formError && <div className="text-red-500 text-[11px] font-semibold">{formError}</div>}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-[var(--border-color)] hover:bg-white/5 rounded-md text-xs font-semibold text-[var(--text-main)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={formLoading}
                className="px-4 py-2 bg-[var(--primary)] text-slate-900 font-bold rounded-md text-xs hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {formLoading ? 'Saving...' : editId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-xs text-[var(--text-muted)] text-center py-6">
            No addresses saved yet. Click "Add Address" to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr: any) => (
              <div
                key={addr.id}
                className={`p-4 rounded-xl border transition-all ${
                  addr.isDefault
                    ? 'border-[var(--primary)] bg-[var(--primary-glow)]/[0.04]'
                    : 'border-[var(--border-color)] bg-[var(--bg-app)]'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-[var(--text-heading)]">{addr.fullName}</strong>
                      {addr.isDefault === 1 && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-[var(--primary-glow)] text-[var(--primary)] font-bold">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      <br />
                      {addr.city}, {addr.state} – {addr.pincode}
                      <br />
                      📞 {addr.phone}
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs font-semibold flex-shrink-0">
                    {addr.isDefault !== 1 && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(addr)}
                      className="text-[var(--text-muted)] hover:text-white cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-red-500 hover:text-red-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
