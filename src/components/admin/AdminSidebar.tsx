import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/templates', label: 'Test Templates', icon: ClipboardList },
  { to: '/admin/candidates', label: 'Candidates', icon: Users },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-lg">SkillSphere</h1>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.to === '/admin/templates' && location.pathname.startsWith('/admin/templates'));
            
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
