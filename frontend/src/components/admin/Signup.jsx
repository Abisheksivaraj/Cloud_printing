import React, { useState } from "react";
import { User, Lock, ArrowRight, UserPlus, Loader2, Mail, Phone, Building2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { callEdgeFunction, API_URLS } from "../../supabaseClient";

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

    // Get params from URL (e.g. for invitations)
    React.useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const email = queryParams.get('email');
        const companyName = queryParams.get('companyName');
        const firstName = queryParams.get('firstName');
        const lastName = queryParams.get('lastName');

        if (email || companyName || firstName || lastName) {
            setFormData(prev => ({
                ...prev,
                email: email || prev.email,
                companyName: companyName || prev.companyName,
                firstName: firstName || prev.firstName,
                lastName: lastName || prev.lastName,
            }));
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
            // Register via complete-profile edge function
            await callEdgeFunction(API_URLS.COMPLETE_PROFILE, {
                // Backend expects snake_case
                first_name: formData.firstName,
                last_name: formData.lastName,
                company_name: formData.companyName,
                mobile_number: formData.mobileNumber,
                user_name: formData.email,

                // Keeping camelCase for safety
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName,
                userName: formData.email,
                email: formData.email,
                mobileNumber: formData.mobileNumber,
                phone: formData.mobileNumber,
                password: formData.password,
            });

            toast.success("Account created successfully!");

            // Auto login after registration
            const loginData = await callEdgeFunction(API_URLS.LOGIN, {
                userName: formData.email,
                password: formData.password,
            });

            // Store auth token and user data
            if (loginData.token) localStorage.setItem("authToken", loginData.token);
            if (loginData.admin) localStorage.setItem("userData", JSON.stringify(loginData.admin));
            if (loginData.user) localStorage.setItem("userData", JSON.stringify(loginData.user));
            if (formData.companyName) localStorage.setItem("companyName", formData.companyName);

            onSignup(loginData.admin || loginData.user);
        } catch (err) {
            console.error("Signup error:", err);
            const errorMessage = err.message || "Something went wrong. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Reusable input field style
    const inputStyle = {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
        borderColor: theme.border,
        color: theme.text,
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500"
            style={{ backgroundColor: theme.bg }}
        >
            <div
                className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
                {/* Left Side - Brand / Info */}
                <div className="md:w-2/5 p-10 md:p-12 text-white flex flex-col relative overflow-hidden bg-[var(--color-primary)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] opacity-90"></div>

                    {/* Decorative Circles */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <UserPlus size={32} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Join the Platform.</h2>
                        <p className="text-white/80 text-lg leading-relaxed mb-8">
                            Create your account to manage labels, users, and print jobs seamlessly.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Enterprise Grade Security</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Cloud-Native Architecture</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Multi-User Collaboration</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Already have an account?</p>
                        <button
                            onClick={onSwitchToLogin}
                            className="flex items-center gap-2 text-white font-bold hover:text-white/80 transition-colors group"
                        >
                            <span>Back to Login</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[90vh]" style={{ backgroundColor: isDarkMode ? theme.surface : '#fff' }}>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>{t.signup || "Create Account"}</h1>
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                            Fill in your details to get started with your workspace.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* First Name & Last Name - Side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    First Name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                        className="input pl-11 py-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    Last Name
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                        className="input pl-11 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Company Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                Company Name
                            </label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                <input
                                    required
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="ATPL Cloud Printing"
                                    className="input pl-11 py-2.5 text-sm"
                                />
                            </div>
                        </div>

                        {/* Email & Mobile - Side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@company.com"
                                        className="input pl-11 py-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    Mobile Number
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="tel"
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="input pl-11 py-2.5 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password & Confirm Password - Side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    {t.password || "Password"}
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="input pl-11 py-2.5 text-sm"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    {t.confirmPassword || "Confirm Password"}
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={16} />
                                    <input
                                        required
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="input pl-11 py-2.5 text-sm"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in slide-in-from-left-2">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3.5 text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{t.createAccount || "Create Account"}</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
