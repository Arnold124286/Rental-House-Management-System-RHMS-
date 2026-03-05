import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Building2, Home, CreditCard, Wrench, Users, AlertCircle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card animate-fade-in">
    <div className={clsx('stat-icon', color)}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
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
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          {greeting()}, {user?.first_name || user?.username} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening with your properties today.</p>
      </div>

      {user?.role === 'admin' && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users} label="Total Users" value={data.users?.reduce((a, u) => a + parseInt(u.count), 0)} color="bg-violet-500/15 text-violet-400" />
            <StatCard icon={Building2} label="Properties" value={data.properties?.total} color="bg-primary-500/15 text-primary-400" />
            <StatCard icon={Home} label="Occupied Units" value={data.units?.find(u => u.status === 'occupied')?.count || 0} sub={`of ${data.units?.reduce((a, u) => a + parseInt(u.count), 0)} total`} color="bg-emerald-500/15 text-emerald-400" />
            <StatCard icon={CreditCard} label="This Month Revenue" value={`KES ${Number(data.current_month_revenue || 0).toLocaleString()}`} color="bg-amber-500/15 text-amber-400" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Unit Occupancy Status</h3>
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
              <h3 className="text-sm font-semibold text-slate-300 mb-4">User Breakdown</h3>
              <div className="space-y-3">
                {data.users?.map(u => (
                  <div key={u.role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-400 capitalize">{u.role}s</span>
                    <span className="text-sm font-semibold text-slate-200">{u.count}</span>
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
        </>
      )}

      {user?.role === 'landlord' && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Building2} label="Properties" value={data.properties} color="bg-primary-500/15 text-primary-400" />
            <StatCard icon={Home} label="Occupied Units" value={data.units?.find(u => u.status === 'occupied')?.count || 0} color="bg-emerald-500/15 text-emerald-400" />
            <StatCard icon={CreditCard} label="This Month Revenue" value={`KES ${Number(data.current_month_revenue || 0).toLocaleString()}`} color="bg-amber-500/15 text-amber-400" />
            <StatCard icon={AlertCircle} label="Rent Arrears" value={data.arrears_count} sub="tenants this month" color="bg-red-500/15 text-red-400" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Unit Status</h3>
              <div className="space-y-3 mt-2">
                {data.units?.map(u => (
                  <div key={u.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-2.5 h-2.5 rounded-full', {
                        'bg-emerald-400': u.status === 'occupied',
                        'bg-slate-500': u.status === 'vacant',
                        'bg-amber-400': u.status === 'maintenance',
                      })} />
                      <span className="text-sm text-slate-400 capitalize">{u.status}</span>
                    </div>
                    <span className="font-semibold text-slate-200">{u.count}</span>
                  </div>
                ))}
              </div>
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
            </div>
          </div>
        </>
      )}

      {user?.role === 'tenant' && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">My Lease</h3>
            <div className="flex flex-col h-full justify-between">
              {data.active_lease ? (
                <div className="space-y-3">
                  {[['Property', data.active_lease.property_name], ['Unit', data.active_lease.unit_number]].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500 text-sm">{k}</span>
                      <span className="text-slate-200 text-sm font-medium">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Monthly Rent</span>
                    <span className="text-emerald-400 text-sm font-bold">KES {Number(data.active_lease.rent_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Status</span>
                    <span className="badge-green badge">Active</span>
                  </div>
                </div>
              ) : <p className="text-slate-500 text-sm">No active lease found.</p>}

              <Link to="/app/relocations" className="mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600/10 text-primary-400 hover:bg-primary-600/20 transition-all font-semibold text-sm">
                <MapPin size={16} /> Need to move? Request Relocation
              </Link>
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Payments</h3>
            {data.recent_payments?.length > 0 ? (
              <div className="space-y-2">
                {data.recent_payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40">
                    <div>
                      <p className="text-sm text-slate-300 font-medium">{p.payment_month}</p>
                      <p className="text-xs text-slate-500">{p.method}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400">KES {Number(p.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-sm">No payments recorded yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}