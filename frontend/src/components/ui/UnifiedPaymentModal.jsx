import { useState, useEffect } from 'react';
import { X, Phone, CreditCard, Building2, Globe, ShieldCheck, Bitcoin, Apple, Banknote, ChevronRight } from 'lucide-react';
import { paymentsAPI, leasesAPI } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * SMART ROUTING RULES:
 * - Daraja (M-Pesa Local): Rent, Deposit, Complaint fees, Local tenants → STK Push.
 * - Card / Global: Opens sub-options: Card (Paystack), M-Pesa Global, Bank Transfer,
 *                  Apple Pay, PayPal, Crypto → Paystack checkout or dedicated flows.
 */

// ── Top-level gateway modes ────────────────────────────────────────────────────
const GATEWAY_MODES = [
    {
        id: 'daraja',
        label: 'M-Pesa (Local)',
        icon: '🇰🇪',
        description: 'Instant STK Push — Rent & Deposits',
        color: 'text-green-700',
        border: 'border-green-500',
        bg: 'bg-green-50',
        checkBg: 'bg-green-500',
    },
    {
        id: 'global',
        label: 'Card / Global Pay',
        icon: '🌍',
        description: 'M-Pesa Global · Card · Bank · Apple Pay · PayPal · Crypto',
        color: 'text-blue-700',
        border: 'border-blue-500',
        bg: 'bg-blue-50',
        checkBg: 'bg-blue-500',
    },
];

// ── Sub-options shown when "Card / Global" is selected ────────────────────────
const GLOBAL_METHODS = [
    {
        id: 'paystack_card',
        label: 'Card Payment',
        sub: 'Visa · Mastercard · Verve',
        icon: <CreditCard size={20} />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        highlight: 'border-blue-400 bg-blue-50/40',
        badge: null,
    },
    {
        id: 'mpesa_global',
        label: 'M-Pesa Global',
        sub: 'Diaspora M-Pesa payments',
        icon: <Phone size={20} />,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        highlight: 'border-green-400 bg-green-50/40',
        badge: 'Popular',
    },
    {
        id: 'bank',
        label: 'Bank Transfer',
        sub: 'Direct bank / RTGS / EFT',
        icon: <Building2 size={20} />,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
        highlight: 'border-slate-400 bg-slate-50/40',
        badge: null,
    },
    {
        id: 'apple_pay',
        label: 'Apple Pay',
        sub: 'One-tap on Safari / iOS',
        icon: <Apple size={20} />,
        iconBg: 'bg-gray-900',
        iconColor: 'text-white',
        highlight: 'border-gray-700 bg-gray-50/40',
        badge: null,
    },
    {
        id: 'paypal',
        label: 'PayPal',
        sub: 'International PayPal wallet',
        icon: <Banknote size={20} />,
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        highlight: 'border-sky-400 bg-sky-50/40',
        badge: null,
    },
    {
        id: 'crypto',
        label: 'Crypto',
        sub: 'BTC · ETH · USDT & more',
        icon: <Bitcoin size={20} />,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-500',
        highlight: 'border-orange-400 bg-orange-50/40',
        badge: 'Beta',
    },
];

