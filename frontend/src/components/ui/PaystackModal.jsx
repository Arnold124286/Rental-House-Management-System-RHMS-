import { useState, useEffect } from 'react';
import { X, Phone, CreditCard, Building2, Mail } from 'lucide-react';
import { paymentsAPI, leasesAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Payment channel definitions ──────────────────────────────────────────
const PAYMENT_CHANNELS = [
    {
        id: 'mobile_money',
        label: 'M-Pesa',
        icon: (
            <span style={{ display: 'flex', alignItems: 'center', gap: '1px', fontWeight: 900, fontSize: '13px' }}>
                <span style={{ color: '#4caf50' }}>M</span>
                <span style={{ fontSize: '16px', margin: '0 1px' }}>🌶</span>
                <span style={{ color: '#4caf50' }}>PESA</span>
            </span>
        ),
    },
    {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        icon: (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11"
                    stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'card',
        label: 'Card Payment',
        icon: (
            <svg width="30" height="22" viewBox="0 0 30 22">
                <rect x="0" y="0" width="30" height="22" rx="3" fill="#f59e0b" />
                <rect x="0" y="6" width="30" height="5" fill="#d97706" />
                <rect x="3" y="15" width="8" height="2.5" rx="1.2" fill="rgba(255,255,255,0.6)" />
            </svg>
        ),
    },
    {
        id: 'apple_pay',
        label: 'Apple Pay',
        icon: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="18" height="22" viewBox="0 0 24 24" fill="#111">
                    <path d="M17.05 11.83c-.02-1.67.74-2.95 2.27-3.88-.87-1.28-2.22-2-3.99-2.14-1.68-.14-3.5 1.01-4.17 1.01-.7 0-2.32-.97-3.6-.97C5.06 5.89 3 7.49 3 11.01c0 1.05.19 2.14.57 3.24.51 1.5 2.38 5.14 4.32 5.08.97-.02 1.66-.67 2.75-.67 1.06 0 1.69.67 2.76.67 1.96-.03 3.65-3.38 4.13-4.88-.01 0-2.48-1.18-2.48-3.62zM14.19 4.25c1.21-1.48 1.08-2.82 1.04-3.25-1.02.06-2.19.68-2.88 1.49-.75.87-1.2 1.96-1.1 3.1 1.1.08 2.11-.5 2.94-1.34z" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>Pay</span>
            </div>
        ),
    },
    {
        id: 'paypal',
        label: 'PayPal',
        icon: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', fontWeight: 900, fontSize: '15px' }}>
                <span style={{ color: '#003087' }}>Pay</span>
                <span style={{ color: '#009cde' }}>Pal</span>
            </div>
        ),
    },
];

