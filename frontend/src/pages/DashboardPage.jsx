import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Building2, Home, CreditCard, Wrench, Users, AlertCircle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, color, sub, className = '' }) => (
  <div className={clsx("stat-card animate-fade-in flex flex-col justify-between", className)}>
    <div className={clsx('stat-icon', color)}>
      <Icon size={22} />
    </div>
    <div className="mt-4">
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-3xl font-bold text-slate-100 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in w-full">
      {user?.role !== 'landlord' && (
        <div className={clsx("mb-8 p-6 pb-0", {
          "font-quicksand": user?.role === 'tenant'
        })}>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            {greeting()}, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-slate-400 mt-2 text-base font-medium">Here's what's happening with your properties today.</p>
        </div>
      )}

      {user?.role === 'admin' && data && (
        <div className="p-6 pt-0 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} label="Total Users" value={data.users?.reduce((a, u) => a + parseInt(u.total || 0), 0)} color="bg-violet-500/15 text-violet-400" />
            <StatCard icon={Building2} label="Properties" value={data.properties?.total} color="bg-primary-500/15 text-primary-400" />
            <StatCard icon={Home} label="Occupied Units" value={data.units?.find(u => u.status === 'occupied')?.total || 0} sub={`of ${data.units?.reduce((a, u) => a + parseInt(u.total || 0), 0) || 0} total`} color="bg-emerald-500/15 text-emerald-400" />
            <StatCard icon={CreditCard} label="This Month Revenue" value={`KES ${Number(data.current_month_revenue || 0).toLocaleString()}`} color="bg-amber-500/15 text-amber-400" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Unit Occupancy Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.units?.map(u => ({ name: u.status, value: parseInt(u.total || 0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">User Breakdown</h3>
              <div className="space-y-3">
                {data.users?.map(u => (
                  <div key={u.role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 capitalize">{u.role}s</span>
                    <span className="text-sm font-semibold text-slate-200">{u.total}</span>
                  </div>
                ))}
              </div>
              {data.pending_maintenance > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-amber-400">
                  <Wrench size={14} />
                  <span className="text-xs">{data.pending_maintenance} pending maintenance</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'landlord' && data && (
        <div className="font-outfit">
          {/* Landlord Hero Banner */}
          <div className="relative w-full h-[50vh] min-h-[360px] mb-10 flex flex-col justify-end overflow-hidden">
            {/* Background image — sharp, no zoom */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/landlord-bg.jpg')" }} />
            {/* Booking.com-style flat blue tint — slightly heavier for text contrast */}
            <div className="absolute inset-0" style={{ background: 'rgba(3, 44, 110, 0.62)' }} />
            {/* Bottom gradient for text area */}
            <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.5) 50%, transparent 100%)' }} />
            {/* Text content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8 sm:px-12 pb-10">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Landlord Dashboard
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white mb-3 tracking-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,1)' }}>
                {greeting()}, {user?.first_name || user?.username} 👋
              </h1>
              <p className="text-white text-lg font-semibold" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>Welcome back. Here's what's happening with your properties today.</p>
              <div className="h-[2px] w-24 bg-gradient-to-r from-white/60 to-transparent mt-5 rounded-full" />
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Building2} label="My Properties" value={data.properties} color="bg-primary-500/15 text-primary-400" />
            <StatCard icon={Home} label="Occupied Units" value={data.units?.find(u => u.status === 'occupied')?.count || 0} sub={`of ${data.units?.reduce((a, u) => a + parseInt(u.count), 0)} total`} color="bg-emerald-500/15 text-emerald-400" />
            <StatCard icon={CreditCard} label="This Month Revenue" value={`KES ${Number(data.current_month_revenue || 0).toLocaleString()}`} color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={AlertCircle} label="Rent Arrears" value={data.arrears_count || 0} sub="tenants this month" color="bg-red-500/15 text-red-400" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Unit Occupancy</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.units?.map(u => ({ name: u.status, value: parseInt(u.count) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Add New Property', path: '/app/properties', icon: Building2 },
                  { label: 'Record Payment', path: '/app/payments', icon: CreditCard },
                  { label: 'View Maintenance', path: '/app/maintenance', icon: Wrench },
                  { label: 'Manage Relocations', path: '/app/relocations', icon: MapPin },
                ].map(({ label, path, icon: Icon }) => (
                  <a key={path} href={path} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-colors group">
                    <Icon size={16} className="text-slate-500 group-hover:text-primary-400 transition-colors" />
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
                  </a>
                ))}
              </div>
              {data.open_maintenance > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-amber-400">
                  <Wrench size={14} />
                  <span className="text-xs">{data.open_maintenance} pending maintenance requests</span>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {user?.role === 'tenant' && data && (
        <div className="font-quicksand">
          {/* Tenant Hero Banner */}
          <div className="relative w-full h-[50vh] min-h-[360px] mb-10 flex flex-col justify-end overflow-hidden">
            {/* Background image — sharp, no zoom */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/tenant-bg.jpg')" }} />
            {/* Booking.com-style flat blue tint — slightly heavier for text contrast */}
            <div className="absolute inset-0" style={{ background: 'rgba(3, 44, 110, 0.62)' }} />
            {/* Bottom gradient for text area */}
            <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.5) 50%, transparent 100%)' }} />
            {/* Text content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8 sm:px-12 pb-10">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 text-xs font-bold text-white uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                Tenant Portal
              </span>
              <h1 className="text-4xl sm:text-6xl font-black text-white mb-3 tracking-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,1)' }}>
                Welcome back, {user?.first_name || user?.username} 👋
              </h1>
              <p className="text-white text-lg font-semibold" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>Here's a summary of your current lease and payment history.</p>
              <div className="h-[2px] w-24 bg-gradient-to-r from-white/60 to-transparent mt-5 rounded-full" />
            </div>
          </div>

          {/* Tenant Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-6 max-w-7xl mx-auto">
            <div className="xl:col-span-2 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <h3 className="text-lg font-extrabold text-slate-800 mb-8 flex items-center gap-3">
                <Home className="text-primary-600" size={24} /> My Current Lease
              </h3>
              <div className="flex flex-col h-full justify-between relative z-10">
                {data.active_lease ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {[['Property', data.active_lease.property_name], ['Unit', data.active_lease.unit_number]].map(([k, v]) => (
                        <div key={k} className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                          <span className="text-slate-500 text-sm font-semibold block mb-1">{k}</span>
                          <span className="text-slate-900 text-xl font-extrabold">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                        <span className="text-emerald-700 text-sm font-semibold block mb-1">Monthly Rent</span>
                        <span className="text-emerald-700 text-2xl font-extrabold flex items-baseline gap-1">
                          <span className="text-sm font-semibold">KES</span> {Number(data.active_lease.rent_amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-slate-500 text-sm font-semibold block mb-1">Status</span>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                            <span className="text-emerald-600 font-extrabold">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Home className="text-slate-400" size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-700 mb-2">No Active Lease</h4>
                    <p className="text-slate-500">You do not have an active lease linked to your account yet.</p>
                  </div>
                )}
                <Link to="/app/relocations" className="mt-8 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all font-bold text-base w-full sm:w-auto self-end px-8">
                  <MapPin size={20} /> Request Relocation
                </Link>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl p-6 flex flex-col">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                <CreditCard className="text-primary-600" size={24} /> Payment History
              </h3>
              {data.recent_payments?.length > 0 ? (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {data.recent_payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-base text-slate-800 font-bold">{p.payment_month}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-0.5">{p.method}</p>
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-emerald-600">
                        KES {Number(p.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <CreditCard className="text-slate-300 mb-3" size={32} />
                  <p className="text-slate-500 font-medium">No payments recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}