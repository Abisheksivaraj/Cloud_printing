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
                        <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-md">
                            <Users size={20} className="text-white dark:text-slate-900" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black dark:text-white tracking-tight">Users</h1>
                            <p className="text-xs font-bold text-slate-400 mt-1">Manage team members and roles</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-12 pr-6 py-3 min-w-[300px]"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary h-[46px] px-8 gap-2 text-sm font-bold shadow-md"
                    >
                        <UserPlus size={16} strokeWidth={2.5} />
                        Invite User
                    </button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Users", value: fetchLoading ? "..." : users.length, icon: Users, color: "text-blue-500" },
                    { label: "Active Accounts", value: fetchLoading ? "..." : users.filter(u => (u.is_active !== undefined ? u.is_active : u.status === 'Active')).length, icon: Activity, color: "text-emerald-500" },
                    { label: "Administrators", value: fetchLoading ? "..." : users.filter(u => u.role?.toLowerCase() === 'admin').length, icon: Shield, color: "text-indigo-500" },
                    { label: "Operators", value: fetchLoading ? "..." : users.filter(u => u.role?.toLowerCase() === 'operator').length, icon: Layers, color: "text-sky-500" },
                ].map((stat, i) => (
                    <div key={i} className="card-premium p-6 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-5 group hover:border-blue-500/30 transition-all shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Registry Table */}
            <div className="card-premium overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all shadow-blue-500/[0.02]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-slate-50 dark:border-slate-900">
                                {["User", "Contact Info", "Role", "Status", "Actions"].map((head) => (
                                    <th key={head} className="px-8 py-5 text-xs font-black uppercase tracking-wider text-slate-400">
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
                                        <p className="text-xs font-bold text-slate-400">Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <Users size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                                        <p className="text-xs font-bold text-slate-400">No users found.</p>
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
                                                        {user.first_name || 'Pending Login'} {user.last_name || ''}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">ID: {user.id?.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="space-y-1.5 opacity-80 group-hover:opacity-100 transition-all">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    <Mail size={14} className="text-slate-400" /> {user.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                    <Phone size={14} className="text-slate-300/80" /> {user.phone || 'No Phone Number'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase border ${user.role?.toLowerCase() === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    user.role?.toLowerCase() === 'operator' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleToggleUserStatus(user.id, user.is_active !== undefined ? user.is_active : (user.status === 'Active'))}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all ring-offset-2 focus:ring-2 focus:ring-blue-500 ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'translate-x-5' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                                <span className={`text-xs font-bold ${(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {user.is_active !== undefined ? (user.is_active ? 'Active' : 'Inactive') : (user.status || 'Active')}
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite User</h3>
                                    <p className="text-xs font-medium text-slate-400">Send an invitation to join the team</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Email Address
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="Enter user's email address"
                                    className="input py-3 w-full"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Access Role
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["admin", "operator", "viewer"].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewUser({ ...newUser, role })}
                                            className={`py-3 rounded-xl border transition-all font-bold text-xs capitalize ${newUser.role === role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-ghost flex-1 py-3 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={loading} className="btn btn-primary flex-1 py-3 font-bold text-sm shadow-md transition-transform active:scale-95">
                                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Send Invitation"}
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