// ─── Channel-specific extra fields ────────────────────────────────────────
function ChannelFields({ channel, extra, setExtra, inputStyle, labelStyle }) {
    const field = (key, label, placeholder, type = 'text', maxLen) => (
        <div>
            <label style={labelStyle}>{label} *</label>
            <input
                type={type}
                value={extra[key] || ''}
                placeholder={placeholder}
                required
                maxLength={maxLen}
                onChange={e => setExtra(p => ({ ...p, [key]: e.target.value }))}
                style={inputStyle}
            />
        </div>
    );

    if (channel === 'mobile_money') {
        return (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Phone size={15} color="#16a34a" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>M-Pesa STK Push Details</span>
                </div>
                {field('phone', 'M-Pesa Phone Number', 'e.g. 0712345678 or 254712345678', 'tel')}
                <p style={{ fontSize: '11px', color: '#16a34a', margin: 0 }}>
                    📱 A payment prompt will be sent directly to this number.
                </p>
            </div>
        );
    }

    if (channel === 'bank_transfer') {
        return (
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Building2 size={15} color="#2563eb" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>Bank Transfer Details</span>
                </div>
                {field('bank_name', 'Bank Name', 'e.g. Equity Bank, KCB')}
                {field('account_name', 'Account Holder Name', 'Full name on account')}
                {field('account_number', 'Account Number', 'e.g. 0123456789')}
            </div>
        );
    }

    if (channel === 'card') {
        return (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <CreditCard size={15} color="#d97706" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>Card Details</span>
                </div>
                {field('card_number', 'Card Number', '1234 5678 9012 3456', 'text', 19)}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {field('card_expiry', 'Expiry (MM/YY)', '08 / 28', 'text', 5)}
                    {field('card_cvv', 'CVV', '123', 'password', 4)}
                </div>
                {field('card_name', 'Name on Card', 'Full name as on card')}
            </div>
        );
    }

    if (channel === 'apple_pay') {
        return (
            <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}></div>
                <p style={{ fontSize: '13px', color: '#374151', fontWeight: 600, margin: 0 }}>Apple Pay</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                    You'll be redirected to complete payment using Touch ID / Face ID on your Apple device.
                </p>
            </div>
        );
    }

    if (channel === 'paypal') {
        return (
            <div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <Mail size={15} color="#003087" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#003087' }}>PayPal Details</span>
                </div>
                {field('paypal_email', 'PayPal Email Address', 'yourname@paypal.com', 'email')}
            </div>
        );
    }

    return null;
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function PaystackModal({ onClose }) {
    const [leases, setLeases] = useState([]);
    const [form, setForm] = useState({
        lease_id: '',
        amount: '',
        payment_month: new Date().toISOString().slice(0, 7),
    });
    const [extra, setExtra] = useState({});
    const [selectedChannel, setSelectedChannel] = useState('card');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    useEffect(() => {
        leasesAPI.getAll({ status: 'active' })
            .then(res => setLeases(res.data.data || []))
            .catch(() => { });
    }, []);

    // Reset channel-specific fields when channel changes
    const handleChannelSelect = (id) => {
        setSelectedChannel(id);
        setExtra({});
    };

    const handleLeaseChange = (e) => {
        const lease = leases.find(l => l.id === e.target.value);
        setForm(p => ({ ...p, lease_id: e.target.value, amount: lease?.rent_amount || '' }));
    };

    const handlePay = async (e) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }

        if (!form.lease_id || !form.amount || !form.payment_month) {
            toast.error('Please fill all required fields.');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form, channel: selectedChannel, channel_meta: extra };
            const res = await paymentsAPI.initializePaystack(payload);
            toast.success('Redirecting to secure payment...');
            const url = res.data?.data?.authorization_url || res.data?.data?.authorizationUrl;
            if (url) {
                window.location.href = url;
            } else {
                toast.error('Could not get checkout URL. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate payment.');
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a2560',
        background: '#fff', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    };

    const labelStyle = {
        fontSize: '11px', fontWeight: 700, color: '#9ca3af',
        marginBottom: '5px', display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase',
    };

    const activeChannel = PAYMENT_CHANNELS.find(c => c.id === selectedChannel);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />

            {/* Modal box */}
            <div style={{
                position: 'relative', zIndex: 10, width: '100%', maxWidth: '390px',
                background: 'linear-gradient(160deg, #f0f4ff 0%, #ffffff 60%)',
                borderRadius: '24px', boxShadow: '0 30px 80px rgba(0,0,30,0.35)',
                padding: '26px 22px 20px', color: '#1a1a2e',
                maxHeight: '92vh', overflowY: 'auto',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a2560', margin: 0 }}>
                        {step === 1 ? 'Complete Payment' : 'Payment Details'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', color: '#6b7280', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handlePay}>
                    {/* ── STEP 1: Pick channel ── */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                            {PAYMENT_CHANNELS.map(channel => {
                                const active = selectedChannel === channel.id;
                                return (
                                    <button key={channel.id} type="button" onClick={() => handleChannelSelect(channel.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px',
                                            border: active ? '2px solid #c7d2fe' : '1.5px solid #f0f0f0',
                                            borderRadius: '14px', background: active ? '#eef2ff' : '#fff',
                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                            boxShadow: active ? '0 2px 10px rgba(37,99,235,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                                        }}>
                                        <span style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {channel.icon}
                                        </span>
                                        <span style={{ fontWeight: 600, color: '#1a2560', fontSize: '15px', flex: 1, textAlign: 'left' }}>
                                            {channel.label}
                                        </span>
                                        {active && (
                                            <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ── STEP 2: Details ── */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Lease */}
                            <div>
                                <label style={labelStyle}>Lease / Unit *</label>
                                <select value={form.lease_id} onChange={handleLeaseChange} required style={inputStyle}>
                                    <option value="">Select active lease</option>
                                    {leases.map(l => (
                                        <option key={l.id} value={l.id}>
                                            Unit {l.unit_number} ({l.property_name}) — KES {Number(l.rent_amount).toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount + Month */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={labelStyle}>Amount (KES) *</label>
                                    <input type="number" value={form.amount} required style={inputStyle}
                                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Month *</label>
                                    <input type="month" value={form.payment_month} required style={inputStyle}
                                        onChange={e => setForm(p => ({ ...p, payment_month: e.target.value }))} />
                                </div>
                            </div>

                            {/* Channel-specific fields */}
                            <ChannelFields
                                channel={selectedChannel}
                                extra={extra}
                                setExtra={setExtra}
                                inputStyle={inputStyle}
                                labelStyle={labelStyle}
                            />

                            {/* Selected method + change */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: '10px' }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>{activeChannel?.icon}</span>
                                <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>{activeChannel?.label}</span>
                                <button type="button" onClick={() => { setStep(1); setExtra({}); }} style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                    Change
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pay Button */}
                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '15px', borderRadius: '14px',
                        background: 'linear-gradient(135deg,#1a56db 0%,#2563eb 100%)',
                        color: '#fff', fontWeight: 700, fontSize: '16px',
                        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                        marginTop: '18px', boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                        opacity: loading ? 0.75 : 1, transition: 'all 0.15s',
                        letterSpacing: '0.01em',
                    }}>
                        {loading ? 'Processing...' : step === 1 ? 'Pay Securely' : 'Complete Payment'}
                    </button>

                    {/* Security badges */}
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#aaa"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7l-9-5z" /></svg>
                            <span style={{ fontSize: '11px', color: '#aaa', fontWeight: 500 }}>Secured by</span>
                            <span style={{ fontWeight: 800, fontSize: '12px', color: '#00c3f7', letterSpacing: '-0.03em' }}>paystack</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 8px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                                <span style={{ fontWeight: 900, fontSize: '12px', fontStyle: 'italic', color: '#1a1f71' }}>VISA</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#eb001b', marginRight: '-9px', zIndex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f79e1b', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                            </div>
                            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#2563eb' }}>PCI</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#16a34a' }}>✓</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#16a34a' }}>DSS</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
