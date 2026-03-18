import React, { useState, useEffect } from 'react';
import { propertiesAPI, leaseRequestsAPI } from '../services/api';
import { Building2, Search, MapPin, Home, ArrowRight, Star, MessageSquare, PlayCircle, X } from 'lucide-react';

import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReviewList from '../components/ui/ReviewList';
import ReviewForm from '../components/ui/ReviewForm';
import UnifiedPaymentModal from '../components/ui/UnifiedPaymentModal';

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
    const [bookingModal, setBookingModal] = useState(false); // New state for payment modal


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
        <div className="min-h-screen bg-slate-50 p-6 font-quicksand">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Explore Available Houses</h1>
                        <p className="text-slate-500 font-medium">Discover your next home from our approved collection</p>
                    </div>
                    <div className="flex flex-col gap-4 max-w-xl w-full">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="input pl-10 bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500/20 shadow-sm rounded-xl py-3"
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
                                    className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${activeCategory === cat.id
                                        ? 'border-transparent text-white shadow-md'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    style={activeCategory === cat.id ? { backgroundColor: '#1d4ed8' } : {}}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl shadow-sm">
                        <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No Houses Found</h3>
                        <p className="text-slate-500">No approved houses matching your criteria are currently available.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {filteredProperties.map(p => (
                            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row group">
                                {/* Image panel */}
                                <div className="sm:w-64 sm:min-w-[256px] h-52 sm:h-auto bg-slate-100 relative overflow-hidden flex-shrink-0">
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                        <Building2 size={48} className="text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white text-slate-800 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border border-slate-200">
                                            {p.category}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <span className="bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                                            {p.vacant_units} Units Available
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        {/* Title row: name + rating badge (like Booking.com) */}
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors leading-tight">
                                                {p.name}
                                            </h3>
                                            {/* Rating badge — top right like Booking.com */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await propertiesAPI.getOne(p.id);
                                                        setReviewModal(res.data.data);
                                                    } catch (err) {
                                                        toast.error('Could not load reviews.');
                                                    }
                                                }}
                                                className="flex-shrink-0 flex flex-col items-end gap-0.5 hover:opacity-80 transition-opacity"
                                            >
                                                <span className="text-xs font-semibold text-slate-500">{Number(p.avg_rating || 5).toFixed(1) >= 4.5 ? 'Superb' : Number(p.avg_rating || 5).toFixed(1) >= 4 ? 'Very Good' : 'Good'}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-slate-400">({p.review_count || 0} reviews)</span>
                                                    <span className="bg-primary-700 text-white font-extrabold text-sm w-9 h-9 rounded-xl rounded-tr-none flex items-center justify-center shadow">
                                                        {Number(p.avg_rating || 5).toFixed(1)}
                                                    </span>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Location */}
                                        <div className="flex items-center gap-1.5 text-slate-700 text-sm font-semibold mb-3">
                                            <MapPin size={14} className="text-primary-600" />
                                            <span>{p.city}, {p.address}</span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-slate-700 text-sm leading-relaxed line-clamp-2 font-medium">
                                            {p.description || "Beautifully managed property with modern amenities and 24/7 security."}
                                        </p>
                                    </div>

                                    {/* Footer: landlord + actions */}
                                    <div className="flex items-end justify-between mt-5 pt-5 border-t border-slate-200">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mb-0.5">Managed by</div>
                                            <div className="text-sm font-extrabold text-slate-900">{p.landlord_name}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await propertiesAPI.getOne(p.id);
                                                        const unitsWithVideo = res.data.data.units.filter(u => u.video_url);
                                                        if (unitsWithVideo.length > 0) {
                                                            setVideoModal({ url: unitsWithVideo[0].video_url, type: unitsWithVideo[0].video_type || 'youtube' });
                                                        } else {
                                                            toast.error('No showroom video available for this property.');
                                                        }
                                                    } catch (err) {
                                                        toast.error('Error loading video details.');
                                                    }
                                                }}
                                                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all"
                                            >
                                                <PlayCircle size={16} /> Showroom
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
                                                className="text-white font-bold px-5 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-md hover:opacity-90"
                                                style={{ backgroundColor: '#1d4ed8' }}
                                            >
                                                Pick a House <ArrowRight size={16} />
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
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRequestModal(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-slate-900 leading-tight">Pick your Unit at {selectedProperty.name}</h2>
                            <button onClick={() => setRequestModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                        </div>
                        
                        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">Choose your preferred unit and decide how you want to proceed.</p>

                        <form onSubmit={handleRequest} className="space-y-6">
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Select Unit</label>
                                <select
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    required
                                    value={requestData.unit_id}
                                    onChange={e => setRequestData(d => ({ ...d, unit_id: e.target.value }))}
                                >
                                    <option value="">Select a vacant unit...</option>
                                    {selectedProperty.units?.map(u => (
                                        <option key={u.id} value={u.id}>Unit {u.unit_number} — KES {Number(u.price || selectedProperty.price || 0).toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button type="submit" className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-sm">
                                    Send Interest (Free)
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { setRequestModal(false); setBookingModal(true); }}
                                    className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black transition-all shadow-xl shadow-primary-500/20 text-sm"
                                >
                                    Instant Online Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {bookingModal && selectedProperty && (
                <UnifiedPaymentModal 
                    onClose={() => setBookingModal(false)} 
                    defaultType="booking" 
                />
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
