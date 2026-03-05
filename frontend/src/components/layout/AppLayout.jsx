import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, Home, FileText, CreditCard,
  Wrench, Users, Menu, X, LogOut, Bell, Search, MessageSquare, ClipboardList, ShieldCheck, CheckCircle
} from 'lucide-react';

import clsx from 'clsx';
import toast from 'react-hot-toast';

const navItems = {
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Approvals', icon: CheckCircle, path: '/app/admin/properties' },
    { label: 'Landlords', icon: ShieldCheck, path: '/app/admin/landlords' },
    { label: 'Units', icon: Home, path: '/app/units' },
    { label: 'Users', icon: Users, path: '/app/users' },
    { label: 'Leases', icon: FileText, path: '/app/leases' },
    { label: 'Payments', icon: CreditCard, path: '/app/payments' },
    { label: 'Complaints', icon: ClipboardList, path: '/app/complaints' },
    { label: 'Maintenance', icon: Wrench, path: '/app/maintenance' },
  ],

  landlord: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Properties', icon: Building2, path: '/app/properties' },
    { label: 'Units', icon: Home, path: '/app/units' },
    { label: 'Leases', icon: FileText, path: '/app/leases' },
    { label: 'Requests', icon: MessageSquare, path: '/app/lease-requests' },
    { label: 'Payments', icon: CreditCard, path: '/app/payments' },
    { label: 'Complaints', icon: ClipboardList, path: '/app/complaints' },
    { label: 'Maintenance', icon: Wrench, path: '/app/maintenance' },
  ],

  tenant: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Browse', icon: Search, path: '/marketplace' },
    { label: 'My Leases', icon: FileText, path: '/app/leases' },
    { label: 'Payments', icon: CreditCard, path: '/app/payments' },
    { label: 'Complaints', icon: ClipboardList, path: '/app/complaints' },
    { label: 'Maintenance', icon: Wrench, path: '/app/maintenance' },
  ],

};


const roleBadge = { admin: 'badge-red', landlord: 'badge-blue', tenant: 'badge-green' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center">
            <Building2 size={18} className="text-primary-400" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">RHMS</div>
            <div className="text-xs text-slate-500">Property Manager</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={clsx('sidebar-link', location.pathname === path && 'active')}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm">
            {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </div>
            <span className={clsx('badge text-xs', roleBadge[user?.role])}>{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800 animate-slide-in">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-200">
            <Menu size={22} />
          </button>
          <div className="flex-1 lg:flex-none" />
          <button className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <Bell size={18} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}