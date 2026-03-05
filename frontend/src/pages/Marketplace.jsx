import React, { useState, useEffect } from 'react';
import { propertiesAPI, leaseRequestsAPI } from '../services/api';
import { Building2, Search, MapPin, Home, ArrowRight, Star, MessageSquare, PlayCircle, X } from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReviewList from '../components/ui/ReviewList';
import ReviewForm from '../components/ui/ReviewForm';

const Marketplace = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [requestModal, setRequestModal] = useState(false);
    const [requestData, setRequestData] = useState({ unit_id: '', message: '' });
    const [videoModal, setVideoModal] = useState(null); // { url, type }
    const [reviewModal, setReviewModal] = useState(null); // { property }


    const categories = [
        { id: 'all', name: 'All' },
        { id: 'rental', name: 'Rentals' },
        { id: 'bnb', name: 'BnB' },
        { id: 'lease', name: 'Lease' },
        { id: 'boardroom', name: 'Boardrooms' }
    ];


    useEffect(() => {
        const params = activeCategory !== 'all' ? { category: activeCategory } : {};
        setLoading(true);
        propertiesAPI.getPublic(params)
            .then(res => setProperties(res.data.data))
            .catch(() => toast.error('Failed to load houses.'))
            .finally(() => setLoading(false));
    }, [activeCategory]);


    const handleRequest = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to pick a house.');
            navigate('/login');
            return;
        }
        if (user.role !== 'tenant') {
            toast.error('Only tenants can request houses.');
            return;
        }

        try {
            await leaseRequestsAPI.create(requestData);
            toast.success('Interest sent to landlord! They will contact you shortly.');
            setRequestModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request.');
        }
    };

    const filteredProperties = properties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Explore Available Houses</h1>
                        <p className="text-slate-400">Discover your next home from our approved collection</p>
                    </div>
                    <div className="flex flex-col gap-4 max-w-xl w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                className="input pl-10"
                                placeholder="Search by name or city..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id
                                        ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/40'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 card bg-slate-900/50 border-dashed border-slate-800">
                        <Building2 className="mx-auto text-slate-700 mb-4" size={48} />
                        <p className="text-slate-400">No approved houses matching your search were found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProperties.map(p => (
                            <div key={p.id} className="card-hover overflow-hidden group">
                                <div className="aspect-video bg-slate-800 relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary-400 border border-primary-500/20">
                                            {p.category}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <span className="badge badge-primary px-3 py-1 text-xs">{p.vacant_units} Units Available</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">{p.name}</h3>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await propertiesAPI.getOne(p.id);
                                                    setReviewModal(res.data.data);
                                                } catch (err) {
                                                    toast.error('Could not load reviews.');
                                                }
                                            }}
                                            className="flex items-center gap-1 text-yellow-500 hover:text-yellow-400 transition-colors"
                                        >
                                            <Star size={16} fill="currentColor" />
                                            <span className="text-sm font-semibold">{p.avg_rating || '5.0'}</span>
                                            <span className="text-[10px] text-slate-500 ml-1">({p.review_count || 0})</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
                                        <MapPin size={16} />
                                        <span>{p.city}, {p.address}</span>
                                    </div>
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                                        {p.description || "Beautifully managed property with modern amenities and 24/7 security."}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                                        <div className="flex flex-col">
                                            <div className="text-xs text-slate-600">Managed by</div>
                                            <div className="text-xs text-slate-400 font-medium">{p.landlord_name}</div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await propertiesAPI.getOne(p.id);
                                                        const unitsWithVideo = res.data.data.units.filter(u => u.video_url);
                                                        if (unitsWithVideo.length > 0) {
                                                            setVideoModal({
                                                                url: unitsWithVideo[0].video_url,
                                                                type: unitsWithVideo[0].video_type || 'youtube'
                                                            });
                                                        } else {

                                                            toast.error('No showroom video available for this property.');
                                                        }
                                                    } catch (err) {
                                                        toast.error('Error loading video details.');
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-1.5 text-sm"
                                            >
                                                <PlayCircle size={18} /> Showroom
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setSelectedProperty(p);
                                                    setRequestModal(true);
                                                    try {
                                                        const res = await propertiesAPI.getOne(p.id);
                                                        const vacant = res.data.data.units.filter(u => u.status === 'vacant');
                                                        setSelectedProperty({ ...p, units: vacant });
                                                        setRequestData(prev => ({ ...prev, unit_id: vacant[0]?.id || '' }));
                                                    } catch (err) {
                                                        toast.error('Could not load unit details.');
                                                    }
                                                }}
                                                className="text-primary-500 flex items-center gap-2 font-semibold hover:text-primary-400 transition-colors group text-sm"
                                            >
                                                Pick a House <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {requestModal && selectedProperty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRequestModal(false)} />
                    <div className="relative z-10 w-full max-w-md card animate-fade-in">
                        <h2 className="text-xl font-bold mb-2">Pick your Unit at {selectedProperty.name}</h2>
                        <p className="text-sm text-slate-400 mb-6">Let the landlord know you are interested.</p>

                        <form onSubmit={handleRequest} className="space-y-4">
                            <div>
                                <label className="label">Select Unit</label>
                                <select
                                    className="input"
                                    required
                                    value={requestData.unit_id}
                                    onChange={e => setRequestData(d => ({ ...d, unit_id: e.target.value }))}
                                >
                                    <option value="">Select a vacant unit...</option>
                                    {selectedProperty.units?.map(u => (
                                        <option key={u.id} value={u.id}>Unit {u.unit_number} - {u.type} (${u.price})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Message (Optional)</label>
                                <textarea
                                    className="input min-h-[100px]"
                                    placeholder="Tell the landlord when you'd like to move in..."
                                    value={requestData.message}
                                    onChange={e => setRequestData(d => ({ ...d, message: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setRequestModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {videoModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setVideoModal(null)} />
                    <div className="relative z-10 w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                        <button
                            onClick={() => setVideoModal(null)}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                        {videoModal.type === 'youtube' && (
                            <iframe
                                src={videoModal.url.replace('watch?v=', 'embed/')}
                                className="w-full h-full"
                                title="YouTube Showroom Video"
                                allowFullScreen
                            />
                        )}
                        {videoModal.type === 'tiktok' && (
                            <iframe
                                src={`https://www.tiktok.com/embed/v2/${videoModal.url.split('video/')[1]?.split('?')[0]}`}
                                className="w-full h-full"
                                title="TikTok Showroom Video"
                                allowFullScreen
                            />
                        )}
                        {videoModal.type === 'local' && (
                            <video
                                src={videoModal.url}
                                className="w-full h-full object-contain"
                                controls
                                autoPlay
                            />
                        )}

                    </div>
                </div>
            )}

            {reviewModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
                    <div className="relative z-10 w-full max-w-xl card animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold">Reviews for {reviewModal.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 text-yellow-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-bold">{reviewModal.avg_rating || '5.0'}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">• {reviewModal.review_count || 0} reviews</span>
                                </div>
                            </div>
                            <button onClick={() => setReviewModal(null)} className="text-slate-500 hover:text-slate-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col gap-6">
                            <ReviewList reviews={reviewModal.reviews} />

                            {user?.role === 'tenant' && (
                                <ReviewForm
                                    propertyId={reviewModal.id}
                                    onReviewSubmitted={async () => {
                                        const res = await propertiesAPI.getOne(reviewModal.id);
                                        setReviewModal(res.data.data);
                                        // Update properties list to reflect new rating in background
                                        propertiesAPI.getPublic(activeCategory !== 'all' ? { category: activeCategory } : {})
                                            .then(res => setProperties(res.data.data));
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Marketplace;
