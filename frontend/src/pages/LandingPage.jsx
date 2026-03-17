import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Building2,
    UserCircle2,
    ArrowRight,
    ShieldCheck,
    Search,
    Star,
    MessageSquare,
} from "lucide-react";

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState("tenant");
    const navigate = useNavigate();

    const features = {
        tenant: [
            {
                icon: Search,
                title: "Browse & Discover",
                desc: "Find Rentals, BnBs, or Boardrooms. Watch showroom clips before you pick.",
            },
            {
                icon: ShieldCheck,
                title: "Easy Relocation",
                desc: "Pick a house, pay deposits securely, and request relocation anytime.",
            },
            {
                icon: MessageSquare,
                title: "Complaint Filing",
                desc: "Direct channel to landlords and admins for fast issue resolution.",
            },
        ],

        landlord: [
            {
                icon: Building2,
                title: "Versatile Postings",
                desc: "Categorize your property as BnB, Rental, or Lease with custom pricing.",
            },
            {
                icon: Star,
                title: "Showroom Videos",
                desc: "Upload high-quality clips to attract the best tenants.",
            },
            {
                icon: MessageSquare,
                title: "Client Support",
                desc: "Manage complaints and reviews to maintain high ratings.",
            },
        ],

        admin: [
            {
                icon: ShieldCheck,
                title: "Approvals",
                desc: "Review landlord registrations and property listings.",
            },
            {
                icon: Star,
                title: "Oversight",
                desc: "Monitor reviews and complaints across the system.",
            },
            {
                icon: Building2,
                title: "Blacklisting",
                desc: "Remove bad listings to maintain marketplace quality.",
            },
        ],
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">

            {/* ================= NAVBAR ================= */}

            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/10">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                        <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                            <Building2 className="text-white" size={20} />
                        </div>

                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            RHMS
                        </span>

                    </div>

                    <div className="flex items-center gap-4">

                        <Link
                            to="/login"
                            className="text-sm font-medium hover:text-white transition"
                        >
                            Login
                        </Link>

                        <Link
                            to="/marketplace"
                            className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm shadow-lg"
                        >
                            Browse Houses
                        </Link>

                    </div>

                </div>
            </nav>


            <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                {/* Background image — sharp, no zoom */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/Landlord bg.jpg')" }}
                />
                {/* Booking.com-style flat blue tint — heavier for text contrast */}
                <div className="absolute inset-0" style={{ background: 'rgba(3, 44, 110, 0.62)' }} />
                {/* Bottom gradient for text area */}
                <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.5) 50%, transparent 100%)' }} />

                {/* Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-28 pb-16">
                    <div className="max-w-3xl">
                        {/* Trust badge */}
                        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-5 py-2 text-xs font-bold text-white uppercase tracking-widest mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Kenya's #1 Rental Platform
                        </span>

                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white leading-tight" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,1)' }}>
                            Modern Living,{" "}
                            <span className="text-primary-300">Simplified.</span>
                        </h1>

                        <p className="text-xl text-white max-w-xl mb-12 font-semibold leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
                            The all-in-one platform for tenants to find homes and landlords to manage properties.
                        </p>

                        {/* Tabs */}
                        <div className="flex mb-12">
                            <div className="inline-flex p-1.5 bg-black/30 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl">
                                <button onClick={() => setActiveTab("tenant")} className={`px-6 py-2.5 rounded-xl flex gap-2 items-center text-sm font-bold transition-all ${activeTab === "tenant" ? "bg-primary-600 text-white shadow-lg" : "text-slate-300 hover:text-white"}`}>
                                    <UserCircle2 size={18} /> Tenants
                                </button>
                                <button onClick={() => setActiveTab("landlord")} className={`px-6 py-2.5 rounded-xl flex gap-2 items-center text-sm font-bold transition-all ${activeTab === "landlord" ? "bg-primary-600 text-white shadow-lg" : "text-slate-300 hover:text-white"}`}>
                                    <Building2 size={18} /> Landlords
                                </button>
                                <button onClick={() => setActiveTab("admin")} className={`px-6 py-2.5 rounded-xl flex gap-2 items-center text-sm font-bold transition-all ${activeTab === "admin" ? "bg-primary-600 text-white shadow-lg" : "text-slate-300 hover:text-white"}`}>
                                    <ShieldCheck size={18} /> Admins
                                </button>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-4">
                            <Link to={`/register?role=${activeTab}`} className="px-10 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-extrabold text-lg flex items-center gap-2 shadow-xl shadow-primary-700/40 transition-all hover:-translate-y-1">
                                Get Started <ArrowRight size={20} />
                            </Link>
                            <Link to="/marketplace" className="px-10 py-4 rounded-2xl bg-white/10 border border-white/25 hover:bg-white/20 text-white font-extrabold text-lg backdrop-blur-sm transition-all hover:-translate-y-1">
                                Explore Houses
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES SECTION ================= */}
            <section className="bg-white py-20 relative z-20 -mt-10 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features[activeTab].map((f, i) => (
                            <div
                                key={i}
                                className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-primary-400 hover:bg-primary-50/30 hover:shadow-xl transition-all duration-300 shadow-sm"
                            >
                                <div className="w-14 h-14 bg-primary-600/10 rounded-2xl flex items-center justify-center mb-6 border border-primary-200">
                                    <f.icon className="text-primary-600" size={26} />
                                </div>
                                <h3 className="text-xl font-extrabold mb-3 text-slate-900">
                                    {f.title}
                                </h3>
                                <p className="text-slate-600 text-base leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ================= FOOTER ================= */}

            <footer className="border-t border-white/10 py-10">

                <div className="max-w-7xl mx-auto px-4 flex justify-between text-sm text-slate-400">

                    <span>RHMS © 2026</span>

                    <div className="flex gap-6">
                        <a href="#">Terms</a>
                        <a href="#">Privacy</a>
                        <a href="#">Help</a>
                    </div>

                </div>

            </footer>

        </div>
    );
};

export default LandingPage;