export default function UnifiedPaymentModal({ onClose, defaultType = 'rent' }) {
    const [leases, setLeases] = useState([]);
    const [form, setForm] = useState({
        lease_id: '',
        amount: '',
        payment_month: new Date().toISOString().slice(0, 7),
        payment_type: defaultType,
        phone: '',
        is_foreign: false,
    });

    const [gatewayMode, setGatewayMode] = useState('daraja');  // daraja | global
    const [globalMethod, setGlobalMethod] = useState('paystack_card'); // sub-option
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = pick method, 2 = fill details

    useEffect(() => {
        leasesAPI.getAll({ status: 'active' })
            .then(res => setLeases(res.data.data || []))
            .catch(() => { });

        if (['booking', 'subscription', 'admin_fee'].includes(defaultType)) {
            setGatewayMode('global');
        } else {
            setGatewayMode('daraja');
        }
    }, [defaultType]);

    const handleLeaseChange = (e) => {
        const lease = leases.find(l => l.id === e.target.value);
        setForm(p => ({ ...p, lease_id: e.target.value, amount: lease?.rent_amount || '' }));
    };

    // Derive selected mode label for the button / header
    const currentMethodLabel = gatewayMode === 'daraja'
        ? 'M-Pesa STK Push'
        : GLOBAL_METHODS.find(m => m.id === globalMethod)?.label || 'Card / Global';

    const handlePay = async (e) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }

        if (!form.lease_id || !form.amount) {
            toast.error('Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            if (gatewayMode === 'daraja') {
                if (!form.phone) {
                    toast.error('Phone number is required for M-Pesa.');
                    setLoading(false);
                    return;
                }
                await paymentsAPI.initializeDaraja(form);
                toast.success('STK Push sent! Please check your phone.');
                setTimeout(() => onClose(), 3000);
            } else {
                // All global methods route through Paystack (which supports card, bank, mobile money, PayPal)
                // For Apple Pay & Crypto we surface a coming-soon notice until dedicated APIs are wired
                if (globalMethod === 'apple_pay') {
                    toast.error('Apple Pay requires Safari on iOS. Coming soon for in-app payments.');
                    setLoading(false);
                    return;
                }
                if (globalMethod === 'crypto') {
                    toast.error('Crypto payments are in beta. Please contact support to pay via crypto.');
                    setLoading(false);
                    return;
                }

                // Map sub-method → Paystack channel hint (passed as metadata)
                const channelMap = {
                    paystack_card: 'card',
                    mpesa_global: 'mobile_money',
                    bank: 'bank',
                    paypal: 'paypal',
                };
                const res = await paymentsAPI.initializePaystack({
                    ...form,
                    channel: channelMap[globalMethod] || 'card',
                    global_method: globalMethod,
                });
                toast.success('Redirecting to secure checkout...');
                const url = res.data?.data?.authorization_url || res.data?.data?.authorizationUrl;
                if (url) window.location.href = url;
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment initialization failed.');
            setLoading(false);
        }
    };

    const inputStyle = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm';
    const labelStyle = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[2rem] shadow-2xl shadow-blue-900/40 p-1 animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-[1.8rem] p-7">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Payment Details</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Step {step} of 2 — {step === 1 ? 'Choose method' : currentMethodLabel}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <form onSubmit={handlePay} className="space-y-4">

                        {/* ── STEP 1: Choose Gateway ─────────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-3">

                                {/* Top-level gateway tiles */}
                                {GATEWAY_MODES.map(mode => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setGatewayMode(mode.id)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                                            gatewayMode === mode.id
                                                ? `${mode.border} ${mode.bg} shadow-lg`
                                                : 'border-slate-100 hover:border-slate-200 bg-white'
                                        }`}
                                    >
                                        <span className="text-2xl">{mode.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-sm ${gatewayMode === mode.id ? mode.color : 'text-slate-700'}`}>
                                                {mode.label}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate">{mode.description}</p>
                                        </div>
                                        {gatewayMode === mode.id && (
                                            <div className={`h-6 w-6 rounded-full ${mode.checkBg} flex items-center justify-center text-white flex-shrink-0`}>
                                                <ShieldCheck size={14} />
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {/* Sub-options: only shown when "global" is selected */}
                                {gatewayMode === 'global' && (
                                    <div className="mt-1 rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
                                        {GLOBAL_METHODS.map(method => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setGlobalMethod(method.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
                                                    globalMethod === method.id
                                                        ? method.highlight
                                                        : 'bg-white hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className={`p-2 rounded-xl flex-shrink-0 ${method.iconBg} ${method.iconColor}`}>
                                                    {method.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-bold text-sm ${globalMethod === method.id ? 'text-slate-800' : 'text-slate-700'}`}>
                                                            {method.label}
                                                        </p>
                                                        {method.badge && (
                                                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500 text-white tracking-wide">
                                                                {method.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">{method.sub}</p>
                                                </div>
                                                {globalMethod === method.id
                                                    ? <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
                                                    : <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                                                }
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── STEP 2: Fill details ───────────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-200">
                                <div>
                                    <label className={labelStyle}>Lease / Unit *</label>
                                    <select value={form.lease_id} onChange={handleLeaseChange} required className={inputStyle}>
                                        <option value="">Select active lease</option>
                                        {leases.map(l => (
                                            <option key={l.id} value={l.id}>
                                                Unit {l.unit_number} ({l.property_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelStyle}>Amount (KES) *</label>
                                        <input type="number" value={form.amount} required className={inputStyle}
                                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>Month *</label>
                                        <input type="month" value={form.payment_month} required className={inputStyle}
                                            onChange={e => setForm(p => ({ ...p, payment_month: e.target.value }))} />
                                    </div>
                                </div>

                                {/* M-Pesa Local: need phone */}
                                {gatewayMode === 'daraja' && (
                                    <div>
                                        <label className={labelStyle}>M-Pesa Phone Number *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                required
                                                className={inputStyle + ' pl-10'}
                                                placeholder="e.g. 0712345678"
                                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                            />
                                        </div>
                                        <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1.5">
                                            <ShieldCheck size={12} /> STK Push will be sent to your phone.
                                        </p>
                                    </div>
                                )}

                                {/* M-Pesa Global: need phone too */}
                                {gatewayMode === 'global' && globalMethod === 'mpesa_global' && (
                                    <div>
                                        <label className={labelStyle}>M-Pesa Global Phone *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="tel"
                                                value={form.phone}
                                                required
                                                className={inputStyle + ' pl-10'}
                                                placeholder="+254712345678"
                                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                            />
                                        </div>
                                        <p className="text-[10px] text-green-600 font-bold mt-1.5 flex items-center gap-1.5">
                                            <ShieldCheck size={12} /> Diaspora M-Pesa via Paystack Global.
                                        </p>
                                    </div>
                                )}

                                {/* Card / Bank / PayPal info panel */}
                                {gatewayMode === 'global' && ['paystack_card', 'bank', 'paypal'].includes(globalMethod) && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Globe size={15} className="text-blue-500" />
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                                                {GLOBAL_METHODS.find(m => m.id === globalMethod)?.label} via Paystack
                                            </p>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            You'll be redirected to a secure Paystack checkout page to complete your payment.
                                        </p>
                                    </div>
                                )}

                                {/* Apple Pay info */}
                                {gatewayMode === 'global' && globalMethod === 'apple_pay' && (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Apple size={15} className="text-gray-800" />
                                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Apple Pay</p>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Apple Pay is available on Safari on iPhone, iPad, and Mac. Tap <strong>Complete Payment</strong> to open Apple Pay.
                                        </p>
                                    </div>
                                )}

                                {/* Crypto info */}
                                {gatewayMode === 'global' && globalMethod === 'crypto' && (
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Bitcoin size={15} className="text-orange-500" />
                                            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Crypto Payment (Beta)</p>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Pay with BTC, ETH, USDT, or other coins via Coinbase Commerce. Currently in beta — contact support if you encounter any issues.
                                        </p>
                                    </div>
                                )}

                                {/* Back link */}
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    ← Change payment method
                                </button>
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl text-sm font-black text-white transition-all shadow-xl active:scale-95 ${
                                loading ? 'bg-slate-400' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'
                            }`}
                        >
                            {loading ? 'Processing...' : step === 1 ? 'Continue →' : 'Complete Payment'}
                        </button>

                        {/* Footer trust badges */}
                        <div className="flex items-center justify-center gap-2 pt-1">
                            <span className="h-px flex-1 bg-slate-100" />
                            <div className="flex items-center gap-2 opacity-50">
                                <span className="text-[9px] font-bold text-slate-400">SECURED BY</span>
                                <span className="text-[10px] font-black text-emerald-600">DARAJA</span>
                                <span className="text-[10px] font-black text-blue-600">PAYSTACK</span>
                                <span className="text-[10px] font-black text-orange-500">COINBASE</span>
                            </div>
                            <span className="h-px flex-1 bg-slate-100" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
