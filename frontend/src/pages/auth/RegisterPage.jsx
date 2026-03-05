import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/api';
import { Building2, UserCircle2, Mail, Lock, User, Phone, CreditCard } from 'lucide-react';

const RegisterPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: '', email: '', password: '', role: (searchParams.get('role') === 'admin' ? 'tenant' : searchParams.get('role')) || 'tenant',
        first_name: '', last_name: '', phone: '', national_id: '', business_name: ''
    });


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.register(form);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                            <Building2 className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">RHMS</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Create an Account</h1>
                    <p className="text-slate-400 mt-2">Join our modern rental community</p>
                </div>

                <form onSubmit={handleSubmit} className="card space-y-4">
                    <div className="flex p-1 bg-slate-800 rounded-lg mb-2">
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, role: 'tenant' }))}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${form.role === 'tenant' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            <UserCircle2 size={16} /> Tenant
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, role: 'landlord' }))}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${form.role === 'landlord' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'
                                }`}
                        >
                            <Building2 size={16} /> Landlord
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">First Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text" required className="input pl-10" placeholder="Jane"
                                    value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">Last Name</label>
                            <input
                                type="text" required className="input" placeholder="Doe"
                                value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Username</label>
                        <input
                            type="text" required className="input" placeholder="janedoe"
                            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="label">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email" required className="input pl-10" placeholder="jane@example.com"
                                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                    </div>

                    {form.role !== 'landlord' && (
                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password" required className="input pl-10" placeholder="••••••••"
                                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}


                    {form.role === 'landlord' && (
                        <div className="animate-slide-down">
                            <label className="label">Business Name (e.g. Sunny Apartments)</label>
                            <input
                                type="text" required className="input" placeholder="Sunny Apartments Management"
                                value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">

                        <div>
                            <label className="label">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text" required className="input pl-10" placeholder="0712345678"
                                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label">ID/National ID</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text" required className="input pl-10" placeholder="12345678"
                                    value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
                        {loading ? 'Creating Account...' : form.role === 'landlord' ? 'Submit Registration' : 'Register Now'}
                    </button>

                    {form.role === 'landlord' && (
                        <p className="text-xs text-center text-slate-500 mt-2 px-2">
                            Note: Landlord accounts require admin approval. Your login credentials will be generated and provided upon approval.
                        </p>
                    )}


                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account? <Link to="/login" className="text-primary-500 hover:underline">Sign In</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
