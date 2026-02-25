import React, { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Zap, UserPlus } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { callEdgeFunction, API_URLS, supabase } from "../../supabaseClient";
import { motion } from "framer-motion";
import logo from "../../assets/companyLogo.png";

const Login = ({ onLogin, onSwitchToSignup }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await callEdgeFunction(API_URLS.LOGIN, {
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            const token = data.access_token || data.token;
            if (token) {
                localStorage.setItem("authToken", token);
                await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: data.refresh_token || ""
                });
            }
            if (data.admin) localStorage.setItem("userData", JSON.stringify(data.admin));
            if (data.user) localStorage.setItem("userData", JSON.stringify(data.user));

            toast.success("Identity Verified. Welcome back!");
            onLogin(data.admin || data.user);
        } catch (err) {
            console.error("Login error:", err);
            const errorMessage = err.message || "Invalid credentials.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex bg-white overflow-hidden font-inter">
            {/* Left Design - Fixed Hero (ALWAYS VISIBLE) */}
            <div className="hidden lg:flex lg:w-4/12 flex-col justify-between p-10 xl:p-12 relative bg-white border-r border-gray-100 z-20">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <img src={logo} alt="Archery Technocrats" className="h-10 mb-8" />
                        <h1 className="text-5xl font-black text-[#38474F] mb-4 leading-tight font-oswald uppercase tracking-tight">
                            Member <br /><span className="text-[#39A3DD]">Portal.</span>
                        </h1>
                        <p className="text-sm text-[#8A9BA5] leading-relaxed font-medium mb-8">
                            Efficiently manage and design professional labels in a seamless enterprise environment.
                        </p>

                        {/* NAV LINK MOVED TO HERO FOR VISIBILITY */}
                        <button
                            onClick={onSwitchToSignup}
                            className="inline-flex items-center gap-3 px-6 py-3 border-2 border-gray-100 rounded-xl text-xs font-black text-[#38474F] hover:bg-[#38474F] hover:text-white hover:border-[#38474F] transition-all uppercase tracking-widest group"
                        >
                            <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
                            Create Account
                        </button>
                    </motion.div>

                    <div className="space-y-3 mt-12">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-l-4 border-[#39A3DD]">
                            <div className="text-[#39A3DD] font-black"><Zap size={18} /></div>
                            <div>
                                <h3 className="text-[10px] font-black text-[#38474F] uppercase tracking-wider">Fast Setup</h3>
                                <p className="text-[#8A9BA5] text-[9px] font-medium leading-tight">Instant deployment across your global network.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border-l-4 border-[#E85874]">
                            <div className="text-[#E85874] font-black"><ShieldCheck size={18} /></div>
                            <div>
                                <h3 className="text-[10px] font-black text-[#38474F] uppercase tracking-wider">Secure Data</h3>
                                <p className="text-[#8A9BA5] text-[9px] font-medium leading-tight">Industry-leading security protocols enabled.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-[#8A9BA5] tracking-[0.3em]">v2.4.0 • PRODUCTION</span>
                </div>
            </div>

            {/* Right Form - Skewed Section */}
            <div className="w-full lg:w-8/12 flex flex-col justify-center p-8 md:p-12 lg:p-24 relative z-10 bg-[#F5F7F9] overflow-hidden">
                {/* Skewed Decoration */}
                <div className="absolute top-0 left-0 w-32 h-full bg-white -ml-16 skew-x-[-15deg] border-r border-gray-100 shadow-[20px_0_60px_rgba(0,0,0,0.03)] hidden lg:block z-0"></div>

                <div className="max-w-md w-full mx-auto relative z-10">
                    <div className="lg:hidden mb-12 text-center flex flex-col items-center gap-4">
                        <img src={logo} alt="Archery Technocrats" className="h-8 mx-auto" />
                        <button onClick={onSwitchToSignup} className="text-[10px] font-black text-[#39A3DD] uppercase tracking-widest underline">Create New Account</button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-center lg:text-left mb-10"
                    >
                        <h2 className="text-5xl font-black text-[#38474F] mb-3 font-oswald uppercase tracking-tight">Welcome Back..!</h2>
                        <p className="text-[#8A9BA5] font-medium italic text-lg opacity-80 whitespace-nowrap">Enter credentials to access the console.</p>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5] ml-1">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#39A3DD] transition-colors" size={20} />
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    className="w-full bg-transparent border-b-2 border-gray-200 py-4 pl-10 text-lg text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A9BA5]">Password</label>
                                <button type="button" className="text-[10px] font-black uppercase text-[#39A3DD] hover:underline tracking-widest">Reset Password ?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8A9BA5] group-focus-within:text-[#39A3DD] transition-colors" size={20} />
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-transparent border-b-2 border-gray-200 py-4 pl-10 text-lg text-[#38474F] font-bold outline-none focus:border-[#39A3DD] transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-[#39A3DD] hover:bg-[#2A7FAF] text-white font-black uppercase tracking-[0.4em] text-sm mt-10 rounded-xl shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    <span>ACCESS ACCOUNT</span>
                                    <ArrowRight size={20} className="opacity-50" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default Login;
