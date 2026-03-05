import React, { useState, useEffect } from 'react';
import { leaseRequestsAPI } from '../services/api';
import { MessageSquare, Check, X, Clock, User, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LeaseRequestsPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        leaseRequestsAPI.getAll()
            .then(res => setRequests(res.data.data))
            .catch(() => toast.error('Failed to load requests.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleStatus = async (id, status) => {
        try {
            await leaseRequestsAPI.updateStatus(id, status);
            toast.success(`Request ${status}!`);
            load();
        } catch (err) {
            toast.error('Failed to update request.');
        }
    };

    const statusColors = {
        pending: 'badge-yellow',
        approved: 'badge-green',
        rejected: 'badge-red',
        cancelled: 'badge-slate'
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">House Requests</h1>
                    <p className="page-subtitle">Manage interest from potential tenants</p>
                </div>
            </div>

            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="card text-center py-20">
                        <MessageSquare className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-400">No house requests found.</p>
                    </div>
                ) : (
                    requests.map(r => (
                        <div key={r.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                                    <User className="text-slate-400" size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-white">{r.tenant_name}</h3>
                                        <span className={`badge ${statusColors[r.status]}`}>{r.status}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <Home size={14} />
                                            <span>{r.property_name} - Unit {r.unit_number}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {r.message && (
                                        <p className="text-sm text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                            "{r.message}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {user.role !== 'tenant' && r.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStatus(r.id, 'rejected')}
                                        className="btn-secondary h-10 px-4 text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleStatus(r.id, 'approved')}
                                        className="btn-primary h-10 px-6 flex items-center gap-2"
                                    >
                                        <Check size={18} />
                                        <span>Approve</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeaseRequestsPage;
