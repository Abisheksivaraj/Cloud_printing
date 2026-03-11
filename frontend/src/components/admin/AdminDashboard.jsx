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

const AdminDashboard = ({ userRole }) => {
    const { theme, isDarkMode } = useTheme();

    if (userRole !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-64px)]">
                <div className="text-center p-10 card-premium">
                    <h1 className="text-3xl font-black text-red-500 mb-4">ACCESS DENIED</h1>
                    <p className="text-[#8A9BA5] font-bold">You do not have authorization to view this secure node.</p>
                </div>
            </div>
        );
    }

    const [users, setUsers] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);


    const fetchUsers = async () => {
        setFetchLoading(true);
        try {
            const data = await callEdgeFunction(API_URLS.LIST_USERS);
            if (data && data.users) {
                setUsers(data.users);
            } else if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            // toast.error("Failed to load users"); // Only if toast is handled locally or via prop
        } finally {
            setFetchLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

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

            // Refresh the user list to show the new invitation
            fetchUsers();
        } catch (error) {
            console.error("Failed to invite user:", error);
            toast.error(error.message || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this user?")) return;

        try {
            await callEdgeFunction(API_URLS.DELETE_USER, { user_id: userId });
            toast.success("User removed successfully");
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast.error(error.message || "Failed to remove user");
        }
    };

    const handleToggleUserStatus = async (userId, currentActiveState) => {
        try {
            // The API expects is_active (boolean)
            const nextActiveState = !currentActiveState;
            
            await callEdgeFunction(API_URLS.STATUS, { 
                user_id: userId, 
                is_active: nextActiveState 
            });
            
            toast.success(`Identity status: ${nextActiveState ? 'ACTIVE' : 'INACTIVE'}`);
            fetchUsers();
        } catch (error) {
            console.error("Failed to toggle status:", error);
            toast.error(error.message || "Failed to update node status");
        }
    };



    const filteredUsers = users.filter(u => {
        const fullName = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
    });

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
                            className="btn-pink px-8 py-3.5 text-xs flex gap-1   font-black uppercase tracking-widest shadow-lg shadow-pink-500/20"
                        >
                            <UserPlus size={16} />
                            <span>Invite User</span>
                        </button>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: "Total Assets", value: "1,284", icon: Layers, color: "text-[#39A3DD]", bg: "bg-blue-50" },
                        { label: "Active Team", value: fetchLoading ? "..." : users.length, icon: Users, color: "text-[#E85874]", bg: "bg-pink-50" },
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
                                    {["Identity", "Access Point", "Assigned Role", "Status", "Action"].map((head) => (
                                        <th key={head} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5]">
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                                {fetchLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-[#39A3DD] mb-4" size={32} />
                                            <p className="text-xs font-black uppercase tracking-widest text-[#8A9BA5]">Synchronizing Registry...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center text-[#8A9BA5]">
                                            No resources found in the registry.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-slate-50 transition-colors" style={{ backgroundColor: isDarkMode ? undefined : 'white' }}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-[#38474F] text-white flex items-center justify-center font-black text-xs uppercase tracking-tighter rounded">
                                                        {user.first_name?.[0] || user.firstName?.[0] || '?'}{user.last_name?.[0] || user.lastName?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-[#38474F] uppercase tracking-wide" style={{ color: theme.text }}>
                                                            {user.first_name || user.firstName || 'Pending'} {user.last_name || user.lastName || 'User'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-[#8A9BA5]">UUID: {user.id?.toString().slice(0, 8) || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-xs font-medium text-[#38474F]" style={{ color: theme.textMuted }}>
                                                    <div className="flex items-center gap-2 mb-1"><Mail size={12} className="text-[#39A3DD]" />{user.email}</div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={12} className="text-[#39A3DD]" />
                                                        {user.phone || user.mobileNumber || user.mobile || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-block px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border border-gray-100 ${user.role?.toLowerCase() === 'admin' ? 'bg-[#F59FB5]/10 text-[#E85874]' :
                                                    user.role?.toLowerCase() === 'operator' ? 'bg-[#6BB9E5]/10 text-[#39A3DD]' :
                                                        'bg-[#38474F]/5 text-[#38474F]'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => handleToggleUserStatus(user.id, user.is_active !== undefined ? user.is_active : (user.status === 'Active'))}
                                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                                                            (user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                                                (user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                        !(user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? 'text-red-500' : 'text-[#38474F]'
                                                    }`} style={{ color: (user.is_active !== undefined ? user.is_active : (user.status === 'Active')) ? theme.text : undefined }}>
                                                        {(user.is_active !== undefined ? (user.is_active ? 'Active' : 'Inactive') : (user.status || 'Active'))}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">

                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2.5 bg-white border border-gray-100 text-[#8A9BA5] hover:text-red-500 rounded shadow-sm transition-all"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
                                                {role.charAt(0).toUpperCase() + role.slice(1)}
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
