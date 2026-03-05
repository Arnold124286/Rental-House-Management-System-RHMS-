import { useState, useEffect } from 'react';
import { maintenanceAPI, unitsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Wrench, Plus, X, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const statusConfig = {
  open:        { label: 'Open',        badge: 'badge-red' },
  in_progress: { label: 'In Progress', badge: 'badge-yellow' },
  resolved:    { label: 'Resolved',    badge: 'badge-green' },
  cancelled:   { label: 'Cancelled',   badge: 'badge-slate' },
};
const priorityBadge = { urgent: 'badge-red', high: 'badge-yellow', normal: 'badge-blue', low: 'badge-slate' };

function RequestModal({ onClose, onSave }) {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ unit_id: '', title: '', description: '', category: 'general', priority: 'normal' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    unitsAPI.getAll({ status: 'occupied' }).then(res => setUnits(res.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await maintenanceAPI.create(form);
      toast.success('Maintenance request submitted!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Submit Maintenance Request</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Unit *</label>
            <select value={form.unit_id} onChange={e => setForm(p => ({ ...p, unit_id: e.target.value }))} className="input" required>
              <option value="">Select a unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.property_name} — Unit {u.unit_number}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Leaking pipe in bathroom" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input">
                {['plumbing','electrical','structural','appliances','cleaning','general'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input">
                {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={3} placeholder="Describe the issue..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');

  const load = () => {
    Promise.all([
      maintenanceAPI.getAll(filter ? { status: filter } : {}),
      maintenanceAPI.getStats(),
    ]).then(([req, st]) => {
      setRequests(req.data.data);
      setStats(st.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await maintenanceAPI.update(id, { status });
      toast.success(`Request marked as ${status}`);
      load();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{requests.length} requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /><span>New Request</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[['Open', stats.open, 'text-red-400'], ['In Progress', stats.in_progress, 'text-amber-400'], ['Resolved', stats.resolved, 'text-emerald-400'], ['Urgent', stats.urgent, 'text-red-300']].map(([label, value, color]) => (
            <div key={label} className="card py-3 text-center">
              <p className={clsx('text-2xl font-bold', color)}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'open', 'in_progress', 'resolved'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === s ? 'bg-primary-600/20 text-primary-300 border border-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200')}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map(r => {
          const st = statusConfig[r.status] || statusConfig.open;
          return (
            <div key={r.id} className="card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-slate-200">{r.title}</h3>
                    <span className={clsx('badge', st.badge)}>{st.label}</span>
                    <span className={clsx('badge', priorityBadge[r.priority])}>{r.priority}</span>
                  </div>
                  <p className="text-sm text-slate-500">{r.property_name} — Unit {r.unit_number}</p>
                  {r.description && <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                    <span>By: {r.tenant_name || 'N/A'}</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.category && <span className="capitalize">{r.category}</span>}
                  </div>
                </div>
                {user?.role !== 'tenant' && r.status !== 'resolved' && r.status !== 'cancelled' && (
                  <div className="flex gap-2 flex-shrink-0">
                    {r.status === 'open' && <button onClick={() => updateStatus(r.id, 'in_progress')} className="btn-secondary text-xs py-1.5 px-3">Start</button>}
                    {r.status === 'in_progress' && <button onClick={() => updateStatus(r.id, 'resolved')} className="btn-primary text-xs py-1.5 px-3">Resolve</button>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="card text-center py-16">
            <Wrench size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No maintenance requests found.</p>
          </div>
        )}
      </div>

      {showModal && <RequestModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}