import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { ShieldCheck, User, Mail, Phone, MapPin, Search, CheckCircle, XCircle, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AdminLandlordsPage = () => {
    const [landlords, setLandlords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [approvalResult, setApprovalResult] = useState(null); // { name, password }


    const loadLandlords = () => {
        setLoading(true);
        // We use getUsers with role=landlord. 
        // Note: The backend returns basic user info. We might need specific landlord data like status.
        // I should have updated the getUsers to include landlord status if requested.
        // Let's assume the backend getUsers returns the landlord object joined or we fetch separately.
        // Actually, I added approveLandlord and blacklistLandlord to userController.
        // Let's assume the backend result for getUsers (role=landlord) includes the status and business_name.
        usersAPI.getAll({ role: 'landlord' })
            .then(res => setLandlords(res.data.data))
            .catch(() => toast.error('Failed to load landlords.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadLandlords();
    }, []);

    const handleApprove = async (id, name) => {
        try {
            const res = await usersAPI.approveLandlord(id);
            setApprovalResult({ name: name, password: res.data.data.generated_password });
            toast.success('Landlord approved and credentials generated!');
            loadLandlords();
        } catch (err) {
            toast.error('Failed to approve landlord.');
        }
    };


    const handleBlacklist = async (id) => {
        if (!confirm('Are you sure you want to blacklist this landlord? All their properties will be hidden.')) return;
        try {
            await usersAPI.blacklistLandlord(id);
            toast.success('Landlord blacklisted.');
            loadLandlords();
        } catch (err) {
            toast.error('Failed to blacklist landlord.');
        }
    };

    const filtered = landlords.filter(l =>
        l.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusBadge = {
        pending: 'badge-yellow',
        approved: 'badge-green',
        rejected: 'badge-red',
        blacklisted: 'badge-red'
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
                    <h1 className="page-title">Landlord Management</h1>
                    <p className="page-subtitle">Approve registrations and monitor landlord status</p>
                </div>
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or business..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(l => (
                    <div key={l.id} className="card-hover">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                                <ShieldCheck size={24} className={clsx(l.status === 'approved' ? 'text-primary-400' : 'text-slate-500')} />
                            </div>
                            <span className={clsx('badge uppercase text-[10px] font-bold tracking-wider', statusBadge[l.status || 'pending'])}>
                                {l.status || 'pending'}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">
                            {l.first_name} {l.last_name}
                        </h3>
                        <p className="text-primary-400 text-sm font-medium mb-4">{l.business_name || 'Individual Landlord'}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Mail size={14} /> <span>{l.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Phone size={14} /> <span>{l.phone}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex gap-3">
                            {l.status !== 'approved' && l.status !== 'blacklisted' && (
                                <button
                                    onClick={() => handleApprove(l.landlord_id || l.id, `${l.first_name} ${l.last_name}`)}

                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 transition-all text-sm font-semibold"
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                            )}
                            {l.status !== 'blacklisted' && (
                                <button
                                    onClick={() => handleBlacklist(l.landlord_id || l.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-all text-sm font-semibold"
                                >
                                    <Ban size={16} /> Blacklist
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {approvalResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setApprovalResult(null)} />
                    <div className="relative z-10 w-full max-w-sm card animate-bounce-in border-emerald-500/30">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Credentials Generated</h2>
                            <p className="text-slate-400 text-sm mb-6">Generated login for <b>{approvalResult.name}</b></p>

                            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 mb-6">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Temporary Password</p>
                                <code className="text-2xl font-mono text-emerald-400 tracking-widest selection:bg-emerald-500 selection:text-white">
                                    {approvalResult.password}
                                </code>
                            </div>

                            <p className="text-xs text-slate-500 mb-6 italic">Please share this password with the landlord. They can change it after their first login.</p>

                            <button onClick={() => setApprovalResult(null)} className="btn-primary w-full py-3">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {filtered.length === 0 && (

                <div className="text-center py-20 card border-dashed border-slate-800">
                    <User className="mx-auto text-slate-700 mb-4" size={48} />
                    <p className="text-slate-500 text-lg">No landlords found.</p>
                </div>
            )}
        </div>
    );
};

export default AdminLandlordsPage;
