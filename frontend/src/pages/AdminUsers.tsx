import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { StoreLayout } from '../components/StoreLayout';
import { showToast } from '../utils/toast';
import { FaSearch, FaUser, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastUsedDate: string;
  orderCount: number;
}

export const AdminUsersPage: React.FC = () => {
  const { user, loading, fetchWithAuth } = useAuth();
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Search state
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter and Sort states
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'user'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'orders-desc', 'orders-asc', 'name-az', 'name-za'

  // Debounce search input by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInputValue]);

  const fetchUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    try {
      let url = `/auth/admin/users?sortBy=${sortBy}`;
      if (roleFilter !== 'all') {
        url += `&role=${roleFilter}`;
      }
      if (searchQuery.trim() !== '') {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsersList(data || []);
    } catch (err: any) {
      console.error(err);
      showToast.error(err.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, searchQuery, roleFilter, sortBy]);

  // Route protection
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Never';
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Never';
    }
  };

  return (
    <StoreLayout pageTitle="User Management">
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[var(--text-heading)]">Manage Users</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              View and manage registered users, logins activity and order statistics.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-main)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>Total Registered: {usersList.length}</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] text-xs text-[var(--text-main)] rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all placeholder-slate-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] text-xs text-[var(--text-main)] rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">User Role</option>
              <option value="admin">Admin Role</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-app)] border border-[var(--border-color)] text-xs text-[var(--text-main)] rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer"
            >
              <option value="newest">Newly Created (Default)</option>
              <option value="oldest">Oldest Created</option>
              <option value="orders-desc">Orders Count (High to Low)</option>
              <option value="orders-asc">Orders Count (Low to High)</option>
              <option value="name-az">Name (A to Z)</option>
              <option value="name-za">Name (Z to A)</option>
            </select>
          </div>
        </div>

        {/* User Table Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)] font-medium">Loading registered users...</span>
            </div>
          ) : usersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500">
                <FaUser size={20} />
              </div>
              <p className="text-sm font-bold text-[var(--text-main)]">No users found</p>
              <p className="text-xs text-[var(--text-muted)]">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-white/2 text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    <th className="py-4 px-6">User details</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Registered date</th>
                    <th className="py-4 px-6">Last used date</th>
                    <th className="py-4 px-6 text-center">Orders Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs text-[var(--text-main)]">
                  {usersList.map((usr) => (
                    <tr 
                      key={usr.id}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold uppercase shadow-sm">
                            {usr.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-[var(--text-heading)]">{usr.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <FaEnvelope className="opacity-60" size={10} />
                              {usr.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          usr.role === 'admin' 
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/15'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <FaCalendarAlt size={10} className="opacity-65" />
                          <span>{formatDate(usr.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <FaCalendarAlt size={10} className="opacity-65" />
                          <span>{formatDate(usr.lastUsedDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-black ${
                          usr.orderCount > 0 
                            ? 'bg-[var(--primary)] text-slate-900 shadow-md shadow-[var(--primary-glow)]/10' 
                            : 'bg-white/5 text-[var(--text-muted)]'
                        }`}>
                          {usr.orderCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
};
