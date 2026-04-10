import React, { useState, useEffect } from "react";
import {
    UserPlus, Users, Search, X, Shield,
    Mail, Phone, Edit2, Trash2, CheckCircle,
    Loader2, MoreVertical, Activity, Layers,
    ChevronRight, Info, Layout, AtSign, Fingerprint
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { useTheme } from "../../ThemeContext";
import { API_URLS, callEdgeFunction } from "../../supabaseClient";

const AdminDashboard = ({ userRole }) => {
    const { theme, isDarkMode } = useTheme();
    const [users, setUsers] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [newUser, setNewUser] = useState({ email: "", role: "operator" });

    if (userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
                <div className="text-center p-12 bg-white dark:bg-slate-950 rounded-2xl border border-red-100 dark:border-red-900 shadow-xl">
                    <Shield size={60} className="mx-auto text-red-500 mb-6 opacity-20" />
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight uppercase">Access Denied</h1>
                    <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">Identity verification failure. You do not have authorization to view enterprise team resources.</p>
                </div>
            </div>
        );
    }

    const fetchUsers = async () => {
        setFetchLoading(true);
        try {
            const data = await callEdgeFunction(API_URLS.LIST_USERS);
            setUsers(data?.users || (Array.isArray(data) ? data : []));
        } catch (error) {
            console.error("Fetch failure:", error);
            toast.error("Registry sync failure");
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await callEdgeFunction(API_URLS.USER_INVITE, { email: newUser.email, role: newUser.role.toLowerCase() });
            toast.success("Invitation transmitted");
            setShowAddModal(false);
            setNewUser({ email: "", role: "operator" });
            fetchUsers();
        } catch (error) {
            toast.error(error.message || "Invitation failed");
        } finally { setLoading(false); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Permanently dissociate this user identity?")) return;
        try {
            await callEdgeFunction(API_URLS.DELETE_USER, { user_id: userId });
            toast.success("Dissociation successful");
            fetchUsers();
        } catch (error) { toast.error(error.message || "Dissociation failed"); }
    };

    const handleToggleUserStatus = async (userId, currentActiveState) => {
        try {
            const nextActiveState = !currentActiveState;
            await callEdgeFunction(API_URLS.STATUS, { user_id: userId, is_active: nextActiveState });
            toast.success(`Identity ${nextActiveState ? 'Activated' : 'Suspended'}`);
            fetchUsers();
        } catch (error) { toast.error(error.message || "Status update failed"); }
    };

    const filteredUsers = users.filter(u => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
    });

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12">

            {/* Header Content */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl">
                            <Users size={20} className="text-white dark:text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black  dark:text-white tracking-tight">Users</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Access Management Registry</p>
                        </div>
                    </div>

                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12 pr-6 py-3 min-w-[300px]"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary h-[46px] px-8 gap-2 text-[10px] uppercase tracking-widest whitespace-nowrap shadow-xl shadow-blue-500/20"
                    >
                        <UserPlus size={16} strokeWidth={3} />
                        Invite Identity
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Assets", value: "1,284", icon: Layers, trend: "+12.5%", color: "text-blue-500" },
                    { label: "Active Registry", value: fetchLoading ? "..." : users.length, icon: Users, trend: "Stable", color: "text-emerald-500" },
                    { label: "System Uptime", value: "99.9%", icon: Activity, trend: "Verified", color: "text-blue-500" },
                    { label: "Security Level", value: "Verified", icon: Shield, trend: "Encrypted", color: "text-slate-500" },
                ].map((stat, i) => (
                    <div key={i} className="card-premium p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 group hover:border-blue-500/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${stat.color} opacity-60`}>{stat.trend}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <div className="card-premium overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all shadow-blue-500/[0.02]">
                <div className="px-8 py-5 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
                    <div className="flex items-center gap-2">
                        <Layout size={14} className="text-blue-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enterprise Registry Audit</h4>
                    </div>
                    <button className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"><MoreVertical size={16} /></button>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-900">
                                {["Identity Signature", "Access Metadata", "Authorization Role", "Identity Status", "Action"].map((head) => (
                                    <th key={head} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                            {fetchLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-500/20 mb-4" size={40} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing Team Registry</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <Fingerprint size={48} className="mx-auto mb-4 text-slate-100 dark:text-slate-900" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No Resource Signatures Detected</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 text-white dark:bg-slate-800 flex items-center justify-center font-black text-xs uppercase rounded-xl border border-white/10">
                                                    {user.first_name?.[0] || '?'}{user.last_name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                                                        {user.first_name || 'Provisioning...'} {user.last_name || ''}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">ID Signature: {user.id?.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                                    <AtSign size={12} className="text-blue-500" /> {user.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                                    <Phone size={11} className="text-emerald-500" /> {user.phone || 'No Linked Endpoint'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.role?.toLowerCase() === 'admin' ? 'bg-blue-500/10 text-blue-500 border-blue-500/10' :
                                                    user.role?.toLowerCase() === 'operator' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' :
                                                        'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => handleToggleUserStatus(user.id, user.is_active !== undefined ? user.is_active : (user.status === 'Active'))}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ring-offset-2 focus:ring-2 focus:ring-blue-500 ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-800'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'text-blue-500' : 'text-slate-400'}`}>
                                                    {user.is_active !== undefined ? (user.is_active ? 'Authorized' : 'Suspended') : (user.status || 'Verified')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Redesigned Identity Invitation Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                                    <UserPlus size={20} className="text-white dark:text-slate-900" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Invite Identity</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Access Protocol</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-10 space-y-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                    <AtSign size={12} className="text-blue-500" /> Targeted Communication Address
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="e.g. signature@enterprise.com"
                                    className="input-premium py-4 text-sm font-bold bg-white dark:bg-slate-900"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                                <p className="text-[10px] font-medium text-slate-400 ml-1">An automated access link will be transmitted to this identity.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                    <Fingerprint size={12} className="text-blue-500" /> Designated Access Authority
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["admin", "operator", "viewer"].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewUser({ ...newUser, role })}
                                            className={`py-4 rounded-xl border-2 transition-all font-black uppercase tracking-widest text-[10px] ${newUser.role === role ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-slate-900">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1 h-12 uppercase text-[10px] tracking-widest font-bold">Discard</button>
                                <button type="submit" disabled={loading} className="btn btn-primary flex-1 h-12 uppercase tracking-[0.2em] font-black text-[10px] shadow-xl shadow-blue-500/20">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Transmit Invitation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Toaster position="top-right" />
        </div>
    );
};

export default AdminDashboard;
