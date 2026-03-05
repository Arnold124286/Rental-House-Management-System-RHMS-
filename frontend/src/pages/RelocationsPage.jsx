import React, { useState, useEffect } from 'react';
import { relocationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle, XCircle, Clock, MapPin, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import RelocationModal from '../components/ui/RelocationModal';

const RelocationsPage = () => {
    const { user } = useAuth();
    const [relocations, setRelocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadRelocations = () => {
        setLoading(true);
        relocationsAPI.getAll()
            .then(res => setRelocations(res.data.data))
            .catch(() => toast.error('Failed to load relocation requests.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadRelocations();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        const notes = prompt(`Any notes for this ${status}?`);
        try {
            await relocationsAPI.updateStatus(id, { status, admin_notes: notes });
            toast.success(`Relocation request ${status}!`);
            loadRelocations();
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    const statusBadge = {
        pending: 'badge-yellow',
        approved: 'badge-green',
        rejected: 'badge-red',
        cancelled: 'badge-slate'
    };

    const statusIcon = {
        pending: Clock,
        approved: CheckCircle,
        rejected: XCircle,
        cancelled: XCircle
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Relocation Requests</h1>
                    <p className="page-subtitle">Manage movement between units and properties</p>
                </div>
                {user?.role === 'tenant' && (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Request Transfer
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 gap-4">
                {relocations.length === 0 ? (
                    <div className="card text-center py-16 border-dashed border-slate-800">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <MapPin className="text-slate-600" size={32} />
                        </div>
                        <p className="text-slate-500">No relocation requests found.</p>
                    </div>
                ) : (
                    relocations.map(r => {
                        const Icon = statusIcon[r.status] || Clock;
                        return (
                            <div key={r.id} className="card-hover flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center border',
                                        r.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            r.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    )}>
                                        <Icon size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-white text-lg">{r.tenant_name}</h3>
                                            <span className={clsx('badge text-[10px] uppercase', statusBadge[r.status])}>{r.status}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-medium text-slate-400">{r.current_property} ({r.current_unit})</span>
                                            <ArrowRight size={14} className="text-primary-500" />
                                            <span className="font-medium text-slate-200">{r.target_property} ({r.target_unit})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-sm">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Reason</p>
                                    <p className="text-sm text-slate-400 line-clamp-2 italic">"{r.reason}"</p>
                                </div>

                                {user?.role !== 'tenant' && r.status === 'pending' && (
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => handleUpdateStatus(r.id, 'rejected')}
                                            className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all font-semibold text-sm"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(r.id, 'approved')}
                                            className="flex-1 md:flex-none py-2 px-6 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all font-semibold text-sm"
                                        >
                                            Approve Move
                                        </button>
                                    </div>
                                )}

                                {r.admin_notes && (
                                    <div className="w-full md:w-auto text-right">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Response</p>
                                        <p className="text-xs text-slate-400">{r.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <RelocationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    loadRelocations();
                }}
            />
        </div>
    );
};

export default RelocationsPage;
