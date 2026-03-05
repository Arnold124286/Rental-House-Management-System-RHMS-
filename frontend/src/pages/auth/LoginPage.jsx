import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('tenant'); // tenant, landlord, admin
  const [form, setForm] = useState({ email: '', password: '', worker_id: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password, form.worker_id);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-600/30 mb-4">
            <Building2 size={32} className="text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">RHMS</h1>
          <p className="text-slate-500 mt-1.5">Rental House Management System</p>
        </div>

        <div className="card">
          <div className="flex p-1 bg-slate-800 rounded-lg mb-6">
            {['tenant', 'landlord', 'admin'].map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-md transition-all ${role === r ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {r}
              </button>
            ))}
          </div>

          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            {role === 'admin' ? 'Administrative Login' : 'Sign in to your account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{role === 'admin' ? 'Work Email' : 'Email address'}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-10" placeholder={role === 'admin' ? 'staff@rhms.com' : 'you@example.com'} required autoComplete="email" />
              </div>
            </div>

            {role === 'admin' && (
              <div className="animate-slide-down">
                <label className="label">Workers ID Number</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[10px]">ID</div>
                  <input type="text" value={form.worker_id}
                    onChange={e => setForm(p => ({ ...p, worker_id: e.target.value }))}
                    className="input pl-10" placeholder="RHMS-ST-000" required />
                </div>
              </div>
            )}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10 pr-10" placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>{role === 'admin' ? 'Admin Access' : 'Sign In'}</span><ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account? <Link to="/register" className="text-primary-500 hover:underline">Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
