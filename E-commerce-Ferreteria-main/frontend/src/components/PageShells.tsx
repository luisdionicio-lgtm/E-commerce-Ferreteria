import type { ReactNode } from 'react';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import { Navigate } from '../state/navigation';
import { useApp } from '../state/context';
import { Loading } from './ui';
export function StorePage({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
export function AdminPage({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, ready } = useApp();
  if (!ready) return <Loading />;
  if (adminOnly && user && user.role !== 'ADMIN')
    return <Navigate to={user.role === 'CUSTOMER' ? '/mi-cuenta' : '/admin/dashboard'} replace />;
  return <AdminLayout>{children}</AdminLayout>;
}
