import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Navbar } from '../components/Navbar';
import type { User, AccountStats, RecentActivity } from '../types/todo';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEdit3,
  FiLock,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiList,
  FiAlertTriangle,
  FiArrowLeft,
  FiSun,
  FiMoon,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState<User | null>(authUser);
  const [stats, setStats] = useState<AccountStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit profile state (phone number empty by default unless saved by user)
  const [name, setName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [updatingProfile, setUpdatingProfile] = useState<boolean>(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [updatingPassword, setUpdatingPassword] = useState<boolean>(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      if (response.data?.user) {
        const u = response.data.user;
        setProfileData(u);
        setName(u.name || '');
        setPhoneNumber(u.phoneNumber || '');
        updateUser(u);
      }
      if (response.data?.stats) {
        setStats(response.data.stats);
      }
      if (response.data?.recentActivities) {
        setActivities(response.data.recentActivities);
      }
    } catch (err) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const response = await api.patch('/auth/profile', {
        name,
        phoneNumber: phoneNumber.trim(),
      });
      if (response.data?.user) {
        setProfileData(response.data.user);
        updateUser(response.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentPassword === newPassword) {
      toast.error('New password and current password cannot be the same');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const memberSinceFormatted = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    : 'July 2026';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-teal-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col pb-12">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation back to dashboard */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to Tasks</span>
          </Link>
          <span className="text-xs px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-slate-400 flex items-center gap-1.5">
            <FiCalendar className="text-teal-400 w-3.5 h-3.5" />
            Member Since {memberSinceFormatted}
          </span>
        </div>

        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border-2 border-teal-500/40 flex items-center justify-center text-teal-300 font-extrabold text-3xl shadow-lg">
            {profileData?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {profileData?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700/50">
                <FiMail className="text-teal-400" />
                {profileData?.email}
              </span>
              {profileData?.phoneNumber && profileData.phoneNumber.trim() !== '' && (
                <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700/50">
                  <FiPhone className="text-teal-400" />
                  {profileData.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Account Statistics Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <FiActivity className="text-teal-400" />
            Account Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
                <FiList className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats.total}</p>
            </div>

            <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-center text-amber-400/80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
                <FiClock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
            </div>

            <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-center text-blue-400/80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
                <FiLoader className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400">{stats.inProgress}</p>
            </div>

            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-center text-emerald-400/80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
                <FiCheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
            </div>

            <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm col-span-2 sm:col-span-1">
              <div className="flex justify-between items-center text-rose-400/80 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
                <FiAlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400">{stats.overdue}</p>
            </div>
          </div>
        </div>

        {/* Theme Preferences Selection Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FiSun className="text-amber-400" />
            Theme Preferences
          </h2>
          <p className="text-xs text-slate-400 mb-5">
            Customize the look and feel of your TaskFlow dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.success('Dark theme activated');
              }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all text-left ${theme === 'dark'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-300 ring-2 ring-teal-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 shrink-0">
                <FiMoon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dark Theme</p>
                <p className="text-xs text-slate-400 mt-0.5">Sleek dark interface with teal accents</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.success('Light theme activated');
              }}
              className={`p-5 rounded-2xl border flex items-center gap-4 transition-all text-left ${theme === 'light'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-300 ring-2 ring-teal-500/20'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500 shrink-0">
                <FiSun className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Light Theme</p>
                <p className="text-xs text-slate-400 mt-0.5">Clean light interface with high readability</p>
              </div>
            </button>
          </div>
        </div>

        {/* Edit Profile & Change Password Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Edit Profile Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiEdit3 className="text-teal-400" />
              Edit Profile
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-slate-500 lowercase">(Read-only)</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    disabled
                    value={profileData?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving Changes...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FiLock className="text-teal-400" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-400 transition-colors"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-400 transition-colors"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-teal-400 transition-colors"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 border border-teal-500/30 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {updatingPassword ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Activity Section (Last 5 activities) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
            <FiActivity className="text-teal-400" />
            Recent Activity (Last 5)
          </h2>

          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No recent activity found. Create or update tasks to see your activity timeline here!
            </p>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                    <span className="text-sm text-slate-200 font-medium">{act.text}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(act.time).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
