import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Home, Plus, X } from 'lucide-react';

import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Marketplace from './pages/Marketplace';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import LeasesPage from './pages/LeasesPage';
import PaymentsPage from './pages/PaymentsPage';
import MaintenancePage from './pages/MaintenancePage';
import UsersPage from './pages/UsersPage';
import LeaseRequestsPage from './pages/LeaseRequestsPage';
import AdminLandlordsPage from './pages/admin/AdminLandlordsPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import RelocationsPage from './pages/RelocationsPage';


import { unitsAPI, propertiesAPI, uploadAPI } from './services/api';


function UnitsPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    property_id: '',
    unit_number: '',
    floor_number: '',
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: '',
    description: '',
    video_url: '',
    video_type: 'youtube'
  });
  const [uploading, setUploading] = useState(false);



  const load = () => {
    unitsAPI.getAll().then(r => setUnits(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    propertiesAPI.getAll().then(r => setProperties(r.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return toast.error('Please wait for video to finish uploading.');
    try {
      await unitsAPI.create(form);
      toast.success('Unit created!');
      setModal(false);
      setForm({ property_id: '', unit_number: '', floor_number: '', bedrooms: 1, bathrooms: 1, rent_amount: '', description: '', video_url: '', video_type: 'youtube' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create unit.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setUploading(true);
    try {
      const res = await uploadAPI.video(formData);
      setForm(p => ({ ...p, video_url: res.data.data.url, video_type: 'local' }));
      toast.success('Video uploaded to gallery!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };


  const statusColors = { vacant: 'badge-yellow', occupied: 'badge-green', maintenance: 'badge-red' };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Units</h1>
          <p className="page-subtitle">{units.length} total units</p>
        </div>
        {user?.role !== 'tenant' && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /><span>Add Unit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {units.map(u => (
          <div key={u.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <Home size={18} className="text-slate-400" />
              </div>
              <span className={clsx('badge', statusColors[u.status])}>{u.status}</span>
            </div>
            <h3 className="font-semibold text-slate-200">Unit {u.unit_number}</h3>
            <p className="text-xs text-slate-500 mb-3">{u.property_name}{u.floor_number && ` · Floor ${u.floor_number}`}</p>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-800">
              <span>{u.bedrooms}bd · {u.bathrooms}ba</span>
              <span className="font-semibold text-emerald-400 text-sm">KES {Number(u.rent_amount).toLocaleString()}</span>
            </div>
            {u.tenant_name && <p className="text-xs text-primary-400 mt-2">👤 {u.tenant_name}</p>}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative z-10 w-full max-w-md card animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add New Unit</h2>
              <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Property *</label>
                <select value={form.property_id} onChange={e => setForm(p => ({ ...p, property_id: e.target.value }))} className="input" required>
                  <option value="">Select property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unit Number *</label>
                  <input value={form.unit_number} onChange={e => setForm(p => ({ ...p, unit_number: e.target.value }))} className="input" placeholder="e.g. A1" required />
                </div>
                <div>
                  <label className="label">Floor</label>
                  <input type="number" value={form.floor_number} onChange={e => setForm(p => ({ ...p, floor_number: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Bedrooms</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: e.target.value }))} className="input" min="1" />
                </div>
                <div>
                  <label className="label">Bathrooms</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm(p => ({ ...p, bathrooms: e.target.value }))} className="input" min="1" />
                </div>
                <div>
                  <label className="label">Rent (KES) *</label>
                  <input type="number" value={form.rent_amount} onChange={e => setForm(p => ({ ...p, rent_amount: e.target.value }))} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="label">Video Source</label>
                  <select
                    value={form.video_type}
                    onChange={e => setForm(p => ({ ...p, video_type: e.target.value, video_url: '' }))}
                    className="input"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="local">Gallery Upload</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="label">
                    {form.video_type === 'local' ? 'Choose Video' : 'Video URL'}
                  </label>
                  {form.video_type === 'local' ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <div className={clsx('input flex items-center justify-center text-xs text-slate-400', uploading && 'animate-pulse')}>
                        {uploading ? 'Uploading...' : form.video_url ? '✅ Video Selected' : '📁 Open Gallery'}
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={form.video_url}
                      onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                      className="input"
                      placeholder={form.video_type === 'youtube' ? 'YouTube link' : 'TikTok link'}
                    />
                  )}
                </div>
              </div>


              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #1e293b' },
          success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
        }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="units" element={<UnitsPage />} />
            <Route path="leases" element={<LeasesPage />} />
            <Route path="lease-requests" element={<LeaseRequestsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="admin/landlords" element={<AdminLandlordsPage />} />
            <Route path="admin/properties" element={<AdminPropertiesPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="relocations" element={<RelocationsPage />} />
          </Route>


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;