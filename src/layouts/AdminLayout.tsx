import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const AdminLayout = () => {
  const { isAuthenticated, userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || userType !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
