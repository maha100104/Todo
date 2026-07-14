import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { LoginPage, RegisterPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ProductDetailPage } from './pages/ProductDetail';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { LogoutPage } from './pages/Logout';
import { AdminProductsPage } from './pages/AdminProducts';
import { AdminUsersPage } from './pages/AdminUsers';
import { UnauthorizedPage } from './pages/Unauthorized';
import { Toaster } from 'react-hot-toast';
const ProtectedRoute: React.FC<{ children: React.ReactNode; pageName?: string; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 3000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-heading)',
              border: '1px solid var(--border-color)',
            }
          }} 
        />
        <BrowserRouter>
          <Routes>
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute pageName="Dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/:id" 
              element={
                <ProtectedRoute pageName="Product Details">
                  <ProductDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute pageName="Profile">
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute pageName="Orders">
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute pageName="Product Management" adminOnly={true}>
                  <AdminProductsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute pageName="User Management" adminOnly={true}>
                  <AdminUsersPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
