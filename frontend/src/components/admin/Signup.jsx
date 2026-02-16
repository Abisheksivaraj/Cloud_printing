import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Building, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { supabase } from "../../supabaseClient";

const Signup = ({ onSignup, onSwitchToLogin }) => {
    const { isDarkMode, theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [lockedFields, setLockedFields] = useState({
        email: false,
        companyName: false
    });

    useEffect(() => {
        // Fetch parameters from both search (?) and hash (#)
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const email = searchParams.get('email') || hashParams.get('email');
        const companyName = searchParams.get('companyName') || hashParams.get('companyName');
        const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

        if (errorDescription) {
            setError(errorDescription);
            toast.error(errorDescription);
        }

        if (email || companyName) {
            setFormData(prev => ({
                ...prev,
                email: email || prev.email,
                companyName: companyName || prev.companyName
            }));

            setLockedFields({
                email: !!email,
                companyName: !!companyName
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data, error: functionError } = await supabase.functions.invoke(
                'users-complete-profile',
                {
                    body: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        companyName: formData.companyName,
                        email: formData.email,
                        mobileNumber: formData.mobileNumber,
                        password: formData.password,
                        role: "admin"
                    }
                }
            );

            if (functionError) throw functionError;

            // Store company name for other components (like AdminDashboard)
            localStorage.setItem("companyName", formData.companyName);

            toast.success("Admin account created successfully!");
            onSignup(formData);
        } catch (err) {
            console.error("Signup error:", err);
            const errorMessage = err.message || "Something went wrong. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 transition-colors duration-500">
            <div
                className={`w-full max-w-4xl rounded-[2.5rem] shadow-2xl border overflow-hidden flex flex-col md:flex-row transition-all duration-500 ${isDarkMode ? 'shadow-pink-500/10' : 'shadow-black/5'}`}
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
                {/* Left Side - Branding/Info */}
                <div className="md:w-2/5 bg-gradient-to-br from-[#E85874] to-[#C4455D] p-12 flex flex-col justify-center text-white relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/30">
                            <UserPlus size={40} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-black leading-tight mb-6">Join the Printing Revolution.</h2>
                        <p className="text-white/80 text-lg font-medium">Create your admin account to manage labels, users, and print jobs seamlessly.</p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center space-x-3 text-white/70">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                <span className="text-sm font-bold uppercase tracking-widest">Enterprise Ready</span>
                            </div>
                            <div className="flex items-center space-x-3 text-white/70">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                <span className="text-sm font-bold uppercase tracking-widest">Global Standards</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <p className="text-xs text-white/60 font-black uppercase tracking-[0.2em] mb-3">{t.alreadyHaveAccount}</p>
                        <button
                            onClick={onSwitchToLogin}
                            className="group flex items-center space-x-2 text-sm font-black text-white hover:text-white/80 transition-all underline underline-offset-8"
                        >
                            <span>{t.login}</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-3/5 p-12 md:p-16">
                    <div className="mb-12">
                        <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: theme.text }}>{t.signup}</h1>
                        <p className="font-medium text-sm" style={{ color: theme.textMuted }}>Fill in the details to set up your premium workspace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                    First Name <span className="text-[#E85874]">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        required
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>Last Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                Company Name <span className="text-[#E85874]">*</span>
                            </label>
                            <div className="relative group">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                <input
                                    required
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    readOnly={lockedFields.companyName}
                                    placeholder="Acme Printing Co."
                                    className={`w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold ${lockedFields.companyName ? 'opacity-70 cursor-not-allowed select-none' : ''}`}
                                    style={{
                                        backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                                        color: theme.text,
                                        borderColor: isDarkMode ? '#334155' : 'transparent'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                    {t.email} <span className="text-[#E85874]">*</span>
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        readOnly={lockedFields.email}
                                        placeholder="john@company.com"
                                        className={`w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold ${lockedFields.email ? 'opacity-70 cursor-not-allowed select-none' : ''}`}
                                        style={{
                                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC',
                                            color: theme.text,
                                            borderColor: isDarkMode ? '#334155' : 'transparent'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                    Mobile Number <span className="text-[#E85874]">*</span>
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        required
                                        type="tel"
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                    {t.password} <span className="text-[#E85874]">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        required
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>
                                    {t.confirmPassword} <span className="text-[#E85874]">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#E85874]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                    <input
                                        required
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                        style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black uppercase tracking-widest text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center space-x-3 group ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black hover:scale-[1.02] active:scale-95'}`}
                            style={{ backgroundColor: isDarkMode ? '#334155' : '#38474F' }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{t.createAccount}</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    <Toaster position="top-right" />
                </div>
            </div>
        </div>
    );
};

export default Signup;
