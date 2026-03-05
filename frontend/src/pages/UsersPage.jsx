import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../services/api';
import { Users, UserPlus, Search, Shield, User, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        username: '', email: '', password: '',
        role: 'tenant', first_name: '', last_name: '',
        phone: '', national_id: ''
    });

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await usersAPI.getAll();
            setUsers(res.data.data);
        } catch (err) {
            toast.error('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Reuse authAPI.register for creation since it handles profile creation
            await authAPI.register(form);
            toast.success('User created successfully!');
            setModal(false);
            setForm({ username: '', email: '', password: '', role: 'tenant', first_name: '', last_name: '', phone: '', national_id: '' });
            loadUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user.');
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await usersAPI.update(user.id, { is_active: !user.is_active });
            toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}!`);
            loadUsers();
        } catch (err) {
            toast.error('Failed to update user status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await usersAPI.delete(id);
            toast.success('User deleted.');
            loadUsers();
        } catch (err) {
            toast.error('Failed to delete user.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    const roleColors = {
        admin: 'badge-red',
        landlord: 'badge-blue',
        tenant: 'badge-green'
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
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage system access for Admins, Landlords, and Tenants</p>
                </div>
                <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
                    <UserPlus size={18} />
                    <span>Add User</span>
                </button>
            </div>

            <div className="card mb-6 mb-0 py-3 px-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="input pl-10 border-none bg-transparent"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredUsers.map(u => (
                    <div key={u.id} className="card-hover">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                    {u.role === 'admin' ? <Shield size={20} className="text-red-400" /> : <User size={20} className="text-slate-400" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-200">{u.first_name} {u.last_name}</h3>
                                    <p className="text-xs text-slate-500">@{u.username}</p>
                                </div>
                            </div>
                            <span className={clsx('badge', roleColors[u.role])}>{u.role}</span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="text-slate-600">Email:</span> {u.email}
                            </p>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <span className="text-slate-600">Status:</span>
                                <span className={u.is_active ? 'text-emerald-400' : 'text-red-400'}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                            <button
                                onClick={() => handleToggleStatus(u)}
                                className={clsx(
                                    "flex-1 btn-secondary py-1.5 flex items-center justify-center gap-2",
                                    u.is_active ? "hover:text-red-400" : "hover:text-emerald-400"
                                )}
                            >
                                {u.is_active ? <X size={14} /> : <Check size={14} />}
                                <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                            </button>
                            {currentUser.role === 'admin' && (
                                <button
                                    onClick={() => handleDelete(u.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
                    <div className="relative z-10 w-full max-w-lg card animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Create New User</h2>
                            <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Username *</label>
                                    <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input" required />
                                </div>
                                <div>
                                    <label className="label">Email *</label>
                                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" required />
                                </div>
                            </div>
                            <div>
                                <label className="label">Password *</label>
                                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" required />
                            </div>
                            <div>
                                <label className="label">Role *</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input" required>
                                    <option value="tenant">Tenant</option>
                                    <option value="landlord">Landlord</option>
                                    {currentUser.role === 'admin' && <option value="admin">Admin</option>}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">First Name</label>
                                    <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="input" />
                                </div>
                                <div>
                                    <label className="label">Last Name</label>
                                    <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="0712345678" />
                                </div>
                                <div>
                                    <label className="label">National ID</label>
                                    <input value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} className="input" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
