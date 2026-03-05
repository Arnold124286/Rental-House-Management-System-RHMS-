import React, { useState, useEffect } from 'react';
import { propertiesAPI, relocationsAPI } from '../../services/api';
import { Home, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const RelocationModal = ({ isOpen, onClose, currentUnitId }) => {
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [vacantUnits, setVacantUnits] = useState([]);
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            propertiesAPI.getPublic()
                .then(res => setProperties(res.data.data))
                .catch(() => toast.error('Failed to load properties.'));
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedPropertyId) {
            propertiesAPI.getOne(selectedPropertyId)
                .then(res => {
                    const vacant = res.data.data.units.filter(u => u.status === 'vacant' && u.id !== currentUnitId);
                    setVacantUnits(vacant);
                })
                .catch(() => toast.error('Failed to load units.'));
        } else {
            setVacantUnits([]);
        }
    }, [selectedPropertyId, currentUnitId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedUnitId) return toast.error('Please select a target unit.');

        setLoading(true);
        try {
            await relocationsAPI.create({
                target_unit_id: selectedUnitId,
                reason
            });
            toast.success('Relocation request submitted!');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md card animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Request Relocation</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="label">Select Property</label>
                        <select
                            className="input"
                            value={selectedPropertyId}
                            onChange={e => setSelectedPropertyId(e.target.value)}
                            required
                        >
                            <option value="">Choose a property...</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">Select Unit</label>
                        <select
                            className="input"
                            value={selectedUnitId}
                            onChange={e => setSelectedUnitId(e.target.value)}
                            required
                            disabled={!selectedPropertyId}
                        >
                            <option value="">{selectedPropertyId ? 'Choose a vacant unit...' : 'Select a property first'}</option>
                            {vacantUnits.map(u => (
                                <option key={u.id} value={u.id}>Unit {u.unit_number} - {u.bedrooms}bd (${u.rent_amount})</option>
                            ))}
                        </select>
                        {selectedPropertyId && vacantUnits.length === 0 && (
                            <p className="text-[10px] text-red-500 mt-1">No vacant units available here.</p>
                        )}
                    </div>

                    <div>
                        <label className="label">Reason for Moving</label>
                        <textarea
                            className="input min-h-[100px]"
                            placeholder="e.g. Need more space, closer to work..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Submit <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RelocationModal;
