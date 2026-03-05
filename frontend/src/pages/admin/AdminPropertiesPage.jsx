import React, { useState, useEffect } from 'react';
import { propertiesAPI } from '../../services/api';
import { Building2, CheckCircle, XCircle, Ban, Search, MapPin, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const AdminPropertiesPage = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const loadProperties = () => {
        setLoading(true);
        // We use the admin-specific getAll which returns landlord info and counts
        propertiesAPI.getAll()
            .then(res => setProperties(res.data.data))
            .catch(() => toast.error('Failed to load properties.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProperties();
    }, []);

    const handleApprove = async (id) => {
        try {
            await propertiesAPI.approve(id);
            toast.success('Property approved!');
            loadProperties();
        } catch (err) {
            toast.error('Failed to approve property.');
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject this property?')) return;
        try {
            await propertiesAPI.reject(id);
            toast.success('Property rejected.');
            loadProperties();
        } catch (err) {
            toast.error('Failed to reject property.');
        }
    };

    const handleBlacklist = async (id) => {
        if (!confirm('Are you sure you want to blacklist this property? It will be hidden from the marketplace.')) return;
        try {
            await propertiesAPI.blacklist(id);
            toast.success('Property blacklisted.');
            loadProperties();
        } catch (err) {
            toast.error('Failed to blacklist property.');
        }
    };

    const filtered = properties.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.landlord_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus || (filterStatus === 'blacklisted' && p.is_blacklisted);
        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="page-title">Property Approvals</h1>
                    <p className="page-subtitle">Verify and manage marketplace listings</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search properties or landlords..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input sm:w-40"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="blacklisted">Blacklisted</option>
                    </select>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {filtered.length === 0 ? (
                    <div className="card text-center py-20 border-dashed border-slate-800">
                        <Building2 className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-500 text-lg">No properties match your criteria.</p>
                    </div>
                ) : (
                    filtered.map(p => (
                        <div key={p.id} className="card-hover flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                                    <Building2 size={28} className={clsx(p.status === 'approved' ? 'text-primary-400' : 'text-slate-500')} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-white truncate">{p.name}</h3>
                                        <span className={clsx('badge uppercase text-[10px] font-bold tracking-wider', p.is_blacklisted ? 'badge-red' : statusBadge[p.status])}>
                                            {p.is_blacklisted ? 'blacklisted' : p.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} /> <span>{p.address}, {p.city}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-600">Landlord:</span>
                                            <span className="text-primary-400 font-medium">{p.landlord_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pt-4 border-t border-slate-800/50">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-slate-200">{p.total_units || 0}</p>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold">Units</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-emerald-400">{p.occupied_units || 0}</p>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold">Occ</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-amber-400">{p.vacant_units || 0}</p>
                                            <p className="text-[10px] uppercase text-slate-500 font-bold">Vac</p>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                                            <p className="text-[10px] uppercase text-slate-500 font-bold">Category</p>
                                            <p className="text-xs font-semibold text-primary-400 capitalize">{p.category}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:border-l lg:border-slate-800 lg:pl-6">
                                {p.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleReject(p.id)}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-all text-sm font-bold"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(p.id)}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2 px-6 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-sm font-bold shadow-lg shadow-emerald-900/20"
                                        >
                                            <CheckCircle size={16} /> Approve Listing
                                        </button>
                                    </>
                                )}
                                {p.status === 'approved' && !p.is_blacklisted && (
                                    <button
                                        onClick={() => handleBlacklist(p.id)}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-all text-sm font-bold"
                                    >
                                        <Ban size={16} /> Blacklist
                                    </button>
                                )}
                                <Link
                                    to={`/marketplace`} // In real app, this would go to a preview page
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-sm font-bold"
                                >
                                    <Eye size={16} /> Preview
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminPropertiesPage;
