import React, { useState, useEffect } from 'react';
import { complaintsAPI, propertiesAPI, leasesAPI } from '../services/api';
import { MessageSquare, ClipboardList, Plus, Search, CheckCircle, Clock, AlertCircle, X, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { format } from 'date-fns';

const ComplaintsPage = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [resolveModal, setResolveModal] = useState(null);
    const [form, setForm] = useState({ property_id: '', unit_id: '', subject: '', description: '' });
    const [resolution, setResolution] = useState('');
    const [myLeases, setMyLeases] = useState([]);

    const load = () => {
        setLoading(true);
        complaintsAPI.getAll()
            .then(res => setComplaints(res.data.data))
            .catch(() => toast.error('Failed to load complaints.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        if (user.role === 'tenant') {
            leasesAPI.getAll().then(res => setMyLeases(res.data.data));
        }
    }, [user.role]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await complaintsAPI.create(form);
            toast.success('Complaint filed successfully. We will look into it.');
            setModal(false);
            setForm({ property_id: '', unit_id: '', subject: '', description: '' });
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to file complaint.');
        }
    };

    const handleResolve = async (e) => {
        e.preventDefault();
        try {
            await complaintsAPI.resolve(resolveModal, resolution);
            toast.success('Complaint resolved.');
            setResolveModal(null);
            setResolution('');
            load();
        } catch (err) {
            toast.error('Failed to resolve complaint.');
        }
    };

    const statusIcon = {
        open: <Clock className="text-yellow-500" size={16} />,
        resolved: <CheckCircle className="text-emerald-500" size={16} />,
        closed: <AlertCircle className="text-slate-500" size={16} />
    };

    const statusBadge = {
        open: 'badge-yellow',
        resolved: 'badge-green',
        closed: 'badge-blue'
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header className="page-header mb-8">
                <div>
                    <h1 className="page-title">Complaints & Feedback</h1>
                    <p className="page-subtitle">
                        {user.role === 'admin' ? 'Monitor system-wide feedback' :
                            user.role === 'landlord' ? 'Address tenant issues' : 'File and track your complaints'}
                    </p>
                </div>
                {user.role === 'tenant' && (
                    <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> <span>File Complaint</span>
                    </button>
                )}
            </header>

            <div className="space-y-4">
                {complaints.map(c => (
                    <div key={c.id} className="card bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={clsx('badge uppercase text-[10px] font-bold tracking-wider', statusBadge[c.status])}>
                                        {c.status}
                                    </span>
                                    <span className="text-slate-500 text-xs">{format(new Date(c.created_at), 'PPP')}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{c.subject}</h3>
                                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{c.description}</p>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Home size={14} className="text-primary-500" />
                                        <span>{c.property_name} (Unit {c.unit_number || 'N/A'})</span>
                                    </div>
                                    {c.tenant_name && (
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare size={14} />
                                            <span>Tenant: <span className="text-slate-300">{c.tenant_name}</span></span>
                                        </div>
                                    )}
                                </div>

                                {c.resolution && (
                                    <div className="mt-4 p-4 rounded-xl bg-primary-500/5 border border-primary-500/10">
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary-400 uppercase tracking-widest mb-1">
                                            <CheckCircle size={12} /> Resolution
                                        </div>
                                        <p className="text-sm text-slate-300">{c.resolution}</p>
                                    </div>
                                )}
                            </div>

                            {user.role !== 'tenant' && c.status === 'open' && (
                                <button
                                    onClick={() => setResolveModal(c.id)}
                                    className="btn-secondary text-xs py-2 px-4 h-fit whitespace-nowrap"
                                >
                                    Resolve
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {complaints.length === 0 && (
                    <div className="text-center py-20 card border-dashed border-slate-800">
                        <ClipboardList className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500">No complaints found.</p>
                    </div>
                )}
            </div>

            {/* File Complaint Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
                    <div className="relative z-10 w-full max-w-lg card animate-fade-in shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">New Complaint</h2>
                            <button onClick={() => setModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Leased Property *</label>
                                <select
                                    required
                                    className="input"
                                    value={form.property_id}
                                    onChange={e => {
                                        const lease = myLeases.find(l => l.property_id == e.target.value);
                                        setForm(f => ({ ...f, property_id: e.target.value, unit_id: lease?.unit_id || '' }));
                                    }}
                                >
                                    <option value="">Select a property...</option>
                                    {myLeases.map(l => (
                                        <option key={l.id} value={l.property_id}>{l.property_name} - Unit {l.unit_number}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Subject *</label>
                                <input
                                    type="text" required className="input" placeholder="e.g., Leaking Tap in Kitchen"
                                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="label">Details *</label>
                                <textarea
                                    required className="input min-h-[120px]"
                                    placeholder="Provide more details about the issue..."
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">File Complaint</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resolve Complaint Modal */}
            {resolveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResolveModal(null)} />
                    <div className="relative z-10 w-full max-w-md card animate-fade-in shadow-2xl">
                        <h2 className="text-xl font-bold mb-2">Resolve Complaint</h2>
                        <p className="text-sm text-slate-400 mb-6">Describe how the issue was addressed.</p>
                        <form onSubmit={handleResolve} className="space-y-4">
                            <div>
                                <label className="label">Resolution Details *</label>
                                <textarea
                                    required className="input min-h-[120px]"
                                    placeholder="e.g., Maintenance team sent to fix the leak on 2024-03-05."
                                    value={resolution} onChange={e => setResolution(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setResolveModal(null)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Mark as Resolved</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsPage;
