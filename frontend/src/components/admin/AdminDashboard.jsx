import React, { useState } from "react";
import {
    UserPlus,
    Users,
    Search,
    X,
    Shield,
    Mail,
    Phone,
    Edit2,
    Trash2,
    CheckCircle,
    Loader2,
    MoreVertical,
    Activity,
    Layers
} from "lucide-react";

import { toast, Toaster } from "react-hot-toast";
import { useTheme } from "../../ThemeContext";

import { API_URLS, callEdgeFunction } from "../../supabaseClient";

const AdminDashboard = () => {
    const { theme, isDarkMode } = useTheme();
    const [users, setUsers] = useState([
        { id: 1, firstName: "Alice", lastName: "Smith", email: "alice@atpl.com", mobile: "+1 555-0101", role: "admin", status: "Active" },
        { id: 2, firstName: "Bob", lastName: "Jones", email: "bob@atpl.com", mobile: "+1 555-0102", role: "operator", status: "Active" },
        { id: 3, firstName: "Charlie", lastName: "Davis", email: "charlie@atpl.com", mobile: "+1 555-0103", role: "operator", status: "Away" },
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const [newUser, setNewUser] = useState({
        email: "",
        role: "operator",
    });

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                email: newUser.email,
                role: newUser.role.toLowerCase()
            };

            await callEdgeFunction(API_URLS.USER_INVITE, payload);

            toast.success("Invitation sent successfully!");
            setShowAddModal(false);
            setNewUser({ email: "", role: "operator" });

            // Note: In a real app, we might want to refresh the user list here
            // For now, let's add a placeholder to the list
            const placeholderUser = {
                id: Date.now(),
                firstName: "Pending",
                lastName: "User",
                email: newUser.email,
                mobile: "N/A",
                role: newUser.role,
                status: "Invited"
            };
            setUsers([placeholderUser, ...users]);
        } catch (error) {
            console.error("Failed to invite user:", error);
            toast.error(error.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F5F7F9] p-6 md:p-10 transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-10">
                    <div>
                        <h1 className="text-4xl font-black text-[#38474F] mb-2 tracking-tight" style={{ color: theme.text }}>
                            TEAM <span className="text-[#39A3DD]">RESOURCES</span>
                        </h1>
                        <p className="text-[#8A9BA5] font-medium" style={{ color: theme.textMuted }}>
                            Provision and manage enterprise user access and roles.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9BA5]" size={18} />
                            <input
                                type="text"
                                placeholder="Filter resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded shadow-sm outline-none focus:border-[#39A3DD] w-full md:w-80 transition-all text-sm font-medium"
                                style={{ backgroundColor: theme.surface, color: theme.text }}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-pink px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-500/20"
                        >
                            <UserPlus size={16} />
                            <span>Invite Resource</span>
                        </button>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Total Assets", value: "1,284", icon: Layers, color: "text-[#39A3DD]", bg: "bg-blue-50" },
                        { label: "Active Team", value: users.length, icon: Users, color: "text-[#E85874]", bg: "bg-pink-50" },
                        { label: "System Uptime", value: "99.9%", icon: Activity, color: "text-green-500", bg: "bg-green-50" },
                        { label: "Security", value: "Locked", icon: Shield, color: "text-slate-600", bg: "bg-slate-50" },
                    ].map((stat, i) => (
                        <div key={i} className="card-premium p-8 relative overflow-hidden group" style={{ backgroundColor: theme.surface }}>
                            <div className={`w-14 h-14 rounded ${stat.bg} ${stat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                                <stat.icon size={26} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] mb-2">{stat.label}</p>
                                <h3 className="text-3xl font-black text-[#38474F] tracking-tighter" style={{ color: theme.text }}>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Users Registry */}
                <div className="card-premium overflow-hidden" style={{ backgroundColor: theme.surface }}>
                    <div className="px-8 py-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }}>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#38474F]" style={{ color: theme.text }}>Enterprise Registry</h4>
                        <button className="p-2 text-[#8A9BA5] hover:text-[#38474F] transition-colors"><MoreVertical size={16} /></button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b" style={{ borderColor: theme.border }}>
                                    {["Identity", "Access Point", "Assigned Role", "Status", "Management"].map((head) => (
                                        <th key={head} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5]">
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50 transition-colors" style={{ backgroundColor: isDarkMode ? undefined : 'white' }}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#38474F] text-white flex items-center justify-center font-black text-xs uppercase tracking-tighter rounded">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-[#38474F] uppercase tracking-wide" style={{ color: theme.text }}>{user.firstName} {user.lastName}</p>
                                                    <p className="text-[10px] font-bold text-[#8A9BA5]">UUID: {user.id}93x84</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-xs font-medium text-[#38474F]" style={{ color: theme.textMuted }}>
                                                <div className="flex items-center gap-2 mb-1"><Mail size={12} className="text-[#39A3DD]" />{user.email}</div>
                                                <div className="flex items-center gap-2"><Phone size={12} className="text-[#39A3DD]" />{user.mobile}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-block px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border border-gray-100 ${user.role.toLowerCase() === 'admin' ? 'bg-[#F59FB5]/10 text-[#E85874]' :
                                                user.role.toLowerCase() === 'operator' ? 'bg-[#6BB9E5]/10 text-[#39A3DD]' :
                                                    'bg-[#38474F]/5 text-[#38474F]'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#38474F]" style={{ color: theme.text }}>{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2.5 bg-white border border-gray-100 text-[#8A9BA5] hover:text-[#39A3DD] rounded shadow-sm transition-all"><Edit2 size={14} /></button>
                                                <button className="p-2.5 bg-white border border-gray-100 text-[#8A9BA5] hover:text-red-500 rounded shadow-sm transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add User Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#38474F]/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
                        <div className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300" style={{ backgroundColor: theme.surface }}>
                            <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-[#38474F] uppercase tracking-tight" style={{ color: theme.text }}>RESOURCE <span className="text-[#E85874]">INVITATION</span></h3>
                                    <p className="text-[#8A9BA5] font-medium text-sm">Provision a new identity for your workspace.</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-[#8A9BA5] hover:text-[#38474F] transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleAddUser} className="p-10 space-y-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Communication: Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="operator@acmecorp.com"
                                        className="input-premium py-3"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">Authorization Role</label>
                                    <div className="flex gap-4">
                                        {["admin", "operator", "viewer"].map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setNewUser({ ...newUser, role })}
                                                className={`flex-1 py-4 border-2 transition-all font-black uppercase tracking-widest text-[10px] ${newUser.role === role ? 'border-[#39A3DD] text-[#39A3DD] bg-blue-50' : 'border-gray-100 text-[#8A9BA5] hover:border-gray-200'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button type="submit" disabled={loading} className="btn-blue w-full py-4 uppercase tracking-[0.3em] font-black text-xs shadow-xl shadow-blue-500/20">
                                        {loading ? <Loader2 className="animate-spin text-white" size={24} /> : "Finalize Authorization"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <Toaster position="top-right" />

            </div>
        </div>
    );
};

export default AdminDashboard;
