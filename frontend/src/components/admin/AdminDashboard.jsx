import React, { useState } from "react";
import { UserPlus, Users, Search, X, Shield, Mail, Phone, Edit2, Trash2, MoreVertical, CheckCircle, Loader2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const AdminDashboard = () => {
    const { isDarkMode, theme } = useTheme();
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
            // Get company name from the current admin's metadata or local storage if available
            // For now, we'll use a placeholder or check if we can get it from somewhere
            const companyName = localStorage.getItem("companyName") || "ATPL Cloud Printing";

            const { data, error } = await supabase.functions.invoke('users-invite', {
                body: {
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    mobileNumber: newUser.mobile,
                    role: newUser.role.toLowerCase(),
                    companyName: companyName
                }
            });

            if (error) throw error;

            toast.success("Invitation sent successfully!");
            setUsers([...users, { ...newUser, id: users.length + 1, status: "Invited" }]);
            setShowAddModal(false);
            setNewUser({ firstName: "", lastName: "", email: "", mobile: "", role: "Designer" });
        } catch (error) {
            console.error("Invite error:", error);
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
        <div className="p-8 transition-colors duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: theme.text }}>Personnel Hub</h1>
                        <p className="font-medium mt-1" style={{ color: theme.textMuted }}>Manage your high-performance team and access levels.</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#39A3DD]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                            <input
                                type="text"
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3.5 rounded-[1.25rem] border-2 border-transparent focus:outline-none transition-all text-sm font-bold w-full md:w-80"
                                style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#E85874] text-white px-6 py-3.5 rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-lg hover:bg-[#C4455D] transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
                        >
                            <UserPlus size={18} />
                            <span>Enroll Staff</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Total Members", value: users.length, icon: Users, color: "bg-blue-500", text: "text-blue-500" },
                        { label: "Active Now", value: users.filter(u => u.status === "Active").length, icon: CheckCircle, color: "bg-green-500", text: "text-green-500" },
                        { label: "System Security", value: "Verified", icon: Shield, color: "bg-purple-500", text: "text-purple-500" },
                    ].map((stat, i) => (
                        <div key={i} className="p-8 rounded-[2rem] border transition-all duration-500 group hover:shadow-xl" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{stat.label}</p>
                                    <h3 className="text-3xl font-black mt-2" style={{ color: theme.text }}>{stat.value}</h3>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={stat.text} size={28} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Users Table */}
                <div className="rounded-[2.5rem] border overflow-hidden transition-all duration-500 shadow-sm" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }}>
                                    {["Profile", "Contact Intelligence", "Position", "System Status", "Actions"].map((head) => (
                                        <th key={head} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: theme.border }}>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-500/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#39A3DD] to-[#E85874] flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm" style={{ color: theme.text }}>{user.firstName} {user.lastName}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>ID: {user.id.toString().padStart(4, '0')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2 text-xs font-bold" style={{ color: theme.text }}>
                                                    <Mail size={12} className="text-[#39A3DD]" />
                                                    <span>{user.email}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs font-bold" style={{ color: theme.textMuted }}>
                                                    <Phone size={12} />
                                                    <span>{user.mobile}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'Manager' ? 'bg-purple-500/10 text-purple-500' :
                                                user.role === 'Designer' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                <span className="text-xs font-bold" style={{ color: theme.text }}>{user.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-gray-500/10 rounded-xl transition-colors" style={{ color: theme.textMuted }}><Edit2 size={16} /></button>
                                                <button className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500"><Trash2 size={16} /></button>
                                                <button className="p-2 hover:bg-gray-500/10 rounded-xl transition-colors" style={{ color: theme.textMuted }}><MoreVertical size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Premium Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div
                        className="w-full max-w-2xl rounded-[3rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-300"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                        <div className="bg-gradient-to-r from-[#38474F] to-[#1E293B] p-10 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-3xl font-black tracking-tight">Enroll New Staff</h3>
                                <p className="text-white/60 text-sm font-medium">Grant high-level access to your workspace.</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.textMuted }}>First Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter first name"
                                        className="w-full border-2 border-transparent px-6 py-4 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.textMuted }}>Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter last name"
                                        className="w-full border-2 border-transparent px-6 py-4 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.textMuted }}>Work Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="email@company.com"
                                        className="w-full border-2 border-transparent px-6 py-4 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.textMuted }}>Mobile Number</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full border-2 border-transparent px-6 py-4 rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: theme.bg, color: theme.text }}
                                        onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: theme.textMuted }}>Designated Role</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {["Manager", "Designer", "Operator"].map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewUser({ ...newUser, role })}
                                            className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${newUser.role === role ? 'border-[#39A3DD] bg-[#39A3DD]/10 text-[#39A3DD]' : 'border-transparent'
                                                }`}
                                            style={{ backgroundColor: newUser.role === role ? undefined : theme.bg, color: newUser.role === role ? undefined : theme.textMuted }}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                    style={{ color: theme.textMuted }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`px-12 py-4 bg-[#39A3DD] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#2A7FAF] hover:scale-105 active:scale-95'}`}
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <span>Confirm Enrollment</span>
                                    )}
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
