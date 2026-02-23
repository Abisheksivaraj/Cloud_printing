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
    MoreVertical
} from "lucide-react";

import { toast, Toaster } from "react-hot-toast";
import { useTheme } from "../../ThemeContext";

const AdminDashboard = () => {
    const { theme, isDarkMode } = useTheme();
    const [users, setUsers] = useState([
        { id: 1, firstName: "Alice", lastName: "Smith", email: "alice@atpl.com", mobile: "+1 555-0101", role: "Manager", status: "Active" },
        { id: 2, firstName: "Bob", lastName: "Jones", email: "bob@atpl.com", mobile: "+1 555-0102", role: "Designer", status: "Active" },
        { id: 3, firstName: "Charlie", lastName: "Davis", email: "charlie@atpl.com", mobile: "+1 555-0103", role: "Operator", status: "Away" },
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const [newUser, setNewUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        role: "Designer",
    });

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Integrate with Supabase for user invitations
            // For now, add user to local state
            const newUserEntry = {
                ...newUser,
                id: users.length + 1,
                status: "Invited",
            };

            setUsers([...users, newUserEntry]);
            toast.success("User added successfully!");
            setShowAddModal(false);
            setNewUser({ firstName: "", lastName: "", email: "", mobile: "", role: "Designer" });
        } catch (error) {
            console.error("Add user error:", error);
            toast.error(error.message || "Failed to add user");
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className="min-h-screen p-6 md:p-8 transition-colors duration-300"
            style={{ backgroundColor: theme.bg }}
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: theme.text }}>
                            Team Management
                        </h1>
                        <p className="text-lg" style={{ color: theme.textMuted }}>
                            Manage users, roles, and access permissions.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 group">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--color-primary)]"
                                size={18}
                                style={{ color: theme.textMuted }}
                            />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all outline-none focus:ring-4 focus:ring-primary/10"
                                style={{
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    color: theme.text
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <UserPlus size={20} />
                            <span>Add User</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Total Members", value: users.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                        { label: "Active Now", value: users.filter(u => u.status === "Active").length, icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
                        { label: "System Status", value: "Secure", icon: Shield, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="p-6 rounded-2xl border transition-all hover:shadow-md"
                            style={{
                                backgroundColor: theme.surface,
                                borderColor: theme.border
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>{stat.label}</p>
                                <h3 className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Users Table */}
                <div
                    className="rounded-2xl border overflow-hidden shadow-sm"
                    style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b" style={{ borderColor: theme.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                                    {["User", "Contact", "Role", "Status", "Actions"].map((head) => (
                                        <th key={head} className="px-6 py-5 text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-lg">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm" style={{ color: theme.text }}>{user.firstName} {user.lastName}</p>
                                                    <p className="text-xs" style={{ color: theme.textMuted }}>ID: {user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                                                    <Mail size={14} />
                                                    <span>{user.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                                                    <Phone size={14} />
                                                    <span>{user.mobile}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${user.role === 'Manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        user.role === 'Designer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${user.status === 'Active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></span>
                                                <span className="text-sm font-medium" style={{ color: theme.text }}>{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 rounded-lg transition-colors hover:bg-[var(--color-primary)]/10 text-gray-400 hover:text-[var(--color-primary)]"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                        <div
                            className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                            style={{ backgroundColor: theme.surface }}
                        >
                            <div className="border-b p-6 flex items-center justify-between" style={{ borderColor: theme.border }}>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: theme.text }}>Invite New User</h3>
                                    <p className="text-sm" style={{ color: theme.textMuted }}>Send an invitation to join your workspace.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    style={{ color: theme.textMuted }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser} className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>First Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Jane"
                                            className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            style={{
                                                backgroundColor: theme.bg,
                                                borderColor: theme.border,
                                                color: theme.text
                                            }}
                                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Last Name</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Doe"
                                            className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            style={{
                                                backgroundColor: theme.bg,
                                                borderColor: theme.border,
                                                color: theme.text
                                            }}
                                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Email Address</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="jane@company.com"
                                            className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            style={{
                                                backgroundColor: theme.bg,
                                                borderColor: theme.border,
                                                color: theme.text
                                            }}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Phone Number</label>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-3 rounded-xl border-2 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            style={{
                                                backgroundColor: theme.bg,
                                                borderColor: theme.border,
                                                color: theme.text
                                            }}
                                            onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Assign Role</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {["Manager", "Designer", "Operator"].map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setNewUser({ ...newUser, role })}
                                                className={`py-4 rounded-xl text-sm font-bold border-2 transition-all ${newUser.role === role
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                                                    : 'border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                                    }`}
                                                style={{ color: newUser.role !== role ? theme.text : undefined }}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.border }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-3 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        style={{ color: theme.textMuted }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Invitation"}
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
