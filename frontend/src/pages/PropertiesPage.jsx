import { useState, useEffect } from 'react';
import { propertiesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';

function PropertyModal({ property, onClose, onSave }) {
  const [form, setForm] = useState(property || { name: '', address: '', city: '', description: '', category: 'rental' });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (property?.id) {
        await propertiesAPI.update(property.id, form);
        toast.success('Property updated!');
      } else {
        await propertiesAPI.create(form);
        toast.success('Property created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{property?.id ? 'Edit Property' : 'Add New Property'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Property Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="e.g. Kamau Apartments" required />
          </div>
          <div>
            <label className="label">Address *</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input" placeholder="Street address" required />
          </div>
          <div>
            <label className="label">City</label>
            <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className="input" placeholder="e.g. Nairobi" />
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="input"
              required
            >
              <option value="rental">Rental</option>
              <option value="bnb">BnB</option>
              <option value="lease">Lease</option>
              <option value="boardroom">Boardroom</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={3} placeholder="Optional description..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : property?.id ? 'Update' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    propertiesAPI.getAll().then(res => setProperties(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        {(user?.role === 'landlord' || user?.role === 'admin') && (
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /><span>Add Property</span>
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-16">
          <Building2 size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No properties yet</p>
          {user?.role !== 'tenant' && (
            <button onClick={() => setModal('add')} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /><span>Add Property</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <div key={p.id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center">
                  <Building2 size={18} className="text-primary-400" />
                </div>
                {user?.role !== 'tenant' && (
                  <button onClick={() => setModal(p)} className="text-slate-600 hover:text-slate-300 text-xs">Edit</button>
                )}
              </div>
              <h3 className="font-semibold text-slate-100 mb-1">{p.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                <MapPin size={12} /><span>{p.address}{p.city && `, ${p.city}`}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800">
                <div className="text-center"><p className="text-lg font-bold text-slate-200">{p.total_units || 0}</p><p className="text-xs text-slate-600">Total</p></div>
                <div className="text-center"><p className="text-lg font-bold text-emerald-400">{p.occupied_units || 0}</p><p className="text-xs text-slate-600">Occupied</p></div>
                <div className="text-center"><p className="text-lg font-bold text-amber-400">{p.vacant_units || 0}</p><p className="text-xs text-slate-600">Vacant</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <PropertyModal
          property={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}