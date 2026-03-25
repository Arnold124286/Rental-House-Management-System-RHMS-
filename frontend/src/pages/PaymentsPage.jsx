import { useState, useEffect } from 'react';
import { paymentsAPI, leasesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Plus, X, Download, Mail, MessageSquare } from 'lucide-react';
import UnifiedPaymentModal from '../components/ui/UnifiedPaymentModal';

import toast from 'react-hot-toast';
import clsx from 'clsx';

function PaymentModal({ onClose, onSave }) {
  const [leases, setLeases] = useState([]);
  const [form, setForm] = useState({ lease_id: '', amount: '', method: 'cash', transaction_ref: '', payment_month: new Date().toISOString().slice(0, 7), notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    leasesAPI.getAll({ status: 'active' }).then(res => setLeases(res.data.data));
  }, []);

  const handleLeaseChange = (e) => {
    const lease = leases.find(l => l.id === e.target.value);
    setForm(p => ({ ...p, lease_id: e.target.value, amount: lease?.rent_amount || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await paymentsAPI.create(form);
      toast.success('Payment recorded successfully!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg card animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Record Payment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Lease / Tenant *</label>
            <select value={form.lease_id} onChange={handleLeaseChange} className="input" required>
              <option value="">Select active lease</option>
              {leases.map(l => (
                <option key={l.id} value={l.id}>{l.tenant_name} — Unit {l.unit_number} ({l.property_name})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (KES) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">Payment Month *</label>
              <input type="month" value={form.payment_month} onChange={e => setForm(p => ({ ...p, payment_month: e.target.value }))} className="input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Method</label>
              <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} className="input">
                {['cash', 'mpesa', 'bank_transfer', 'cheque', 'card'].map(m => (
                  <option key={m} value={m}>{m.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Transaction Ref</label>
              <input value={form.transaction_ref} onChange={e => setForm(p => ({ ...p, transaction_ref: e.target.value }))} className="input" placeholder="e.g. MPESA ref" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// PaystackModal is imported from components/ui/PaystackModal.jsx

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [tab, setTab] = useState('payments');

  const [bulkSMSLoading, setBulkSMSLoading] = useState(false);

  const load = () => {
    Promise.all([paymentsAPI.getAll(), paymentsAPI.getArrears()])
      .then(([p, a]) => { setPayments(p.data.data); setArrears(a.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemind = async (lease_id, type) => {
    const loadingToast = toast.loading(`Sending ${type.toUpperCase()}...`);
    try {
      await paymentsAPI.sendReminder({ lease_id, type });
      toast.success(`${type.toUpperCase()} Reminder Sent!`, { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to send ${type.toUpperCase()}`, { id: loadingToast });
    }
  };

  const handleBulkSMSRemind = async () => {
    if (!window.confirm("Are you sure you want to send SMS reminders to ALL tenants with arrears?")) return;

    setBulkSMSLoading(true);
    const loadingToast = toast.loading('Sending bulk SMS reminders...');
    try {
      const res = await paymentsAPI.sendBulkReminders();
      toast.success(res.data.message || 'Bulk reminders sent!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send bulk reminders.', { id: loadingToast });
    } finally {
      setBulkSMSLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId, filenameMonth) => {
    const loadingToast = toast.loading('Generating receipt...');
    try {
      const response = await paymentsAPI.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${filenameMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to download receipt.', { id: loadingToast });
    }
  };

  const methodBadge = { cash: 'badge-slate', paystack: 'badge-blue', bank_transfer: 'badge-blue', cheque: 'badge-yellow', card: 'badge-blue' };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{payments.length} total payments</p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'tenant' ? (
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /><span>Record Payment</span>
            </button>
          ) : (
            <button onClick={() => setShowPaystackModal(true)} className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-blue-900/20">
              <CreditCard size={16} /><span>Pay Rent (Secure Checkout)</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['payments', 'arrears'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors',
              tab === t ? 'bg-primary-600/20 text-primary-300 border border-primary-600/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200')}>
            {t}{t === 'arrears' && arrears.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">{arrears.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="card overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-16 text-center"><CreditCard size={40} className="text-slate-700 mx-auto mb-3" /><p className="text-slate-400">No payments recorded yet.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Tenant</th><th>Property / Unit</th><th>Month</th><th>Amount</th><th>Method</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-200">{p.tenant_name}</td>
                      <td>{p.property_name} — {p.unit_number}</td>
                      <td>{p.payment_month}</td>
                      <td><span className="font-semibold text-emerald-400">KES {Number(p.amount).toLocaleString()}</span></td>
                      <td><span className={clsx('badge', methodBadge[p.method] || 'badge-slate')}>{p.method?.replace('_', ' ')}</span></td>
                      <td>{new Date(p.paid_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDownloadReceipt(p.id, p.payment_month)}
                          className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-all flex items-center gap-1.5 ml-auto text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Download size={12} /> Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'arrears' && (
        <div className="space-y-3">
          {arrears.length > 0 && user?.role !== 'tenant' && (
            <div className="flex justify-end mb-4">
              <button
                onClick={handleBulkSMSRemind}
                disabled={bulkSMSLoading}
                className="btn-primary bg-amber-600 hover:bg-amber-500 border-none shadow-amber-900/20 flex items-center gap-2"
              >
                <MessageSquare size={16} />
                <span>{bulkSMSLoading ? 'Sending...' : 'Send Bulk SMS Reminders'}</span>
              </button>
            </div>
          )}

          {arrears.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-emerald-400 font-medium">🎉 No arrears this month!</p>
              <p className="text-slate-500 text-sm mt-1">All tenants are up to date.</p>
            </div>
          ) : arrears.map(a => (
            <div key={a.lease_id} className="card-hover flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">{a.tenant_name}</p>
                <p className="text-sm text-slate-500">{a.property_name} — Unit {a.unit_number}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-red-400 font-bold">KES {Number(a.rent_amount).toLocaleString()}</p>
                  <span className="badge-red badge text-xs">Unpaid</span>
                </div>
                {user?.role !== 'tenant' && (
                  <div className="flex flex-col gap-1 border-l border-slate-700 pl-4 ml-2">
                    <button onClick={() => handleRemind(a.lease_id, 'sms')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
                      <MessageSquare size={14} /> SMS
                    </button>
                    <button onClick={() => handleRemind(a.lease_id, 'email')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wider">
                      <Mail size={14} /> Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
      {showPaystackModal && <UnifiedPaymentModal onClose={() => setShowPaystackModal(false)} defaultType="rent" />}
    </div>
  );
}