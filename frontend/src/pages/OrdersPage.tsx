import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { StoreLayout } from '../components/StoreLayout';
import { Orders } from './Orders';

export const OrdersPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="w-6 h-6 border-2 border-[var(--primary-glow)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <StoreLayout pageTitle="My Orders" activeTab="orders">
      <Orders />
    </StoreLayout>
  );
};
