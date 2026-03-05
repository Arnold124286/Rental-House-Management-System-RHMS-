import { useState, useEffect } from 'react';
import { leasesAPI, unitsAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function LeaseModal({ onClose, onSave }) {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ unit_id: '', tenant_id: '', start_date: '', end_date: '', rent_amount: '', deposit_amount: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    unitsAPI.getAll({ status: 'vacant' }).then(r => setUnits(r.data.data));
  }, []);

  const handleUnitChange = (e) => {
    const unit = units.find(u => u.id === e.target.value);
    setForm(p => ({ ...p, unit_id: e.target.value, rent_amount: unit?.rent_amount || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenant_id) { toast.error('Please enter a tenant ID.'); return; }
    setLoading(true);
    try {
      await leasesAPI.create(form);
      toast.success('Lease created and unit allocated!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lease.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Create New Lease</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Vacant Unit *</label>
            <select value={form.unit_id} onChange={handleUnitChange} className="input" required>
              <option value="">Select a vacant unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.property_name} — Unit {u.unit_number} (KES {Number(u.rent_amount).toLocaleString()}/mo)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tenant ID (UUID) *</label>
            <input value={form.tenant_id} onChange={e => setForm(p => ({ ...p, tenant_id: e.target.value }))}
              className="input font-mono text-sm" placeholder="Paste tenant UUID from DB" required />
            <p className="text-xs text-slate-600 mt-1">Find this in your database tenants table.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date *</label>
              <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rent Amount (KES) *</label>
              <input type="number" value={form.rent_amount} onChange={e => setForm(p => ({ ...p, rent_amount: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">Deposit (KES)</label>
              <input type="number" value={form.deposit_amount} onChange={e => setForm(p => ({ ...p, deposit_amount: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Lease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const statusBadge = { active: 'badge-green', expired: 'badge-slate', terminated: 'badge-red', pending: 'badge-yellow' };

export default function LeasesPage() {
  const { user } = useAuth();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    leasesAPI.getAll().then(res => setLeases(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const terminate = async (id) => {
    if (!confirm('Are you sure you want to terminate this lease?')) return;
    try {
      await leasesAPI.terminate(id);
      toast.success('Lease terminated.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leases</h1>
          <p className="page-subtitle">{leases.filter(l => l.status === 'active').length} active leases</p>
        </div>
        {user?.role !== 'tenant' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /><span>New Lease</span>
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {leases.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400">No leases found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th><th>Property / Unit</th><th>Rent</th>
                  <th>Start Date</th><th>End Date</th><th>Status</th>
                  {user?.role !== 'tenant' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leases.map(l => (
                  <tr key={l.id}>
                    <td>
                      <p className="font-medium text-slate-200">{l.tenant_name}</p>
                      <p className="text-xs text-slate-500">{l.tenant_email}</p>
                    </td>
                    <td>{l.property_name} — {l.unit_number}</td>
                    <td><span className="font-semibold text-emerald-400">KES {Number(l.rent_amount).toLocaleString()}</span></td>
                    <td>{new Date(l.start_date).toLocaleDateString()}</td>
                    <td>{l.end_date ? new Date(l.end_date).toLocaleDateString() : '—'}</td>
                    <td><span className={clsx('badge', statusBadge[l.status])}>{l.status}</span></td>
                    {user?.role !== 'tenant' && (
                      <td>
                        {l.status === 'active' && (
                          <button onClick={() => terminate(l.id)} className="btn-danger text-xs py-1 px-3">Terminate</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <LeaseModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </div>
  );
}