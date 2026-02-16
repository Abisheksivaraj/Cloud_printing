import React, { useState } from "react";
import { Mail, Lock, LogIn, ArrowRight, Loader2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { supabase } from "../../supabaseClient";
import { toast, Toaster } from "react-hot-toast";

const Login = ({ onLogin, onSwitchToSignup }) => {
    const { isDarkMode, theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            toast.success("Logged in successfully!");
            onLogin(data.user);
        } catch (error) {
            toast.error(error.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 transition-colors duration-500">
            <div
                className={`w-full max-w-md rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all duration-500 ${isDarkMode ? 'shadow-blue-500/10' : 'shadow-black/5'}`}
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
                {/* Header Branding */}
                <div className="bg-gradient-to-br from-[#39A3DD] to-[#2E82B1] p-12 text-white flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/30 relative z-10">
                        <LogIn size={40} />
                    </div>
                    <h2 className="text-4xl font-black leading-tight relative z-10">{t.welcomeBack}.</h2>
                    <p className="text-white/80 text-sm font-medium mt-3 relative z-10">Sign in to your premium dashboard.</p>
                </div>

                {/* Form Body */}
                <div className="p-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: theme.textMuted }}>{t.email}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#39A3DD]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@company.com"
                                    className="w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl focus:outline-none transition-all text-sm font-bold"
                                    style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', color: theme.text, borderColor: isDarkMode ? '#334155' : 'transparent' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{t.password}</label>
                                <button type="button" className="text-[10px] font-black text-[#39A3DD] uppercase tracking-[0.2em] hover:underline">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#39A3DD]" style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }} size={18} />
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

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center space-x-3 group ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                            style={{ backgroundColor: isDarkMode ? '#334155' : '#38474F' }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{t.login}</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{t.dontHaveAccount}</p>
                        <button
                            onClick={onSwitchToSignup}
                            className="text-[#E85874] text-sm font-black mt-3 hover:underline underline-offset-8 transition-all"
                        >
                            {t.createAccount}
                        </button>
                    </div>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default Login;
