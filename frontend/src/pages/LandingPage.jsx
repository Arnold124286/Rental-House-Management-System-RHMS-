import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserCircle2, ArrowRight, ShieldCheck, Search, Star, MessageSquare } from 'lucide-react';

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState('tenant');
    const navigate = useNavigate();

    const features = {
        tenant: [
            { icon: Search, title: "Browse & Discover", desc: "Find Rentals, BnBs, or Boardrooms. Watch showroom clips before you pick." },
            { icon: ShieldCheck, title: "Easy Relocation", desc: "Pick a house, pay deposits securely, and request relocation anytime." },
            { icon: MessageSquare, title: "Complaint Filing", desc: "Direct channel to landlords and admins for fast issue resolution." },
        ],
        landlord: [
            { icon: Building2, title: "Versatile Postings", desc: "Categorize your property as BnB, Rental, or Lease with custom pricing." },
            { icon: Star, title: "Showroom Videos", desc: "Upload high-quality clips to attract the best tenants and clients." },
            { icon: MessageSquare, title: "Client Support", desc: "Manage complaints and reviews to maintain high property ratings." },
        ],
        admin: [
            { icon: ShieldCheck, title: "Approvals", desc: "Review and approve landlord registrations and property listings." },
            { icon: Star, title: "Oversight", desc: "Monitor all reviews and complaints to ensure high system satisfaction." },
            { icon: Building2, title: "Blacklisting", desc: "De-list properties with poor feedback to maintain marketplace quality." },
        ]
    };


    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary-500/30">
            {/* Navigation */}
            <nav className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Building2 className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">RHMS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium hover:text-white transition-colors">Login</Link>
                        <Link to="/marketplace" className="btn-primary py-1.5 px-4 text-sm">Browse Houses</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary-600/20 blur-[120px] -z-10 rounded-full" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Modern Living, <span className="text-primary-500">Simplified.</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                        The all-in-one platform for tenants to find homes and landlords to manage properties efficiently.
                    </p>

                    {/* Role Tabs */}
                    <div className="flex items-center justify-center mb-16">
                        <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setActiveTab('tenant')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tenant' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <UserCircle2 size={18} /> For Tenants
                            </button>
                            <button
                                onClick={() => setActiveTab('landlord')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'landlord' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <Building2 size={18} /> For Landlords
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'admin' ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <ShieldCheck size={18} /> For Admins
                            </button>

                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {features[activeTab].map((f, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-primary-500/50 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <f.icon className="text-primary-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={`/register?role=${activeTab}`}
                            className="btn-primary px-8 py-3 text-lg flex items-center gap-2 group w-full sm:w-auto justify-center"
                        >
                            Get Started as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </Link>
                        <Link to="/marketplace" className="btn-secondary px-8 py-3 text-lg w-full sm:w-auto">
                            Explore Houses
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
                            <Building2 className="text-slate-400" size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">RHMS © 2024</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <a href="#" className="hover:text-slate-300">Terms</a>
                        <a href="#" className="hover:text-slate-300">Privacy</a>
                        <a href="#" className="hover:text-slate-300">Help</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
